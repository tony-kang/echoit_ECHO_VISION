// 게시물 서비스
import { supabase } from '$lib/supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from '$lib/logService';

/**
 * @typedef {Object} PostOptions
 * @property {number} [page] - 페이지 번호
 * @property {number} [limit] - 페이지당 항목 수
 * @property {string} [sortBy] - 정렬 기준
 */

/**
 * 카테고리별 게시물 목록 조회
 * @param {string} categoryId 
 * @param {PostOptions} options - { page, limit, sortBy }
 * @returns {Promise<{data: any[] | null, total: number|null, error: Error|null}>}
 */
export async function getPostsByCategory(categoryId, options = {}) {
  const { page = 1, limit = 20, sortBy = 'created_at' } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 전체 개수 조회
  const { count, error: countError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (countError) {
    return { data: null, total: null, error: countError };
  }

  // 데이터 조회
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      category:board_categories!category_id(id, name, slug, options),
      reaction_counts:post_reaction_counts(like_count, dislike_count)
    `)
    .eq('category_id', categoryId)
    .order('is_pinned', { ascending: false })
    .order(sortBy, { ascending: false })
    .range(from, to);

  const { data, error } = await query;

  return { data: data || null, total: count || null, error };
}

/**
 * 게시물 상세 조회
 * @param {string} postId 
 * @param {boolean} incrementView - 조회수 증가 여부 (기본값: false)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getPostById(postId, incrementView = false) {
  // reaction_counts는 선택적으로 조회 (에러가 발생해도 게시물 데이터는 반환)
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      category:board_categories!category_id(id, name, slug, options),
      reaction_counts:post_reaction_counts(like_count, dislike_count)
    `)
    .eq('id', postId)
    .single();

  // reaction_counts 조회 실패 시에도 게시물 데이터는 유지
  // (reaction_counts는 null이거나 빈 객체일 수 있음)
  if (data && !error) {
    // 조회수 증가 (옵션이 true일 때만)
    if (incrementView) {
      await supabase.rpc('increment_post_view_count', { post_id: postId });
    }
    
    // reaction_counts가 없거나 빈 객체인 경우 직접 조회
    if (!data.reaction_counts || (data.reaction_counts.like_count === undefined && data.reaction_counts.dislike_count === undefined)) {
      // 직접 post_reactions 테이블에서 카운트 조회
      const { data: reactions, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId);
      
      if (!reactionsError && reactions) {
        const likeCount = reactions.filter(r => r.reaction_type === 'like').length;
        const dislikeCount = reactions.filter(r => r.reaction_type === 'dislike').length;
        data.reaction_counts = { like_count: likeCount, dislike_count: dislikeCount };
      } else {
        // 조회 실패 시 기본값 설정
        data.reaction_counts = { like_count: 0, dislike_count: 0 };
      }
    }
  }

  return { data, error };
}

/**
 * 게시물 생성
 * @param {Object} postData - { category_id, title, content, thumbnail_url? }
 * @param {string} postData.category_id - 카테고리 ID
 * @param {string} postData.title - 게시물 제목
 * @param {string} postData.content - 게시물 내용
 * @param {string} [postData.thumbnail_url] - 썸네일 이미지/영상 URL (선택사항)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createPost(postData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    /** @type {Error} */
    const error = new Error('로그인이 필요합니다.');
    return { data: null, error };
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      ...postData,
      author_id: user.id
    })
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      category:board_categories!category_id(id, name, slug, options)
    `)
    .single();

  if (error) {
    // 에러 로그 기록
    await logAction({
      actionType: ACTION_TYPES.POST_CREATE,
      actionCategory: ACTION_CATEGORIES.POST,
      actionDetails: {
        categoryId: postData.category_id,
        title: postData.title
      },
      result: 'error',
      errorMessage: error.message || '게시물 생성 실패'
    });
    return { data, error };
  }

  // 성공 로그 기록
  await logAction({
    actionType: ACTION_TYPES.POST_CREATE,
    actionCategory: ACTION_CATEGORIES.POST,
    actionDetails: {
      postId: data?.id,
      categoryId: postData.category_id,
      title: postData.title
    },
    result: 'success'
  });

  return { data, error };
}

/**
 * 게시물 수정
 * @param {string} postId - 게시물 ID
 * @param {Object} updates - { title?, content?, thumbnail_url? }
 * @param {string} [updates.title] - 게시물 제목
 * @param {string} [updates.content] - 게시물 내용
 * @param {string} [updates.thumbnail_url] - 썸네일 이미지/영상 URL
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updatePost(postId, updates) {
  // 이전 데이터 조회
  const { data: oldData } = await supabase
    .from('posts')
    .select('title, category_id')
    .eq('id', postId)
    .single();

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      category:board_categories!category_id(id, name, slug, options)
    `)
    .single();

  if (error) {
    // 에러 로그 기록
    await logAction({
      actionType: ACTION_TYPES.POST_UPDATE,
      actionCategory: ACTION_CATEGORIES.POST,
      actionDetails: {
        postId: postId,
        updates: updates
      },
      result: 'error',
      errorMessage: error.message || '게시물 수정 실패'
    });
    return { data, error };
  }

  // 성공 로그 기록
  await logAction({
    actionType: ACTION_TYPES.POST_UPDATE,
    actionCategory: ACTION_CATEGORIES.POST,
    actionDetails: {
      postId: postId,
      oldTitle: oldData?.title || null,
      newTitle: updates.title || oldData?.title || null,
      categoryId: data?.category_id || oldData?.category_id || null
    },
    result: 'success'
  });

  return { data, error };
}

/**
 * 게시물 삭제
 * @param {string} postId 
 * @returns {Promise<{error: Error|null}>}
 */
export async function deletePost(postId) {
  // 삭제 전 데이터 조회
  const { data: oldData } = await supabase
    .from('posts')
    .select('title, category_id')
    .eq('id', postId)
    .single();

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    // 에러 로그 기록
    await logAction({
      actionType: ACTION_TYPES.POST_DELETE,
      actionCategory: ACTION_CATEGORIES.POST,
      actionDetails: {
        postId: postId
      },
      result: 'error',
      errorMessage: error.message || '게시물 삭제 실패'
    });
    return { error };
  }

  // 성공 로그 기록
  await logAction({
    actionType: ACTION_TYPES.POST_DELETE,
    actionCategory: ACTION_CATEGORIES.POST,
    actionDetails: {
      postId: postId,
      title: oldData?.title || null,
      categoryId: oldData?.category_id || null
    },
    result: 'success'
  });

  return { error };
}

/**
 * 게시물 검색
 * @param {string} searchTerm 
 * @param {string | null} categoryId - 선택적
 * @returns {Promise<{data: any[] | null, error: Error|null}>}
 */
export async function searchPosts(searchTerm, categoryId = null) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      category:board_categories!category_id(id, name, slug, options),
      reaction_counts:post_reaction_counts(like_count, dislike_count)
    `)
    .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  return { data: data || null, error };
}

