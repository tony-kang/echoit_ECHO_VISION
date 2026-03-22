<script>
	import { formatCurrency, toKoreanAmount } from '$lib/utils/moneyUtil.js';

	/**
	 * 컴포넌트 Props (단일 `value` 또는 `planned`/`expected`/`actual` 중 하나의 방식)
	 * @type {{
	 *   type: 'sales' | 'cost' | 'profit',
	 *   bgColor?: 'blue' | 'green' | 'yellow' | 'blue-dark' | 'green-dark' | 'yellow-dark',
	 *   value?: number,
	 *   planned?: number,
	 *   expected?: number,
	 *   actual?: number
	 * }}
	 */
	let {
		type,
		bgColor = 'blue',
		value = undefined,
		planned = undefined,
		expected = undefined,
		actual = undefined
	} = $props();

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
	 * 계획·예상·실제 3행 표시 여부
	 * @returns {boolean}
	 */
	const isTriple = $derived(
		planned !== undefined && expected !== undefined && actual !== undefined
	);

	/**
	 * 단일 값 모드에서 이익 행 텍스트 색상
	 * @returns {string}
	 */
	const singleProfitTextClass = $derived(
		!isTriple && type === 'profit' && value !== undefined && value >= 0
			? ''
			: !isTriple && type === 'profit' && value !== undefined && value < 0
				? 'text-sm font-bold text-red-600'
				: ''
	);

	/**
	 * 3행 모드에서 실제 이익 색상
	 * @returns {string}
	 */
	const tripleActualProfitClass = $derived(
		isTriple && type === 'profit' && actual !== undefined && actual >= 0
			? 'text-green-600'
			: isTriple && type === 'profit' && actual !== undefined && actual < 0
				? 'text-red-600'
				: ''
	);
</script>

{#if isTriple}
	<td class="px-1 py-1 text-sm text-gray-900 border-r border-gray-200 {bgColorClass()}">
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
					class="relative cursor-default amount-tooltip-trigger inline-block font-medium {tripleActualProfitClass}"
					aria-label={toKoreanAmount(actual)}
				>
					{formatCurrency(actual)}
					<span class="amount-tooltip" role="tooltip">{toKoreanAmount(actual)}</span>
				</span>
			</div>
		</div>
	</td>
{:else}
	<td
		class="px-4 py-3 text-right text-sm font-semibold text-gray-900 {bgColorClass()} border-r border-gray-200"
	>
		<span
			class="relative cursor-default amount-tooltip-trigger {singleProfitTextClass}"
			aria-label={toKoreanAmount(value ?? 0)}
		>
			{formatCurrency(value ?? 0)}
			<span class="amount-tooltip" role="tooltip">{toKoreanAmount(value ?? 0)}</span>
		</span>
	</td>
{/if}

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
		transition:
			visibility 0s,
			opacity 0.1s ease-out;
		z-index: 50;
	}
	.amount-tooltip-trigger:hover .amount-tooltip {
		visibility: visible;
		opacity: 1;
		transition-delay: 0s;
	}
</style>
