// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';
import { 
  PUBLIC_SUPABASE_URL, 
  PUBLIC_SUPABASE_ANON_KEY 
} from '$env/static/public';

// 디버깅: 현재 로드된 환경 변수 확인
// if (typeof window !== 'undefined') {
// 	console.log('🔍 Supabase 환경 변수 확인:');
// 	console.log('  PUBLIC_SUPABASE_URL:', PUBLIC_SUPABASE_URL);
// 	console.log('  PUBLIC_SUPABASE_ANON_KEY:', PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음');
// }

// 환경 변수 검증
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	const errorMsg = '❌ Supabase 환경 변수가 설정되지 않았습니다.\n' +
		'   .env 파일에서 ENV_MODE를 설정하고, 해당 환경의 변수를 확인하세요.\n' +
		`   PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL ? '설정됨' : '없음'}\n` +
		`   PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음'}`;
	console.error(errorMsg);
	throw new Error('Supabase 환경 변수가 필요합니다. .env 파일을 확인하세요.');
}

// Production 환경에서 URL 형식 검증
if (typeof window !== 'undefined' && PUBLIC_SUPABASE_URL) {
	try {
		const url = new URL(PUBLIC_SUPABASE_URL);
		if (!url.hostname.includes('supabase.co')) {
			console.warn('⚠️ Supabase URL 형식이 올바르지 않을 수 있습니다:', PUBLIC_SUPABASE_URL);
		}
	} catch (e) {
		console.error('❌ Supabase URL이 유효하지 않습니다:', PUBLIC_SUPABASE_URL);
		console.error('URL 형식 예시: https://your-project-id.supabase.co');
	}
}

// Supabase 클라이언트 생성
export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
      flowType: 'pkce'
    }
  }
);

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

