import { supabase } from './supabaseClient';

/**
 * 액션 카테고리 상수
 */
export const ACTION_CATEGORIES = {
	AUTH: 'auth',
	POST: 'post',
	COMMENT: 'comment',
	USER: 'user',
	ADMIN: 'admin',
	SYSTEM: 'system',
	BOARD: 'board',
	SCHEDULE: 'schedule',
	INQUIRY: 'inquiry',
	LOGISTICS: 'logistics'
};

/**
 * 액션 타입 상수
 */
export const ACTION_TYPES = {
	// 인증 관련
	LOGIN: 'login',
	LOGOUT: 'logout',
	SIGNUP: 'signup',
	PASSWORD_RESET: 'password_reset',
	PASSWORD_CHANGE: 'password_change',
	
	// 게시물 관련
	POST_CREATE: 'post_create',
	POST_UPDATE: 'post_update',
	POST_DELETE: 'post_delete',
	POST_VIEW: 'post_view',
	
	// 댓글 관련
	COMMENT_CREATE: 'comment_create',
	COMMENT_UPDATE: 'comment_update',
	COMMENT_DELETE: 'comment_delete',
	
	// 사용자 관리
	USER_ROLE_UPDATE: 'user_role_update',
	USER_STATUS_TOGGLE: 'user_status_toggle',
	USER_PASSWORD_RESET: 'user_password_reset',
	
	// 관리자 액션
	ADMIN_ACCESS: 'admin_access',
	ADMIN_SETTINGS_UPDATE: 'admin_settings_update',
	
	// 문의 관련
	INQUIRY_CREATE: 'inquiry_create',
	INQUIRY_UPDATE: 'inquiry_update',
	INQUIRY_DELETE: 'inquiry_delete',
	
	// 일정 관련
	SCHEDULE_CREATE: 'schedule_create',
	SCHEDULE_UPDATE: 'schedule_update',
	SCHEDULE_DELETE: 'schedule_delete',
	
	// 일정 카테고리 관련
	SCHEDULE_CATEGORY_CREATE: 'schedule_category_create',
	SCHEDULE_CATEGORY_UPDATE: 'schedule_category_update',
	SCHEDULE_CATEGORY_DELETE: 'schedule_category_delete',
	
	// 물류 관련
	CUSTOMER_CREATE: 'customer_create',
	CUSTOMER_UPDATE: 'customer_update',
	CUSTOMER_DELETE: 'customer_delete',
	PRODUCT_CREATE: 'product_create',
	PRODUCT_UPDATE: 'product_update',
	PRODUCT_DELETE: 'product_delete',
	WAREHOUSE_CREATE: 'warehouse_create',
	WAREHOUSE_UPDATE: 'warehouse_update',
	WAREHOUSE_DELETE: 'warehouse_delete',
	TRACKING_CREATE: 'tracking_create',
	TRACKING_UPDATE: 'tracking_update',
	TRACKING_DELETE: 'tracking_delete',
	
	// 기타
	FILE_UPLOAD: 'file_upload',
	FILE_DELETE: 'file_delete'
};

/**
 * 에러 메시지를 안전하게 문자열로 변환
 * @param {any} error - 에러 객체
 * @returns {string} 에러 메시지 문자열
 */
export function formatErrorMessage(error) {
	if (!error) return '';
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	if (typeof error === 'object' && error !== null) {
		// error.message가 있으면 우선 사용
		if (error.message) return String(error.message);
		// 객체인 경우 JSON으로 변환
		try {
			return JSON.stringify(error, null, 2);
		} catch {
			return String(error);
		}
	}
	return String(error);
}

/**
 * 로그 기록
 * @param {Object} params - 로그 파라미터
 * @param {string} params.actionType - 액션 타입 (ACTION_TYPES 상수 사용)
 * @param {string} params.actionCategory - 액션 카테고리 (ACTION_CATEGORIES 상수 사용)
 * @param {Object} [params.actionDetails] - 액션 상세 정보 (JSON)
 * @param {string} [params.userId] - 사용자 ID (없으면 현재 로그인한 사용자)
 * @param {string} [params.ipAddress] - IP 주소
 * @param {string} [params.userAgent] - User Agent
 * @param {string} [params.result] - 결과 ('success' 또는 'error', 기본값: 'success')
 * @param {string} [params.errorMessage] - 에러 메시지 (result가 'error'인 경우)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function logAction({
	actionType,
	actionCategory,
	actionDetails = {},
	userId = null,
	ipAddress = null,
	userAgent = null,
	result = 'success',
	errorMessage = null
}) {
	try {
		// 현재 로그인한 사용자 정보 가져오기
		if (!userId) {
			const { data: { user } } = await supabase.auth.getUser();
			userId = user?.id || null;
		}

		// IP 주소와 User Agent 가져오기 (클라이언트 사이드에서만)
		if (typeof window !== 'undefined') {
			if (!ipAddress) {
				// IP 주소는 서버 사이드에서만 정확히 가져올 수 있으므로 클라이언트에서는 null
				ipAddress = null;
			}
			if (!userAgent) {
				userAgent = navigator.userAgent || null;
			}
		}

		const { data, error } = await supabase
			.from('user_action_logs')
			.insert({
				user_id: userId,
				action_type: actionType,
				action_category: actionCategory,
				action_details: actionDetails,
				ip_address: ipAddress,
				user_agent: userAgent,
				result: result,
				error_message: errorMessage
			})
			.select()
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		// 로그 기록 실패는 앱 동작에 영향을 주지 않도록 에러를 무시하거나 콘솔에만 출력
		console.error('로그 기록 실패:', error);
		return { 
			data: null, 
			error: error instanceof Error ? error : new Error(String(error)) 
		};
	}
}

/**
 * 필터 조건을 적용한 쿼리 빌더 생성
 * @param {Object} options - 필터 옵션
 * @returns {Object} Supabase 쿼리 객체
 */
function buildLogQuery(options) {
	const {
		userId = null,
		actionCategory = null,
		actionType = null,
		result = null,
		startDate = null,
		endDate = null
	} = options;

	let query = supabase.from('user_action_logs');

	// 필터 적용
	if (userId) {
		query = query.eq('user_id', userId);
	}
	if (actionCategory) {
		query = query.eq('action_category', actionCategory);
	}
	if (actionType) {
		query = query.eq('action_type', actionType);
	}
	if (result) {
		query = query.eq('result', result);
	}
	if (startDate) {
		// Date 객체인지 확인
		const startDateValue = startDate instanceof Date ? startDate.toISOString() : startDate;
		query = query.gte('created_at', startDateValue);
	}
	if (endDate) {
		// Date 객체인지 확인하고 하루 끝 시간으로 설정
		let endDateValue;
		if (endDate instanceof Date) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			endDateValue = end.toISOString();
		} else {
			endDateValue = endDate;
		}
		query = query.lte('created_at', endDateValue);
	}

	return query;
}

/**
 * 로그 조회 (관리자 전용)
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.userId] - 특정 사용자 ID로 필터링
 * @param {string} [options.actionCategory] - 특정 카테고리로 필터링
 * @param {string} [options.actionType] - 특정 액션 타입으로 필터링
 * @param {string} [options.result] - 결과로 필터링 ('success' 또는 'error')
 * @param {Date} [options.startDate] - 시작 날짜
 * @param {Date} [options.endDate] - 종료 날짜
 * @param {number} [options.page] - 페이지 번호 (기본값: 1)
 * @param {number} [options.limit] - 페이지당 항목 수 (기본값: 50)
 * @returns {Promise<{data: Array|null, total: number|null, error: Error|null}>}
 */
export async function getActionLogs(options = {}) {
	try {
		const {
			userId = null,
			actionCategory = null,
			actionType = null,
			result = null,
			startDate = null,
			endDate = null,
			page = 1,
			limit = 2
		} = options;

		// 전체 개수 조회 (필터 조건 동일하게 적용)
		const countQuery = buildLogQuery({
			userId,
			actionCategory,
			actionType,
			result,
			startDate,
			endDate
		});
		const { count, error: countError } = await countQuery.select('*', { count: 'exact', head: true });

		if (countError) {
			console.error('로그 개수 조회 쿼리 에러:', countError);
			throw countError;
		}

		// 데이터 조회
		const dataQuery = buildLogQuery({
			userId,
			actionCategory,
			actionType,
			result,
			startDate,
			endDate
		})
			.select('*')
			.order('created_at', { ascending: false })
			.range((page - 1) * limit, page * limit - 1);

		const { data, error } = await dataQuery;

		if (error) {
			console.error('로그 조회 쿼리 에러:', error);
			throw error;
		}

		// user_id가 있는 경우 user_profiles에서 사용자 정보 조회
		const processedData = [];
		if (data && data.length > 0) {
			// user_id 목록 수집
			const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
			
			// 사용자 정보 일괄 조회
			let usersMap = new Map();
			if (userIds.length > 0) {
				const { data: usersData } = await supabase
					.from('user_profiles')
					.select('id, email, full_name')
					.in('id', userIds);
				
				if (usersData) {
					usersData.forEach(user => {
						usersMap.set(user.id, user);
					});
				}
			}

			// 로그 데이터에 사용자 정보 추가
			processedData.push(...data.map(log => ({
				...log,
				user: log.user_id ? (usersMap.get(log.user_id) || null) : null
			})));
		}

		return { data: processedData, total: count || 0, error: null };
	} catch (error) {
		console.error('로그 조회 실패:', error);
		return { 
			data: null,
			total: null,
			error: error instanceof Error ? error : new Error(String(error)) 
		};
	}
}

/**
 * 로그 통계 조회
 * @param {Object} [options] - 조회 옵션
 * @param {Date} [options.startDate] - 시작 날짜
 * @param {Date} [options.endDate] - 종료 날짜
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getLogStatistics(options = {}) {
	try {
		const { startDate = null, endDate = null } = options;

		let query = supabase
			.from('user_action_logs')
			.select('action_category, action_type, result, created_at');

		if (startDate) {
			query = query.gte('created_at', startDate.toISOString());
		}
		if (endDate) {
			query = query.lte('created_at', endDate.toISOString());
		}

		const { data, error } = await query;

		if (error) throw error;

		// 통계 계산
		const stats = {
			total: data?.length || 0,
			byCategory: {},
			byType: {},
			byResult: {
				success: 0,
				error: 0
			},
			byDate: {}
		};

		if (data) {
			data.forEach(log => {
				// 카테고리별 통계
				stats.byCategory[log.action_category] = (stats.byCategory[log.action_category] || 0) + 1;
				
				// 타입별 통계
				stats.byType[log.action_type] = (stats.byType[log.action_type] || 0) + 1;
				
				// 결과별 통계
				if (log.result === 'success') {
					stats.byResult.success++;
				} else {
					stats.byResult.error++;
				}
				
				// 날짜별 통계
				const date = new Date(log.created_at).toISOString().split('T')[0];
				stats.byDate[date] = (stats.byDate[date] || 0) + 1;
			});
		}

		return { data: stats, error: null };
	} catch (error) {
		console.error('로그 통계 조회 실패:', error);
		return { 
			data: null, 
			error: error instanceof Error ? error : new Error(String(error)) 
		};
	}
}

/**
 * 오래된 로그 삭제 (관리자 전용)
 * @param {number} daysToKeep - 보관할 일수 (기본값: 90일)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function deleteOldLogs(daysToKeep = 90) {
	try {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

		const { data, error } = await supabase
			.from('user_action_logs')
			.delete()
			.lt('created_at', cutoffDate.toISOString())
			.select();

		if (error) throw error;

		return { 
			data: { deletedCount: data?.length || 0 }, 
			error: null 
		};
	} catch (error) {
		console.error('오래된 로그 삭제 실패:', error);
		return { 
			data: null, 
			error: error instanceof Error ? error : new Error(String(error)) 
		};
	}
}

