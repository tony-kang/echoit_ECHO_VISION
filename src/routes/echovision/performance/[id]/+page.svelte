<script>
	import { page } from '$app/stores';
	import { onMount, untrack } from 'svelte';
	import MainContent from '$lib/C/MainContent.svelte';
	import MonthDataCell from '../MonthDataCell.svelte';
	import SummaryDataCell from '../SummaryDataCell.svelte';
	import MonthHeaderCell from '../MonthHeaderCell.svelte';
	import PerformanceInputModal from '../PerformanceInputModal.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { getSales } from '$lib/salesService';
	import { getCosts } from '$lib/costService';
	import { getGoals } from '$lib/goalService';
	import { getPerformance, upsertPerformanceBulk, upsertPerformance } from '$lib/performanceService';
	import { getCurrentUserProfile } from '$lib/userService';
	import { getDepartments } from '$lib/departmentService';
	import { toast } from 'svelte-sonner';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	/** @type {import('@supabase/supabase-js').User | null} (레이아웃에서 인증 처리) */
	let user = $derived(authStore.user);
	/** @type {object | null} 페이지 진입 시 재조회한 프로필(권한 검사용) */
	let permissionProfile = $state(null);
	/** @type {boolean} 권한 프로필 로딩 중 */
	let permissionProfileLoading = $state(false);
	/** 실적현황 접근 가능 여부 (can_performance, 페이지별 최신 프로필로 검사) */
	let canAccessPerformance = $derived(permissionProfile?.can_performance === true);

	/** @type {number} 선택된 연도 */
	let selectedYear = $state(new Date().getFullYear());

	/** @type {Array<{org_id: string, org_alias_id: string, org_alias_name: string, org_code: string[], sales_code: string[], cost_code: string[]}>} ev_department 기반 조직 정보 (org_id = ev_department.id) */
	let orgInfo = $state([]);
	/** @type {boolean} 부서 목록 로딩 중 */
	let orgInfoLoading = $state(false);

	/** sales_code, cost_code 고정값 */
	const FIXED_SALES_CODES = ['SALES_0100', 'SALES_0200', 'SALES_0300', 'SALES_0400', 'SALES_0500', 'SALES_0600'];
	const FIXED_COST_CODES = ['COST_0100'];

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
	/** @type {Array<any>} 목표 데이터 */
	let goalData = $state([]);
	/** @type {Array<any>} 경영실적 데이터 */
	let performanceData = $state([]);
	/** @type {boolean} 데이터 로딩 중 */
	let isLoading = $state(false);
	/** @type {boolean} 입력 모달 표시 여부 */
	let showInputModal = $state(false);
	/** @type {boolean} 저장 중 */
	let isSaving = $state(false);
	/** @type {Array<{month: number, p_revenue: number, f_revenue: number, p_expenses: number, f_expenses: number}>} 입력 데이터 */
	let inputData = $state([]);
	/** @type {HTMLCanvasElement | null} 매출/이익 차트 캔버스 요소 */
	let salesProfitChartCanvas = $state(null);
	/** @type {Chart | null} 매출/이익 차트 인스턴스 */
	let salesProfitChartInstance = $state(null);
	/** @type {HTMLCanvasElement | null} 매출/비용 차트 캔버스 요소 */
	let salesCostChartCanvas = $state(null);
	/** @type {Chart | null} 매출/비용 차트 인스턴스 */
	let salesCostChartInstance = $state(null);

	/** URL 부서 id (ev_department.id, 추측 불가하여 타 부서 접근 방지) */
	const departmentId = $derived($page.params.id ?? '');
	/**
	 * 선택된 조직 정보 (라우트 부서 id와 일치하는 부서, 없으면 null)
	 */
	const selectedOrg = $derived.by(() => {
		if (!departmentId) return null;
		return orgInfo.find((o) => o.org_id === departmentId) ?? null;
	});

	/**
	 * 연간 합계 데이터 (derived)
	 */
	const yearTotal = $derived(getYearTotal());

	/**
	 * 특정 월의 경영실적 데이터 가져오기
	 * @param {number} month - 월 (1~12)
	 * @returns {any | null}
	 */
	function getPerformanceData(month) {
		if (!selectedOrg) return null;
		return performanceData.find(
			perf => perf.month === month &&
			perf.year === selectedYear &&
			perf.org_alias_id === selectedOrg.org_alias_id
		) || null;
	}

	/**
	 * 해당 년도/조직의 경영실적 데이터 존재 여부
	 */
	const hasPerformanceData = $derived.by(() => {
		if (!selectedOrg) return false;
		return performanceData.some(
			perf => perf.year === selectedYear && perf.org_alias_id === selectedOrg.org_alias_id
		);
	});

	/**
	 * 월별 데이터 계산
	 * @param {number} month - 월 (1~12)
	 * @returns {{sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number}}
	 */
	function getMonthData(month) {
		if (!selectedOrg) {
			return {
				sales: 0, cost: 0, profit: 0,
				plannedSales: 100000000, forecastSales: 90000000,
				plannedCost: 100000000, forecastCost: 90000000
			};
		}
		const sales = calculateMonthValue(salesData, month, selectedOrg.org_code, selectedOrg.sales_code);
		const cost = calculateMonthValue(costData, month, selectedOrg.org_code, selectedOrg.cost_code);
		const profit = sales - cost;
		
		// 경영실적 데이터에서 계획/예상 값 가져오기 (원 단위로 저장되어 있음)
		const perf = getPerformanceData(month);
		const plannedSales = perf?.p_revenue || 100000000; // 기본값 (원 단위)
		const forecastSales = perf?.f_revenue || 90000000; // 기본값 (원 단위)
		const plannedCost = perf?.p_expenses || 100000000; // 기본값 (원 단위)
		const forecastCost = perf?.f_expenses || 90000000; // 기본값 (원 단위)
		
		return { 
			sales, 
			cost, 
			profit,
			plannedSales,
			forecastSales,
			plannedCost,
			forecastCost
		};
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
	 * @returns {{sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number, plannedProfit: number, forecastProfit: number}}
	 */
	function getYearTotal() {
		let sales = 0, cost = 0;
		let plannedSales = 0, forecastSales = 0;
		let plannedCost = 0, forecastCost = 0;
		
		for (let month = 1; month <= 12; month++) {
			const monthData = getMonthData(month);
			sales += monthData.sales;
			cost += monthData.cost;
			plannedSales += monthData.plannedSales;
			forecastSales += monthData.forecastSales;
			plannedCost += monthData.plannedCost;
			forecastCost += monthData.forecastCost;
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
	 * 데이터 로드
	 */
	async function loadData() {
		if (!selectedOrg) return;
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
			
			// 경영실적 데이터 로드
			const performanceResult = await getPerformance({
				year: selectedYear,
				org_alias_id: selectedOrg.org_alias_id,
				orderByYear: true,
				orderByMonth: true
			});
			
			if (performanceResult.data) {
				performanceData = performanceResult.data;
			}

			console.log('Performance loadData salesData:',selectedYear, $state.snapshot(salesData));
			console.log('Performance loadData costData:',selectedYear, $state.snapshot(costData));
			console.log('Performance loadData performanceData:',selectedYear, $state.snapshot(performanceData));
		} catch (error) {
			console.error('데이터 로드 실패:', error);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 금액 포맷팅 (천원 단위)
	 * @param {number} value - 금액 (원 단위)
	 * @returns {string}
	 */
	function formatCurrency(value) {
		const thousandValue = value / 1000; // 천원 단위로 변환
		return new Intl.NumberFormat('ko-KR').format(Math.round(thousandValue));
	}

	/**
	 * 숫자 문자열을 천단위 콤마가 포함된 문자열로 변환
	 * @param {string | number} value - 숫자 값
	 * @returns {string}
	 */
	function formatNumberWithComma(value) {
		if (value === null || value === undefined || value === '') return '';
		const numStr = String(value).replace(/,/g, '');
		const num = parseFloat(numStr);
		if (isNaN(num)) return '';
		return new Intl.NumberFormat('ko-KR').format(num);
	}

	/**
	 * 천단위 콤마가 포함된 문자열을 숫자로 변환
	 * @param {string} value - 콤마가 포함된 문자열
	 * @returns {number}
	 */
	function parseNumberFromComma(value) {
		if (!value) return 0;
		const numStr = String(value).replace(/,/g, '');
		const num = parseFloat(numStr);
		return isNaN(num) ? 0 : num;
	}

	/**
	 * 입력 모달 열기 (기존 데이터가 있으면 불러오기)
	 */
	function openInputModal() {
		// 1~12월 데이터 초기화 (기존 데이터가 있으면 불러오고, 없으면 기본값 사용)
		inputData = Array.from({ length: 12 }, (_, i) => {
			const month = i + 1;
			const perf = getPerformanceData(month);
			
			// 기존 데이터가 있으면 천원 단위로 변환하여 사용, 없으면 기본값 사용
			const p_revenue = perf?.p_revenue ? perf.p_revenue / 1000 : 100000; // 원 -> 천원
			const f_revenue = perf?.f_revenue ? perf.f_revenue / 1000 : 90000; // 원 -> 천원
			const p_expenses = perf?.p_expenses ? perf.p_expenses / 1000 : 100000; // 원 -> 천원
			const f_expenses = perf?.f_expenses ? perf.f_expenses / 1000 : 90000; // 원 -> 천원
			
			return {
				month: month,
				p_revenue: p_revenue,
				f_revenue: f_revenue,
				p_expenses: p_expenses,
				f_expenses: f_expenses,
				p_revenue_display: formatNumberWithComma(p_revenue),
				f_revenue_display: formatNumberWithComma(f_revenue),
				p_expenses_display: formatNumberWithComma(p_expenses),
				f_expenses_display: formatNumberWithComma(f_expenses)
			};
		});
		showInputModal = true;
	}

	/**
	 * 입력 모달 닫기
	 */
	function closeInputModal() {
		showInputModal = false;
		inputData = [];
	}

	/**
	 * 경영실적 데이터 저장
	 */
	async function savePerformanceData() {
		isSaving = true;
		try {
			// 입력된 값은 천원 단위이므로 원 단위로 변환하여 저장
			const dataToSave = inputData.map(item => ({
				year: selectedYear,
				month: item.month,
				org_alias_id: selectedOrg.org_alias_id,
				p_revenue: (item.p_revenue || 0) * 1000, // 천원 -> 원 변환
				f_revenue: (item.f_revenue || 0) * 1000, // 천원 -> 원 변환
				p_expenses: (item.p_expenses || 0) * 1000, // 천원 -> 원 변환
				f_expenses: (item.f_expenses || 0) * 1000, // 천원 -> 원 변환
				a_revenue: 0, // 실제 매출은 ev_sales에서 계산
				a_expenses: 0 // 실제 비용은 ev_cost에서 계산
			}));

			const result = await upsertPerformanceBulk(dataToSave);
			
			if (result.error) {
				toast.error('경영실적 데이터 저장 실패');
				console.error('저장 실패:', result.error);
			} else {
				toast.success('경영실적 데이터가 저장되었습니다');
				closeInputModal();
				await loadData(); // 데이터 다시 로드
			}
		} catch (error) {
			console.error('저장 중 오류:', error);
			toast.error('저장 중 오류가 발생했습니다');
		} finally {
			isSaving = false;
		}
	}

	/**
	 * 특정 월의 경영실적 데이터 업데이트
	 * @param {number} month - 월
	 * @param {number} p_revenue - 계획 매출 (천원 단위)
	 * @param {number} f_revenue - 예상 매출 (천원 단위)
	 * @param {number} p_expenses - 계획 비용 (천원 단위)
	 * @param {number} f_expenses - 예상 비용 (천원 단위)
	 */
	async function updateMonthPerformance(month, p_revenue, f_revenue, p_expenses, f_expenses) {
		try {
			const perf = getPerformanceData(month);
			// 입력된 값은 천원 단위이므로 원 단위로 변환하여 저장
			const dataToSave = {
				year: selectedYear,
				month: month,
				org_alias_id: selectedOrg.org_alias_id,
				p_revenue: (p_revenue || 0) * 1000, // 천원 -> 원 변환
				f_revenue: (f_revenue || 0) * 1000, // 천원 -> 원 변환
				p_expenses: (p_expenses || 0) * 1000, // 천원 -> 원 변환
				f_expenses: (f_expenses || 0) * 1000, // 천원 -> 원 변환
				a_revenue: perf?.a_revenue || 0,
				a_expenses: perf?.a_expenses || 0
			};

			const result = await upsertPerformance(dataToSave);
			
			if (result.error) {
				toast.error('경영실적 데이터 수정 실패');
				console.error('수정 실패:', result.error);
			} else {
				toast.success('경영실적 데이터가 수정되었습니다');
				await loadData(); // 데이터 다시 로드
			}
		} catch (error) {
			console.error('수정 중 오류:', error);
			toast.error('수정 중 오류가 발생했습니다');
		}
	}

	/**
	 * 매출/이익 차트 생성/업데이트
	 */
	function updateSalesProfitChart() {
		if (!salesProfitChartCanvas) return;
		
		// 기존 차트가 있으면 제거
		if (salesProfitChartInstance) {
			salesProfitChartInstance.destroy();
			salesProfitChartInstance = null;
		}
		
		// 월별 데이터 수집
		const months = Array.from({ length: 12 }, (_, i) => i + 1);
		const monthLabels = months.map(m => `${m}월`);
		
		const plannedSalesData = months.map(m => {
			const data = getMonthData(m);
			return data.plannedSales / 1000; // 천원 단위로 변환
		});
		const forecastSalesData = months.map(m => {
			const data = getMonthData(m);
			return data.forecastSales / 1000; // 천원 단위로 변환
		});
		const actualSalesData = months.map(m => {
			const data = getMonthData(m);
			return data.sales / 1000; // 천원 단위로 변환
		});
		
		const plannedProfitData = months.map(m => {
			const data = getMonthData(m);
			return (data.plannedSales - data.plannedCost) / 1000; // 천원 단위로 변환
		});
		const forecastProfitData = months.map(m => {
			const data = getMonthData(m);
			return (data.forecastSales - data.forecastCost) / 1000; // 천원 단위로 변환
		});
		const actualProfitData = months.map(m => {
			const data = getMonthData(m);
			return data.profit / 1000; // 천원 단위로 변환
		});
		
		// 차트 생성
		try {
			salesProfitChartInstance = new Chart(salesProfitChartCanvas, {
				type: 'line',
				data: {
					labels: monthLabels,
					datasets: [
						{
							label: '계획 매출',
							data: plannedSalesData,
							borderColor: 'rgb(107, 114, 128)',
							backgroundColor: 'rgba(107, 114, 128, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '예상 매출',
							data: forecastSalesData,
							borderColor: 'rgb(37, 99, 235)',
							backgroundColor: 'rgba(37, 99, 235, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '실제 매출',
							data: actualSalesData,
							borderColor: 'rgb(59, 130, 246)',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							borderWidth: 2,
							tension: 0.1
						},
						{
							label: '계획 이익',
							data: plannedProfitData,
							borderColor: 'rgb(75, 85, 99)',
							backgroundColor: 'rgba(75, 85, 99, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '예상 이익',
							data: forecastProfitData,
							borderColor: 'rgb(34, 197, 94)',
							backgroundColor: 'rgba(34, 197, 94, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '실제 이익',
							data: actualProfitData,
							borderColor: 'rgb(16, 185, 129)',
							backgroundColor: 'rgba(16, 185, 129, 0.1)',
							borderWidth: 2,
							tension: 0.1
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: {
							display: true,
							text: '매출 & 이익',
							font: { size: 20, weight: 'bold' }
						},
						legend: {
							display: true,
							position: 'bottom',
							labels: {
								boxWidth: 12,
								padding: 6,
								font: { size: 12 }
							}
						},
						tooltip: {
							mode: 'index',
							intersect: false,
							callbacks: {
								label: function(context) {
									let label = context.dataset.label || '';
									if (label) label += ': ';
									label += new Intl.NumberFormat('ko-KR').format(context.parsed.y) + ' 천원';
									return label;
								}
							}
						}
					},
					scales: {
						y: {
							beginAtZero: false,
							ticks: {
								callback: function(value) {
									return new Intl.NumberFormat('ko-KR').format(value) + ' 천원';
								},
								font: { size: 9 }
							},
							grid: { color: 'rgba(0, 0, 0, 0.05)' }
						},
						x: {
							ticks: { font: { size: 9 } },
							grid: { display: false }
						}
					}
				}
			});
		} catch (error) {
			console.error('매출/이익 차트 생성 실패:', error);
		}
	}

	/**
	 * 매출/비용 차트 생성/업데이트
	 */
	function updateSalesCostChart() {
		if (!salesCostChartCanvas) return;
		
		// 기존 차트가 있으면 제거
		if (salesCostChartInstance) {
			salesCostChartInstance.destroy();
			salesCostChartInstance = null;
		}
		
		// 월별 데이터 수집
		const months = Array.from({ length: 12 }, (_, i) => i + 1);
		const monthLabels = months.map(m => `${m}월`);
		
		const plannedSalesData = months.map(m => {
			const data = getMonthData(m);
			return data.plannedSales / 1000; // 천원 단위로 변환
		});
		const forecastSalesData = months.map(m => {
			const data = getMonthData(m);
			return data.forecastSales / 1000; // 천원 단위로 변환
		});
		const actualSalesData = months.map(m => {
			const data = getMonthData(m);
			return data.sales / 1000; // 천원 단위로 변환
		});
		
		const plannedCostData = months.map(m => {
			const data = getMonthData(m);
			return data.plannedCost / 1000; // 천원 단위로 변환
		});
		const forecastCostData = months.map(m => {
			const data = getMonthData(m);
			return data.forecastCost / 1000; // 천원 단위로 변환
		});
		const actualCostData = months.map(m => {
			const data = getMonthData(m);
			return data.cost / 1000; // 천원 단위로 변환
		});
		
		// 차트 생성
		try {
			salesCostChartInstance = new Chart(salesCostChartCanvas, {
				type: 'line',
				data: {
					labels: monthLabels,
					datasets: [
						{
							label: '계획 매출',
							data: plannedSalesData,
							borderColor: 'rgb(107, 114, 128)',
							backgroundColor: 'rgba(107, 114, 128, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '예상 매출',
							data: forecastSalesData,
							borderColor: 'rgb(37, 99, 235)',
							backgroundColor: 'rgba(37, 99, 235, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '실제 매출',
							data: actualSalesData,
							borderColor: 'rgb(59, 130, 246)',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							borderWidth: 2,
							tension: 0.1
						},
						{
							label: '계획 비용',
							data: plannedCostData,
							borderColor: 'rgb(156, 163, 175)',
							backgroundColor: 'rgba(156, 163, 175, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '예상 비용',
							data: forecastCostData,
							borderColor: 'rgb(239, 68, 68)',
							backgroundColor: 'rgba(239, 68, 68, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '실제 비용',
							data: actualCostData,
							borderColor: 'rgb(248, 113, 113)',
							backgroundColor: 'rgba(248, 113, 113, 0.1)',
							borderWidth: 2,
							tension: 0.1
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: {
							display: true,
							text: '매출 & 비용',
							font: { size: 20, weight: 'bold' }
						},
						legend: {
							display: true,
							position: 'bottom',
							labels: {
								boxWidth: 12,
								padding: 6,
								font: { size: 12 }
							}
						},
						tooltip: {
							mode: 'index',
							intersect: false,
							callbacks: {
								label: function(context) {
									let label = context.dataset.label || '';
									if (label) label += ': ';
									label += new Intl.NumberFormat('ko-KR').format(context.parsed.y) + ' 천원';
									return label;
								}
							}
						}
					},
					scales: {
						y: {
							beginAtZero: false,
							ticks: {
								callback: function(value) {
									return new Intl.NumberFormat('ko-KR').format(value) + ' 천원';
								},
								font: { size: 9 }
							},
							grid: { color: 'rgba(0, 0, 0, 0.05)' }
						},
						x: {
							ticks: { font: { size: 9 } },
							grid: { display: false }
						}
					}
				}
			});
		} catch (error) {
			console.error('매출/비용 차트 생성 실패:', error);
		}
	}

	/** 페이지 진입 시 프로필 재조회하여 권한(can_performance) 검사 */
	$effect(() => {
		const userId = authStore.user?.id;
		if (!userId) {
			return;
		}
		permissionProfileLoading = true;
		permissionProfile = null;
		getCurrentUserProfile(userId, authStore.user?.user_metadata)
			.then(({ data }) => { permissionProfile = data ?? null; })
			.catch(() => { permissionProfile = null; })
			.finally(() => { permissionProfileLoading = false; });
	});

	/** ev_department 부서 목록 로드 → orgInfo 구성 (can_performance 있을 때만) */
	$effect(() => {
		if (!user || !canAccessPerformance) return;
		if (orgInfoLoading || orgInfo.length > 0) return;
		orgInfoLoading = true;
		getDepartments()
			.then(({ data }) => {
				const list = (data || []).map((d) => ({
					org_id: d.id,
					org_alias_id: d.code,
					org_alias_name: d.title || d.code,
					org_code: Array.isArray(d.param) ? d.param : [],
					sales_code: FIXED_SALES_CODES,
					cost_code: FIXED_COST_CODES
				}));
				orgInfo = list;
			})
			.catch(() => { orgInfo = []; })
			.finally(() => { orgInfoLoading = false; });
	});

	onMount(() => {
		// canvas가 마운트된 후 차트 초기화 시도
		setTimeout(() => {
			if (!isLoading) {
				updateSalesProfitChart();
				updateSalesCostChart();
			}
		}, 200);
		
		return () => {
			// 컴포넌트 언마운트 시 차트 정리
			if (salesProfitChartInstance) {
				salesProfitChartInstance.destroy();
				salesProfitChartInstance = null;
			}
			if (salesCostChartInstance) {
				salesCostChartInstance.destroy();
				salesCostChartInstance = null;
			}
		};
	});

	/** @type {boolean} 성능 데이터 로드 완료 여부 */
	let isPerformanceDataLoaded = $state(false);
	/** @type {string} 이전 URL 부서 id (재로드 트리거용) */
	let prevDepartmentId = $state('');
	/** @type {number} 이전 선택 연도 (재로드 트리거용) */
	let prevSelectedYear = $state(0);

	// 부서 id 또는 연도 변경 시 재로드 플래그 초기화
	$effect(() => {
		const id = departmentId;
		const year = selectedYear;
		if (prevDepartmentId !== id || prevSelectedYear !== year) {
			prevDepartmentId = id;
			prevSelectedYear = year;
			isPerformanceDataLoaded = false;
		}
	});

	// 부서·연도 확정 후 데이터 로드 (실적현황 접근 권한 있을 때만)
	$effect(() => {
		if (!user || !canAccessPerformance || !selectedOrg || isPerformanceDataLoaded) return;
		untrack(async () => {
			isPerformanceDataLoaded = true;
			console.log('Performance loadData');
			await loadData();
		});
	});

	// 데이터 로드 후 차트 업데이트
	$effect(() => {
		if (!isLoading && salesProfitChartCanvas && salesCostChartCanvas) {
			// 약간의 지연을 두어 DOM이 완전히 렌더링된 후 차트 생성
			setTimeout(() => {
				updateSalesProfitChart();
				updateSalesCostChart();
			}, 100);
		}
	});
</script>

<MainContent>
	{#snippet children()}
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
			{#if !selectedOrg}
				<div class="flex items-center justify-center min-h-[200px]">
					<p class="text-gray-600">해당 부서를 찾을 수 없습니다.</p>
				</div>
			{:else}
			<!-- 헤더 + 필터 (한 row, 연도는 중앙) -->
			<div class="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full min-w-0 bg-white shadow-sm p-4 rounded-lg">
				<div class="min-w-0">
					<h1 class="text-3xl font-bold text-gray-800">부서별 실적 (<span class="text-blue-600">{selectedOrg.org_alias_name}</span>)</h1>
					<p class="text-gray-600 mt-2">부서별 월별/분기별 실적을 확인할 수 있습니다</p>
				</div>
				<div class="flex justify-center items-center gap-2">
					<label for="year-select" class="text-sm font-medium text-gray-700 whitespace-nowrap">연도</label>
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
				<div class="flex flex-row flex-nowrap items-center justify-end gap-4 min-w-0">
					{#if isLoading}
						<div class="text-sm text-gray-500 whitespace-nowrap">데이터 로딩 중...</div>
					{:else if hasPerformanceData}
						<button
							onclick={openInputModal}
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
							type="button"
						>
							예상실적 수정
						</button>
					{:else}
						<div class="flex items-center gap-3 min-w-0">
							<span class="text-sm text-yellow-800 whitespace-nowrap">{selectedYear}년 {selectedOrg.org_alias_name} 경영실적 예상 데이터 없음</span>
							<button
								onclick={openInputModal}
								class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium whitespace-nowrap"
								type="button"
							>
								예상실적 입력
							</button>
						</div>
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
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="sales" 
									planned={monthData.plannedSales} 
									expected={monthData.forecastSales} 
									actual={monthData.sales}
									{month}
								/>
							{/each}
							<SummaryDataCell type="sales" value={getQuarterData(1).sales} bgColor="blue" />
							{#each [4, 5, 6] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="sales" 
									planned={monthData.plannedSales} 
									expected={monthData.forecastSales} 
									actual={monthData.sales}
									{month}
								/>
							{/each}
							<SummaryDataCell type="sales" value={getQuarterData(2).sales} bgColor="green" />
							<SummaryDataCell type="sales" value={getHalfData(1).sales} bgColor="yellow" />
						</tr>

						<!-- 비용 행 -->
						<tr class="border-b border-gray-200 hover:bg-gray-50">
							<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">비용</td>
							{#each [1, 2, 3] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="cost" 
									planned={monthData.plannedCost} 
									expected={monthData.forecastCost} 
									actual={monthData.cost}
									{month}
								/>
							{/each}
							<SummaryDataCell type="cost" value={getQuarterData(1).cost} bgColor="blue" />
							{#each [4, 5, 6] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="cost" 
									planned={monthData.plannedCost} 
									expected={monthData.forecastCost} 
									actual={monthData.cost}
									{month}
								/>
							{/each}
							<SummaryDataCell type="cost" value={getQuarterData(2).cost} bgColor="green" />
							<SummaryDataCell type="cost" value={getHalfData(1).cost} bgColor="yellow" />
						</tr>

						<!-- 이익 행 -->
						<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
							<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
							{#each [1, 2, 3] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="profit" 
									planned={monthData.plannedSales - monthData.plannedCost} 
									expected={monthData.forecastSales - monthData.forecastCost} 
									actual={monthData.profit}
									{month}
								/>
							{/each}
							<SummaryDataCell type="profit" value={getQuarterData(1).profit} bgColor="blue-dark" />
							{#each [4, 5, 6] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="profit" 
									planned={monthData.plannedSales - monthData.plannedCost} 
									expected={monthData.forecastSales - monthData.forecastCost} 
									actual={monthData.profit}
									{month}
								/>
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
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="sales" 
									planned={monthData.plannedSales} 
									expected={monthData.forecastSales} 
									actual={monthData.sales}
									{month}
								/>
							{/each}
							<SummaryDataCell type="sales" value={getQuarterData(3).sales} bgColor="blue" />
							{#each [10, 11, 12] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="sales" 
									planned={monthData.plannedSales} 
									expected={monthData.forecastSales} 
									actual={monthData.sales}
									{month}
								/>
							{/each}
							<SummaryDataCell type="sales" value={getQuarterData(4).sales} bgColor="green" />
							<SummaryDataCell type="sales" value={getHalfData(2).sales} bgColor="yellow" />
						</tr>

						<!-- 비용 행 -->
						<tr class="border-b border-gray-200 hover:bg-gray-50">
							<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">비용</td>
							{#each [7, 8, 9] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="cost" 
									planned={monthData.plannedCost} 
									expected={monthData.forecastCost} 
									actual={monthData.cost}
									{month}
								/>
							{/each}
							<SummaryDataCell type="cost" value={getQuarterData(3).cost} bgColor="blue" />
							{#each [10, 11, 12] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="cost" 
									planned={monthData.plannedCost} 
									expected={monthData.forecastCost} 
									actual={monthData.cost}
									{month}
								/>
							{/each}
							<SummaryDataCell type="cost" value={getQuarterData(4).cost} bgColor="green" />
							<SummaryDataCell type="cost" value={getHalfData(2).cost} bgColor="yellow" />
						</tr>

						<!-- 이익 행 -->
						<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
							<td class="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
							{#each [7, 8, 9] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="profit" 
									planned={monthData.plannedSales - monthData.plannedCost} 
									expected={monthData.forecastSales - monthData.forecastCost} 
									actual={monthData.profit}
									{month}
								/>
							{/each}
							<SummaryDataCell type="profit" value={getQuarterData(3).profit} bgColor="blue-dark" />
							{#each [10, 11, 12] as month}
								{@const monthData = getMonthData(month)}
								<MonthDataCell 
									type="profit" 
									planned={monthData.plannedSales - monthData.plannedCost} 
									expected={monthData.forecastSales - monthData.forecastCost} 
									actual={monthData.profit}
									{month}
								/>
							{/each}
							<SummaryDataCell type="profit" value={getQuarterData(4).profit} bgColor="green-dark" />
							<SummaryDataCell type="profit" value={getHalfData(2).profit} bgColor="yellow-dark" />
						</tr>
					</tbody>
				</table>

				<!-- 연간 합계 -->
				<table class="w-full border-collapse mt-4 text-sm font-semibold">
					<thead>
						<tr class="bg-gray-100 border-b border-gray-200">
							<th class="w-[7%] px-4 py-3 text-center text-gray-700 border-r border-gray-200">구분</th>
							<th class="w-[15%] px-4 py-3 text-center text-gray-700">합계</th>
							<th class="w-[78%] px-4 py-3 text-center text-gray-700"></th>
						</tr>
					</thead>
					<tbody>
						<tr class="border-b border-gray-200">
							<td class="px-4 py-3 text-center text-gray-700 border-r border-gray-200">매출</td>
							<td class="px-4 py-3 text-gray-900 border-r border-gray-200">
								<div class="space-y-1">
									<div class="flex justify-between items-center">
										<span class="text-gray-500 opacity-70">계획</span>
										<span class="text-gray-700">{formatCurrency(yearTotal.plannedSales)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-blue-600 opacity-70">예상</span>
										<span class="text-blue-700">{formatCurrency(yearTotal.forecastSales)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-gray-500 opacity-70">실제</span>
										<span class="text-gray-700">{formatCurrency(yearTotal.sales)}</span>
									</div>
								</div>
							</td>
							<td rowspan="3" class="px-4 py-3 align-top">
								<div class="flex flex-row gap-4 w-full min-w-[800px]">
									<div class="flex-1 h-[400px] relative">
										<canvas bind:this={salesProfitChartCanvas} class="w-full h-full"></canvas>
									</div>
									<div class="flex-1 h-[400px] relative">
										<canvas bind:this={salesCostChartCanvas} class="w-full h-full"></canvas>
									</div>
								</div>
							</td>
						</tr>
						<tr class="border-b border-gray-200">
							<td class="px-4 py-3 text-center text-gray-700 border-r border-gray-200">비용</td>
							<td class="px-4 py-3 text-gray-900 border-r border-gray-200">
								<div class="space-y-1">
									<div class="flex justify-between items-center">
										<span class="text-gray-500 opacity-70">계획</span>
										<span class="text-gray-700">{formatCurrency(yearTotal.plannedCost)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-blue-600 opacity-70">예상</span>
										<span class="text-blue-700">{formatCurrency(yearTotal.forecastCost)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-gray-500 opacity-70">실제</span>
										<span class="text-gray-700">{formatCurrency(yearTotal.cost)}</span>
									</div>
								</div>
							</td>
						</tr>
						<tr class="bg-blue-50">
							<td class="px-4 py-3 text-center text-gray-700 border-r border-gray-200">이익</td>
							<td class="px-4 py-3 text-gray-900 border-r border-gray-200">
								<div class="space-y-1">
									<div class="flex justify-between items-center">
										<span class="text-gray-500 opacity-70">계획</span>
										<span class="text-gray-700">{formatCurrency(yearTotal.plannedProfit)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-blue-600 opacity-70">예상</span>
										<span class="text-blue-700">{formatCurrency(yearTotal.forecastProfit)}</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="{yearTotal.profit >= 0 ? 'text-green-600' : 'text-red-600'} opacity-70">실제</span>
										<span class="{yearTotal.profit >= 0 ? 'text-green-600' : 'text-red-600'}">{formatCurrency(yearTotal.profit)}</span>
									</div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			{/if}
		{/if}
	{/snippet}
</MainContent>

<!-- 입력 모달 (해당 부서가 있을 때만) -->
{#if selectedOrg}
	<PerformanceInputModal
		open={showInputModal}
		selectedYear={selectedYear}
		orgAliasName={selectedOrg.org_alias_name}
		hasPerformanceData={hasPerformanceData}
		{inputData}
		{isSaving}
		onClose={closeInputModal}
		onSave={savePerformanceData}
		{formatNumberWithComma}
		{parseNumberFromComma}
	/>
{/if}
