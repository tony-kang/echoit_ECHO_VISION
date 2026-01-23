import { json } from '@sveltejs/kit';
import { getServerClient } from '$lib/supabaseServerClient.js';

/**
 * 일일 작업을 수행하는 Cron Job
 * Vercel Cron Jobs에서 매일 오전 2시에 실행됩니다.
 * 
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function GET({ request }) {
	// Vercel Cron Job에서 호출하는지 확인
	// 방법 1: Vercel이 자동으로 추가하는 헤더 확인 (권장)
	const cronHeader = request.headers.get('x-vercel-cron');
	if (!cronHeader) {
		// 방법 2: 수동으로 설정한 CRON_SECRET 확인 (선택사항)
		const authHeader = request.headers.get('authorization');
		if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
	}

	const startTime = Date.now();
	const executedAt = new Date().toISOString();
	const jobName = 'daily-task';
	const jobPath = '/api/cron/daily-task';

	try {
		const serverClient = getServerClient();
		if (!serverClient) {
			const errorMessage = '서버 클라이언트를 초기화할 수 없습니다.';
			return json(
				{ error: errorMessage },
				{ status: 500 }
			);
		}

		// 여기에 주기적으로 수행할 작업을 작성합니다
		// 예시: 만료된 데이터 정리, 통계 업데이트 등
		
		// 예시 1: 만료된 세션 정리
		// const { error: cleanupError } = await serverClient
		// 	.from('sessions')
		// 	.delete()
		// 	.lt('expires_at', new Date().toISOString());

		// 예시 2: 일일 통계 업데이트
		// const { data: stats } = await serverClient
		// 	.from('daily_stats')
		// 	.insert({
		// 		date: new Date().toISOString().split('T')[0],
		// 		total_users: userCount,
		// 		total_orders: orderCount
		// 	});

		const executionTimeMs = Date.now() - startTime;
		const successMessage = '정상처리 완료';

		// 성공 이력 기록
		try {
			const { error: logError } = await serverClient
				.from('cron_job_logs')
				.insert({
					job_name: jobName,
					job_path: jobPath,
					status: 'success',
					message: successMessage,
					execution_time_ms: executionTimeMs,
					metadata: {
						timestamp: executedAt
					},
					executed_at: executedAt
				});
			
			if (logError) {
				console.error('Cron log 저장 실패:', logError);
			}
		} catch (logError) {
			console.error('Cron log 저장 중 예외 발생:', logError);
		}

		return json({
			success: true,
			message: successMessage,
			timestamp: executedAt,
			execution_time_ms: executionTimeMs
		});
	} catch (error) {
		const executionTimeMs = Date.now() - startTime;
		const errorMessage = error.message || '작업 실행 중 오류가 발생했습니다.';
		
		console.error('일일 작업 실행 중 오류:', error);

		// 에러 이력 기록
		try {
			const serverClient = getServerClient();
			if (serverClient) {
				const { error: logError } = await serverClient
					.from('cron_job_logs')
					.insert({
						job_name: jobName,
						job_path: jobPath,
						status: 'error',
						message: errorMessage,
						error_message: error.stack || errorMessage,
						execution_time_ms: executionTimeMs,
						metadata: {
							error_name: error.name,
							timestamp: executedAt
						},
						executed_at: executedAt
					});
				
				if (logError) {
					console.error('Cron log 저장 실패:', logError);
				}
			}
		} catch (logError) {
			console.error('에러 로그 저장 중 예외 발생:', logError);
		}

		return json(
			{
				error: '작업 실행 중 오류가 발생했습니다.',
				message: errorMessage,
				execution_time_ms: executionTimeMs
			},
			{ status: 500 }
		);
	}
}
