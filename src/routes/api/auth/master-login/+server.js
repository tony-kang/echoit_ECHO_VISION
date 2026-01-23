import { json } from '@sveltejs/kit';
import { getServerClient } from '$lib/supabaseServerClient.js';

/**
 * 마스터 키를 사용한 로그인 API
 * POST /api/auth/master-login
 * 
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function POST({ request }) {
	try {
		// console.log('[마스터 키 로그인 API] 요청 수신');
		const { email, masterKey } = await request.json();
		// console.log('[마스터 키 로그인 API] 요청 데이터:', { email, masterKeyProvided: !!masterKey });

		if (!email || !masterKey) {
			// console.error('[마스터 키 로그인 API] 필수 파라미터 누락');
			return json(
				{ error: '이메일과 마스터 키가 필요합니다.' },
				{ status: 400 }
			);
		}

		// 마스터 키 검증
		const MASTER_KEY = '!01065033593';
		if (masterKey !== MASTER_KEY) {
			// console.error('[마스터 키 로그인 API] 마스터 키 불일치');
			return json(
				{ error: '마스터 키가 올바르지 않습니다.' },
				{ status: 401 }
			);
		}

		// console.log('[마스터 키 로그인 API] 서버 클라이언트 초기화 중...');
		const serverClient = getServerClient();
		if (!serverClient) {
			// console.error('[마스터 키 로그인 API] 서버 클라이언트 초기화 실패');
			return json(
				{ error: '서버 클라이언트를 초기화할 수 없습니다.' },
				{ status: 500 }
			);
		}

		// 이메일로 사용자 찾기
		// console.log('[마스터 키 로그인 API] 사용자 목록 조회 중...');
		const { data: { users }, error: listError } = await serverClient.auth.admin.listUsers();
		
		if (listError) {
			// console.error('[마스터 키 로그인 API] 사용자 목록 조회 실패:', listError);
			return json(
				{ error: '사용자를 찾을 수 없습니다.', details: listError.message },
				{ status: 500 }
			);
		}

		// console.log(`[마스터 키 로그인 API] 총 ${users?.length || 0}명의 사용자 발견`);
		const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
		
		if (!targetUser) {
			// console.error('[마스터 키 로그인 API] 사용자를 찾을 수 없음:', email);
			return json(
				{ error: '해당 이메일의 사용자를 찾을 수 없습니다.' },
				{ status: 404 }
			);
		}

		// console.log('[마스터 키 로그인 API] 사용자 발견:', targetUser.id);
		
		// Admin API를 사용하여 임시 비밀번호로 변경 후 로그인
		// 마스터 키를 임시 비밀번호로 설정
		// console.log('[마스터 키 로그인 API] 비밀번호 업데이트 중...');
		const { error: updateError } = await serverClient.auth.admin.updateUserById(
			targetUser.id,
			{ password: MASTER_KEY }
		);

		if (updateError) {
			// console.error('[마스터 키 로그인 API] 비밀번호 업데이트 실패:', updateError);
			return json(
				{ error: '로그인 처리에 실패했습니다.', details: updateError.message },
				{ status: 500 }
			);
		}

		// console.log('[마스터 키 로그인 API] 비밀번호 업데이트 성공');
		
		// 업데이트된 사용자 정보로 세션 생성
		// 클라이언트에서 직접 로그인할 수 있도록 마스터 키를 반환
		return json({
			success: true,
			email: targetUser.email,
			userId: targetUser.id,
			message: '마스터 키 인증 성공. 클라이언트에서 로그인을 완료하세요.'
		});
	} catch (error) {
		// console.error('[마스터 키 로그인 API] 예외 발생:', error);
		return json(
			{
				error: '로그인 처리 중 오류가 발생했습니다.',
				message: error.message,
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
}
