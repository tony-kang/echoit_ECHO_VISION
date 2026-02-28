<script>
	import { formatCurrency, toKoreanAmount } from '$lib/utils/moneyUtil.js';

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
	<span
		class="relative cursor-default amount-tooltip-trigger {textColorClass}"
		aria-label={toKoreanAmount(value)}
	>
		{formatCurrency(value)}
		<span class="amount-tooltip" role="tooltip">{toKoreanAmount(value)}</span>
	</span>
</td>

<style>
	.amount-tooltip-trigger .amount-tooltip {
		visibility: hidden;
		opacity: 0;
		position: absolute;
		left: calc(50% - 40px);
		transform: translateX(-50%);
		bottom: 100%;
		margin-bottom: 4px;
		padding: 6px 10px;
		background: #1f2937;
		color: #fff;
		font-size: 0.75rem;
		white-space: nowrap;
		border-radius: 6px;
		pointer-events: none;
		transition: visibility 0s, opacity 0.1s ease-out;
		z-index: 50;
	}
	.amount-tooltip-trigger:hover .amount-tooltip {
		visibility: visible;
		opacity: 1;
		transition-delay: 0s;
	}
</style>
