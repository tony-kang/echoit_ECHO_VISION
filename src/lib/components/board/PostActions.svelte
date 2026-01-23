<script>
	import ReactionButton from './ReactionButton.svelte';

	let {
		reactionCounts,
		userReaction,
		onReaction = () => {},
		onShare = () => {}
	} = $props();

	/**
	 * 좋아요 반응 핸들러
	 * @returns {void}
	 */
	function handleLike() {
		onReaction('like');
	}

	/**
	 * 싫어요 반응 핸들러
	 * @returns {void}
	 */
	function handleDislike() {
		onReaction('dislike');
	}
</script>

<div class="flex items-center justify-between pt-4 border-t border-gray-200">
	<div class="flex items-center gap-4">
		<ReactionButton
			type="like"
			count={reactionCounts?.like_count || 0}
			isActive={userReaction?.reaction_type === 'like'}
			onClick={handleLike}
		/>
		<ReactionButton
			type="dislike"
			count={reactionCounts?.dislike_count || 0}
			isActive={userReaction?.reaction_type === 'dislike'}
			onClick={handleDislike}
		/>
	</div>
	<button
		type="button"
		onclick={onShare}
		class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
	>
		<span>🔗</span>
		<span>공유</span>
	</button>
</div>

