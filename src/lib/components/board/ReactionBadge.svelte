<script>
	let {
		counts
	} = $props();
</script>

<div class="flex items-center gap-2">
	<span class="text-green-600">👍 {counts.like_count || 0}</span>
	<span class="text-red-600">👎 {counts.dislike_count || 0}</span>
</div>

