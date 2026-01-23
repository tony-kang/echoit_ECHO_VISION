<script>
	let {
		size = 'md',
		message = '로딩 중...'
	} = $props();

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};
</script>

<div class="flex flex-col justify-center items-center py-12 gap-4">
	<div class="animate-spin rounded-full border-b-2 border-blue-600 {sizeClasses[size]}"></div>
	{#if message}
		<p class="text-gray-500 text-sm">{message}</p>
	{/if}
</div>

