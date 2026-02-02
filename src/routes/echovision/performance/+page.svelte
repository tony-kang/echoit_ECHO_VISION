<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import MonthDataCell from './MonthDataCell.svelte';
	import SummaryDataCell from './SummaryDataCell.svelte';
	import MonthHeaderCell from './MonthHeaderCell.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { getSales } from '$lib/salesService';
	import { getCosts } from '$lib/costService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);

	/** @type {number} 선택된 연도 */
	let selectedYear = $state(new Date().getFullYear());

	/** @type {Array<{org_alias_name: string, org_code: string[], sales_code: string[], cost_code: string[]}>} 조직 정보 */
	const orgInfo = [
		{
			org_alias_name: 'SAP 사업부문',
			org_code: ['209100', '201100', '202100', '203100'],
			sales_code: ['SALES_0100'],
			cost_code: ['COST_0100']
		},
		{
			org_alias_name: 'ERP 사업부문',
			org_code: ['309100', '301100'],
			sales_code: ['SALES_0100'],
			cost_code: ['COST_0100']
		}
	];

	/** @type {string} 선택된 조직 */
	let selectedOrgIndex = $state(0);

	/** @type {Array<number>} 최근 3년 */
	const recentYears = $state([
		new Date().getFullYear(),
		new Date().getFullYear() - 1,
		new Date().getFullYear() - 2
	]);

	/** @type {Array<any>} 매출 데이터 */
	let salesData = $state([]);
	/** @type {Array<any>} 비용 데이터 */
	let costData = $state([]);
	/** @type {boolean} 데이터 로딩 중 */
	let isLoading = $state(false);

	/**
	 * 선택된 조직 정보 가져오기
	 */
	const selectedOrg = $derived(orgInfo[selectedOrgIndex]);

	/**
	 * 월별 데이터 계산
	 * @param {number} month - 월 (1~12)
	 * @returns {{sales: number, cost: number, profit: number}}
	 */
	function getMonthData(month) {
		const sales = calculateMonthValue(salesData, month, selectedOrg.org_code, selectedOrg.sales_code);
		const cost = calculateMonthValue(costData, month, selectedOrg.org_code, selectedOrg.cost_code);
		const profit = sales - cost;
		
		return { sales, cost, profit };
	}

	/**
	 * 특정 월의 매출/비용 계산
	 * @param {Array<any>} data - 원본 데이터
	 * @param {number} month - 월
	 * @param {string[]} orgCodes - 조직 코드 배열
	 * @param {string[]} targetCodes - 대상 코드 배열 (SUM_000 등)
	 * @returns {number}
	 */
	function calculateMonthValue(data, month, orgCodes, targetCodes) {
		let total = 0;
		
		for (const item of data) {
			if (item.month !== month || item.year !== selectedYear) continue;
			if (!orgCodes.includes(item.org_code)) continue;
			if (!item.excel_file_data) continue;
			
			// targetCodes의 값들을 모두 합산
			for (const code of targetCodes) {
				const value = item.excel_file_data[code];
				if (value !== null && value !== undefined) {
					const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
					if (!isNaN(numValue)) {
						total += numValue;
					}
				}
			}
		}
		
		return total;
	}

	/**
	 * 분기 데이터 계산
	 * @param {number} quarter - 분기 (1~4)
	 * @returns {{sales: number, cost: number, profit: number}}
	 */
	function getQuarterData(quarter) {
		const startMonth = (quarter - 1) * 3 + 1;
		const endMonth = startMonth + 2;
		
		let sales = 0, cost = 0;
		for (let month = startMonth; month <= endMonth; month++) {
			const monthData = getMonthData(month);
			sales += monthData.sales;
			cost += monthData.cost;
		}
		
		return { sales, cost, profit: sales - cost };
	}

	/**
	 * 반기 데이터 계산
	 * @param {number} half - 반기 (1~2)
	 * @returns {{sales: number, cost: number, profit: number}}
	 */
	function getHalfData(half) {
		const startMonth = (half - 1) * 6 + 1;
		const endMonth = startMonth + 5;
		
		let sales = 0, cost = 0;
		for (let month = startMonth; month <= endMonth; month++) {
			const monthData = getMonthData(month);
			sales += monthData.sales;
			cost += monthData.cost;
		}
		
		return { sales, cost, profit: sales - cost };
	}

	/**
	 * 연간 합계 데이터 계산
	 * @returns {{sales: number, cost: number, profit: number}}
	 */
	function getYearTotal() {
		let sales = 0, cost = 0;
		for (let month = 1; month <= 12; month++) {
			const monthData = getMonthData(month);
			sales += monthData.sales;
			cost += monthData.cost;
		}
		
		return { sales, cost, profit: sales - cost };
	}

	/**
	 * 데이터 로드
	 */
	async function loadData() {
		isLoading = true;
		try {
			// 선택된 조직의 org_code 배열을 evCodeItems로 전달
			const evCodeItems = selectedOrg.org_code;
			
			// 매출 데이터 로드
			const salesResult = await getSales({
				year: selectedYear,
				evCodeItems: evCodeItems,
				orderByYear: true,
				orderByMonth: true
			});
			
			// 비용 데이터 로드
			const costResult = await getCosts({
				year: selectedYear,
				evCodeItems: evCodeItems,
				orderByYear: true,
				orderByMonth: true
			});
			
			if (salesResult.data) {
				salesData = salesResult.data;
			}
			
			if (costResult.data) {
				costData = costResult.data;
			}

			console.log('Performance loadData salesData:',selectedYear, $state.snapshot(salesData));
			console.log('Performance loadData costData:',selectedYear, $state.snapshot(costData));
		} catch (error) {
			console.error('데이터 로드 실패:', error);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 금액 포맷팅
	 * @param {number} value - 금액
	 * @returns {string}
	 */
	function formatCurrency(value) {
		return new Intl.NumberFormat('ko-KR').format(Math.round(value));
	}

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			
			if (!state.loading && !state.user) {
				goto('/login');
			}
		});
		
		return () => {
			unsubscribe();
		};
	});

	// 연도 또는 조직 변경 시 데이터 로드
	$effect(() => {
		if (!authLoading && user) {
            console.log('Performance loadData');
			loadData();
		}
	});
</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<PrjMainSidebar />

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto bg-gray-50 p-6">
			<div class="max-w-[1800px] mx-auto">
				<!-- 헤더 -->
				<div class="mb-6">
					<h1 class="text-3xl font-bold text-gray-800">경영실적</h1>
					<p class="text-gray-600 mt-2">조직별 월별/분기별 경영실적을 확인할 수 있습니다</p>
				</div>

				<!-- 필터 영역 -->
				<div class="bg-white rounded-lg shadow-sm p-4 mb-6">
					<div class="flex gap-4 items-center">
						<div class="flex items-center gap-2">
							<label for="year-select" class="text-sm font-medium text-gray-700">연도</label>
							<select
								id="year-select"
								bind:value={selectedYear}
								class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{#each recentYears as year}
									<option value={year}>{year}년</option>
								{/each}
							</select>
						</div>

						<div class="flex items-center gap-2">
							<label for="org-select" class="text-sm font-medium text-gray-700">조직</label>
							<select
								id="org-select"
								bind:value={selectedOrgIndex}
								class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{#each orgInfo as org, index}
									<option value={index}>{org.org_alias_name}</option>
								{/each}
							</select>
						</div>

						{#if isLoading}
							<div class="ml-auto text-sm text-gray-500">데이터 로딩 중...</div>
						{/if}
					</div>
				</div>

				<!-- 실적 테이블 -->
				<div class="bg-white rounded-lg shadow-sm overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="bg-gray-50 border-b border-gray-200">
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">구분</th>
								<MonthHeaderCell month={1} />
								<MonthHeaderCell month={2} />
								<MonthHeaderCell month={3} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200">1분기 합계</th>
								<MonthHeaderCell month={4} />
								<MonthHeaderCell month={5} />
								<MonthHeaderCell month={6} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200">2분기 합계</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200">상반기 합계</th>
							</tr>
						</thead>
						<tbody>
							<!-- 매출 행 -->
							<tr class="border-b border-gray-200 hover:bg-gray-50">
								<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">매출</td>
								{#each [1, 2, 3] as month}
									<MonthDataCell type="sales" planned={100000000} expected={90000000} actual={getMonthData(month).sales} />
								{/each}
								<SummaryDataCell type="sales" value={getQuarterData(1).sales} bgColor="blue" />
								{#each [4, 5, 6] as month}
									<MonthDataCell type="sales" planned={100000000} expected={90000000} actual={getMonthData(month).sales} />
								{/each}
								<SummaryDataCell type="sales" value={getQuarterData(2).sales} bgColor="green" />
								<SummaryDataCell type="sales" value={getHalfData(1).sales} bgColor="yellow" />
							</tr>

							<!-- 비용 행 -->
							<tr class="border-b border-gray-200 hover:bg-gray-50">
								<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">비용</td>
								{#each [1, 2, 3] as month}
									<MonthDataCell type="cost" planned={100000000} expected={90000000} actual={getMonthData(month).cost} />
								{/each}
								<SummaryDataCell type="cost" value={getQuarterData(1).cost} bgColor="blue" />
								{#each [4, 5, 6] as month}
									<MonthDataCell type="cost" planned={100000000} expected={90000000} actual={getMonthData(month).cost} />
								{/each}
								<SummaryDataCell type="cost" value={getQuarterData(2).cost} bgColor="green" />
								<SummaryDataCell type="cost" value={getHalfData(1).cost} bgColor="yellow" />
							</tr>

							<!-- 이익 행 -->
							<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
								<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
								{#each [1, 2, 3] as month}
									<MonthDataCell type="profit" planned={0} expected={0} actual={getMonthData(month).profit} />
								{/each}
								<SummaryDataCell type="profit" value={getQuarterData(1).profit} bgColor="blue-dark" />
								{#each [4, 5, 6] as month}
									<MonthDataCell type="profit" planned={0} expected={0} actual={getMonthData(month).profit} />
								{/each}
								<SummaryDataCell type="profit" value={getQuarterData(2).profit} bgColor="green-dark" />
								<SummaryDataCell type="profit" value={getHalfData(1).profit} bgColor="yellow-dark" />
							</tr>
						</tbody>
					</table>

					<!-- 하반기 테이블 -->
					<table class="w-full border-collapse mt-4">
						<thead>
							<tr class="bg-gray-50 border-b border-gray-200">
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">구분</th>
								<MonthHeaderCell month={7} />
								<MonthHeaderCell month={8} />
								<MonthHeaderCell month={9} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200">3분기 합계</th>
								<MonthHeaderCell month={10} />
								<MonthHeaderCell month={11} />
								<MonthHeaderCell month={12} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200">4분기 합계</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200">하반기 합계</th>
							</tr>
						</thead>
						<tbody>
							<!-- 매출 행 -->
							<tr class="border-b border-gray-200 hover:bg-gray-50">
								<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">매출</td>
								{#each [7, 8, 9] as month}
									<MonthDataCell type="sales" planned={100000000} expected={90000000} actual={getMonthData(month).sales} />
								{/each}
								<SummaryDataCell type="sales" value={getQuarterData(3).sales} bgColor="blue" />
								{#each [10, 11, 12] as month}
									<MonthDataCell type="sales" planned={100000000} expected={90000000} actual={getMonthData(month).sales} />
								{/each}
								<SummaryDataCell type="sales" value={getQuarterData(4).sales} bgColor="green" />
								<SummaryDataCell type="sales" value={getHalfData(2).sales} bgColor="yellow" />
							</tr>

							<!-- 비용 행 -->
							<tr class="border-b border-gray-200 hover:bg-gray-50">
								<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">비용</td>
								{#each [7, 8, 9] as month}
									<MonthDataCell type="cost" planned={100000000} expected={90000000} actual={getMonthData(month).cost} />
								{/each}
								<SummaryDataCell type="cost" value={getQuarterData(3).cost} bgColor="blue" />
								{#each [10, 11, 12] as month}
									<MonthDataCell type="cost" planned={100000000} expected={90000000} actual={getMonthData(month).cost} />
								{/each}
								<SummaryDataCell type="cost" value={getQuarterData(4).cost} bgColor="green" />
								<SummaryDataCell type="cost" value={getHalfData(2).cost} bgColor="yellow" />
							</tr>

							<!-- 이익 행 -->
							<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
								<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
								{#each [7, 8, 9] as month}
									<MonthDataCell type="profit" planned={0} expected={0} actual={getMonthData(month).profit} />
								{/each}
								<SummaryDataCell type="profit" value={getQuarterData(3).profit} bgColor="blue-dark" />
								{#each [10, 11, 12] as month}
									<MonthDataCell type="profit" planned={0} expected={0} actual={getMonthData(month).profit} />
								{/each}
								<SummaryDataCell type="profit" value={getQuarterData(4).profit} bgColor="green-dark" />
								<SummaryDataCell type="profit" value={getHalfData(2).profit} bgColor="yellow-dark" />
							</tr>
						</tbody>
					</table>

					<!-- 연간 합계 -->
					<table class="w-full border-collapse mt-4">
						<thead>
							<tr class="bg-gray-100 border-b border-gray-200">
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">구분</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">합계</th>
							</tr>
						</thead>
						<tbody>
							<tr class="border-b border-gray-200">
								<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">매출</td>
								<td class="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(getYearTotal().sales)}</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">비용</td>
								<td class="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(getYearTotal().cost)}</td>
							</tr>
							<tr class="bg-blue-50">
								<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
								<td class="px-4 py-3 text-right text-sm font-bold {getYearTotal().profit >= 0 ? 'text-green-600' : 'text-red-600'}">
									{formatCurrency(getYearTotal().profit)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</main>
	</div>
</div>

<style>
	.main-content-page {
		width: 100%;
	}
</style>
