// 인증 상태 관리 Store (Svelte 5)
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { supabase } from '$lib/supabaseClient';
import { getCurrentUserProfile as fetchUserProfile, USER_ROLES } from '$lib/userService';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from '$lib/logService';

/**
 * 인증 상태 Store
 * - user: 현재 로그인된 사용자 정보
 * - session: 현재 세션 정보
 * - loading: 초기화 중 여부
 * - userProfile: 사용자 프로필 정보 (캐싱됨)
 * - profileLoading: 프로필 로딩 중 여부
 * 
 * @typedef {Object} AuthState
 * @property {import('@supabase/supabase-js').User | null} user
 * @property {import('@supabase/supabase-js').Session | null} session
 * @property {boolean} loading
 * @property {Object | null} userProfile
 * @property {boolean} profileLoading
 */
function createAuthStore() {
  /** @type {import('svelte/store').Writable<AuthState>} */
  const store = writable({
    user: null,
    session: null,
    loading: true,
    userProfile: null,
    profileLoading: false
  });
  
  const { subscribe, set, update } = store;
  
  /** @type {boolean} 초기화 실행 여부 (중복 초기화 방지) */
  let initialized = false;
  /** @type {string | null} 마지막으로 로드한 사용자 ID */
  let lastLoadedUserId = null;

  return {
    subscribe,
    
    /**
     * 현재 상태 가져오기 (동기)
     * @returns {AuthState}
     */
    getState() {
      let currentState;
      const unsubscribe = subscribe(state => {
        currentState = state;
      });
      unsubscribe();
      return currentState;
    },
    
    /**
     * 인증 상태 초기화 (앱 시작 시 호출, 한 번만 실행)
     */
    async initialize() {
      if (initialized) {
        console.warn('authStore는 이미 초기화되었습니다.');
        return;
      }

      initialized = true;

      try {
        // 현재 세션 가져오기
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const currentUser = session?.user ?? null;
        
        set({
          user: currentUser,
          session,
          loading: false,
          userProfile: null,
          profileLoading: false
        });

        // 사용자가 있으면 프로필 로드
        if (currentUser) {
          await this.loadUserProfile();
        }

        /**
         * 유효하지 않은 세션 처리
         * @returns {Promise<void>}
         */
        const handleInvalidSession = async () => {
          console.log('🔔 handleInvalidSession 호출됨');
          
          lastLoadedUserId = null;
          
          // 로컬 스토리지 완전 클리어
          try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('🔔 로컬 스토리지 클리어 완료:', keysToRemove);
          } catch (e) {
            console.warn('로컬 스토리지 클리어 실패:', e);
          }
          
          set({
            user: null,
            session: null,
            loading: false,
            userProfile: null,
            profileLoading: false
          });
          console.log('🔔 상태 초기화 완료');
          
          // 로그인 페이지로 이동 (클라이언트 사이드에서만)
          if (typeof window !== 'undefined') {
            console.log('🔔 /login으로 리다이렉트');
            goto('/login');
          }
        };

        // 인증 상태 변화 감지 리스너 등록
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('🔔 onAuthStateChange 이벤트:', event, { hasSession: !!newSession, hasUser: !!newSession?.user });
          const newUser = newSession?.user ?? null;
          
          // 세션이 무효한 경우 처리 (로그아웃 또는 토큰 갱신 실패)
          if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !newSession)) {
            console.log('🔔 SIGNED_OUT 이벤트 처리 시작');
            await handleInvalidSession();
            console.log('🔔 SIGNED_OUT 이벤트 처리 완료');
            return;
          }
          
          // 사용자가 변경된 경우에만 프로필 다시 로드
          if (newUser?.id !== lastLoadedUserId) {
            lastLoadedUserId = null; // 캐시 초기화
          }
          
          // 로그인 성공 시 마지막 로그인 시간 업데이트
          if (event === 'SIGNED_IN' && newUser?.id) {
            try {
              await supabase
                .from('user_profiles')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', newUser.id);
            } catch (error) {
              console.error('마지막 로그인 시간 업데이트 실패:', error);
            }
          }
          
          console.log('🔔 상태 업데이트 중...', { hasUser: !!newUser, event });
          update(state => ({
            ...state,
            user: newUser,
            session: newSession,
            loading: false,
            userProfile: newUser ? state.userProfile : null // 로그아웃 시 프로필 초기화
          }));
          console.log('🔔 상태 업데이트 완료');

          // 사용자가 있으면 프로필 로드
          if (newUser) {
            console.log('🔔 프로필 로드 시작');
            await this.loadUserProfile();
            console.log('🔔 프로필 로드 완료');
          }
        });
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        set({
          user: null,
          session: null,
          loading: false,
          userProfile: null,
          profileLoading: false
        });
      }
    },

    /**
     * 사용자 프로필 로드 (캐싱 적용)
     * @returns {Promise<void>}
     */
    async loadUserProfile() {
      // 현재 상태 가져오기
      let currentState;
      const unsubscribe = subscribe(state => {
        currentState = state;
      });
      unsubscribe();
      
      const { user, userProfile, profileLoading } = currentState;
      
      // 사용자가 없으면 프로필도 없음
      if (!user?.id) {
        update(s => ({ ...s, userProfile: null, profileLoading: false }));
        return;
      }
      
      // 이미 같은 사용자의 프로필이 로드되어 있으면 스킵
      if (lastLoadedUserId === user.id && userProfile) {
        return;
      }
      
      // 이미 로딩 중이면 스킵
      if (profileLoading) {
        return;
      }
      
      // 프로필 로드 시작
      update(s => ({ ...s, profileLoading: true }));
      
      try {
        /** @type {any} */
        const userMeta = user.user_metadata;
        const { data, error } = await fetchUserProfile(user.id, userMeta);
        
        if (error) {
          // 에러 발생 시 기본 프로필 설정
          update(s => ({
            ...s,
            userProfile: {
              id: user.id,
              role: USER_ROLES.USER,
              email: userMeta?.email || null,
              full_name: userMeta?.full_name || null
            },
            profileLoading: false
          }));
        } else {
          lastLoadedUserId = user.id;
          update(s => ({
            ...s,
            userProfile: data,
            profileLoading: false
          }));
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        update(s => ({
          ...s,
          userProfile: {
            id: user.id,
            role: USER_ROLES.USER,
            email: user.user_metadata?.email || null,
            full_name: user.user_metadata?.full_name || null
          },
          profileLoading: false
        }));
      }
    },

    /**
     * 이메일/비밀번호 회원가입
     * @param {string} email 
     * @param {string} password 
     * @param {Object} userData - 추가 사용자 정보 (full_name 등)
     */
    async signUp(email, password, userData = {}) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData,  // full_name, phone 등 추가 정보
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) throw error;

        // 로그 기록
        if (data?.user) {
          await logAction({
            actionType: ACTION_TYPES.SIGNUP,
            actionCategory: ACTION_CATEGORIES.AUTH,
            actionDetails: {
              userId: data.user.id,
              email: email,
              fullName: userData?.full_name || null
            },
            result: 'success'
          });
        }
        
        return { data, error: null };
      } catch (error) {
        console.error('회원가입 실패:', error);

        // 에러 로그 기록
        await logAction({
          actionType: ACTION_TYPES.SIGNUP,
          actionCategory: ACTION_CATEGORIES.AUTH,
          actionDetails: {
            email: email
          },
          result: 'error',
          errorMessage: error instanceof Error ? error.message : String(error)
        });

        return { data: null, error };
      }
    },

    /**
     * 이메일/비밀번호 로그인
     * @param {string} email 
     * @param {string} password 
     */
    async signIn(email, password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        return { data, error: null };
      } catch (error) {
        console.error('로그인 실패:', error);
        return { data: null, error };
      }
    },

    /**
     * 소셜 로그인 (Google, GitHub 등)
     * @param {import('@supabase/supabase-js').Provider} provider - 'google', 'github', 'facebook' 등
     */
    async signInWithProvider(provider) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) throw error;
        
        return { data, error: null };
      } catch (error) {
        console.error('소셜 로그인 실패:', error);
        return { data: null, error };
      }
    },

    /**
     * 로그아웃
     */
    async signOut() {
      try {
        console.log('📤 authStore.signOut 호출됨');
        
        // 먼저 상태를 초기화하여 즉시 UI 업데이트
        console.log('📤 상태 즉시 초기화 중...');
        lastLoadedUserId = null;
        set({ user: null, session: null, loading: false, userProfile: null, profileLoading: false });
        console.log('📤 상태 초기화 완료');
        
        // 로컬 스토리지 완전 클리어
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          console.log('📤 로컬 스토리지 클리어 완료:', keysToRemove);
        } catch (e) {
          console.warn('로컬 스토리지 클리어 실패:', e);
        }
        
        // Supabase 로그아웃 시도 (onAuthStateChange 트리거)
        console.log('📤 supabase.auth.signOut 호출 중...');
        const { error } = await supabase.auth.signOut();
        console.log('📤 supabase.auth.signOut 응답:', { error });
        
        // AuthSessionMissingError는 무시하고 진행
        if (error && error.name !== 'AuthSessionMissingError') {
          console.error('❌ Supabase 로그아웃 에러:', error);
        }
        
        if (error && error.name === 'AuthSessionMissingError') {
          console.warn('⚠️ 세션이 없지만 로컬 상태는 클리어됨');
        }
        
        console.log('✅ 로그아웃 완료');
        return { error: null };
      } catch (error) {
        console.error('❌ authStore.signOut 실패:', error);
        
        // 에러가 나도 로컬 상태는 클리어
        lastLoadedUserId = null;
        set({ user: null, session: null, loading: false, userProfile: null, profileLoading: false });
        
        return { error };
      }
    },

    /**
     * 비밀번호 재설정 이메일 발송
     * @param {string} email 
     */
    async resetPassword(email) {
      try {
        // redirectTo URL 생성
        const redirectTo = typeof window !== 'undefined' 
          ? `${window.location.origin}/update-password`
          : '/update-password';
        
        console.log('비밀번호 재설정 요청:', { email, redirectTo });
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo,
          // 이메일 옵션 설정 (필요시)
          emailRedirectTo: redirectTo
        });
        
        if (error) {
          console.error('Supabase 비밀번호 재설정 에러:', error);
          throw error;
        }
        
        // 성공 응답 확인
        console.log('비밀번호 재설정 응답:', { data, error });
        
        // Supabase는 보안상 이유로 항상 성공 응답을 반환합니다
        // 실제 이메일 전송 여부는 별도로 확인해야 합니다
        console.log('비밀번호 재설정 요청이 처리되었습니다. 이메일을 확인해주세요.');
        
        return { data, error: null };
      } catch (error) {
        console.error('비밀번호 재설정 실패:', error);
        
        // 에러 타입에 따라 더 자세한 메시지 제공
        let errorMessage = '비밀번호 재설정 링크 전송에 실패했습니다.';
        
        if (error?.message) {
          errorMessage = error.message;
        } else if (error instanceof TypeError) {
          if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            errorMessage = '네트워크 연결에 실패했습니다. Supabase URL 설정을 확인해주세요.';
          } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            errorMessage = 'Supabase URL을 해석할 수 없습니다. 환경 변수 설정을 확인해주세요.';
          } else {
            errorMessage = `네트워크 오류: ${error.message}`;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        }
        
        return { 
          data: null, 
          error: {
            ...error,
            message: errorMessage
          }
        };
      }
    },

    /**
     * 비밀번호 변경
     * @param {string} newPassword 
     */
    async updatePassword(newPassword) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
        
        return { data, error: null };
      } catch (error) {
        console.error('비밀번호 변경 실패:', error);
        return { data: null, error };
      }
    },

    /**
     * 이메일 인증 링크 재발송 (Magic Link)
     * @param {string} email 
     * @param {Object} options - 추가 옵션 (userData 등)
     */
    async resendEmailVerification(email, options = {}) {
      try {
        const { data, error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            ...options
          }
        });
        
        if (error) throw error;
        
        return { data, error: null };
      } catch (error) {
        console.error('이메일 인증 재발송 실패:', error);
        return { data: null, error };
      }
    },

    /**
     * Magic Link 로그인 (이메일 링크 로그인)
     * @param {string} email 
     */
    async signInWithMagicLink(email) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) throw error;
        
        return { data, error: null };
      } catch (error) {
        console.error('Magic Link 발송 실패:', error);
        return { data: null, error };
      }
    }
  };
}

export const authStore = createAuthStore();
