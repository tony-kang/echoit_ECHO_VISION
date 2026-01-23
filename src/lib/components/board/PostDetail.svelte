<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getPostById, deletePost } from '$lib/postService';
	import { toggleReaction, getUserReaction } from '$lib/reactionService';
	import { getPostHashtags } from '$lib/hashtagService';
	import { authStore } from '$lib/stores/authStore';
	import CommentList from './CommentList.svelte';
	import PostHeader from './PostHeader.svelte';
	import PostActions from './PostActions.svelte';
	import PostLabelManager from './PostLabelManager.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import ErrorMessage from './ErrorMessage.svelte';

	/**
	 * @typedef {Object} PostDetailProps
	 * @property {string} postId - 게시물 ID
	 * @property {Function} [onEdit] - 게시물 수정 콜백 함수
	 * @property {Function} [onDelete] - 게시물 삭제 콜백 함수
	 */

	/** @type {PostDetailProps} */
	let {
		postId,
		onEdit = () => {},
		onDelete = () => {}
	} = $props();

	/** @type {any} 게시물 데이터 */
	let post = $state(null);
	/** @type {boolean} 로딩 상태 */
	let loading = $state(true);
	/** @type {string | null} 에러 메시지 */
	let error = $state(null);
	/** @type {import('@supabase/supabase-js').User | null} 현재 사용자 */
	let user = $state(null);
	/** @type {any} 사용자의 반응 정보 */
	let userReaction = $state(null);
	/** @type {Array<any>} 해시태그 목록 */
	let hashtags = $state([]);

	onMount(() => {
		authStore.initialize();
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
		});

		loadPost();
		loadHashtags();

		return () => {
			unsubscribe();
		};
	});

	/**
	 * 사용자 상태 변경 시 반응 정보 로드
	 */
	$effect(() => {
		if (user && postId) {
			loadUserReaction();
		}
	});

	/**
	 * 게시물 데이터 로드
	 * @returns {Promise<void>}
	 */
	async function loadPost() {
		loading = true;
		error = null;
		const { data, error: err } = await getPostById(postId);

		if (err) {
			error = err.message || '게시물을 불러오는데 실패했습니다.';
			loading = false;
			return;
		}

		post = data;
		loading = false;
	}

	/**
	 * 해시태그 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadHashtags() {
		const { data } = await getPostHashtags(postId);
		hashtags = (data || []).map(item => item.hashtag).filter(Boolean);
	}

	/**
	 * 사용자 반응 정보 로드
	 * @returns {Promise<void>}
	 */
	async function loadUserReaction() {
		if (!user) return;
		const { data } = await getUserReaction(postId);
		userReaction = data;
	}

	/**
	 * 반응 버튼 클릭 핸들러
	 * @param {string} type - 반응 타입
	 * @returns {Promise<void>}
	 */
	async function handleReaction(type) {
		if (!user) {
			goto('/login');
			return;
		}

		const { error: err } = await toggleReaction(postId, type);
		if (!err) {
			await loadPost();
			await loadUserReaction();
		}
	}

	/**
	 * 게시물 삭제 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleDelete() {
		if (!confirm('정말 삭제하시겠습니까?')) return;

		const { error: err } = await deletePost(postId);
		if (err) {
			alert('삭제에 실패했습니다.');
			return;
		}

		onDelete();
		goto('/board');
	}

	/**
	 * 게시물 공유 핸들러
	 * @returns {void}
	 */
	function handleShare() {
		if (navigator.share) {
			navigator.share({
				title: post?.title,
				text: post?.content,
				url: window.location.href
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			alert('링크가 클립보드에 복사되었습니다.');
		}
	}

	/**
	 * 작성자 여부 확인
	 * @type {boolean}
	 */
	const isAuthor = $derived.by(() => {
		return user && post && user.id === post.author_id;
	});
</script>

<div class="post-detail">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<ErrorMessage message={error} onRetry={loadPost} />
	{:else if post}
		<article class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
			<PostHeader
				{post}
				{isAuthor}
				onEdit={() => onEdit(post)}
				onDelete={handleDelete}
			/>

			<!-- 본문 -->
			<div class="prose max-w-none mb-6">
				{#if post.category?.options?.editor_style === 'html'}
					<!-- HTML 에디터로 작성된 경우 HTML 렌더링 -->
					<div class="froala-content">{@html post.content}</div>
				{:else}
					<!-- 텍스트 에디터로 작성된 경우 일반 텍스트 렌더링 -->
					<div class="whitespace-pre-wrap text-gray-700">{post.content}</div>
				{/if}
			</div>

			<!-- 해시태그 -->
			{#if hashtags.length > 0}
				<div class="mb-4 pb-4 border-b border-gray-200">
					<div class="flex flex-wrap gap-2">
						{#each hashtags as hashtag (hashtag.id)}
							<span class="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
								#{hashtag.name}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 라벨 관리 -->
			{#if user && (post.category?.slug === 'personal' || post.category?.options?.enable_labels === true)}
				<div class="mb-4 pb-4 border-b border-gray-200">
					<PostLabelManager postId={post.id} />
				</div>
			{/if}

			<PostActions
				reactionCounts={post.reaction_counts}
				{userReaction}
				onReaction={handleReaction}
				onShare={handleShare}
			/>
		</article>

		<!-- 댓글 -->
		<CommentList {postId} />
	{/if}
</div>

<style>
	.prose {
		color: #374151;
	}
	
	:global(.froala-content) {
		color: #374151;
		line-height: 1.75;
	}
	
	:global(.froala-content img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
	
	:global(.froala-content p) {
		margin: 1rem 0;
	}
	
	:global(.froala-content h1),
	:global(.froala-content h2),
	:global(.froala-content h3),
	:global(.froala-content h4),
	:global(.froala-content h5),
	:global(.froala-content h6) {
		margin-top: 1.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}
	
	:global(.froala-content ul),
	:global(.froala-content ol) {
		margin: 1rem 0;
		padding-left: 2rem;
	}
	
	:global(.froala-content blockquote) {
		border-left: 4px solid #3b82f6;
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: #6b7280;
	}
	
	:global(.froala-content table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}
	
	:global(.froala-content table th),
	:global(.froala-content table td) {
		border: 1px solid #e5e7eb;
		padding: 0.5rem;
	}
	
	:global(.froala-content table th) {
		background-color: #f9fafb;
		font-weight: 600;
	}
</style>

