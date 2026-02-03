<script>
	/**
	 * 컴포넌트 Props
	 * @type {{
	 *   type: 'sales' | 'cost' | 'profit',
	 *   planned: number,
	 *   expected: number,
	 *   actual: number,
	 *   month: number
	 * }}
	 */
	let { type, planned, expected, actual, month } = $props();

	/**
	 * 금액 포맷팅 (천원 단위)
	 * @param {number} value - 금액 (원 단위)
	 * @returns {string}
	 */
	function formatCurrency(value) {
		const thousandValue = value / 1000; // 천원 단위로 변환
		return new Intl.NumberFormat('ko-KR').format(Math.round(thousandValue));
	}

	/**
	 * 이익인 경우 색상 클래스 반환
	 * @returns {string}
	 */
	const profitColorClass = $derived(type === 'profit' && actual >= 0 ? 'text-green-600' : type === 'profit' && actual < 0 ? 'text-red-600' : '');
</script>

<td class="px-4 py-1 text-sm text-gray-900 border-r border-gray-200">
	<div class="space-y-1">
		<div class="flex justify-between items-center">
			<span class="text-gray-500 opacity-70">계획</span>
			<span class="text-gray-700">{formatCurrency(planned)}</span>
		</div>
		<div class="flex justify-between items-center">
			<span class="text-blue-600 opacity-70">예상</span>
			<span class="text-blue-700 font-medium">{formatCurrency(expected)}</span>
		</div>
		<div class="flex justify-between items-center">
			<span class="{profitColorClass} opacity-70">실제</span>
			<span class="{profitColorClass} font-medium">{formatCurrency(actual)}</span>
		</div>
	</div>
</td>
