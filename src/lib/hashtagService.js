// 해시태그 서비스
import { supabase } from '$lib/supabaseClient';

/**
 * 해시태그 이름으로 해시태그 찾기 또는 생성
 * @param {string} name - 해시태그 이름 (# 제외)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function findOrCreateHashtag(name) {
  const normalizedName = name.trim().toLowerCase().replace(/^#/, '');
  
  if (!normalizedName) {
    return { data: null, error: { message: '해시태그 이름이 필요합니다.' } };
  }

  // 기존 해시태그 찾기
  const { data: existing } = await supabase
    .from('hashtags')
    .select('*')
    .eq('name', normalizedName)
    .single();

  if (existing) {
    return { data: existing, error: null };
  }

  // 새 해시태그 생성
  const { data, error } = await supabase
    .from('hashtags')
    .insert({ name: normalizedName })
    .select()
    .single();

  return { data, error };
}

/**
 * 게시물에 해시태그 추가
 * @param {string} postId 
 * @param {string} hashtagName - 해시태그 이름 (# 포함 가능)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addHashtagToPost(postId, hashtagName) {
  const { data: hashtag, error: hashtagError } = await findOrCreateHashtag(hashtagName);
  
  if (hashtagError || !hashtag) {
    return { data: null, error: hashtagError || { message: '해시태그를 찾을 수 없습니다.' } };
  }

  const { data, error } = await supabase
    .from('post_hashtag_mappings')
    .insert({
      post_id: postId,
      hashtag_id: hashtag.id
    })
    .select(`
      *,
      hashtag:hashtags(*)
    `)
    .single();

  return { data, error };
}

/**
 * 게시물에서 해시태그 제거
 * @param {string} postId 
 * @param {string} hashtagId 
 * @returns {Promise<{error: Error|null}>}
 */
export async function removeHashtagFromPost(postId, hashtagId) {
  const { error } = await supabase
    .from('post_hashtag_mappings')
    .delete()
    .eq('post_id', postId)
    .eq('hashtag_id', hashtagId);

  return { error };
}

/**
 * 게시물의 해시태그 목록 조회
 * @param {string} postId 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getPostHashtags(postId) {
  const { data, error } = await supabase
    .from('post_hashtag_mappings')
    .select(`
      *,
      hashtag:hashtags(*)
    `)
    .eq('post_id', postId);

  return { data, error };
}

/**
 * 여러 해시태그를 게시물에 추가
 * @param {string} postId 
 * @param {Array<string>} hashtagNames - 해시태그 이름 배열
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function addHashtagsToPost(postId, hashtagNames) {
  const results = [];
  const errors = [];

  for (const name of hashtagNames) {
    const { data, error } = await addHashtagToPost(postId, name);
    if (error) {
      errors.push({ name, error });
    } else {
      results.push(data);
    }
  }

  return { 
    data: results, 
    error: errors.length > 0 ? { message: '일부 해시태그 추가에 실패했습니다.', errors } : null 
  };
}

/**
 * 인기 해시태그 조회
 * @param {number} limit - 조회할 개수
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getPopularHashtags(limit = 10) {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * 해시태그로 게시물 검색
 * @param {string} hashtagName 
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getPostsByHashtag(hashtagName) {
  const normalizedName = hashtagName.trim().toLowerCase().replace(/^#/, '');
  
  const { data, error } = await supabase
    .from('post_hashtag_mappings')
    .select(`
      *,
      hashtag:hashtags!inner(*),
      post:posts(
        *,
        author:profiles!author_id(id, full_name, avatar_url),
        category:board_categories!category_id(id, name, slug)
      )
    `)
    .eq('hashtag.name', normalizedName)
    .order('created_at', { ascending: false });

  return { data, error };
}

