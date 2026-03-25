<script>
	import { formatCurrency, toKoreanAmount } from '$lib/utils/moneyUtil.js';

	/**
	 * 전년 동월 대비 실적 매출 비교 고정 레이어
	 * @type {{
	 *   open: boolean,
	 *   monthLabel: string,
	 *   compareYear: number,
	 *   current: number,
	 *   prior: number,
	 *   popupTopPx: number,
	 *   popupLeftPx: number,
	 *   ariaTitleId: string,
	 *   getAnchorEl: () => HTMLElement | null
	 * }}
	 */
	let {
		open = $bindable(false),
		monthLabel,
		compareYear,
		current,
		prior,
		popupTopPx,
		popupLeftPx,
		ariaTitleId,
		getAnchorEl
	} = $props();

	/** @type {HTMLElement | null} */
	let layerPopupEl = $state(null);

	/**
	 * 증감액 (원)
	 * @returns {number}
	 */
	const salesDelta = $derived(current - prior);

	$effect(() => {
		if (!open) return;
		/**
		 * 앵커·팝업 밖 포인터 시 닫기
		 * @param {PointerEvent} e
		 * @returns {void}
		 */
		function onDocPointerDown(e) {
			const t = e.target;
			if (!(t instanceof Node)) return;
			const anchor = getAnchorEl();
			if (anchor?.contains(t)) return;
			if (layerPopupEl?.contains(t)) return;
			open = false;
		}
		/**
		 * Escape로 닫기
		 * @param {KeyboardEvent} e
		 * @returns {void}
		 */
		function onKeyDown(e) {
			if (e.key === 'Escape') open = false;
		}
		/**
		 * 스크롤·리사이즈 시 닫기
		 * @returns {void}
		 */
		function onScrollOrResize() {
			open = false;
		}
		document.addEventListener('pointerdown', onDocPointerDown, true);
		document.addEventListener('keydown', onKeyDown);
		window.addEventListener('scroll', onScrollOrResize, true);
		window.addEventListener('resize', onScrollOrResize);
		return () => {
			document.removeEventListener('pointerdown', onDocPointerDown, true);
			document.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('scroll', onScrollOrResize, true);
			window.removeEventListener('resize', onScrollOrResize);
		};
	});
</script>

{#if open}
	<div
		bind:this={layerPopupEl}
		class="yoy-layer-popup fixed z-100 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-lg ring-1 ring-black/5"
		style="top: {popupTopPx}px; left: {popupLeftPx}px;"
		role="dialog"
		aria-modal="true"
		aria-labelledby={ariaTitleId}
		tabindex="-1"
	>
		<p id={ariaTitleId} class="mb-2 border-b border-gray-100 pb-1.5 text-xs font-semibold text-gray-800">
			{monthLabel} 실적 매출 비교 <span class="font-normal text-gray-500">(천원)</span>
		</p>
		<dl class="space-y-1.5 text-xs text-gray-700">
			<div class="flex justify-between gap-2">
				<dt class="text-gray-500">{compareYear}년</dt>
				<dd class="font-mono font-medium tabular-nums text-gray-900">
					{formatCurrency(current)}
				</dd>
			</div>
			<div class="flex justify-between gap-2">
				<dt class="text-gray-500">{compareYear - 1}년 동월</dt>
				<dd class="font-mono font-medium tabular-nums text-gray-900">
					{formatCurrency(prior)}
				</dd>
			</div>
			<div class="flex justify-between gap-2 border-t border-gray-100 pt-1.5">
				<dt class="text-gray-600">증감</dt>
				<dd
					class="font-mono font-semibold tabular-nums {salesDelta > 0
						? 'text-green-600'
						: salesDelta < 0
							? 'text-red-600'
							: 'text-gray-700'}"
				>
					{salesDelta > 0 ? '+' : ''}{formatCurrency(salesDelta)}
				</dd>
			</div>
		</dl>
		<p class="mt-2 text-[0.65rem] leading-snug text-gray-400">
			{toKoreanAmount(current)} / {toKoreanAmount(prior)}
		</p>
	</div>
{/if}
