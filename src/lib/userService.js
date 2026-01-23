import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * 사용자 관리 서비스
 * 
 * ⚠️ 중요: Supabase Admin API는 클라이언트에서 직접 호출할 수 없습니다!
 * 
 * 현재 구현은 개발/테스트 목적이며, 실제 프로덕션 환경에서는:
 * 1. Supabase Edge Functions 사용
 * 2. 백엔드 API 서버 구축
 * 3. Service Role Key를 서버 사이드에서만 사용
 * 
 * 클라이언트에서 Admin API를 호출하면 에러가 발생하거나
 * 제한적인 기능만 사용 가능합니다.
 */

// 사용자 역할
export const USER_ROLES = {
	USER: 'user',
	ADMIN: 'admin',
	MASTER: 'master'
};

export const USER_ROLE_LABELS = {
	user: '일반 사용자',
	admin: '관리자',
	master: '마스터'
};

/**
 * 역할이 특정 역할인지 확인
 * @param {string|null|undefined} role - 역할 문자열
 * @param {string} targetRole - 확인할 역할
 * @returns {boolean}
 */
export function hasRole(role, targetRole) {
	if (!role) return false;
	return role === targetRole;
}

/**
 * 사용자가 관리자인지 확인
 * @param {string} role - 역할 문자열
 * @returns {boolean}
 */
export function isAdmin(role) {
	return role === USER_ROLES.ADMIN || role === USER_ROLES.MASTER;
}

/**
 * 사용자가 마스터인지 확인
 * @param {string} role - 역할 문자열
 * @returns {boolean}
 */
export function isMaster(role) {
	return role === USER_ROLES.MASTER;
}

/**
 * 현재 사용자의 user_profiles 정보 조회
 * @param {string} userId - 사용자 ID
 * @param {Object|null} userMetadata - 사용자 메타데이터 (선택사항, 폴백용)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getCurrentUserProfile(userId, userMetadata = null) {
	try {
		const { data, error } = await supabase
			.from('user_profiles')
			.select('*')
			.eq('id', userId)
			.maybeSingle();
		
		/** @type {any} */
		const metadata = userMetadata;
		
		// 테이블이 없거나 에러가 발생한 경우 user_metadata에서 역할 확인
		if (error) {
			// user_metadata에서 역할 확인 시도
			if (metadata?.role) {
				return {
					data: {
						id: userId,
						role: metadata.role,
						email: metadata.email || null,
						full_name: metadata.full_name || null
					},
					error: null
				};
			}
			
			// user_metadata에도 역할이 없으면 기본값 반환
			return {
				data: {
					id: userId,
					role: USER_ROLES.USER,
					email: metadata?.email || null,
					full_name: metadata?.full_name || null
				},
				error: null
			};
		}
		
		// 데이터가 있는 경우
		if (data) {
			// role이 없으면 기본값 설정
			if (!data.role || data.role === '' || data.role === null || data.role === undefined) {
				data.role = USER_ROLES.USER;
			} else {
				// role 값 정규화 (공백 제거, 소문자 변환)
				data.role = String(data.role).trim().toLowerCase();
			}
			
			return { data, error: null };
		}
		
		// 데이터가 없으면 기본 프로필 생성
		const defaultRole = metadata?.role || USER_ROLES.USER;
		return {
			data: {
				id: userId,
				role: defaultRole,
				email: metadata?.email || null,
				full_name: metadata?.full_name || null
			},
			error: null
		};
	} catch (error) {
		console.error('getCurrentUserProfile 예외 발생:', error);
		
		/** @type {any} */
		const metadata = userMetadata;
		
		// 에러 발생 시에도 기본 프로필 반환
		const defaultRole = metadata?.role || USER_ROLES.USER;
		return {
			data: {
				id: userId,
				role: defaultRole,
				email: metadata?.email || null,
				full_name: metadata?.full_name || null
			},
			error: null
		};
	}
}

/**
 * 모든 사용자 조회 (관리자 전용)
 * 
 * ⚠️ 주의: 클라이언트에서는 Supabase Admin API를 사용할 수 없습니다.
 * user_profiles 테이블에 필요한 정보(이메일, 이름 등)가 모두 저장되어 있어야 합니다.
 * 
 * RLS 정책: 관리자/마스터만 모든 사용자 프로필을 조회할 수 있습니다.
 * 
 * @param {Object} [options={}] - 조회 옵션
 * @param {string} [options.role] - 역할 필터
 * @param {string} [options.status] - 상태 필터 ('active' 또는 'banned')
 * @param {string} [options.search] - 검색어 (이메일, 이름)
 * @param {number} [options.page] - 페이지 번호 (기본값: 1)
 * @param {number} [options.pageSize] - 페이지당 항목 수 (기본값: 50)
 * @returns {Promise<{data: Array|null, total: number|null, error: Error|null}>}
 */
export async function getAllUsers(options = {}) {
	try {
		const {
			role = null,
			status = null,
			search = null,
			page = null,
			pageSize = null
		} = options;

		// 전체 개수 조회용 쿼리
		let countQuery = supabase
			.from('user_profiles')
			.select('*', { count: 'exact', head: true });

		// 데이터 조회용 쿼리
		let dataQuery = supabase
			.from('user_profiles')
			.select('*')
			.order('created_at', { ascending: false });

		// 필터 적용
		if (role) {
			countQuery = countQuery.eq('role', role);
			dataQuery = dataQuery.eq('role', role);
		}

		if (status === 'active') {
			countQuery = countQuery.eq('banned', false);
			dataQuery = dataQuery.eq('banned', false);
		} else if (status === 'banned') {
			countQuery = countQuery.eq('banned', true);
			dataQuery = dataQuery.eq('banned', true);
		}

		if (search) {
			const searchLower = `%${search.toLowerCase()}%`;
			countQuery = countQuery.or(`email.ilike.${searchLower},full_name.ilike.${searchLower}`);
			dataQuery = dataQuery.or(`email.ilike.${searchLower},full_name.ilike.${searchLower}`);
		}

		// 전체 개수 조회
		const { count, error: countError } = await countQuery;
		if (countError) {
			console.error('getAllUsers 개수 조회 에러:', countError);
			throw countError;
		}

		// 페이지네이션 적용
		if (page && pageSize) {
			const from = (page - 1) * pageSize;
			const to = from + pageSize - 1;
			dataQuery = dataQuery.range(from, to);
		}

		// 데이터 조회
		const { data: profiles, error } = await dataQuery;
		
		if (error) {
			console.error('getAllUsers 에러:', error);
			throw error;
		}
		
		// 데이터 정규화
		const normalizedData = (profiles || []).map(profile => {
			// banned 필드가 없으면 status로 판단
			const isBanned = profile.banned !== undefined 
				? profile.banned 
				: (profile.status === 'banned');
			
			return {
				...profile,
				email: profile.email || null,
				role: profile.role || USER_ROLES.USER,
				banned: isBanned,
				full_name: profile.full_name || null,
				// created_at과 last_sign_in_at은 user_profiles에 있으면 사용
				created_at: profile.created_at || null,
				// last_login_at을 last_sign_in_at으로 매핑
				last_sign_in_at: profile.last_login_at || null
			};
		});
		
		return { data: normalizedData, total: count || null, error: null };
	} catch (error) {
		console.error('사용자 조회 실패:', error);
		return { data: [], total: null, error: error instanceof Error ? error : new Error(String(error)) };
	}
}

/**
 * 사용자 역할 업데이트 (관리자 전용)
 * @param {string} userId - 사용자 ID
 * @param {string} role - 새로운 역할 ('user', 'admin', 'master')
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateUserRole(userId, role) {
	try {
		// 유효한 역할인지 확인
		const validRoles = [USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.MASTER];
		const finalRole = validRoles.includes(role) ? role : USER_ROLES.USER;
		
		const { data, error } = await supabase
			.from('user_profiles')
			.update({ role: finalRole })
			.eq('id', userId)
			.select()
			.single();
		
		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.USER_ROLE_UPDATE,
			actionCategory: ACTION_CATEGORIES.USER,
			actionDetails: {
				targetUserId: userId,
				oldRole: data?.role || null,
				newRole: finalRole
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('역할 업데이트 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.USER_ROLE_UPDATE,
			actionCategory: ACTION_CATEGORIES.USER,
			actionDetails: {
				targetUserId: userId,
				newRole: role
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
	}
}

/**
 * 사용자 활성화/비활성화
 * @param {string} userId - 사용자 ID
 * @param {boolean} banned - 비활성화 여부
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function toggleUserStatus(userId, banned) {
	try {
		const { data, error } = await supabase
			.from('user_profiles')
			.update({ banned: banned })
			.eq('id', userId)
			.select()
			.single();
		
		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.USER_STATUS_TOGGLE,
			actionCategory: ACTION_CATEGORIES.USER,
			actionDetails: {
				targetUserId: userId,
				banned: banned
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('상태 업데이트 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.USER_STATUS_TOGGLE,
			actionCategory: ACTION_CATEGORIES.USER,
			actionDetails: {
				targetUserId: userId,
				banned: banned
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
	}
}

/**
 * 사용자 통계
 * @param {Array<Object>} users - 사용자 배열
 * @returns {Promise<{total: number, admins: number, activeUsers: number, bannedUsers: number}>}
 */
export async function getUserStatistics(users) {
	if (!users || users.length === 0) {
		return {
			total: 0,
			admins: 0,
			activeUsers: 0,
			bannedUsers: 0
		};
	}
	
	const stats = {
		total: users.length,
		admins: 0,
		activeUsers: 0,
		bannedUsers: 0
	};
	
	users.forEach((/** @type {any} */ user) => {
		const role = user.role || USER_ROLES.USER;
		
		// 관리자 카운트 (admin 또는 master 역할)
		if (isAdmin(role)) {
			stats.admins++;
		}
		
		// 활성/비활성 카운트
		if (user.banned) {
			stats.bannedUsers++;
		} else {
			stats.activeUsers++;
		}
	});
	
	return stats;
}

/**
 * CSV 변환
 * @param {Array<Object>} users - 사용자 배열
 * @returns {string}
 */
export function convertUsersToCSV(users) {
	if (!users || users.length === 0) return '';
	
	const headers = [
		'ID',
		'이메일',
		'이름',
		'역할',
		'가입일',
		'마지막 로그인',
		'상태'
	];
	
	const rows = users.map((user) => {
		const role = user.role || USER_ROLES.USER;
		const roleLabel = USER_ROLE_LABELS[role] || role;
		
		return [
			user.id,
			user.email || '',
			user.full_name || '-',
			roleLabel,
			user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-',
			user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ko-KR') : '-',
			user.banned ? '비활성' : '활성'
		];
	});
	
	const csvContent = [headers, ...rows]
		.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
		.join('\n');
	
	return csvContent;
}

/**
 * CSV 다운로드
 * @param {Array<Object>} users - 사용자 배열
 * @param {string} [filename] - 파일명 (기본값: 'users')
 */
export function downloadUsersCSV(users, filename = 'users') {
	const csv = convertUsersToCSV(users);
	const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * 사용자 패스워드 리셋 (관리자 전용)
 * @param {string} userId - 사용자 ID
 * @param {string} newPassword - 새 패스워드
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function resetUserPassword(userId, newPassword) {
	try {
		const response = await fetch('/api/admin/reset-password', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				userId,
				newPassword
			})
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || '패스워드 리셋에 실패했습니다.');
		}

		return { data: result.data, error: null };
	} catch (error) {
		console.error('패스워드 리셋 실패:', error);
		return { 
			data: null, 
			error: error instanceof Error ? error : new Error(String(error)) 
		};
	}
}
