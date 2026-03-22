<script>
	import { formatCurrency, toKoreanAmount } from '$lib/utils/moneyUtil.js';

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
	 * 이익인 경우 실제 금액 색상
	 * @returns {string}
	 */
	const profitColorClass = $derived(
		type === 'profit' && actual >= 0 ? 'text-green-600' : type === 'profit' && actual < 0 ? 'text-red-600' : 'text-gray-700'
	);
</script>

<td class="px-1 py-1 text-sm text-gray-900 border-r border-gray-200">
	<div class="space-y-1 text-right">
		<div>
			<span
				class="relative cursor-default text-gray-700 amount-tooltip-trigger inline-block"
				aria-label={toKoreanAmount(planned)}
			>
				{formatCurrency(planned)}
				<span class="amount-tooltip" role="tooltip">{toKoreanAmount(planned)}</span>
			</span>
		</div>
		<div>
			<span
				class="relative cursor-default text-blue-700 amount-tooltip-trigger inline-block"
				aria-label={toKoreanAmount(expected)}
			>
				{formatCurrency(expected)}
				<span class="amount-tooltip" role="tooltip">{toKoreanAmount(expected)}</span>
			</span>
		</div>
		<div>
			<span
				class="relative cursor-default amount-tooltip-trigger inline-block font-medium {profitColorClass}"
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
