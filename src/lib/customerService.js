// 고객 서비스
import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES, formatErrorMessage } from './logService';

/**
 * 고객 유형 상수
 */
export const CUSTOMER_TYPES = {
	DEMAND: 'demand',
	MANAGEMENT: 'management',
	VENDOR: 'vendor'
};

/**
 * 고객 유형 라벨
 */
export const CUSTOMER_TYPE_LABELS = {
	demand: '고객/수요회사',
	management: '관리회사',
	vendor: '생산/공급회사'
};

/**
 * 고객 데이터 타입
 * @typedef {Object} CustomerData
 * @property {string} id - 고객 코드
 * @property {string} cust_type - 고객 유형 (demand, management, vendor)
 * @property {string} name - 고객명/회사명
 * @property {string} [company_reg_no] - 사업자등록번호
 * @property {Array<{name: string, email: string, phone: string}>} [contact_persons] - 담당자 정보 배열
 * @property {string} [address] - 주소
 * @property {string} [notes] - 비고
 * @property {boolean} [is_active] - 활성화 여부
 */

/**
 * 고객 목록 조회
 * @param {Object} [options] - 조회 옵션
 * @param {boolean} [options.activeOnly] - 활성화된 고객만 조회
 * @param {string} [options.custType] - 고객 유형 필터
 * @param {string} [options.search] - 검색어 (고객명/회사명)
 * @returns {Promise<{data: Array<CustomerData>|null, error: Error|null}>}
 */
export async function getCustomers(options = {}) {
	try {
		const { activeOnly = false, custType = null, search = null } = options;

		let query = supabase
			.from('el_customer')
			.select('*')
			.order('created_at', { ascending: false });

		if (activeOnly) {
			query = query.eq('is_active', true);
		}

		if (custType) {
			query = query.eq('cust_type', custType);
		}

		if (search) {
			query = query.ilike('name', `%${search}%`);
		}

		const { data, error } = await query;

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('고객 목록 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 고객 상세 조회
 * @param {string} customerId - 고객 코드
 * @returns {Promise<{data: CustomerData|null, error: Error|null}>}
 */
export async function getCustomerById(customerId) {
	try {
		const { data, error } = await supabase
			.from('el_customer')
			.select('*')
			.eq('id', customerId)
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('고객 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 고객 생성
 * @param {CustomerData} customerData - 고객 데이터
 * @returns {Promise<{data: CustomerData|null, error: Error|null}>}
 */
export async function createCustomer(customerData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_customer')
			.insert([
				{
					...customerData,
					created_by: user.id,
					is_active: customerData.is_active !== undefined ? customerData.is_active : true
				}
			])
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.CUSTOMER_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				customerId: data?.id,
				name: customerData.name,
				custType: customerData.cust_type
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('고객 생성 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.CUSTOMER_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				name: customerData.name,
				custType: customerData.cust_type
			},
			result: 'error',
			errorMessage: formatErrorMessage(error)
		});

		return { data: null, error };
	}
}

/**
 * 고객 수정
 * @param {string} customerId - 고객 코드
 * @param {Partial<CustomerData>} updates - 수정할 데이터
 * @returns {Promise<{data: CustomerData|null, error: Error|null}>}
 */
export async function updateCustomer(customerId, updates) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_customer')
			.update(updates)
			.eq('id', customerId)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.CUSTOMER_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				customerId: customerId,
				updates: updates
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('고객 수정 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.CUSTOMER_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				customerId: customerId,
				updates: updates
			},
			result: 'error',
			errorMessage: formatErrorMessage(error)
		});

		return { data: null, error };
	}
}

/**
 * 고객 삭제
 * @param {string} customerId - 고객 코드
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteCustomer(customerId) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		// 삭제 전 데이터 조회
		const { data: oldData } = await supabase
			.from('el_customer')
			.select('name, cust_type')
			.eq('id', customerId)
			.single();

		const { error } = await supabase
			.from('el_customer')
			.delete()
			.eq('id', customerId);

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.CUSTOMER_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				customerId: customerId,
				name: oldData?.name || null,
				custType: oldData?.cust_type || null
			},
			result: 'success'
		});

		return { error: null };
	} catch (error) {
		console.error('고객 삭제 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.CUSTOMER_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				customerId: customerId
			},
			result: 'error',
			errorMessage: formatErrorMessage(error)
		});

		return { error };
	}
}
