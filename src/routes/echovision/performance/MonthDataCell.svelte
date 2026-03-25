<script>
	import { formatCurrency, toKoreanAmount } from '$lib/utils/moneyUtil.js';
	import YoySalesCompareLayer from './YoySalesCompareLayer.svelte';

	/**
	 * 컴포넌트 Props
	 * @type {{
	 *   type: 'sales' | 'cost' | 'profit',
	 *   planned: number,
	 *   expected: number,
	 *   actual: number,
	 *   yoySalesBeatPrev?: boolean,
	 *   yoySalesCompareForLayer?: { current: number, prior: number } | null,
	 *   compareYearForLayer?: number,
	 *   yoyCompareMonth?: number,
	 *   yoyOpenPopupOnActualClick?: boolean,
	 *   yoyLayerTitleId?: string
	 * }}
	 */
	let {
		type,
		planned,
		expected,
		actual,
		yoySalesBeatPrev = false,
		yoySalesCompareForLayer = null,
		compareYearForLayer = undefined,
		yoyCompareMonth = undefined,
		yoyOpenPopupOnActualClick = false,
		yoyLayerTitleId = 'yoy-layer-cell'
	} = $props();

	/**
	 * 이익인 경우 실제 금액 색상
	 * @returns {string}
	 */
	const profitColorClass = $derived(
		type === 'profit' && actual >= 0 ? 'text-green-600' : type === 'profit' && actual < 0 ? 'text-red-600' : 'text-gray-700'
	);

	/**
	 * 실적 줄 클릭으로 YoY 레이어 표시 (전사 실적 등)
	 */
	const yoyActualLayerEnabled = $derived(
		type === 'sales' &&
			yoyOpenPopupOnActualClick === true &&
			yoySalesCompareForLayer != null &&
			compareYearForLayer != null &&
			Number.isFinite(compareYearForLayer) &&
			yoyCompareMonth != null &&
			Number.isFinite(yoyCompareMonth)
	);

	/** @type {boolean} */
	let yoyLayerOpen = $state(false);

	/** @type {HTMLElement | null} 실적 줄 앵커 (위치·외부클릭) */
	let actualAnchorEl = $state(null);

	/** @type {number} */
	let yoyPopupTopPx = $state(0);

	/** @type {number} */
	let yoyPopupLeftPx = $state(0);

	/**
	 * 월 라벨 (레이어 제목)
	 */
	const yoyMonthLabel = $derived(`${yoyCompareMonth ?? ''}월`);

	/**
	 * 실적 매출 클릭 시 YoY 레이어 토글
	 * @param {MouseEvent} event - 클릭 이벤트
	 * @returns {void}
	 */
	function toggleYoyLayerFromActual(event) {
		event.stopPropagation();
		if (!yoyActualLayerEnabled || !actualAnchorEl) return;
		const opening = !yoyLayerOpen;
		if (opening) {
			const r = actualAnchorEl.getBoundingClientRect();
			yoyPopupTopPx = r.bottom + 6;
			yoyPopupLeftPx = r.left + r.width / 2;
		}
		yoyLayerOpen = opening;
	}

	/**
	 * 외부 클릭 판별용 앵커
	 * @returns {HTMLElement | null}
	 */
	function getYoyAnchorEl() {
		return actualAnchorEl;
	}
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
		<div
			bind:this={actualAnchorEl}
			class="relative min-h-4.5"
			class:pl-2={type === 'sales' && yoySalesBeatPrev}
		>
			{#if type === 'sales' && yoySalesBeatPrev}
				<span
					class="pointer-events-none absolute left-0 top-1/2 z-1 -translate-y-1/2 select-none text-[0.65rem] leading-none"
					title="전년 동월 실적 매출보다 증가"
					aria-hidden="true"
				>
					🏅
				</span>
			{/if}
			{#if yoyActualLayerEnabled && yoySalesCompareForLayer && compareYearForLayer != null}
				<button
					type="button"
					class="amount-tooltip-trigger relative inline-block w-full cursor-pointer border-0 bg-transparent p-0 text-right font-medium {profitColorClass} hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-sm"
					aria-label={`${yoyMonthLabel} 실적 매출, 전년 동월과 비교`}
					aria-expanded={yoyLayerOpen}
					aria-haspopup="dialog"
					onclick={toggleYoyLayerFromActual}
				>
					{formatCurrency(actual)}
					<span class="amount-tooltip" role="tooltip">{toKoreanAmount(actual)}</span>
				</button>
			{:else}
				<span
					class="relative cursor-default amount-tooltip-trigger inline-block font-medium {profitColorClass}"
					aria-label={toKoreanAmount(actual)}
				>
					{formatCurrency(actual)}
					<span class="amount-tooltip" role="tooltip">{toKoreanAmount(actual)}</span>
				</span>
			{/if}
		</div>
	</div>

	{#if yoyActualLayerEnabled && yoySalesCompareForLayer && compareYearForLayer != null}
		<YoySalesCompareLayer
			bind:open={yoyLayerOpen}
			monthLabel={yoyMonthLabel}
			compareYear={compareYearForLayer}
			current={yoySalesCompareForLayer.current}
			prior={yoySalesCompareForLayer.prior}
			popupTopPx={yoyPopupTopPx}
			popupLeftPx={yoyPopupLeftPx}
			ariaTitleId={yoyLayerTitleId}
			getAnchorEl={getYoyAnchorEl}
		/>
	{/if}
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
