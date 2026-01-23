<script>
	import PostStyleFeed from './PostStyleFeed.svelte';

	let {
		posts = [],
		onPostClick = () => {}
	} = $props();
</script>

<!-- 피드형: Pinterest 스타일 masonry 레이아웃 -->
<div class="pinterest-grid">
	{#each posts as post (post.id)}
		<div class="pinterest-item">
			<PostStyleFeed
				{post}
				onClick={() => onPostClick(post)}
			/>
		</div>
	{/each}
</div>

<style>
	.pinterest-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, 236px);
		gap: 1rem;
		padding: 1rem 0;
		align-items: start;
		justify-content: center;
	}

	@media (min-width: 640px) {
		.pinterest-grid {
			grid-template-columns: repeat(auto-fill, 236px);
			justify-content: flex-start;
		}
	}

	.pinterest-item {
		width: 100%;
		break-inside: avoid;
		page-break-inside: avoid;
	}
</style>

