import { supabase } from '$lib/supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from '$lib/logService';
import { getCurrentUserProfile as fetchUserProfile } from '$lib/userService';

// 1. 상태 관리 (Universal Runes)
let state = $state({
    user: null, session: null, loading: true,
    userProfile: null, profileLoading: false
});
let lastUserId = null;
const origin = typeof window !== 'undefined' ? window.location.origin : '';

// 2. 내부 유틸리티 (비용 절감용)
const clearLocalAuth = () => {
    lastUserId = null;
    state.user = null; state.session = null; state.userProfile = null;
    Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
};

export const authStore = {
    get user() { return state.user; },
    get profile() { return state.userProfile; },
    get loading() { return state.loading; },
    get profileLoading() { return state.profileLoading; },

    /** 현재 상태 스냅샷 (getState 호환) */
    getState() {
        return { user: state.user, loading: state.loading, userProfile: state.userProfile, profileLoading: state.profileLoading };
    },

    async initialize() {
        const { data: { session } } = await supabase.auth.getSession();
        this._update(session);
        
        supabase.auth.onAuthStateChange(async (event, sess) => {
            if (event === 'SIGNED_OUT') clearLocalAuth();
            else if (sess?.user?.id !== lastUserId) this._update(sess);
        });
    },

    _update(session) {
        state.session = session;
        state.user = session?.user ?? null;
        state.loading = false;
        if (state.user) this.loadProfile();
    },

    async loadProfile() {
        if (!state.user || state.profileLoading || lastUserId === state.user.id) return;
        state.profileLoading = true;
        try {
            const { data, error } = await fetchUserProfile(state.user.id, state.user.user_metadata);
            if (data?.banned === true) {
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem('auth_banned_message', '사용할 수 없는 계정입니다.');
                }
                clearLocalAuth();
                await supabase.auth.signOut();
                state.profileLoading = false;
                return;
            }
            state.userProfile = error ? { id: state.user.id, role: 'USER' } : data;
            lastUserId = state.user.id;
        } finally { state.profileLoading = false; }
    },

    // API 핸들러 (규칙 1 & 2 적용: 압축된 리턴 구조)
    async signUp(email, password, userData) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: userData, emailRedirectTo: `${origin}/auth/callback` }});
        await logAction({ actionType: ACTION_TYPES.SIGNUP, actionCategory: ACTION_CATEGORIES.AUTH, result: error ? 'error' : 'success' });
        return { data, error };
    },

    async signIn(email, password) { return await supabase.auth.signInWithPassword({ email, password }); },

    async signOut() {
        clearLocalAuth();
        return await supabase.auth.signOut();
    },

    async resetPassword(email) {
        return await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/update-password` });
    },

    async updatePassword(newPassword) {
        return await supabase.auth.updateUser({ password: newPassword });
    },

    /** OAuth 로그인 (Google 등) */
    async signInWithProvider(provider) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${origin}/auth/callback` }
        });
        return error ? { data: null, error } : { data, error: null };
    },

    /** Magic Link 로그인 */
    async signInWithMagicLink(email) {
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${origin}/auth/callback` }
        });
        return error ? { data: null, error } : { data, error: null };
    }
};
