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

	const colorMap = {
		blue: 'bg-cyan-100',
		green: 'bg-lime-100',
		yellow: 'bg-yellow-100',
		'blue-dark': 'bg-cyan-300',
		'green-dark': 'bg-lime-300',
		'yellow-dark': 'bg-yellow-300'
	};

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
	function bgColorClass() {
		return colorMap[bgColor] || 'bg-blue-300';
	}

	/**
	 * 이익인 경우 색상 클래스 반환
	 * @returns {string}
	 */
	const textColorClass = $derived(type === 'profit' && value >= 0 ? '' : type === 'profit' && value < 0 ? 'text-sm font-bold text-red-600' : '');
</script>

<td class="px-4 py-3 text-right text-sm font-semibold text-gray-900 {bgColorClass()} border-r border-gray-200">
	<span class={textColorClass}>{formatCurrency(value)}</span>
</td>
