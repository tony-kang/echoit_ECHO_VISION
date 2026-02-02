<script>
	/**
	 * 컴포넌트 Props
	 * @type {{
	 *   type: 'sales' | 'cost' | 'profit',
	 *   planned: number,
	 *   expected: number,
	 *   actual: number
	 * }}
	 */
	let { type, planned, expected, actual } = $props();

	/**
	 * 금액 포맷팅
	 * @param {number} value - 금액
	 * @returns {string}
	 */
	function formatCurrency(value) {
		return new Intl.NumberFormat('ko-KR').format(Math.round(value));
	}

	/**
	 * 이익인 경우 색상 클래스 반환
	 * @returns {string}
	 */
	const profitColorClass = $derived(type === 'profit' && actual >= 0 ? 'text-green-600' : type === 'profit' && actual < 0 ? 'text-red-600' : '');
</script>

<td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
	<div class="space-y-1">
		<div class="flex justify-between items-center">
			<span class="text-gray-500 text-xs opacity-70">계획</span>
			<span class="text-gray-700 text-xs font-medium">{formatCurrency(planned)}</span>
		</div>
		<div class="flex justify-between items-center">
			<span class="text-blue-600 text-xs opacity-70">예상</span>
			<span class="text-blue-700 text-xs font-medium">{formatCurrency(expected)}</span>
		</div>
		<div class="flex justify-between items-center">
			<span class="{profitColorClass} text-xs opacity-70">실제</span>
			<span class="text-xs {profitColorClass} font-medium">{formatCurrency(actual)}</span>
		</div>
	</div>
</td>
