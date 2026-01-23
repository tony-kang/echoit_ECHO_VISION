<script>
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import UserAvatar from './UserAvatar.svelte';
	import ReactionBadge from './ReactionBadge.svelte';

	let {
		post,
		onClick = () => {}
	} = $props();

	// console.log('post', $state.snapshot(post));
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<tr
	class="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
	onclick={() => onClick()}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick();
		}
	}}
>
	<!-- 고정 게시물 표시 -->
	<td class="px-4 py-3 text-center w-12">
		{#if post.is_pinned}
			<span class="text-yellow-500 text-lg" title="고정 게시물">📌</span>
		{/if}
	</td>

	<!-- 제목 -->
	<td class="px-4 py-3 text-left">
		<div class="flex items-center gap-2">
			<h3 class="text-sm font-medium text-gray-900 truncate">
				{post.title}
			</h3>
			{#if post.reaction_counts && Object.values(post.reaction_counts).some(count => count > 0)}
				<ReactionBadge counts={post.reaction_counts} />
			{/if}
		</div>
	</td>

	<!-- 작성자 -->
	<td class="px-4 py-3 text-center w-32">
		<div class="flex items-center justify-center gap-2">
			<UserAvatar
				user={post.author}
				showName={true}
				size="sm"
			/>
		</div>
	</td>

	<!-- 날짜 -->
	<td class="px-4 py-3 text-sm text-gray-600 text-center whitespace-nowrap w-28">
		{formatDistanceToNow(post.created_at)}
	</td>

	<!-- 조회수 -->
	<td class="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap w-24">
		👁️ {post.view_count || 0}
	</td>
</tr>

