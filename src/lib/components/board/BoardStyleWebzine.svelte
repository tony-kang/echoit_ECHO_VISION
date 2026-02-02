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
	<!-- 메인 콘텐츠 (넓은 레이아웃, 사이드바 없음) -->
	<div class="max-w-5xl mx-auto px-2 sm:px-4">
		<!-- 헤더 -->
		<div class="webzine-header mb-8">
			<div class="header-content">
				<div class="header-text">
					<h1 class="header-title">{category.name}</h1>
					{#if category.description}
						<p class="header-description">{category.description}</p>
					{:else}
						<p class="header-description">웹진 스타일 게시판입니다.</p>
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
				designStyle="webzine"
				refreshTrigger={postListRefreshTrigger}
				onPostClick={(post) => { goto(`/board/${category.slug}/posts/${post.id}`); }}
			/>
		{/if}
	</div>
</div>

<style>
	.webzine-header {
		border-bottom: 2px solid #e5e7eb;
		padding: 2rem 0;
	}

	@media (min-width: 640px) {
		.webzine-header {
			padding: 3rem 0;
		}
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.header-content {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 2rem;
		}
	}

	.header-text {
		flex: 1;
	}

	.header-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
		line-height: 1.2;
	}

	@media (min-width: 640px) {
		.header-title {
			font-size: 2rem;
			margin: 0 0 0.75rem 0;
		}
	}

	@media (min-width: 1024px) {
		.header-title {
			font-size: 2.5rem;
		}
	}

	.header-description {
		font-size: 0.875rem;
		color: #4b5563;
		margin: 0;
		line-height: 1.6;
	}

	@media (min-width: 640px) {
		.header-description {
			font-size: 1rem;
		}
	}

	@media (min-width: 1024px) {
		.header-description {
			font-size: 1.125rem;
		}
	}

	.write-button {
		width: 100%;
		padding: 0.5rem 1rem;
		background-color: #111827;
		color: #ffffff;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	@media (min-width: 640px) {
		.write-button {
			width: auto;
			padding: 0.75rem 1.5rem;
			font-size: 1rem;
		}
	}

	.write-button:hover {
		background-color: #1f2937;
	}

	.write-button:active {
		transform: translateY(1px);
	}
</style>

