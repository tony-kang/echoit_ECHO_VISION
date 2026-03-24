<script>
	/**
	 * 컴포넌트 Props (ev_department_user 권한에 따라 편집 가능 컬럼 제어)
	 * @type {{
	 *   open: boolean,
	 *   selectedYear: number,
	 *   orgAliasName: string,
	 *   hasPerformanceData: boolean,
	 *   inputData: Array<{month: number, p_revenue: number, f_revenue: number, p_expenses: number, f_expenses: number, p_revenue_display: string, f_revenue_display: string, p_expenses_display: string, f_expenses_display: string}>,
	 *   isSaving: boolean,
	 *   canEditPlanRevenue?: boolean,
	 *   canEditExpectedRevenue?: boolean,
	 *   canEditPlanCost?: boolean,
	 *   canEditExpectedCost?: boolean,
	 *   onClose: () => void,
	 *   onSave: () => void,
	 *   formatNumberWithComma: (value: string | number) => string,
	 *   parseNumberFromComma: (value: string) => number
	 * }}
	 */
	let {
		open,
		selectedYear,
		orgAliasName,
		hasPerformanceData,
		inputData,
		isSaving,
		canEditPlanRevenue = false,
		canEditExpectedRevenue = false,
		canEditPlanCost = false,
		canEditExpectedCost = false,
		onClose,
		onSave,
		formatNumberWithComma,
		parseNumberFromComma
	} = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
		<div
			class="flex max-h-[90vh] w-full min-w-0 max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="performance-input-modal-title"
			tabindex="-1"
		>
			<!-- 모달 헤더 -->
			<div
				class="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4"
			>
				<h2 id="performance-input-modal-title" class="wrap-break-word text-lg font-bold text-gray-800 sm:text-xl">
					{selectedYear}년 {orgAliasName} 경영실적 {hasPerformanceData ? '수정' : '입력'}
				</h2>
				<button
					onclick={onClose}
					class="shrink-0 text-2xl font-bold text-gray-400 hover:text-gray-600"
					type="button"
					aria-label="닫기"
				>
					×
				</button>
			</div>

			<!-- 모달 본문: 세로·가로 스크롤 (표 min-width로 좁은 화면에서 가로 스크롤) -->
			<div class="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
				<div class="p-4 sm:p-6">
					<div class="mb-3 text-sm text-gray-600 sm:mb-4">
						각 월별로 계획/전망 매출/원가를 입력해 주세요.(단위:천원)
					</div>
					<p class="mb-2 text-xs text-gray-500 md:hidden">입력란이 많을 때 표를 좌우로 스크롤할 수 있습니다.</p>

					<div class="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
						<table class="w-full min-w-136 border-collapse">
						<thead>
							<tr class="bg-gray-50 border-b border-gray-200">
								<th class="w-[10%] text-right px-4 py-3 text-sm font-semibold text-gray-700">{selectedYear} 년</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">매출 계획</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">매출 전망</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">계획 원가</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">비용 전망</th>
							</tr>
						</thead>
						<tbody>
							{#each inputData as item (item.month)}
								<tr class="hover:bg-gray-50">
									<td class="w-[10%] text-right px-4 py-1 text-sm font-medium text-gray-700">{item.month} 월</td>
									<td class="px-4 py-1">
										<input
											type="text"
											bind:value={item.p_revenue_display}
											disabled={!canEditPlanRevenue}
											readonly={!canEditPlanRevenue}
											oninput={(e) => {
												if (!canEditPlanRevenue) return;
												const num = parseNumberFromComma(e.target.value);
												item.p_revenue = num;
												item.p_revenue_display = formatNumberWithComma(num);
											}}
											class="w-full text-right px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-md {!canEditPlanRevenue ? 'bg-gray-100 cursor-not-allowed' : ''}"
											placeholder="계획 매출"
										/>
									</td>
									<td class="px-4 py-1">
										<input
											type="text"
											bind:value={item.f_revenue_display}
											disabled={!canEditExpectedRevenue}
											readonly={!canEditExpectedRevenue}
											oninput={(e) => {
												if (!canEditExpectedRevenue) return;
												const num = parseNumberFromComma(e.target.value);
												item.f_revenue = num;
												item.f_revenue_display = formatNumberWithComma(num);
											}}
											class="w-full text-right px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-md {!canEditExpectedRevenue ? 'bg-gray-100 cursor-not-allowed' : ''}"
											placeholder="예상 매출"
										/>
									</td>
									<td class="px-4 py-1">
										<input
											type="text"
											bind:value={item.p_expenses_display}
											disabled={!canEditPlanCost}
											readonly={!canEditPlanCost}
											oninput={(e) => {
												if (!canEditPlanCost) return;
												const num = parseNumberFromComma(e.target.value);
												item.p_expenses = num;
												item.p_expenses_display = formatNumberWithComma(num);
											}}
											class="w-full text-right px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-md {!canEditPlanCost ? 'bg-gray-100 cursor-not-allowed' : ''}"
											placeholder="계획 비용"
										/>
									</td>
									<td class="px-4 py-1">
										<input
											type="text"
											bind:value={item.f_expenses_display}
											disabled={!canEditExpectedCost}
											readonly={!canEditExpectedCost}
											oninput={(e) => {
												if (!canEditExpectedCost) return;
												const num = parseNumberFromComma(e.target.value);
												item.f_expenses = num;
												item.f_expenses_display = formatNumberWithComma(num);
											}}
											class="w-full text-right px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-md {!canEditExpectedCost ? 'bg-gray-100 cursor-not-allowed' : ''}"
											placeholder="예상 비용"
										/>
									</td>
								</tr>
							{/each}
						</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- 모달 푸터 -->
			<div
				class="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4"
			>
				<button
					onclick={onClose}
					class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
					type="button"
					disabled={isSaving}
				>
					취소
				</button>
				<button
					onclick={onSave}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
					type="button"
					disabled={isSaving}
				>
					{isSaving ? '저장 중...' : '저장'}
				</button>
			</div>
		</div>
	</div>
{/if}
