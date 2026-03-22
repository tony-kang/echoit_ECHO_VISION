<script>
	import MainContent from '$lib/C/MainContent.svelte';
	import MonthDataCell from '../MonthDataCell.svelte';
	import SummaryDataCell from '../SummaryDataCell.svelte';
	import MonthHeaderCell from '../MonthHeaderCell.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { getSales } from '$lib/salesService';
	import { getCosts } from '$lib/costService';
	import { getPerformance } from '$lib/performanceService';
	import { getCurrentUserProfile } from '$lib/userService';
	import { getDepartments } from '$lib/departmentService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	/** @type {object | null} 권한 검사용 프로필 */
	let permissionProfile = $state(null);
	/** @type {boolean} 프로필 로딩 중 */
	let permissionProfileLoading = $state(false);
	/** 실적현황 접근 가능 여부 */
	let canAccessPerformance = $derived(permissionProfile?.can_performance === true);

	/** @type {number} 선택된 연도 */
	let selectedYear = $state(new Date().getFullYear());
	/** @type {Array<{org_id: string, org_alias_id: string, org_alias_name: string, org_code: string[], company_code: string[], sales_code: string[], cost_code: string[]}>} */
	let orgInfo = $state([]);
	/** @type {boolean} 부서 목록 로딩 중 */
	let orgInfoLoading = $state(false);
	/** @type {Record<string, { salesData: any[], costData: any[], performanceData: any[] }>} 부서별 로드 데이터 */
	let dataByDept = $state(/** @type {Record<string, { salesData: any[], costData: any[], performanceData: any[] }>} */ ({}));
	/** @type {boolean} 전체 데이터 로딩 중 */
	let isLoading = $state(false);

	const FIXED_SALES_CODES = ['SALES_0100'];
	const FIXED_COST_CODES = ['COST_1100'];

	/** @type {Array<number>} 최근 3년 */
	const recentYears = $state([
		new Date().getFullYear(),
		new Date().getFullYear() - 1,
		new Date().getFullYear() - 2
	]);

	/** 프로필 재조회 */
	$effect(() => {
		const userId = authStore.user?.id;
		if (!userId) return;
		permissionProfileLoading = true;
		permissionProfile = null;
		getCurrentUserProfile(userId, authStore.user?.user_metadata)
			.then(({ data }) => { permissionProfile = data ?? null; })
			.catch(() => { permissionProfile = null; })
			.finally(() => { permissionProfileLoading = false; });
	});

	/** ev_department → orgInfo 구성 */
	$effect(() => {
		if (!user || !canAccessPerformance || orgInfoLoading || orgInfo.length > 0) return;
		orgInfoLoading = true;
		getDepartments()
			.then(({ data }) => {
				const list = (data || []).map((d) => ({
					org_id: d.id,
					org_alias_id: d.code,
					org_alias_name: d.title || d.code,
					org_code: Array.isArray(d.param) ? d.param : [],
					company_code: Array.isArray(d.company_code) ? d.company_code : [],
					sales_code: FIXED_SALES_CODES,
					cost_code: FIXED_COST_CODES,
				}));
				orgInfo = list;
			})
			.catch(() => { orgInfo = []; })
			.finally(() => { orgInfoLoading = false; });
	});

	/** 연도·부서 목록 변경 시 부서별 데이터 로드 */
	$effect(() => {
		if (!user || !canAccessPerformance || orgInfo.length === 0) return;
		const year = selectedYear;
		isLoading = true;
		const next = /** @type {Record<string, { salesData: any[], costData: any[], performanceData: any[] }>} */ ({});
		Promise.all(
			orgInfo.map(async (org) => {
				const evCodeItems = org.org_code;
				const companyCodeItems = org.company_code;
				const [salesRes, costRes, perfRes] = await Promise.all([
					getSales({
						year,
						evCodeItems,
						companyCodeItems,
						orderByYear: true,
						orderByMonth: true
					}),
					getCosts({
						year,
						evCodeItems,
						companyCodeItems,
						orderByYear: true,
						orderByMonth: true
					}),
					getPerformance({ year, org_alias_id: org.org_alias_id, orderByYear: true, orderByMonth: true })
				]);
				return {
					org_id: org.org_id,
					salesData: salesRes.data ?? [],
					costData: costRes.data ?? [],
					performanceData: perfRes.data ?? []
				};
			})
		).then((results) => {
			results.forEach((r) => {
				next[r.org_id] = {
					salesData: r.salesData,
					costData: r.costData,
					performanceData: r.performanceData
				};
			});
			dataByDept = next;
		}).catch(() => {
			dataByDept = {};
		}).finally(() => {
			isLoading = false;
		});
	});

	/**
	 * 특정 월의 매출/비용 합산
	 * @param {any[]} data - 원본 데이터
	 * @param {number} month - 월
	 * @param {number} year - 연도
	 * @param {string[]} orgCodes - 조직 코드 배열
	 * @param {string[]} targetCodes - 대상 코드 배열
	 * @returns {number}
	 */
	function calculateMonthValue(data, month, year, orgCodes, targetCodes) {
		let total = 0;
		for (const item of data) {
			if (item.month !== month || item.year !== year) continue;
			if (!orgCodes.includes(item.org_code)) continue;
			if (!item.excel_file_data) continue;
			for (const code of targetCodes) {
				const value = item.excel_file_data[code];
				if (value != null) {
					const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
					if (!isNaN(num)) total += num;
				}
			}
		}
		return total;
	}

	/**
	 * 부서·데이터 기준 해당 월 경영실적 한 건
	 * @param {any[]} performanceData - 경영실적 배열
	 * @param {number} month - 월
	 * @param {number} year - 연도
	 * @param {string} orgAliasId - 부서 코드
	 * @returns {any | null}
	 */
	function getPerformanceDataForOrg(performanceData, month, year, orgAliasId) {
		return performanceData.find(
			(p) => p.month === month && p.year === year && p.org_alias_id === orgAliasId
		) ?? null;
	}

	/**
	 * 부서·데이터 기준 월별 데이터 (계획/예상/실제)
	 * @param {{ org_code: string[], company_code: string[], sales_code: string[], cost_code: string[], org_alias_id: string }} org - 조직 정보
	 * @param {{ salesData: any[], costData: any[], performanceData: any[] }} data - 해당 부서 데이터
	 * @param {number} month - 월
	 * @returns {{ sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number }}
	 */
	function getMonthDataForOrg(org, data, month) {
		if (!data) {
			return {
				sales: 0, cost: 0, profit: 0,
				plannedSales: 0, forecastSales: 0,
				plannedCost: 0, forecastCost: 0
			};
		}
		const sales = calculateMonthValue(data.salesData, month, selectedYear, org.org_code, org.sales_code);
		const cost = calculateMonthValue(data.costData, month, selectedYear, org.org_code, org.cost_code);
		const perf = getPerformanceDataForOrg(data.performanceData, month, selectedYear, org.org_alias_id);
		return {
			sales,
			cost,
			profit: sales - cost,
			plannedSales: perf?.p_revenue ?? 0,
			forecastSales: perf?.f_revenue ?? 0,
			plannedCost: perf?.p_expenses ?? 0,
			forecastCost: perf?.f_expenses ?? 0
		};
	}

	/**
	 * 부서·데이터 기준 분기 데이터 (월별 계획·예상·실적 합산)
	 * @param {object} org - 조직 정보
	 * @param {object} data - 해당 부서 데이터
	 * @param {number} quarter - 분기 (1~4)
	 * @returns {{ sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number, plannedProfit: number, forecastProfit: number }}
	 */
	function getQuarterDataForOrg(org, data, quarter) {
		const startMonth = (quarter - 1) * 3 + 1;
		let sales = 0,
			cost = 0;
		let plannedSales = 0,
			forecastSales = 0,
			plannedCost = 0,
			forecastCost = 0;
		for (let m = startMonth; m <= startMonth + 2; m++) {
			const md = getMonthDataForOrg(org, data, m);
			sales += md.sales;
			cost += md.cost;
			plannedSales += md.plannedSales;
			forecastSales += md.forecastSales;
			plannedCost += md.plannedCost;
			forecastCost += md.forecastCost;
		}
		return {
			sales,
			cost,
			profit: sales - cost,
			plannedSales,
			forecastSales,
			plannedCost,
			forecastCost,
			plannedProfit: plannedSales - plannedCost,
			forecastProfit: forecastSales - forecastCost
		};
	}

	/**
	 * 부서·데이터 기준 반기 데이터 (월별 계획·예상·실적 합산)
	 * @param {object} org - 조직 정보
	 * @param {object} data - 해당 부서 데이터
	 * @param {number} half - 반기 (1~2)
	 * @returns {{ sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number, plannedProfit: number, forecastProfit: number }}
	 */
	function getHalfDataForOrg(org, data, half) {
		const startMonth = (half - 1) * 6 + 1;
		let sales = 0,
			cost = 0;
		let plannedSales = 0,
			forecastSales = 0,
			plannedCost = 0,
			forecastCost = 0;
		for (let m = startMonth; m <= startMonth + 5; m++) {
			const md = getMonthDataForOrg(org, data, m);
			sales += md.sales;
			cost += md.cost;
			plannedSales += md.plannedSales;
			forecastSales += md.forecastSales;
			plannedCost += md.plannedCost;
			forecastCost += md.forecastCost;
		}
		return {
			sales,
			cost,
			profit: sales - cost,
			plannedSales,
			forecastSales,
			plannedCost,
			forecastCost,
			plannedProfit: plannedSales - plannedCost,
			forecastProfit: forecastSales - forecastCost
		};
	}

	/**
	 * 부서·데이터 기준 연간 합계 (월별 계획·예상·실적 합산)
	 * @param {object} org - 조직 정보
	 * @param {object} data - 해당 부서 데이터
	 * @returns {{ sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number, plannedProfit: number, forecastProfit: number }}
	 */
	function getYearTotalForOrg(org, data) {
		let sales = 0,
			cost = 0;
		let plannedSales = 0,
			forecastSales = 0,
			plannedCost = 0,
			forecastCost = 0;
		for (let m = 1; m <= 12; m++) {
			const md = getMonthDataForOrg(org, data, m);
			sales += md.sales;
			cost += md.cost;
			plannedSales += md.plannedSales;
			forecastSales += md.forecastSales;
			plannedCost += md.plannedCost;
			forecastCost += md.forecastCost;
		}
		return {
			sales,
			cost,
			profit: sales - cost,
			plannedSales,
			forecastSales,
			plannedCost,
			forecastCost,
			plannedProfit: plannedSales - plannedCost,
			forecastProfit: forecastSales - forecastCost
		};
	}
</script>

<MainContent>
	{#if permissionProfileLoading}
			<div class="flex items-center justify-center min-h-[200px]">
				<div class="text-gray-500">로딩 중...</div>
			</div>
		{:else if !canAccessPerformance}
			<div class="flex items-center justify-center min-h-[50vh]">
				<p class="text-lg text-gray-600">접근 권한이 없습니다.</p>
			</div>
		{:else if orgInfoLoading}
			<div class="flex items-center justify-center min-h-[200px]">
				<div class="text-gray-500">부서 목록 로딩 중...</div>
			</div>
		{:else if orgInfo.length === 0}
			<div class="flex items-center justify-center min-h-[200px]">
				<p class="text-gray-600">등록된 부서가 없습니다.</p>
			</div>
		{:else}
			<!-- 상단: 전사 실적 + 연도 선택 (예상실적 버튼 없음) -->
			<div class="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full min-w-0 bg-white shadow-sm p-4 rounded-lg">
				<div class="min-w-0">
					<h1 class="text-3xl font-bold text-gray-800">전사 실적</h1>
                    <p class="text-gray-600 mt-2">부서별 월별/분기별 실적을 확인할 수 있습니다. <span class="text-blue-500">(단위: 천원 , 천단위 반올림)</span></p>
				</div>
				<div class="flex justify-center items-center gap-2">
					<label for="company-year-select" class="text-sm font-medium text-gray-700 whitespace-nowrap">연도</label>
					<select
						id="company-year-select"
						bind:value={selectedYear}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each recentYears as year (year)}
							<option value={year}>{year}년</option>
						{/each}
					</select>
				</div>
				<div class="min-w-0"></div>
			</div>

			{#if isLoading}
				<div class="flex items-center justify-center min-h-[120px] text-gray-500">데이터 로딩 중...</div>
			{:else}
				<!-- 전사 단일 테이블: thead 고정, tbody 세로 스크롤, 부서별 border-top -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 company-performance-table-wrap">
					<table class="w-full border-collapse">
						<thead>
							<tr class="bg-gray-50 border-b border-gray-200">
								<th class="w-30 px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 company-performance-th">부서</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 company-performance-th">구분</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-gray-200 border-r border-gray-200 company-performance-th">합계</th>
								<MonthHeaderCell month={1} />
								<MonthHeaderCell month={2} />
								<MonthHeaderCell month={3} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200 company-performance-th">1분기 합계</th>
								<MonthHeaderCell month={4} />
								<MonthHeaderCell month={5} />
								<MonthHeaderCell month={6} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200 company-performance-th">2분기 합계</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200 company-performance-th">상반기 합계</th>
								<MonthHeaderCell month={7} />
								<MonthHeaderCell month={8} />
								<MonthHeaderCell month={9} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200 company-performance-th">3분기 합계</th>
								<MonthHeaderCell month={10} />
								<MonthHeaderCell month={11} />
								<MonthHeaderCell month={12} />
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200 company-performance-th">4분기 합계</th>
								<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200 company-performance-th">하반기 합계</th>
							</tr>
						</thead>
						<tbody>
							{#each orgInfo as org, orgIndex (org.org_id)}
								{@const data = dataByDept[org.org_id]}
								{@const ytot = getYearTotalForOrg(org, data)}
								{@const q1 = getQuarterDataForOrg(org, data, 1)}
								{@const q2 = getQuarterDataForOrg(org, data, 2)}
								{@const q3 = getQuarterDataForOrg(org, data, 3)}
								{@const q4 = getQuarterDataForOrg(org, data, 4)}
								{@const h1 = getHalfDataForOrg(org, data, 1)}
								{@const h2 = getHalfDataForOrg(org, data, 2)}
								<tr class="border-b border-gray-200 hover:bg-gray-50 {orgIndex >= 0 ? 'company-performance-dept-first' : ''}">
									<td rowspan="3" class="px-4 py-3 text-center text-sm font-semibold text-gray-800 align-middle border-r border-gray-200 bg-gray-50">{org.org_alias_name}</td>
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">매출</td>
									<SummaryDataCell type="sales" planned={ytot.plannedSales} expected={ytot.forecastSales} actual={ytot.sales} bgColor="yellow-dark" />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} />
									{/each}
									<SummaryDataCell type="sales" planned={q1.plannedSales} expected={q1.forecastSales} actual={q1.sales} bgColor="blue" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} />
									{/each}
									<SummaryDataCell type="sales" planned={q2.plannedSales} expected={q2.forecastSales} actual={q2.sales} bgColor="green" />
									<SummaryDataCell type="sales" planned={h1.plannedSales} expected={h1.forecastSales} actual={h1.sales} bgColor="yellow" />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} />
									{/each}
									<SummaryDataCell type="sales" planned={q3.plannedSales} expected={q3.forecastSales} actual={q3.sales} bgColor="blue" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} />
									{/each}
									<SummaryDataCell type="sales" planned={q4.plannedSales} expected={q4.forecastSales} actual={q4.sales} bgColor="green" />
									<SummaryDataCell type="sales" planned={h2.plannedSales} expected={h2.forecastSales} actual={h2.sales} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">비용</td>
									<SummaryDataCell type="cost" planned={ytot.plannedCost} expected={ytot.forecastCost} actual={ytot.cost} bgColor="yellow-dark" />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={q1.plannedCost} expected={q1.forecastCost} actual={q1.cost} bgColor="blue" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={q2.plannedCost} expected={q2.forecastCost} actual={q2.cost} bgColor="green" />
									<SummaryDataCell type="cost" planned={h1.plannedCost} expected={h1.forecastCost} actual={h1.cost} bgColor="yellow" />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={q3.plannedCost} expected={q3.forecastCost} actual={q3.cost} bgColor="blue" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={q4.plannedCost} expected={q4.forecastCost} actual={q4.cost} bgColor="green" />
									<SummaryDataCell type="cost" planned={h2.plannedCost} expected={h2.forecastCost} actual={h2.cost} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
									<SummaryDataCell type="profit" planned={ytot.plannedProfit} expected={ytot.forecastProfit} actual={ytot.profit} bgColor="yellow-dark" />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={q1.plannedProfit} expected={q1.forecastProfit} actual={q1.profit} bgColor="blue-dark" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={q2.plannedProfit} expected={q2.forecastProfit} actual={q2.profit} bgColor="green-dark" />
									<SummaryDataCell type="profit" planned={h1.plannedProfit} expected={h1.forecastProfit} actual={h1.profit} bgColor="yellow-dark" />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={q3.plannedProfit} expected={q3.forecastProfit} actual={q3.profit} bgColor="blue-dark" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthDataForOrg(org, data, month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={q4.plannedProfit} expected={q4.forecastProfit} actual={q4.profit} bgColor="green-dark" />
									<SummaryDataCell type="profit" planned={h2.plannedProfit} expected={h2.forecastProfit} actual={h2.profit} bgColor="yellow-dark" />
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{/if}
</MainContent>

<style>
	.company-performance-table-wrap {
		max-height: 70vh;
		overflow: auto;
	}
	.company-performance-table-wrap thead th {
		position: sticky;
		top: 0;
		z-index: 10;
		background: rgb(249 250 251);
		box-shadow: 0 1px 0 0 rgb(229 231 235);
	}
	.company-performance-table-wrap thead th.bg-blue-50 { background: rgb(239 246 255); }
	.company-performance-table-wrap thead th.bg-green-50 { background: rgb(240 253 244); }
	.company-performance-table-wrap thead th.bg-yellow-50 { background: rgb(254 252 232); }
	.company-performance-table-wrap thead th.bg-gray-200 { background: rgb(229 231 235); }
	.company-performance-dept-first {
		border-top: 2px solid black;
	}
</style>
