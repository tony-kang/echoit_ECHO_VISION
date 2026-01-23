// 서버 사이드 Supabase 클라이언트 설정
// 이 클라이언트는 서버 사이드에서만 사용되며, RLS를 우회할 수 있습니다.
// 절대 클라이언트 사이드에서 사용하지 마세요!

import { createClient } from '@supabase/supabase-js';
import { 
  PUBLIC_SUPABASE_URL 
} from '$env/static/public';
import { 
  SUPABASE_SERVICE_ROLE_KEY 
} from '$env/static/private';

/**
 * 서버 사이드 Supabase 클라이언트 생성
 * RLS를 우회하여 관리자 작업 등에 사용됩니다.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {Error} 서비스 롤 키가 설정되지 않은 경우
 */
export function createServerClient() {
  if (!PUBLIC_SUPABASE_URL) {
    throw new Error('PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 서버 사이드 작업이 필요한 경우에만 필요합니다.');
  }

  return createClient(
    PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * 서버 사이드 클라이언트 인스턴스 (싱글톤)
 * 필요시에만 생성되도록 lazy initialization 사용
 */
let serverClient = null;

/**
 * 서버 사이드 클라이언트 가져오기
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getServerClient() {
  try {
    if (!serverClient) {
      serverClient = createServerClient();
    }
    return serverClient;
  } catch (error) {
    console.warn('서버 사이드 클라이언트 생성 실패:', error.message);
    return null;
  }
}

