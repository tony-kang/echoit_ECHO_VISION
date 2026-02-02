<script>
	/**
	 * 컴포넌트 Props
	 * @type {{
	 *   month: number | string,
	 *   label?: string
	 * }}
	 */
	let { month, label } = $props();

	/**
	 * 월 라벨 텍스트
	 */
	const monthLabel = $derived(label || `${month}월`);
</script>

<th class="px-4 py-2 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">
	<div class="inline-flex items-center justify-center w-10 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold border-2 border-blue-300">
		{monthLabel}
	</div>
</th>
