// 댓글 서비스
import { supabase } from '$lib/supabaseClient';

/**
 * 게시물의 댓글 목록 조회 (계층 구조)
 * @param {string} postId 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getCommentsByPost(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      replies:comments!parent_id(
        *,
        author:profiles!author_id(id, full_name, avatar_url)
      )
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  return { data, error };
}

/**
 * 댓글 생성
 * @param {Object} commentData - { post_id, content, parent_id (선택적) }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createComment(commentData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '로그인이 필요합니다.' } };
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      ...commentData,
      author_id: user.id
    })
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url)
    `)
    .single();

  return { data, error };
}

/**
 * 댓글 수정
 * @param {string} commentId 
 * @param {Object} updates - { content }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateComment(commentId, updates) {
  const { data, error } = await supabase
    .from('comments')
    .update(updates)
    .eq('id', commentId)
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url)
    `)
    .single();

  return { data, error };
}

/**
 * 댓글 삭제
 * @param {string} commentId 
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  return { error };
}

