<script>
	let {
		message = '오류가 발생했습니다.',
		onRetry = null
	} = $props();
</script>

<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
	<div class="flex items-start justify-between gap-4">
		<p>{message}</p>
		{#if onRetry}
			<button
				onclick={onRetry}
				class="px-3 py-1 text-sm bg-red-100 rounded hover:bg-red-200 transition-colors"
			>
				다시 시도
			</button>
		{/if}
	</div>
</div>

