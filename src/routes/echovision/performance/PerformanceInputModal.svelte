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
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<!-- 모달 헤더 -->
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">
					{selectedYear}년 {orgAliasName} 경영실적 {hasPerformanceData ? '수정' : '입력'}
				</h2>
				<button
					onclick={onClose}
					class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
					type="button"
					aria-label="닫기"
				>
					×
				</button>
			</div>

			<!-- 모달 본문 -->
			<div class="p-6">
				<div class="mb-4 text-sm text-gray-600">
					각 월별로 계획/전망 매출/원가를 입력해 주세요.(단위:천원)
				</div>

				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
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

			<!-- 모달 푸터 -->
			<div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
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
