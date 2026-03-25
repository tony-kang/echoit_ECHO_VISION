<script>
	import YoySalesCompareLayer from './YoySalesCompareLayer.svelte';

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

	/** @type {HTMLElement | null} 헤더 셀 루트 */
	let rootEl = $state(null);

	/** @type {number} 레이어 top (뷰포트 px) */
	let popupTopPx = $state(0);

	/** @type {number} 레이어 가로 중심 left (뷰포트 px) */
	let popupLeftPx = $state(0);

	/** 레이어 제목 요소 id (문서 내 유일 권장) */
	const ariaTitleId = $derived(`yoy-header-title-${String(month)}`);

	/**
	 * 비교 레이어 토글
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
	 * 외부 클릭 판별용 앵커
	 * @returns {HTMLElement | null}
	 */
	function getAnchorEl() {
		return rootEl;
	}
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

	{#if yoyEnabled && yoySalesCompare && compareYear != null}
		<YoySalesCompareLayer
			bind:open={layerOpen}
			{monthLabel}
			compareYear={compareYear}
			current={yoySalesCompare.current}
			prior={yoySalesCompare.prior}
			{popupTopPx}
			{popupLeftPx}
			ariaTitleId={ariaTitleId}
			{getAnchorEl}
		/>
	{/if}
</th>
