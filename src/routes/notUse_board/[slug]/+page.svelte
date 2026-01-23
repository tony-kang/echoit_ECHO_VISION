<script>
	import { page } from '$app/stores';
	import BoardView from '$lib/components/board/BoardView.svelte';

	const categorySlug = $derived($page.params.slug);
	const postId = $derived($page.url.searchParams.get('postId'));
</script>

<svelte:head>
	<title>게시판 - Telepasi</title>
</svelte:head>


<div class="main-content-page">
	<main>
		<div class="container mx-auto px-4 py-8 max-w-7xl">
			<BoardView
				categorySlug={categorySlug}
				postId={postId}
			/>
		</div>
	</main>
</div>

