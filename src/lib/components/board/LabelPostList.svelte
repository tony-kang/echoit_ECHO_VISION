<script>
	import { goto } from '$app/navigation';

	let {
		label,
		posts = []
	} = $props();

	function handlePostClick(post) {
		const categorySlug = post.category?.slug;
		if (categorySlug) {
			goto(`/board/${categorySlug}/posts/${post.id}`);
		} else {
			console.error('Category slug not found for post:', post);
		}
	}
</script>

{#if posts.length > 0}
	<div class="mt-4 pt-4 border-t border-gray-200">
		<h4 class="text-sm font-semibold mb-2">{label.name} 게시물</h4>
		<div class="space-y-2">
			{#each posts as post (post.id)}
				<button
					onclick={() => handlePostClick(post)}
					class="w-full text-left px-2 py-1 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded"
				>
					<div class="truncate">{post.title}</div>
				</button>
			{/each}
		</div>
	</div>
{/if}
