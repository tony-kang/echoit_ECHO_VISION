// 창고 서비스
import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * 창고 데이터 타입
 * @typedef {Object} WarehouseData
 * @property {string} code - 창고 코드
 * @property {string} name - 창고명
 * @property {string} country - 국가
 * @property {string} location - (소재)지역
 * @property {string} addr - 주소
 * @property {Array<{name: string, email: string, tel: string}>} [person] - 담당자 정보 배열
 * @property {number} [total_qty] - 총재고 수량
 * @property {number} [available_qty] - 가용재고 수량
 * @property {number} [defective_qty] - 불량재고 수량
 * @property {number} [damaged_qty] - 파손재고 수량
 * @property {string} [notes] - 비고
 * @property {boolean} [is_active] - 활성화 여부
 */

/**
 * 창고 목록 조회
 * @param {Object} [options] - 조회 옵션
 * @param {boolean} [options.activeOnly] - 활성화된 창고만 조회
 * @param {string} [options.country] - 국가 필터
 * @param {string} [options.location] - 지역 필터
 * @param {string} [options.search] - 검색어 (창고명, 코드)
 * @returns {Promise<{data: Array<WarehouseData>|null, error: Error|null}>}
 */
export async function getWarehouses(options = {}) {
	try {
		const { activeOnly = false, country = null, location = null, search = null } = options;

		let query = supabase
			.from('el_warehouse')
			.select('*')
			.order('created_at', { ascending: false });

		if (activeOnly) {
			query = query.eq('is_active', true);
		}

		if (country) {
			query = query.eq('country', country);
		}

		if (location) {
			query = query.eq('location', location);
		}

		if (search) {
			query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
		}

		const { data, error } = await query;

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('창고 목록 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 창고 상세 조회
 * @param {string} warehouseId - 창고 ID
 * @returns {Promise<{data: WarehouseData|null, error: Error|null}>}
 */
export async function getWarehouseById(warehouseId) {
	try {
		const { data, error } = await supabase
			.from('el_warehouse')
			.select('*')
			.eq('id', warehouseId)
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('창고 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 창고 생성
 * @param {WarehouseData} warehouseData - 창고 데이터
 * @returns {Promise<{data: WarehouseData|null, error: Error|null}>}
 */
export async function createWarehouse(warehouseData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_warehouse')
			.insert([
				{
					...warehouseData,
					person: warehouseData.person || [],
					total_qty: warehouseData.total_qty || 0,
					available_qty: warehouseData.available_qty || 0,
					defective_qty: warehouseData.defective_qty || 0,
					damaged_qty: warehouseData.damaged_qty || 0,
					created_by: user.id,
					is_active: warehouseData.is_active !== undefined ? warehouseData.is_active : true
				}
			])
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.WAREHOUSE_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				warehouseId: data?.id,
				code: warehouseData.code,
				name: warehouseData.name
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('창고 생성 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.WAREHOUSE_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				code: warehouseData.code,
				name: warehouseData.name
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 창고 수정
 * @param {string} warehouseId - 창고 ID
 * @param {Partial<WarehouseData>} updates - 수정할 데이터
 * @returns {Promise<{data: WarehouseData|null, error: Error|null}>}
 */
export async function updateWarehouse(warehouseId, updates) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_warehouse')
			.update(updates)
			.eq('id', warehouseId)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.WAREHOUSE_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				warehouseId: warehouseId,
				updates: updates
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('창고 수정 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.WAREHOUSE_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				warehouseId: warehouseId,
				updates: updates
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 등록된 국가 목록 조회 (DISTINCT)
 * @returns {Promise<{data: Array<string>|null, error: Error|null}>}
 */
export async function getCountries() {
	try {
		const { data, error } = await supabase
			.from('el_warehouse')
			.select('country')
			.not('country', 'is', null)
			.order('country', { ascending: true });

		if (error) throw error;

		// 중복 제거 및 정렬
		const uniqueCountries = [...new Set((data || []).map((item) => item.country))].sort();

		return { data: uniqueCountries, error: null };
	} catch (error) {
		console.error('국가 목록 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 등록된 지역 목록 조회 (DISTINCT)
 * @param {string} [country] - 국가 필터 (선택사항)
 * @returns {Promise<{data: Array<string>|null, error: Error|null}>}
 */
export async function getLocations(country = null) {
	try {
		let query = supabase
			.from('el_warehouse')
			.select('location')
			.not('location', 'is', null)
			.order('location', { ascending: true });

		if (country) {
			query = query.eq('country', country);
		}

		const { data, error } = await query;

		if (error) throw error;

		// 중복 제거 및 정렬
		const uniqueLocations = [...new Set((data || []).map((item) => item.location))].sort();

		return { data: uniqueLocations, error: null };
	} catch (error) {
		console.error('지역 목록 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 창고 삭제
 * @param {string} warehouseId - 창고 ID
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteWarehouse(warehouseId) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		// 삭제 전 데이터 조회
		const { data: oldData } = await supabase
			.from('el_warehouse')
			.select('name, code')
			.eq('id', warehouseId)
			.single();

		const { error } = await supabase
			.from('el_warehouse')
			.delete()
			.eq('id', warehouseId);

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.WAREHOUSE_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				warehouseId: warehouseId,
				name: oldData?.name || null,
				code: oldData?.code || null
			},
			result: 'success'
		});

		return { error: null };
	} catch (error) {
		console.error('창고 삭제 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.WAREHOUSE_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				warehouseId: warehouseId
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { error };
	}
}
