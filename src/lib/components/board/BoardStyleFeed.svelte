<script>
	import { goto } from '$app/navigation';
	import PostList from './PostList.svelte';
	import PostForm from './PostForm.svelte';
	import PostDetail from './PostDetail.svelte';

	let {
		category,
		user,
		postId = null,
		postListRefreshTrigger = 0,
		onPostCreated = () => {},
		onPostEdit = () => {},
		onPostDelete = () => {}
	} = $props();

	/** @type {boolean} 게시물 작성 폼 표시 여부 */
	let showPostForm = $state(false);
</script>

<div class="w-full">
	<!-- 메인 콘텐츠 (Pinterest 스타일 그리드 레이아웃) -->
	<div class="max-w-7xl mx-auto px-2 sm:px-4">
		<!-- 헤더 -->
		<div class="feed-header mb-4 sm:mb-6">
			<div class="header-content">
				<div class="header-text">
					<h1 class="header-title">{category.name}</h1>
					{#if category.description}
						<p class="header-description">{category.description}</p>
					{:else}
						<p class="header-description">피드 스타일 게시판입니다.</p>
					{/if}
				</div>
				{#if user && !showPostForm}
					<button
						type="button"
						onclick={() => { showPostForm = true; }}
						class="write-button"
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
						onSubmit={(savedPost) => {
							showPostForm = false;
							onPostCreated(savedPost);
						}}
						onCancel={() => { showPostForm = false; }}
					/>
				</div>
			{/if}

		<!-- 게시물 상세 또는 목록 -->
		{#if postId}
			<PostDetail
				postId={postId}
				categorySlug={category.slug}
				onEdit={onPostEdit}
				onDelete={onPostDelete}
			/>
		{:else}
			<PostList
				categoryId={category.id}
				designStyle="feed"
				refreshTrigger={postListRefreshTrigger}
				onPostClick={(post) => { goto(`/board/${category.slug}/posts/${post.id}`); }}
			/>
		{/if}
	</div>
</div>

<style>
	.feed-header {
		background-color: transparent;
		padding: 0;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.header-content {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
		}
	}

	.header-text {
		flex: 1;
	}

	.header-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 640px) {
		.header-title {
			font-size: 1.25rem;
		}
	}

	.header-description {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
	}

	@media (min-width: 640px) {
		.header-description {
			font-size: 0.875rem;
		}
	}

	.write-button {
		width: 100%;
		padding: 0.375rem 0.75rem;
		background-color: #e5e7eb;
		color: #1f2937;
		border-radius: 0.25rem;
		font-weight: 500;
		font-size: 0.75rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	@media (min-width: 640px) {
		.write-button {
			width: auto;
			font-size: 0.875rem;
		}
	}

	.write-button:hover {
		background-color: #d1d5db;
	}

	.write-button:active {
		transform: translateY(1px);
	}
</style>

