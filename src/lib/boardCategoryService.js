// 게시판 카테고리 서비스
import { supabase } from '$lib/supabaseClient';

/**
 * 모든 활성화된 카테고리 조회
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getActiveCategories() {
  const { data, error } = await supabase
    .from('board_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return { data, error };
}

/**
 * 모든 카테고리 조회 (관리자용)
 * @param {Object} [options={}] - 조회 옵션
 * @param {number} [options.page] - 페이지 번호
 * @param {number} [options.pageSize] - 페이지당 항목 수
 * @returns {Promise<{data: Array, total: number|null, error: Error|null}>}
 */
export async function getAllCategories(options = {}) {
  const { page = null, pageSize = null } = options;

  // 전체 개수 조회
  const { count, error: countError } = await supabase
    .from('board_categories')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return { data: null, total: null, error: countError };
  }

  // 데이터 조회용 쿼리
  let query = supabase
    .from('board_categories')
    .select('*')
    .order('display_order', { ascending: true });

  // 페이지네이션 적용
  if (page && pageSize) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;

  return { data, total: count || null, error };
}

/**
 * 카테고리 생성
 * @param {Object} categoryData - { name, description, slug, display_order }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createCategory(categoryData) {
  const { data, error } = await supabase
    .from('board_categories')
    .insert({
      ...categoryData,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  return { data, error };
}

/**
 * 카테고리 수정
 * @param {string} categoryId 
 * @param {Object} updates - 수정할 필드들
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('board_categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();

  return { data, error };
}

/**
 * 카테고리 삭제
 * @param {string} categoryId 
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from('board_categories')
    .delete()
    .eq('id', categoryId);

  return { error };
}

/**
 * 슬러그로 카테고리 조회
 * @param {string} slug 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getCategoryBySlug(slug) {
  const { data, error } = await supabase
    .from('board_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return { data, error };
}

