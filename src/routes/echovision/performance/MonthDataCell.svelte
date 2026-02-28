<script>
	import { formatCurrency, toKoreanAmount } from '$lib/utils/moneyUtil.js';

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
	 * 이익인 경우 색상 클래스 반환
	 * @returns {string}
	 */
	const profitColorClass = $derived(type === 'profit' && actual >= 0 ? 'text-green-600' : type === 'profit' && actual < 0 ? 'text-red-600' : '');
</script>

<td class="px-1 py-1 text-sm text-gray-900 border-r border-gray-200 group">
	<div class="space-y-1">
		<div class="flex justify-between items-center">
			<span class="text-gray-500 {month === 1 || month === 7 ? 'opacity-70' : 'opacity-0 group-hover:opacity-70'}">계획</span>
			<span
				class="relative cursor-default text-gray-700 amount-tooltip-trigger"
				aria-label={toKoreanAmount(planned)}
			>
				{formatCurrency(planned)}
				<span class="amount-tooltip" role="tooltip">{toKoreanAmount(planned)}</span>
			</span>
		</div>
		<div class="flex justify-between items-center">
			<span class="text-blue-600 {month === 1 || month === 7 ? 'opacity-70' : 'opacity-0 group-hover:opacity-70'}">예상</span>
			<span
				class="relative cursor-default text-blue-700 amount-tooltip-trigger"
				aria-label={toKoreanAmount(expected)}
			>
				{formatCurrency(expected)}
				<span class="amount-tooltip" role="tooltip">{toKoreanAmount(expected)}</span>
			</span>
		</div>
		<div class="flex justify-between items-center">
			<span class="{profitColorClass} {month === 1 || month === 7 ? 'opacity-70' : 'opacity-0 group-hover:opacity-70'}">실제</span>
			<span
				class="relative cursor-default amount-tooltip-trigger {profitColorClass}"
				aria-label={toKoreanAmount(actual)}
			>
				{formatCurrency(actual)}
				<span class="amount-tooltip" role="tooltip">{toKoreanAmount(actual)}</span>
			</span>
		</div>
	</div>
</td>

<style>
	.amount-tooltip-trigger .amount-tooltip {
		visibility: hidden;
		opacity: 0;
		position: absolute;
		left: 50%;
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
