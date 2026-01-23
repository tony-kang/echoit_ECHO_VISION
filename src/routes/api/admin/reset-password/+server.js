import { json } from '@sveltejs/kit';
import { getServerClient } from '$lib/supabaseServerClient.js';
import { ACTION_TYPES, ACTION_CATEGORIES } from '$lib/logService.js';

/**
 * 사용자 패스워드 리셋 API
 * POST /api/admin/reset-password
 * 
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function POST({ request }) {
	try {
		const { userId, newPassword } = await request.json();

		if (!userId || !newPassword) {
			return json(
				{ error: '사용자 ID와 새 패스워드가 필요합니다.' },
				{ status: 400 }
			);
		}

		const serverClient = getServerClient();
		if (!serverClient) {
			return json(
				{ error: '서버 클라이언트를 초기화할 수 없습니다.' },
				{ status: 500 }
			);
		}

		// Admin API를 사용하여 패스워드 업데이트
		const { data, error } = await serverClient.auth.admin.updateUserById(
			userId,
			{ password: newPassword }
		);

		if (error) {
			console.error('패스워드 리셋 실패:', error);
			
			// 에러 로그 기록
			try {
				const { data: { user } } = await serverClient.auth.getUser();
				await serverClient
					.from('user_action_logs')
					.insert({
						user_id: user?.id || null,
						action_type: ACTION_TYPES.USER_PASSWORD_RESET,
						action_category: ACTION_CATEGORIES.USER,
						action_details: { targetUserId: userId },
						result: 'error',
						error_message: error.message || '패스워드 리셋에 실패했습니다.'
					});
			} catch (logError) {
				console.error('로그 기록 실패:', logError);
			}
			
			return json(
				{ error: error.message || '패스워드 리셋에 실패했습니다.' },
				{ status: 500 }
			);
		}

		// 성공 로그 기록
		try {
			const { data: { user } } = await serverClient.auth.getUser();
			await serverClient
				.from('user_action_logs')
				.insert({
					user_id: user?.id || null,
					action_type: ACTION_TYPES.USER_PASSWORD_RESET,
					action_category: ACTION_CATEGORIES.USER,
					action_details: { targetUserId: userId },
					result: 'success'
				});
		} catch (logError) {
			console.error('로그 기록 실패:', logError);
		}

		return json({ 
			success: true, 
			message: '패스워드가 성공적으로 리셋되었습니다.',
			data 
		});
	} catch (error) {
		console.error('패스워드 리셋 예외 발생:', error);
		return json(
			{ error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' },
			{ status: 500 }
		);
	}
}

