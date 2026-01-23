// 제품 서비스
import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * 제품 데이터 타입
 * @typedef {Object} ProductData
 * @property {string} id - 부품 코드
 * @property {string} customer_id - 고객 코드
 * @property {string} part_no - 파트번호 (최대 16자리)
 * @property {string} [category] - 카테고리
 * @property {string} name - 명칭
 * @property {string} [spec] - 스펙(텍스트 내용)
 * @property {string} [unit] - 단위 (개, 박스, 팔레트 등)
 * @property {number} [weight] - 무게 (kg)
 * @property {string} [dimensions] - 치수 (예: "100x50x30cm")
 * @property {string} [notes] - 비고
 * @property {boolean} [is_active] - 활성화 여부
 */

/**
 * 제품 목록 조회
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.customerId] - 고객 코드 필터
 * @param {boolean} [options.activeOnly] - 활성화된 제품만 조회
 * @param {string} [options.search] - 검색어 (명칭, 파트번호)
 * @returns {Promise<{data: Array<ProductData>|null, error: Error|null}>}
 */
export async function getProducts(options = {}) {
	try {
		const { customerId = null, activeOnly = false, search = null } = options;

		let query = supabase
			.from('el_product')
			.select(`
				*,
				customer:el_customer(id, name, cust_type)
			`)
			.order('created_at', { ascending: false });

		if (customerId) {
			query = query.eq('customer_id', customerId);
		}

		if (activeOnly) {
			query = query.eq('is_active', true);
		}

		if (search) {
			query = query.or(`name.ilike.%${search}%,part_no.ilike.%${search}%`);
		}

		const { data, error } = await query;

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('제품 목록 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 제품 상세 조회
 * @param {string} productId - 부품 코드
 * @returns {Promise<{data: ProductData|null, error: Error|null}>}
 */
export async function getProductById(productId) {
	try {
		const { data, error } = await supabase
			.from('el_product')
			.select(`
				*,
				customer:el_customer(id, name, cust_type)
			`)
			.eq('id', productId)
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('제품 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 제품 생성
 * @param {ProductData} productData - 제품 데이터
 * @returns {Promise<{data: ProductData|null, error: Error|null}>}
 */
export async function createProduct(productData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_product')
			.insert([
				{
					...productData,
					unit: productData.unit || '개',
					created_by: user.id,
					is_active: productData.is_active !== undefined ? productData.is_active : true
				}
			])
			.select(`
				*,
				customer:el_customer(id, name, cust_type)
			`)
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.PRODUCT_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				productId: data?.id,
				name: productData.name,
				partNo: productData.part_no,
				customerId: productData.customer_id
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('제품 생성 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.PRODUCT_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				name: productData.name,
				partNo: productData.part_no,
				customerId: productData.customer_id
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 제품 수정
 * @param {string} productId - 부품 코드
 * @param {Partial<ProductData>} updates - 수정할 데이터
 * @returns {Promise<{data: ProductData|null, error: Error|null}>}
 */
export async function updateProduct(productId, updates) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_product')
			.update(updates)
			.eq('id', productId)
			.select(`
				*,
				customer:el_customer(id, name, cust_type)
			`)
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.PRODUCT_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				productId: productId,
				updates: updates
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('제품 수정 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.PRODUCT_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				productId: productId,
				updates: updates
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 제품 삭제
 * @param {string} productId - 부품 코드
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteProduct(productId) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		// 삭제 전 데이터 조회
		const { data: oldData } = await supabase
			.from('el_product')
			.select('name, part_no, customer_id')
			.eq('id', productId)
			.single();

		const { error } = await supabase
			.from('el_product')
			.delete()
			.eq('id', productId);

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.PRODUCT_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				productId: productId,
				name: oldData?.name || null,
				partNo: oldData?.part_no || null
			},
			result: 'success'
		});

		return { error: null };
	} catch (error) {
		console.error('제품 삭제 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.PRODUCT_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				productId: productId
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { error };
	}
}
