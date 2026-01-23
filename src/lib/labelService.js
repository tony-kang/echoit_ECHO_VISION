// 사용자 라벨 서비스
import { supabase } from '$lib/supabaseClient';

/**
 * 사용자의 모든 라벨 조회
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getUserLabels() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('post_labels')
    .select('*')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true });

  return { data, error };
}

/**
 * 라벨 생성
 * @param {Object} labelData - { name, color, display_order }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createLabel(labelData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '로그인이 필요합니다.' } };
  }

  const { data, error } = await supabase
    .from('post_labels')
    .insert({
      ...labelData,
      user_id: user.id
    })
    .select()
    .single();

  return { data, error };
}

/**
 * 라벨 수정
 * @param {string} labelId 
 * @param {Object} updates - { name, color, display_order }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateLabel(labelId, updates) {
  const { data, error } = await supabase
    .from('post_labels')
    .update(updates)
    .eq('id', labelId)
    .select()
    .single();

  return { data, error };
}

/**
 * 라벨 삭제
 * @param {string} labelId 
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteLabel(labelId) {
  const { error } = await supabase
    .from('post_labels')
    .delete()
    .eq('id', labelId);

  return { error };
}

/**
 * 게시물에 라벨 추가
 * @param {string} postId 
 * @param {string} labelId 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addLabelToPost(postId, labelId) {
  const { data, error } = await supabase
    .from('post_label_mappings')
    .insert({
      post_id: postId,
      label_id: labelId
    })
    .select()
    .single();

  return { data, error };
}

/**
 * 게시물에서 라벨 제거
 * @param {string} postId 
 * @param {string} labelId 
 * @returns {Promise<{error: Error|null}>}
 */
export async function removeLabelFromPost(postId, labelId) {
  const { error } = await supabase
    .from('post_label_mappings')
    .delete()
    .eq('post_id', postId)
    .eq('label_id', labelId);

  return { error };
}

/**
 * 게시물의 라벨 목록 조회
 * @param {string} postId 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getPostLabels(postId) {
  const { data, error } = await supabase
    .from('post_label_mappings')
    .select(`
      *,
      label:post_labels(*)
    `)
    .eq('post_id', postId);

  return { data, error };
}

/**
 * 라벨별 게시물 목록 조회
 * @param {string} labelId 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getPostsByLabel(labelId) {
  const { data, error } = await supabase
    .from('post_label_mappings')
    .select(`
      *,
      post:posts(
        *,
        author:profiles!author_id(id, full_name, avatar_url),
        category:board_categories!category_id(id, name, slug)
      )
    `)
    .eq('label_id', labelId)
    .order('created_at', { ascending: false });

  return { data, error };
}

