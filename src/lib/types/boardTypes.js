/**
 * 게시판 관련 타입 정의
 */

/**
 * 게시판 카테고리 타입
 * @typedef {Object} BoardCategory
 * @property {string} id - 카테고리 ID
 * @property {string} name - 카테고리 이름
 * @property {string} [description] - 카테고리 설명
 * @property {string} slug - 카테고리 슬러그
 * @property {number} display_order - 표시 순서
 * @property {boolean} is_active - 활성화 여부
 * @property {CategoryOptions} [options] - 카테고리 옵션
 * @property {string} [created_by] - 생성자 ID
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 */

/**
 * 카테고리 옵션 타입
 * @typedef {Object} CategoryOptions
 * @property {'text'|'html'} [editor_style] - 에디터 스타일 (기본값: 'text')
 * @property {'list'|'card'|'webzine'|'timeline'|'feed'} [design_style] - 디자인 스타일 (기본값: 'list')
 * @property {'news'|'magazine'|'blog'} [card_subtype] - 카드형 세부 스타일 (기본값: 'news')
 * @property {boolean} [enable_comments] - 댓글 활성화 (기본값: true)
 * @property {boolean} [enable_images] - 이미지 업로드 활성화 (기본값: false)
 * @property {boolean} [enable_files] - 파일 업로드 활성화 (기본값: false)
 * @property {boolean} [enable_reactions] - 좋아요/싫어요 활성화 (기본값: true)
 * @property {boolean} [enable_labels] - 개인 라벨 활성화 (기본값: false)
 */

/**
 * 게시물 타입
 * @typedef {Object} Post
 * @property {string} id - 게시물 ID
 * @property {string} title - 게시물 제목
 * @property {string} content - 게시물 내용
 * @property {string} category_id - 카테고리 ID
 * @property {string} author_id - 작성자 ID
 * @property {boolean} [is_pinned] - 고정 여부
 * @property {number} [view_count] - 조회수
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 * @property {BoardCategory} [category] - 게시물이 속한 카테고리
 * @property {Author} [author] - 작성자 정보
 * @property {ReactionCounts} [reaction_counts] - 반응 수
 */

/**
 * 작성자 정보 타입
 * @typedef {Object} Author
 * @property {string} id - 사용자 ID
 * @property {string} [full_name] - 전체 이름
 * @property {string} [avatar_url] - 아바타 URL
 */

/**
 * 반응 수 타입
 * @typedef {Object} ReactionCounts
 * @property {number} [like_count] - 좋아요 수
 * @property {number} [dislike_count] - 싫어요 수
 */

/**
 * 라벨 타입
 * @typedef {Object} Label
 * @property {string} id - 라벨 ID
 * @property {string} name - 라벨 이름
 * @property {string} [color] - 라벨 색상
 * @property {string} user_id - 소유자 ID
 * @property {string} created_at - 생성일시
 */

/**
 * 해시태그 타입
 * @typedef {Object} Hashtag
 * @property {string} id - 해시태그 ID
 * @property {string} name - 해시태그 이름
 * @property {string} created_at - 생성일시
 */

/**
 * 댓글 타입
 * @typedef {Object} Comment
 * @property {string} id - 댓글 ID
 * @property {string} post_id - 게시물 ID
 * @property {string} author_id - 작성자 ID
 * @property {string} content - 댓글 내용
 * @property {string} [parent_id] - 부모 댓글 ID (대댓글인 경우)
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 * @property {Author} [author] - 작성자 정보
 * @property {Comment[]} [replies] - 대댓글 목록
 */

/**
 * 사용자 반응 타입
 * @typedef {Object} UserReaction
 * @property {string} id - 반응 ID
 * @property {string} post_id - 게시물 ID
 * @property {string} user_id - 사용자 ID
 * @property {'like'|'dislike'} type - 반응 타입
 */

