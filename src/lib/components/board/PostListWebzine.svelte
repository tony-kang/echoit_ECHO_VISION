<script>
	import PostStyleWebzine from './PostStyleWebzine.svelte';

	let {
		posts = [],
		onPostClick = () => {}
	} = $props();
</script>

<!-- 웹진형: 큰 카드형, 넓은 레이아웃, 이미지 강조 -->
<div class="webzine-list">
	{#each posts as post (post.id)}
		<PostStyleWebzine
			{post}
			onClick={() => onPostClick(post)}
		/>
	{/each}
</div>

<style>
	.webzine-list {
		display: grid;
		gap: 2rem;
	}

	@media (min-width: 1024px) {
		.webzine-list {
			gap: 2.5rem;
		}
	}
</style>

