<script>
	/**
	 * 컴포넌트 Props
	 * @type {{
	 *   type: 'sales' | 'cost' | 'profit',
	 *   value: number,
	 *   bgColor?: 'blue' | 'green' | 'yellow' | 'blue-dark' | 'green-dark' | 'yellow-dark'
	 * }}
	 */
	let { type, value, bgColor = 'blue' } = $props();

	/**
	 * 금액 포맷팅 (천원 단위)
	 * @param {number} val - 금액 (원 단위)
	 * @returns {string}
	 */
	function formatCurrency(val) {
		const thousandValue = val / 1000; // 천원 단위로 변환
		return new Intl.NumberFormat('ko-KR').format(Math.round(thousandValue));
	}

	/**
	 * 배경색 클래스 반환
	 * @returns {string}
	 */
	const bgColorClass = $derived(() => {
		const colorMap = {
			blue: 'bg-blue-50',
			green: 'bg-green-50',
			yellow: 'bg-yellow-50',
			'blue-dark': 'bg-blue-100',
			'green-dark': 'bg-green-100',
			'yellow-dark': 'bg-yellow-100'
		};
		return colorMap[bgColor] || 'bg-blue-50';
	});

	/**
	 * 이익인 경우 색상 클래스 반환
	 * @returns {string}
	 */
	const textColorClass = $derived(type === 'profit' && value >= 0 ? 'text-green-600' : type === 'profit' && value < 0 ? 'text-red-600' : '');
</script>

<td class="px-4 py-3 text-right text-sm font-semibold text-gray-900 {bgColorClass} border-r border-gray-200">
	<span class={textColorClass}>{formatCurrency(value)}</span>
</td>
