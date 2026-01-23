// 반응(좋아요/싫어요) 서비스
import { supabase } from '$lib/supabaseClient';

/**
 * 게시물에 반응 추가/수정
 * @param {string} postId 
 * @param {string} reactionType - 'like' | 'dislike'
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function toggleReaction(postId, reactionType) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    /** @type {Error} */
    const error = new Error('로그인이 필요합니다.');
    return { data: null, error };
  }

  // console.log('[toggleReaction] 시작:', { postId, reactionType, userId: user.id });

  // 기존 반응 확인
  const { data: existing, error: checkError } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();
  
  // console.log('[toggleReaction] 기존 반응 확인:', { existing, checkError });
  
  // 에러가 발생했지만 PGRST116 (0개 행) 에러가 아닌 경우만 처리
  if (checkError && checkError.code !== 'PGRST116') {
    // console.error('[toggleReaction] 기존 반응 확인 에러:', checkError);
    return { data: null, error: checkError };
  }

  if (existing) {
    if (existing.reaction_type === reactionType) {
      // 같은 반응이면 삭제
      // console.log('[toggleReaction] 같은 반응 삭제:', existing.id);
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existing.id);
      
      // if (error) {
      //   console.error('[toggleReaction] 삭제 에러:', error);
      // } else {
      //   console.log('[toggleReaction] 삭제 성공');
      // }
      
      return { data: null, error };
    } else {
      // 다른 반응이면 업데이트
      // console.log('[toggleReaction] 다른 반응으로 업데이트:', existing.id, '->', reactionType);
      const { data, error } = await supabase
        .from('post_reactions')
        .update({ reaction_type: reactionType })
        .eq('id', existing.id)
        .select()
        .single();
      
      // if (error) {
      //   console.error('[toggleReaction] 업데이트 에러:', error);
      // } else {
      //   console.log('[toggleReaction] 업데이트 성공:', data);
      // }
      
      return { data, error };
    }
  } else {
    // 새 반응 추가
    // console.log('[toggleReaction] 새 반응 추가:', { postId, userId: user.id, reactionType });
    const { data, error } = await supabase
      .from('post_reactions')
      .insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: reactionType
      })
      .select()
      .single();
    
    // if (error) {
    //   console.error('[toggleReaction] 추가 에러:', error);
    // } else {
    //   console.log('[toggleReaction] 추가 성공:', data);
    // }
    
    return { data, error };
  }
}

/**
 * 사용자의 게시물 반응 조회
 * @param {string} postId 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getUserReaction(postId) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  // PGRST116 에러(0개 행)는 정상적인 경우로 처리
  if (error && error.code === 'PGRST116') {
    return { data: null, error: null };
  }

  return { data, error };
}

/**
 * 게시물의 반응 통계 조회
 * @param {string} postId 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getReactionCounts(postId) {
  const { data, error } = await supabase
    .from('post_reaction_counts')
    .select('*')
    .eq('post_id', postId)
    .maybeSingle();

  // PGRST116 에러(0개 행)는 정상적인 경우로 처리 (반응이 없는 게시물)
  if (error && error.code === 'PGRST116') {
    return { data: null, error: null };
  }

  return { data, error };
}

