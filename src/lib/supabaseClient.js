// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

// 환경 변수 검증
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  const errorMsg =
    '❌ Supabase 환경 변수가 설정되지 않았습니다.\n' +
    '   .env 파일에서 ENV_MODE를 설정하고, 해당 환경의 변수를 확인하세요.\n' +
    `   PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL ? '설정됨' : '없음'}\n` +
    `   PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음'}`;
  console.error(errorMsg);
  throw new Error('Supabase 환경 변수가 필요합니다. .env 파일을 확인하세요.');
}

// 프로젝트별 고유 storageKey 생성 (URL에서 호스트 첫 세그먼트 사용)
const getStorageKey = () => {
  try {
    const url = new URL(PUBLIC_SUPABASE_URL);
    const projectId = url.hostname.split('.')[0];
    return `sb-${projectId}-auth-token`;
  } catch {
    return 'sb-auth-token';
  }
};

// Supabase 경고 메시지 억제
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('Multiple GoTrueClient instances') ||
      message.includes('Lock') && message.includes('was not released')
    )) {
      return; // Supabase 경고 메시지 무시
    }
    originalWarn.apply(console, args);
  };
}

// Supabase 클라이언트 생성
let _supabaseInstance = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: getStorageKey(),
    flowType: 'pkce'
  },
  global: {
    headers: {}
  }
});

/**
 * 탭 전환 감지하여 클라이언트 재생성
 * - Supabase 2.87.x~2.97.x: getUser()/getSession() 내부 상태 손상으로 탭 복귀 후 멈춤
 * - 해결: visibilitychange에서 포그라운드 복귀 시 클라이언트를 새로 생성하여 내부 상태 초기화
 * - 참고: GitHub supabase/supabase-js#36046, #2111
 */
if (typeof window !== 'undefined') {
  let wasHidden = false;
  document.addEventListener('visibilitychange', () => {
    if (wasHidden && !document.hidden) {
      _supabaseInstance = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: getStorageKey(),
          flowType: 'pkce'
        },
        global: {
          headers: {}
        }
      });
    }
    wasHidden = document.hidden;
  });
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    return _supabaseInstance[prop];
  }
});

/**
 * 인증 상태 변화 감지 헬퍼 함수
 * @param {Function} callback - (event, session) => void
 * @returns {Object} subscription - unsubscribe() 메서드 포함
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * 현재 로그인된 사용자 가져오기
 * @returns {Promise<Object>} { user, error }
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * 현재 세션 가져오기
 * @returns {Promise<Object>} { session, error }
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

