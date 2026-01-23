import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * @typedef {Object} CategoryData
 * @property {string} value
 * @property {string} label
 * @property {string} [color]
 * @property {string} [level]
 * @property {number} [display_order]
 * @property {boolean} [is_active]
 */

/**
 * 활성화된 카테고리 조회 (모든 사용자)
 * @param {string|string[]|null} categoryLevel - 카테고리 레벨 필터 
 *   - string: 단일 레벨 (예: 'default', 'contract')
 *   - string[]: 여러 레벨 배열 (예: ['default', 'contract'])
 *   - null: 'default' 레벨만 조회
 */
export async function getActiveCategories(categoryLevel = null) {
	try {
		let query = supabase
			.from('schedule_categories')
			.select('*')
			.eq('is_active', true);

		// categoryLevel 처리
		if (categoryLevel === null) {
			// null이면 default 레벨만 조회
			query = query.eq('level', 'default');
		} else if (Array.isArray(categoryLevel)) {
			// 배열이면 여러 레벨 조회 (IN 연산자)
			if (categoryLevel.length > 0) {
				query = query.in('level', categoryLevel);
			}
		} else if (typeof categoryLevel === 'string') {
			// 문자열이면 단일 레벨 조회
			query = query.eq('level', categoryLevel);
		}

		const { data, error } = await query.order('display_order', { ascending: true });

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('카테고리 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 모든 카테고리 조회 (관리자 전용)
 * @param {string|string[]|null} categoryLevel - 카테고리 레벨 필터 
 *   - string: 단일 레벨 (예: 'default', 'contract')
 *   - string[]: 여러 레벨 배열 (예: ['default', 'contract'])
 *   - null: 모든 레벨 조회 (관리자는 전체 조회)
 * @param {Object} [options={}] - 조회 옵션
 * @param {number} [options.page] - 페이지 번호
 * @param {number} [options.pageSize] - 페이지당 항목 수
 * @returns {Promise<{data: Array, total: number|null, error: Error|null}>}
 */
export async function getAllCategories(categoryLevel = null, options = {}) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { page = null, pageSize = null } = options;

		// 전체 개수 조회용 쿼리
		let countQuery = supabase
			.from('schedule_categories')
			.select('*', { count: 'exact', head: true });

		// 데이터 조회용 쿼리
		let dataQuery = supabase
			.from('schedule_categories')
			.select('*');

		// 관리자는 categoryLevel이 null이면 모든 레벨 조회
		if (categoryLevel !== null) {
			if (Array.isArray(categoryLevel)) {
				// 배열이면 여러 레벨 조회 (IN 연산자)
				if (categoryLevel.length > 0) {
					countQuery = countQuery.in('level', categoryLevel);
					dataQuery = dataQuery.in('level', categoryLevel);
				}
			} else if (typeof categoryLevel === 'string') {
				// 문자열이면 단일 레벨 조회
				countQuery = countQuery.eq('level', categoryLevel);
				dataQuery = dataQuery.eq('level', categoryLevel);
			}
		}

		// 전체 개수 조회
		const { count, error: countError } = await countQuery;
		if (countError) {
			console.error('카테고리 개수 조회 실패:', countError);
			throw countError;
		}

		// 페이지네이션 적용
		if (page && pageSize) {
			const from = (page - 1) * pageSize;
			const to = from + pageSize - 1;
			dataQuery = dataQuery.range(from, to);
		}

		const { data, error } = await dataQuery.order('display_order', { ascending: true });

		if (error) throw error;

		return { data: data || [], total: count || null, error: null };
	} catch (error) {
		console.error('카테고리 조회 실패:', error);
		return { data: [], total: null, error };
	}
}

/**
 * 카테고리 생성 (관리자 전용)
 * @param {CategoryData} categoryData
 */
export async function createCategory(categoryData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {CategoryData} */
		const category = categoryData;

		const { data, error } = await supabase
			.from('schedule_categories')
			.insert([
				{
					value: category.value,
					label: category.label,
					color: category.color || '#3b82f6',
					level: category.level || 'default',
					display_order: category.display_order || 0,
					is_active: category.is_active !== undefined ? category.is_active : true
				}
			])
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_CATEGORY_CREATE || 'schedule_category_create',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				categoryId: data?.id,
				value: category.value,
				label: category.label,
				level: category.level || 'default'
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('카테고리 생성 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_CATEGORY_CREATE || 'schedule_category_create',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				value: categoryData.value,
				label: categoryData.label
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 카테고리 수정 (관리자 전용)
 * @param {string} id
 * @param {Partial<CategoryData>} categoryData
 */
export async function updateCategory(id, categoryData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string} */
		const categoryId = id;
		/** @type {Partial<CategoryData>} */
		const categoryUpdate = categoryData;

		const updateData = {};
		if (categoryUpdate.value !== undefined) updateData.value = categoryUpdate.value;
		if (categoryUpdate.label !== undefined) updateData.label = categoryUpdate.label;
		if (categoryUpdate.color !== undefined) updateData.color = categoryUpdate.color;
		if (categoryUpdate.level !== undefined) updateData.level = categoryUpdate.level;
		if (categoryUpdate.display_order !== undefined) updateData.display_order = categoryUpdate.display_order;
		if (categoryUpdate.is_active !== undefined) updateData.is_active = categoryUpdate.is_active;

		const { data, error } = await supabase
			.from('schedule_categories')
			.update(updateData)
			.eq('id', categoryId)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_CATEGORY_UPDATE || 'schedule_category_update',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				categoryId: categoryId,
				updates: updateData
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('카테고리 수정 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_CATEGORY_UPDATE || 'schedule_category_update',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				categoryId: id,
				updates: categoryData
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 카테고리 삭제 (관리자 전용)
 * @param {string} id
 */
export async function deleteCategory(id) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string} */
		const categoryId = id;

		const { error } = await supabase
			.from('schedule_categories')
			.delete()
			.eq('id', categoryId);

		if (error) throw error;

		return { error: null };
	} catch (error) {
		console.error('카테고리 삭제 실패:', error);
		return { error };
	}
}

/**
 * 카테고리 활성화/비활성화 토글 (관리자 전용)
 * @param {string} id
 */
export async function toggleCategoryStatus(id) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string} */
		const categoryId = id;

		// 현재 상태 조회
		const { data: category, error: fetchError } = await supabase
			.from('schedule_categories')
			.select('is_active')
			.eq('id', categoryId)
			.single();

		if (fetchError) throw fetchError;

		// 상태 토글
		const { data, error } = await supabase
			.from('schedule_categories')
			.update({ is_active: !category.is_active })
			.eq('id', categoryId)
			.select()
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('카테고리 상태 변경 실패:', error);
		return { data: null, error };
	}
}

