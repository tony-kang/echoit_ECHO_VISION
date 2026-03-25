<script>
	import { formatCurrency, toKoreanAmount } from '$lib/utils/moneyUtil.js';

	/**
	 * 컴포넌트 Props
	 * @type {{
	 *   month: number | string,
	 *   label?: string,
	 *   yoySalesCompare?: { current: number, prior: number } | null,
	 *   compareYear?: number
	 * }}
	 */
	let { month, label, yoySalesCompare = null, compareYear = undefined } = $props();

	/**
	 * 월 라벨 텍스트
	 */
	const monthLabel = $derived(label || `${month}월`);

	/**
	 * 전년·당해 실적 매출 비교 UI 표시 여부
	 */
	const yoyEnabled = $derived(
		yoySalesCompare != null && compareYear != null && Number.isFinite(compareYear)
	);

	/** @type {boolean} 비교 레이어 팝업 열림 */
	let layerOpen = $state(false);

	/** @type {HTMLElement | null} 헤더 셀 루트 (외부 클릭 판별) */
	let rootEl = $state(null);

	/** @type {HTMLElement | null} 고정 위치 팝업 (외부 클릭 판별) */
	let layerPopupEl = $state(null);

	/** @type {number} 레이어 팝업 top (fixed, 뷰포트 px) */
	let popupTopPx = $state(0);

	/** @type {number} 레이어 팝업 가로 중심 left (fixed, 뷰포트 px) */
	let popupLeftPx = $state(0);

	/**
	 * 비교 레이어 열림 토글
	 * @param {MouseEvent} event - 클릭 이벤트
	 * @returns {void}
	 */
	function toggleYoyLayer(event) {
		event.stopPropagation();
		if (!yoyEnabled) return;
		const opening = !layerOpen;
		if (opening && rootEl) {
			const r = rootEl.getBoundingClientRect();
			popupTopPx = r.bottom + 6;
			popupLeftPx = r.left + r.width / 2;
		}
		layerOpen = opening;
	}

	/**
	 * 증감액 (원): 당해 − 전년
	 * @returns {number}
	 */
	const salesDelta = $derived(
		yoySalesCompare ? yoySalesCompare.current - yoySalesCompare.prior : 0
	);

	$effect(() => {
		if (!layerOpen) return;
		/**
		 * 문서 클릭 시 레이어 닫기 (헤더·팝업 밖)
		 * @param {PointerEvent} e
		 * @returns {void}
		 */
		function onDocPointerDown(e) {
			const t = e.target;
			if (!(t instanceof Node)) return;
			if (rootEl?.contains(t)) return;
			if (layerPopupEl?.contains(t)) return;
			layerOpen = false;
		}
		/**
		 * Escape로 레이어 닫기
		 * @param {KeyboardEvent} e
		 * @returns {void}
		 */
		function onKeyDown(e) {
			if (e.key === 'Escape') layerOpen = false;
		}
		/**
		 * 스크롤 시 팝업 위치가 어긋나므로 닫기
		 * @returns {void}
		 */
		function onScrollOrResize() {
			layerOpen = false;
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

<th
	bind:this={rootEl}
	class="company-performance-th relative border-r border-gray-200 px-2 py-2 text-center text-sm font-semibold text-gray-700 sm:px-4"
	style="position: sticky; top: 0; z-index: 10; background: rgb(249 250 251); box-shadow: 0 1px 0 0 rgb(229 231 235);"
	scope="col"
>
	{#if yoyEnabled}
		<button
			type="button"
			class="inline-flex w-full flex-col items-center justify-center gap-0.5 rounded-lg border-0 bg-transparent p-0 text-inherit hover:bg-blue-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
			aria-expanded={layerOpen}
			aria-haspopup="dialog"
			aria-label={`${monthLabel} 실적 매출, 전년 동월과 비교`}
			onclick={toggleYoyLayer}
		>
			<div
				class="inline-flex h-8 w-10 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-100 font-semibold text-blue-700"
			>
				{monthLabel}
			</div>
		</button>
	{:else}
		<div
			class="inline-flex h-8 w-10 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-100 font-semibold text-blue-700"
		>
			{monthLabel}
		</div>
	{/if}

	{#if layerOpen && yoyEnabled && yoySalesCompare && compareYear != null}
		<div
			bind:this={layerPopupEl}
			class="yoy-layer-popup fixed z-100 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-lg ring-1 ring-black/5"
			style="top: {popupTopPx}px; left: {popupLeftPx}px;"
			role="dialog"
			aria-modal="true"
			aria-labelledby="yoy-layer-title-{month}"
			tabindex="-1"
		>
			<p id="yoy-layer-title-{month}" class="mb-2 border-b border-gray-100 pb-1.5 text-xs font-semibold text-gray-800">
				{monthLabel} 실적 매출 비교 <span class="font-normal text-gray-500">(천원)</span>
			</p>
			<dl class="space-y-1.5 text-xs text-gray-700">
				<div class="flex justify-between gap-2">
					<dt class="text-gray-500">{compareYear}년</dt>
					<dd class="font-mono font-medium tabular-nums text-gray-900">
						{formatCurrency(yoySalesCompare.current)}
					</dd>
				</div>
				<div class="flex justify-between gap-2">
					<dt class="text-gray-500">{compareYear - 1}년</dt>
					<dd class="font-mono font-medium tabular-nums text-gray-900">
						{formatCurrency(yoySalesCompare.prior)}
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
				{toKoreanAmount(yoySalesCompare.current)} / {toKoreanAmount(yoySalesCompare.prior)}
			</p>
		</div>
	{/if}
</th>
