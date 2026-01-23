<script>
	import { goto } from '$app/navigation';
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import PostHashtags from './PostHashtags.svelte';
	import PostActions from './PostActions.svelte';

	let {
		post, // 게시물 정보
		categorySlug = null, // 카테고리 슬러그
		hashtags = [], // 해시태그 목록
		userReaction = null, // 사용자 반응 정보
		isAuthor = false, // 작성자 여부
		onEdit = () => {}, // 편집 핸들러
		onDelete = () => {}, // 삭제 핸들러
		onReaction = () => {}, // 반응 핸들러
		onShare = () => {} // 공유 핸들러
	} = $props();
</script>

<!-- 이미지 갤러리 모드: 제목 + 이미지 + 태그 + 댓글 -->
<article class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
	<!-- 뒤로가기 버튼 -->
	{#if categorySlug}
		<div class="px-4 py-4 sm:px-8 sm:py-6 border-b border-gray-100">
			<button
				onclick={() => { goto(`/board/${categorySlug}`); }}
				class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
				<span>목록으로</span>
			</button>
		</div>
	{/if}

	<!-- 제목 및 메타 정보 -->
	<div class="px-4 py-6 sm:px-8 sm:py-8">
		<!-- 제목 -->
		<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
			{post.title}
		</h1>

		<!-- 작성자 및 날짜 -->
		<div class="flex items-center justify-between gap-3 mb-3 text-sm text-gray-600 flex-wrap">
			{#if post.author}
				<div class="flex items-center justify-start gap-2">
					{#if post.author.avatar_url}
						<img
							src={post.author.avatar_url}
							alt={post.author.full_name || '작성자'}
							class="w-8 h-8 rounded-full object-cover"
						/>
					{:else}
						<div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
							{(post.author.full_name || 'U')[0]}
						</div>
					{/if}
					<span class="font-medium">{post.author.full_name || '익명'}</span>
					<span>{formatDistanceToNow(post.created_at)}</span>
				</div>
			{/if}

			<div class="flex items-center justify-end gap-2">
				{#if post.view_count !== undefined && post.view_count !== null}
					<span>👁️ {post.view_count}</span>
				{/if}
				{#if isAuthor}
					<span>·</span>
					<button
						onclick={onEdit}
						class="text-blue-600 hover:text-blue-800 transition-colors"
					>
						수정
					</button>
					<span>·</span>
					<button
						onclick={onDelete}
						class="text-red-600 hover:text-red-800 transition-colors"
					>
						삭제
					</button>
				{/if}
			</div>
		</div>

		<!-- 이미지 영역 -->
		{#if post.thumbnail_url}
			<div class="flex justify-center mb-6 bg-gray-100 py-4">
				<div class="gallery-image-container">
					<img
						src={post.thumbnail_url}
						alt={post.title}
						class="gallery-image"
						onerror={(e) => {
							e.target.style.display = 'none';
							const errorDiv = e.target.nextElementSibling;
							if (errorDiv) {
								errorDiv.style.display = 'flex';
							}
						}}
					/>
					<div class="hidden w-full h-64 bg-gray-200 items-center justify-center error-message">
						<span class="text-gray-400 text-lg">이미지를 불러올 수 없습니다</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- 해시태그 -->
		<PostHashtags {hashtags} />

		<!-- 액션 버튼 -->
		<PostActions
			reactionCounts={post.reaction_counts}
			{userReaction}
			onReaction={onReaction}
			onShare={onShare}
		/>
	</div>
</article>

<style>
	.gallery-image-container {
		max-width: 1200px;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.gallery-image {
		max-width: 100%;
		height: auto;
		object-fit: contain;
		display: block;
	}

	.error-message {
		display: none;
	}

	/* 작은 화면에서는 전체 너비 사용 */
	@media (max-width: 640px) {
		.gallery-image-container {
			max-width: 100%;
		}
	}
</style>

