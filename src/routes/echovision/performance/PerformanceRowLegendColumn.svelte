<script>
	import { PLAN_FORECAST_ACTUAL_ROW_DEFS } from './planActualRowLabels.js';

	/**
	 * 테이블 범례 칼럼. `th`는 폭 맞춤용 빈 칸, `td`에만 계/예/실 표시. `visible`이 false이면 `hidden`.
	 * @type {{ visible: boolean, as?: 'th' | 'td' }}
	 */
	let { visible, as = 'td' } = $props();

	/**
	 * th/td 공통 셀 클래스 (본문 숫자 칼럼: `MonthDataCell`과 동일 `text-sm`·`space-y-1` 계열)
	 * @returns {string}
	 */
	function cellClass() {
		if (!visible) {
			return 'hidden w-0 min-w-0 max-w-0 p-0 border-0 overflow-hidden';
		}
		if (as === 'th') {
			return 'px-2 py-3 text-sm border-r border-gray-200 align-middle bg-gray-50 w-6 min-w-[3rem]';
		}
		return 'px-1 py-1 text-sm text-gray-900 border-r border-gray-200 align-middle bg-gray-50/80';
	}
</script>

<svelte:element
	this={as}
	class={cellClass()}
	aria-hidden={visible ? (as === 'th' ? 'true' : undefined) : 'true'}
>
	{#if visible && as === 'td'}
		<div class="space-y-1 text-center" role="presentation">
			{#each PLAN_FORECAST_ACTUAL_ROW_DEFS as row (row.fullLabel)}
				<div>
					<span class="{row.labelClass} font-medium" title={row.fullLabel}>{row.shortLabel}</span>
				</div>
			{/each}
		</div>
	{/if}
</svelte:element>
