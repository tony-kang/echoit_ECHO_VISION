<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getCategoryBySlug } from '$lib/boardCategoryService';
	import { authStore } from '$lib/stores/authStore';
	import PostList from './PostList.svelte';
	import PostForm from './PostForm.svelte';
	import PostDetail from './PostDetail.svelte';
	import LabelSidebar from './LabelSidebar.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import ErrorMessage from './ErrorMessage.svelte';

	let {
		categorySlug,
		postId = null
	} = $props();

	/** @type {any} */
	let category = $state(null);
	let loading = $state(true);
	/** @type {string | null} */
	let error = $state(null);
	let showPostForm = $state(false);
	/** @type {any} */
	let editingPost = $state(null);
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let postListRefreshTrigger = $state(0);

	onMount(() => {
		authStore.initialize();
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
		});

		loadCategory();

		return () => {
			unsubscribe();
		};
	});

	$effect(() => {
		const slug = categorySlug;
		if (slug) {
			loadCategory();
		}
	});

	async function loadCategory() {
		if (!categorySlug) return;

		loading = true;
		error = null;
		const { data, error: err } = await getCategoryBySlug(categorySlug);

		if (err) {
			error = err.message || '게시판을 불러오는데 실패했습니다.';
			loading = false;
			return;
		}

		category = data;
		loading = false;
	}

	function handlePostCreated() {
		showPostForm = false;
		editingPost = null;
		// 게시물 목록 새로고침
		postListRefreshTrigger += 1;
	}

	/** @param {any} post */
	function handlePostEdit(post) {
		editingPost = post;
		showPostForm = true;
	}

	function handlePostDelete() {
		// PostDetail에서 처리됨
	}
</script>

<div class="board-view">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<ErrorMessage message={error} onRetry={loadCategory} />
	{:else if category}
		<div class="flex gap-6">
			<!-- 메인 콘텐츠 -->
			<div class="flex-1">
				<!-- 헤더 -->
				<div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
					<div class="flex items-center justify-between">
						<div>
							<h1 class="text-2xl font-bold text-gray-900">{category.name}</h1>
							{#if category.description}
								<p class="text-gray-600 mt-1">{category.description}</p>
							{/if}
						</div>
						{#if user}
							<button
								onclick={() => { editingPost = null; showPostForm = true; }}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								글쓰기
							</button>
						{/if}
					</div>
				</div>

				<!-- 게시물 작성 폼 -->
				{#if showPostForm}
					<div class="mb-6">
						<PostForm
							categoryId={category.id}
							category={category}
							post={editingPost}
							onSubmit={handlePostCreated}
							onCancel={() => { showPostForm = false; editingPost = null; }}
						/>
					</div>
				{/if}

				<!-- 게시물 상세 또는 목록 -->
				{#if postId}
					<PostDetail
						postId={postId}
						onEdit={handlePostEdit}
						onDelete={handlePostDelete}
					/>
				{:else}
					<PostList
						categoryId={category.id}
						refreshTrigger={postListRefreshTrigger}
						onPostClick={(/** @type {any} */ post) => { goto(`/board/${categorySlug}/posts/${post.id}`); }}
					/>
				{/if}
			</div>

			<!-- 사이드바 (라벨) -->
			{#if user && (category.slug === 'personal' || category.options?.enable_labels === true)}
				<div class="w-64 flex-shrink-0">
					<LabelSidebar categoryId={category.id} />
				</div>
			{/if}
		</div>
	{/if}
</div>

