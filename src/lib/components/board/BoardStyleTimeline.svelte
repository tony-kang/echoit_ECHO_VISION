<script>
	import { goto } from '$app/navigation';
	import PostList from './PostList.svelte';
	import PostForm from './PostForm.svelte';
	import PostDetail from './PostDetail.svelte';
	import LabelSidebar from './LabelSidebar.svelte';

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

	const showSidebar = $derived.by(() => {
		if (!user || !category) return false;
		return category.slug === 'personal' || category.options?.enable_labels === true;
	});
</script>

<div class="w-full">
	<div class="flex flex-col md:flex-row gap-4 md:gap-6">
		<!-- 메인 콘텐츠 -->
		<div class="flex-1 min-w-0">
			<!-- 헤더 -->
			<div class="timeline-header mb-6">
				<div class="header-content">
					<div class="header-text">
						<h1 class="header-title">{category.name}</h1>
						{#if category.description}
							<p class="header-description">{category.description}</p>
						{:else}
							<p class="header-description">타임라인 스타일 게시판입니다.</p>
						{/if}
					</div>
					{#if user && !showPostForm}
						<button
							type="button"
							onclick={() => { showPostForm = true; }}
							class="write-button"
						>
							+ 이력 추가
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
					designStyle="timeline"
					refreshTrigger={postListRefreshTrigger}
					onPostClick={(post) => { goto(`/board/${category.slug}/posts/${post.id}`); }}
				/>
			{/if}
		</div>

		<!-- 사이드바 (라벨) -->
		{#if showSidebar}
			<div class="hidden xl:block w-64 shrink-0">
				<LabelSidebar categoryId={category.id} />
			</div>
		{/if}
	</div>
</div>

<style>
	.timeline-header {
		background-color: #ffffff;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		padding: 1rem;
	}

	@media (min-width: 640px) {
		.timeline-header {
			padding: 1.5rem;
		}
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
		line-height: 1.2;
	}

	@media (min-width: 640px) {
		.header-title {
			font-size: 1.5rem;
		}
	}

	.header-description {
		font-size: 0.875rem;
		color: #4b5563;
		margin: 0.25rem 0 0 0;
		line-height: 1.6;
	}

	@media (min-width: 640px) {
		.header-description {
			font-size: 1rem;
		}
	}

	.write-button {
		width: 100%;
		padding: 0.5rem 1rem;
		background-color: #2563eb;
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
			font-size: 1rem;
		}
	}

	.write-button:hover {
		background-color: #1d4ed8;
	}

	.write-button:active {
		transform: translateY(1px);
	}
</style>

