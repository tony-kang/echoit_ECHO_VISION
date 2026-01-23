<script>
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import { goto } from '$app/navigation';
	import UserAvatar from './UserAvatar.svelte';

	let {
		post,
		isAuthor = false,
		onEdit = () => {},
		onDelete = () => {},
		showBackButton = false,
		categorySlug = null
	} = $props();

	function handleBackToList() {
		if (categorySlug) {
			goto(`/board/${categorySlug}`);
		} else if (post?.category?.slug) {
			goto(`/board/${post.category.slug}`);
		}
	}
</script>

<div class="border-b border-gray-200 pb-4 mb-4">
	{#if showBackButton}
		<div class="mb-3">
			<button
				onclick={() => handleBackToList()}
				class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
				<span>목록으로</span>
			</button>
		</div>
	{/if}
	<div class="flex items-start justify-between mb-2">
		<h1 class="text-2xl font-bold text-gray-900 flex-1">
			{#if post.is_pinned}
				<span class="inline-block mr-2">📌</span>
			{/if}
			{post.title}
		</h1>
		{#if isAuthor}
			<div class="flex gap-2 ml-4">
				<button
					onclick={() => onEdit(post)}
					class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
				>
					수정
				</button>
				<button
					onclick={() => onDelete()}
					class="px-3 py-1 text-sm text-red-600 hover:text-red-800"
				>
					삭제
				</button>
			</div>
		{/if}
	</div>
	<div class="flex items-center justify-end gap-4 text-sm text-gray-500">
		<UserAvatar
			user={post.author}
			showName={true}
			size="sm"
		/>
		<span>·</span>
		<span>{formatDistanceToNow(post.created_at)}</span>
		<span>·</span>
		<span>👁️ {post.view_count || 0}</span>
	</div>
</div>

