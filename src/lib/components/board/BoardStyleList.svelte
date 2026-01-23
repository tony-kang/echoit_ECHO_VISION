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
			<!-- 헤더 배너 -->
			<div class="category-banner mb-8">
				<div class="banner-content">
					<div class="banner-text">
						<h1 class="banner-title">{category.name}</h1>
						{#if category.description}
							<p class="banner-description">{category.description}</p>
						{:else}
							<p class="banner-description">게시판에 오신 것을 환영합니다.</p>
						{/if}
					</div>
					<div class="banner-graphic">
						<div class="code-icon">{`{}`}</div>
					</div>
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
				{#if user && !showPostForm}
					<div class="banner-actions">
						<button
							onclick={() => { showPostForm = true; }}
							class="write-button"
						>
							글쓰기
						</button>
					</div>
				{/if}
				<PostList
					categoryId={category.id}
					designStyle="list"
					refreshTrigger={postListRefreshTrigger}
					onPostClick={(post) => { goto(`/board/${category.slug}/posts/${post.id}`); }}
				/>
			{/if}
		</div>

		<!-- 사이드바 (라벨) -->
		{#if showSidebar}
			<div class="hidden md:block w-64 shrink-0">
				<LabelSidebar categoryId={category.id} />
			</div>
		{/if}
	</div>
</div>

<style>
	.category-banner {
		position: relative;
		background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
		border-radius: 0.5rem;
		padding: 1.5rem 1rem;
		overflow: hidden;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
	}

	@media (min-width: 640px) {
		.category-banner {
			border-radius: 1rem;
			padding: 0.5rem 2rem;
		}
	}

	@media (min-width: 1024px) {
		.category-banner {
			padding: 0.5rem 3rem;
		}
	}

	.category-banner::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
		background-size: 40px 40px;
		opacity: 0.5;
		pointer-events: none;
	}

	.banner-content {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		z-index: 1;
	}

	.banner-text {
		flex: 1;
	}

	.banner-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0 0 0.5rem 0;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	@media (min-width: 640px) {
		.banner-title {
			font-size: 2rem;
			margin: 0 0 1rem 0;
		}
	}

	@media (min-width: 1024px) {
		.banner-title {
			font-size: 3rem;
		}
	}

	.banner-description {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
		line-height: 1.6;
	}

	@media (min-width: 640px) {
		.banner-description {
			font-size: 1rem;
		}
	}

	@media (min-width: 1024px) {
		.banner-description {
			font-size: 1.125rem;
		}
	}

	.banner-graphic {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.code-icon {
		font-size: 4rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.15);
		transform: rotate(-5deg);
		text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		font-family: 'Courier New', monospace;
		line-height: 1;
	}

	@media (min-width: 640px) {
		.code-icon {
			font-size: 5rem;
		}
	}

	@media (min-width: 1024px) {
		.code-icon {
			font-size: 8rem;
		}
	}

	.banner-actions {
		position: relative;
		margin-top: 1rem;
		z-index: 1;
		display: flex;
		justify-content: flex-end;
	}

	.write-button {
		background-color: #3b82f6;
		color: #ffffff;
		padding: 0.3rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
		margin-bottom: 1rem;
	}

	.write-button:hover {
		background-color: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.3);
	}

	.write-button:active {
		transform: translateY(0);
	}

	/* 반응형 디자인 */
	@media (max-width: 640px) {
		.banner-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.banner-graphic {
			align-self: flex-end;
		}
	}
</style>

