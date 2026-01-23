<script>
	import { goto } from '$app/navigation';
	import { getPostsByCategory } from '$lib/postService';
	import PostListList from './PostListList.svelte';
	import PostListCard from './PostListCard.svelte';
	import PostListWebzine from './PostListWebzine.svelte';
	import PostListTimeline from './PostListTimeline.svelte';
	import PostListFeed from './PostListFeed.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import ErrorMessage from './ErrorMessage.svelte';
	import EmptyState from './EmptyState.svelte';

	/**
	 * @typedef {Object} BoardCategory
	 * @property {string} id - 카테고리 ID
	 * @property {string} [name] - 카테고리 이름
	 * @property {string} [slug] - 카테고리 슬러그
	 * @property {Object} [options] - 카테고리 옵션
	 * @property {string} [options.card_subtype] - 카드 서브타입
	 * 
	 * @typedef {Object} Post
	 * @property {string} id - 게시물 ID
	 * @property {string} title - 게시물 제목
	 * @property {BoardCategory} [category] - 게시물이 속한 카테고리
	 */

	/**
	 * 기본 게시물 클릭 핸들러
	 * @param {Post} post - 클릭된 게시물
	 * @returns {void}
	 */
	const defaultOnPostClick = (post) => {
		// 부가 로직 코드
	};

	let {
		categoryId,
		category = null,
		designStyle = 'list',
		/** @type {(post: Post) => void} */
		onPostClick = defaultOnPostClick,
		refreshTrigger = 0
	} = $props();

	/**
	 * 카드형 세부 스타일 가져오기
	 * @type {string}
	 */
	const cardSubtype = $derived.by(() => {
		if (designStyle !== 'card') return 'news';
		if (category?.options?.card_subtype) {
			return category.options.card_subtype;
		}
		// category가 없으면 첫 번째 post의 category에서 가져오기
		if (posts.length > 0 && posts[0]?.category?.options?.card_subtype) {
			return posts[0].category.options.card_subtype;
		}
		return 'news'; // 기본값: 뉴스/기사형
	});

	/** @type {Array<Post>} 게시물 목록 */
	let posts = $state([]);
	/** @type {boolean} 로딩 상태 */
	let loading = $state(true);
	/** @type {string | null} 에러 메시지 */
	let error = $state(null);
	/** @type {number} 현재 페이지 */
	let currentPage = $state(1);
	/** @type {number} 페이지당 게시물 수 */
	const pageSize = 20;

	/**
	 * 카테고리별 게시물 목록을 불러오는 함수
	 * @returns {Promise<void>}
	 */
	async function loadPosts() {
		if (!categoryId) return;

		loading = true;
		error = null;

		const { data, error: err } = await getPostsByCategory(categoryId, {
			page: currentPage,
			limit: pageSize,
			sortBy: 'created_at'
		});

		if (err) {
			error = err.message || '게시물을 불러오는데 실패했습니다.';
			loading = false;
			return;
		}

		posts = data || [];
		loading = false;
	}

	/**
	 * categoryId 변경 시 게시물 목록 로드
	 */
	$effect(() => {
		loadPosts();
	});

	/**
	 * refreshTrigger 변경 시 게시물 목록 새로고침
	 */
	$effect(() => {
		if (refreshTrigger > 0 && categoryId) {
			loadPosts();
		}
	});

	/**
	 * 게시물 클릭 핸들러
	 * @param {Post} post - 클릭된 게시물
	 * @returns {void}
	 */
	function handlePostClick(post) {
		onPostClick(post);
		const categorySlug = post.category?.slug;
		if (categorySlug) {
			goto(`/board/${categorySlug}/posts/${post.id}`);
		} else {
			console.error('Category slug not found for post:', post);
		}
	}
</script>

<div class="post-list">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<ErrorMessage message={error} onRetry={loadPosts} />
	{:else if posts.length === 0}
		<EmptyState
			title="새 글을 작성해보세요."
			message="게시판에 대해 궁금한 게 있거나 유용한 팁이 있다면 공유해주세요."
		/>
	{:else}
		<div class="post-list-container">
			{#if designStyle === 'list'}
				<PostListList
					{posts}
					onPostClick={handlePostClick}
				/>
			{:else if designStyle === 'card'}
				<PostListCard
					{posts}
					cardSubtype={cardSubtype}
					onPostClick={handlePostClick}
				/>
			{:else if designStyle === 'webzine'}
				<PostListWebzine
					{posts}
					onPostClick={handlePostClick}
				/>
			{:else if designStyle === 'timeline'}
				<PostListTimeline
					{posts}
					onPostClick={handlePostClick}
				/>
			{:else if designStyle === 'feed'}
				<PostListFeed
					{posts}
					onPostClick={handlePostClick}
				/>
			{:else}
				<!-- 기본값: 목록형 -->
				<PostListList
					{posts}
					onPostClick={handlePostClick}
				/>
			{/if}
		</div>
	{/if}
</div>

