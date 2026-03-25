<script>
	import { page } from '$app/stores';
	import { onMount, untrack } from 'svelte';
	import MainContent from '$lib/C/MainContent.svelte';
	import MonthDataCell from '../MonthDataCell.svelte';
	import SummaryDataCell from '../SummaryDataCell.svelte';
	import MonthHeaderCell from '../MonthHeaderCell.svelte';
	import PerformanceRowLegendColumn from '../PerformanceRowLegendColumn.svelte';
	import { PLAN_FORECAST_ACTUAL_ROW_DEFS } from '../planActualRowLabels.js';
	import PerformanceInputModal from '../PerformanceInputModal.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { getSales } from '$lib/salesService';
	import { getCosts } from '$lib/costService';
	// import { getGoals } from '$lib/goalService';
	import { 
		getPerformance, 
		upsertPerformanceBulk, 
		// upsertPerformance 
	} from '$lib/performanceService';
	import { getDepartments, getDepartmentUsers } from '$lib/departmentService';
	import { toKoreanAmount } from '$lib/utils/moneyUtil.js';
	import { toast } from 'svelte-sonner';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	/** @type {import('@supabase/supabase-js').User | null} (레이아웃에서 인증 처리) */
	let user = $derived(authStore.user);
	/** @type {boolean} 해당 부서 담당자 여부 로딩 중 */
	let departmentAccessLoading = $state(true);
	/** @type {boolean} 해당 부서(ev_department_user) 담당자에 자신이 포함되어 있으면 true */
	let isDepartmentMember = $state(false);
	/** @type {{ can_edit_business_plan: boolean, can_edit_expected_sales: boolean, can_edit_plan_cost: boolean, can_edit_expected_cost: boolean } | null} 현재 사용자의 해당 부서 담당자 권한 (모달 입력 가능 여부용) */
	let currentUserDepartmentRecord = $state(null);
	/** 실적현황 접근 가능 여부: 이 부서의 담당자(ev_department_user)에 자신이 있을 때만 */
	let canAccessPerformance = $derived(isDepartmentMember);

	/** @type {number} 선택된 연도 */
	let selectedYear = $state(new Date().getFullYear());

	/** @type {'full' | 'split'} 실적 테이블 레이아웃: full=1~12월 가로 한 줄, split=1~6월 위 / 7~12월 아래 */
	let tableLayoutMode = $state('full'); // 'split'

	/** @type {boolean} 계·예·실 범례 칼럼 및 연간 합계 짧은 라벨 표시 여부 */
	let showPlanActualLegendColumns = $state(true);

	/**
	 * 계획·예상·실제 범례 칼럼·라벨 표시 토글
	 * @returns {void}
	 */
	function togglePlanActualLegendColumns() {
		showPlanActualLegendColumns = !showPlanActualLegendColumns;
	}

	/** @type {number} 연간 합계 영역에서 왼쪽 표(구분·연간 누계) 가로 비율 % (나머지는 차트) */
	let yearTotalDataTableWidthPct = $state(20);

	/** 연간 누계 요약 표 구분 열 고정 너비 비율 % (항목·금액 열과 합 100%) */
	const YEAR_TOTAL_CATEGORY_COL_PCT = 20;

	/** @type {number} 연간 누계 표 항목 열 너비 %(전체 표 기준, table-fixed에서 colgroup으로 적용) */
	let yearTotalItemColWidthPct = $state(12);

	/** @type {number} 연간 누계 표 금액 열 너비 %(구분·항목 제외 잔여) */
	const yearTotalAmountColWidthPct = $derived(
		100 - YEAR_TOTAL_CATEGORY_COL_PCT - yearTotalItemColWidthPct
	);

	/** @type {number} 연간 합계 차트 영역(.year-total-charts) 최소 높이 rem (scoped CSS min-height:0 제거·인라인으로 적용) */
	let yearTotalChartsMinHeightRem = $state(30);

	/** @type {Array<{org_id: string, org_alias_id: string, org_alias_name: string, org_code: string[], sales_code: string[], cost_code: string[]}>} ev_department 기반 조직 정보 (org_id = ev_department.id) */
	let orgInfo = $state([]);
	/** @type {boolean} 부서 목록 로딩 중 */
	let orgInfoLoading = $state(false);

	/** sales_code, cost_code 고정값 */
	const FIXED_SALES_CODES = [
		// 'SALES_0100', 'SALES_0200', 'SALES_0300', 'SALES_0400', 'SALES_0500', 'SALES_0600', 'SALES_0700',
		// 'SALES_0800', 'SALES_0900', 'SALES_1000', 'SALES_1100', 'SALES_1200', 'SALES_1300', 'SALES_1400',
		'SALES_0100'
	];
	const FIXED_COST_CODES = ['COST_1100'];

	/** @type {Array<number>} 최근 3년 */
	const recentYears = $state([
		new Date().getFullYear(),
		new Date().getFullYear() - 1,
		new Date().getFullYear() - 2
	]);

	/** @type {Array<any>} 매출 데이터 (선택 연도) */
	let salesData = $state([]);
	/** @type {Array<any>} 매출 데이터 (전년도, YoY 매출 비교용) */
	let prevYearSalesData = $state([]);
	/** @type {Array<any>} 원가 데이터 */
	let costData = $state([]);
	/** @type {Array<any>} 목표 데이터 */
	// let goalData = $state([]);
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
	/** @type {HTMLCanvasElement | null} 매출/원가 차트 캔버스 요소 */
	let salesCostChartCanvas = $state(null);
	/** @type {Chart | null} 매출/원가 차트 인스턴스 */
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
		// console.log('>>>> 1',selectedYear, selectedOrg.org_alias_id, performanceData);
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
				plannedSales: 0, forecastSales: 0,
				plannedCost: 0, forecastCost: 0
			};
		}
		const sales = calculateMonthValue(salesData, month, selectedOrg.org_code, selectedOrg.sales_code);
		const cost = calculateMonthValue(costData, month, selectedOrg.org_code, selectedOrg.cost_code);
		const profit = sales - cost;
		
		// 경영실적 데이터에서 계획/예상 값 가져오기 (원 단위로 저장되어 있음)
		const perf = getPerformanceData(month);
		const plannedSales = perf?.p_revenue || 0; // 기본값 (원 단위)
		const forecastSales = perf?.f_revenue || 0; // 기본값 (원 단위)
		const plannedCost = perf?.p_expenses || 0; // 기본값 (원 단위)
		const forecastCost = perf?.f_expenses || 0; // 기본값 (원 단위)
		
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
	 * 특정 월·연도의 매출/원가 계산 (ev_sales / ev_cost 행 합산)
	 * @param {Array<any>} data - 원본 데이터
	 * @param {number} month - 월 (1~12)
	 * @param {string[]} orgCodes - 조직 코드 배열
	 * @param {string[]} targetCodes - 대상 코드 배열 (SUM_000 등)
	 * @param {number} [year] - 연도 (생략 시 selectedYear)
	 * @returns {number}
	 */
	function calculateMonthValue(data, month, orgCodes, targetCodes, year) {
		const y = year ?? selectedYear;
		let total = 0;

		for (const item of data) {
			if (item.month !== month || item.year !== y) continue;
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
	 * 해당 월 실적 매출이 전년 동월 실적 매출보다 큰지 (비용·이익 행에는 미사용)
	 * @param {number} month - 월 (1~12)
	 * @returns {boolean}
	 */
	function isSalesBeatPriorYear(month) {
		if (!selectedOrg) return false;
		const priorYear = selectedYear - 1;
		const currentSales = calculateMonthValue(
			salesData,
			month,
			selectedOrg.org_code,
			selectedOrg.sales_code,
			selectedYear
		);
		const priorSales = calculateMonthValue(
			prevYearSalesData,
			month,
			selectedOrg.org_code,
			selectedOrg.sales_code,
			priorYear
		);
		return currentSales > priorSales;
	}

	/**
	 * 월 헤더 YoY 팝업용 실적 매출 (원 단위)
	 * @param {number} month - 월 (1~12)
	 * @returns {{ current: number, prior: number }}
	 */
	function getMonthSalesYoY(month) {
		if (!selectedOrg) return { current: 0, prior: 0 };
		const priorY = selectedYear - 1;
		return {
			current: calculateMonthValue(
				salesData,
				month,
				selectedOrg.org_code,
				selectedOrg.sales_code,
				selectedYear
			),
			prior: calculateMonthValue(
				prevYearSalesData,
				month,
				selectedOrg.org_code,
				selectedOrg.sales_code,
				priorY
			)
		};
	}

	/**
	 * 분기 데이터 계산 (월별 계획·예상·실적을 동일 구간에서 합산)
	 * @param {number} quarter - 분기 (1~4)
	 * @returns {{sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number, plannedProfit: number, forecastProfit: number}}
	 */
	function getQuarterData(quarter) {
		const startMonth = (quarter - 1) * 3 + 1;
		const endMonth = startMonth + 2;

		let sales = 0,
			cost = 0;
		let plannedSales = 0,
			forecastSales = 0,
			plannedCost = 0,
			forecastCost = 0;
		for (let month = startMonth; month <= endMonth; month++) {
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
	 * 반기 데이터 계산 (월별 계획·예상·실적을 동일 구간에서 합산)
	 * @param {number} half - 반기 (1~2)
	 * @returns {{sales: number, cost: number, profit: number, plannedSales: number, forecastSales: number, plannedCost: number, forecastCost: number, plannedProfit: number, forecastProfit: number}}
	 */
	function getHalfData(half) {
		const startMonth = (half - 1) * 6 + 1;
		const endMonth = startMonth + 5;

		let sales = 0,
			cost = 0;
		let plannedSales = 0,
			forecastSales = 0,
			plannedCost = 0,
			forecastCost = 0;
		for (let month = startMonth; month <= endMonth; month++) {
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
			console.log('Performance loadData selectedOrg:',$state.snapshot(selectedOrg));
			// 선택된 조직의 org_code 배열을 evCodeItems로 전달
			const evCodeItems = selectedOrg.org_code;
			const companyCodeItems = selectedOrg.company_code;

			console.log('Performance loadData companyCodeItems:',$state.snapshot(companyCodeItems));

			const priorYear = selectedYear - 1;
			const [salesResult, priorSalesResult, costResult] = await Promise.all([
				getSales({
					year: selectedYear,
					evCodeItems: evCodeItems,
					companyCodeItems: companyCodeItems,
					orderByYear: true,
					orderByMonth: true
				}),
				getSales({
					year: priorYear,
					evCodeItems: evCodeItems,
					companyCodeItems: companyCodeItems,
					orderByYear: true,
					orderByMonth: true
				}),
				getCosts({
					year: selectedYear,
					evCodeItems: evCodeItems,
					companyCodeItems: companyCodeItems,
					orderByYear: true,
					orderByMonth: true
				})
			]);

			salesData = salesResult.data ?? [];
			prevYearSalesData = priorSalesResult.data ?? [];
			costData = costResult.data ?? [];
			
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
			salesData = [];
			prevYearSalesData = [];
			costData = [];
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
			const p_revenue = perf?.p_revenue ? perf.p_revenue / 1000 : 0; // 원 -> 천원
			const f_revenue = perf?.f_revenue ? perf.f_revenue / 1000 : 0; // 원 -> 천원
			const p_expenses = perf?.p_expenses ? perf.p_expenses / 1000 : 0; // 원 -> 천원
			const f_expenses = perf?.f_expenses ? perf.f_expenses / 1000 : 0; // 원 -> 천원
			
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
				a_expenses: 0 // 실제 원가은 ev_cost에서 계산
			}));

			const result = await upsertPerformanceBulk(dataToSave);
			
			if (result.error) {
				toast.error('경영실적 데이터 저장 실패');
				console.error('저장 실패:', result.error);
			} else {
				toast.success('경영실적 데이터가 저장되었습니다');
				closeInputModal();
				console.log('>>>> 1 >>>>');
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
	 * @param {number} p_expenses - 계획 원가 (천원 단위)
	 * @param {number} f_expenses - 예상 원가 (천원 단위)
	 */
	// async function updateMonthPerformance(month, p_revenue, f_revenue, p_expenses, f_expenses) {
	// 	try {
	// 		const perf = getPerformanceData(month);
	// 		// 입력된 값은 천원 단위이므로 원 단위로 변환하여 저장
	// 		const dataToSave = {
	// 			year: selectedYear,
	// 			month: month,
	// 			org_alias_id: selectedOrg.org_alias_id,
	// 			p_revenue: (p_revenue || 0) * 1000, // 천원 -> 원 변환
	// 			f_revenue: (f_revenue || 0) * 1000, // 천원 -> 원 변환
	// 			p_expenses: (p_expenses || 0) * 1000, // 천원 -> 원 변환
	// 			f_expenses: (f_expenses || 0) * 1000, // 천원 -> 원 변환
	// 			a_revenue: perf?.a_revenue || 0,
	// 			a_expenses: perf?.a_expenses || 0
	// 		};

	// 		const result = await upsertPerformance(dataToSave);
			
	// 		if (result.error) {
	// 			toast.error('경영실적 데이터 수정 실패');
	// 			console.error('수정 실패:', result.error);
	// 		} else {
	// 			toast.success('경영실적 데이터가 수정되었습니다');
	// 			console.log('>>>> 3 >>>>');
	// 			await loadData(); // 데이터 다시 로드
	// 		}
	// 	} catch (error) {
	// 		console.error('수정 중 오류:', error);
	// 		toast.error('수정 중 오류가 발생했습니다');
	// 	}
	// }

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
	 * 매출/원가 차트 생성/업데이트
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
							label: '계획 원가',
							data: plannedCostData,
							borderColor: 'rgb(156, 163, 175)',
							backgroundColor: 'rgba(156, 163, 175, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '예상 원가',
							data: forecastCostData,
							borderColor: 'rgb(239, 68, 68)',
							backgroundColor: 'rgba(239, 68, 68, 0.1)',
							borderWidth: 2,
							borderDash: [5, 5],
							tension: 0.1
						},
						{
							label: '실제 원가',
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
							text: '매출 & 원가',
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
			console.error('매출/원가 차트 생성 실패:', error);
		}
	}

	/** 해당 부서(departmentId)의 ev_department_user에 현재 사용자가 포함되는지 검사 */
	$effect(() => {
		const uid = authStore.user?.id;
		const deptId = departmentId;
		if (!deptId) {
			departmentAccessLoading = false;
			isDepartmentMember = false;
			currentUserDepartmentRecord = null;
			return;
		}
		if (!uid) {
			departmentAccessLoading = false;
			isDepartmentMember = false;
			currentUserDepartmentRecord = null;
			return;
		}
		departmentAccessLoading = true;
		getDepartmentUsers(deptId)
			.then(({ data }) => {
				const list = data ?? [];
				const myRecord = list.find((u) => u.user_id === uid) ?? null;
				isDepartmentMember = !!myRecord;
				currentUserDepartmentRecord = myRecord
					? {
							can_edit_business_plan: !!myRecord.can_edit_business_plan,
							can_edit_expected_sales: !!myRecord.can_edit_expected_sales,
							can_edit_plan_cost: !!myRecord.can_edit_plan_cost,
							can_edit_expected_cost: !!myRecord.can_edit_expected_cost
						}
					: null;
			})
			.catch(() => {
				isDepartmentMember = false;
				currentUserDepartmentRecord = null;
			})
			.finally(() => { departmentAccessLoading = false; });
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
					cost_code: FIXED_COST_CODES,
					company_code: Array.isArray(d.company_code) ? d.company_code : [],
					company_excel: Array.isArray(d.company_excel) ? d.company_excel : []
				}));
				orgInfo = list;
			})
			.catch(() => { orgInfo = []; })
			.finally(() => { orgInfoLoading = false; });
	});

	onMount(() => {
		/** 좁은 뷰포트에서는 분할 테이블이 가로 스크롤 폭을 줄임 */
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
			tableLayoutMode = 'split';
		}
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
			console.log('>>>> 2 >>>>');
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
	{#if departmentAccessLoading}
		<div class="flex items-center justify-center min-h-[200px]">
			<div class="text-gray-500">로딩 중...</div>
		</div>
	{:else if !canAccessPerformance}
		<div class="min-w-0">
			<h1 class="text-3xl font-bold text-gray-800">부서별 실적</h1>
			<p class="text-gray-600 mt-2">부서별 월별/분기별 실적을 확인할 수 있습니다. <span class="text-blue-500">(단위: 천원 , 천단위 반올림)</span></p>
		</div>
		<div class="flex items-center justify-center min-h-[10vh] border-2 border-red-600 rounded-lg p-4">
			<p class="text-lg text-red-600">해당 부서의 담당자가 아니어서 접근할 수 없습니다.</p>
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
			<div class="performance-dept-root w-full min-w-0 max-w-full">
				<!-- 헤더 + 필터: 모바일 세로 스택, 넓은 화면에서 3열 -->
				<div
					class="mb-4 grid w-full min-w-0 max-w-full grid-cols-1 gap-4 rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:p-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center xl:gap-4"
				>
					<div class="min-w-0">
						<h1 class="wrap-break-word text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">
							부서별 실적 (<span class="text-blue-600">{selectedOrg.org_alias_name}</span>)
						</h1>
						<p class="mt-2 text-sm text-gray-600 sm:text-base">
							부서별 월별/분기별 실적을 확인할 수 있습니다.
							<span class="text-blue-500">(단위: 천원 , 천단위 반올림)</span>
						</p>
						<p class="mt-1 text-xs text-gray-500 md:hidden">표는 좌우로 스크롤할 수 있습니다.</p>
					</div>
					<div class="flex min-w-0 flex-wrap items-center justify-start gap-3 sm:justify-center xl:justify-center">
						<div class="flex items-center gap-2">
							<label for="year-select" class="whitespace-nowrap text-sm font-medium text-gray-700">연도</label>
							<select
								id="year-select"
								bind:value={selectedYear}
								class="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{#each recentYears as year (year)}
									<option value={year}>{year}년</option>
								{/each}
							</select>
						</div>
						<fieldset class="flex flex-wrap items-center gap-3 border-0 p-0 sm:gap-4">
							<legend class="sr-only">실적 테이블 레이아웃</legend>
							<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
								<input type="radio" name="table-layout" value="full" bind:group={tableLayoutMode} class="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500" />
								<span class="whitespace-nowrap">1~12월 가로</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
								<input type="radio" name="table-layout" value="split" bind:group={tableLayoutMode} class="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500" />
								<span class="whitespace-nowrap">1~6 / 7~12 분리</span>
							</label>
						</fieldset>
						<button
							type="button"
							class="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
							aria-pressed={showPlanActualLegendColumns}
							aria-label="계획 예상 실제 범례 칼럼 표시 전환"
							onclick={togglePlanActualLegendColumns}
						>
							{showPlanActualLegendColumns ? '계·전·실 숨기기' : '계·전·실 표시'}
						</button>
					</div>
					<div class="flex min-w-0 flex-row flex-wrap items-center justify-start gap-3 xl:justify-end">
						{#if isLoading}
							<div class="text-sm text-gray-500 whitespace-nowrap">데이터 로딩 중...</div>
						{:else if hasPerformanceData}
							<button
								onclick={openInputModal}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
								type="button"
							>
								전망실적 수정
							</button>
						{:else}
							<div class="flex items-center gap-3 min-w-0">
								<span class="text-sm text-yellow-800 whitespace-nowrap">{selectedYear}년 {selectedOrg.org_alias_name} 경영실적 예상 데이터 없음</span>
								<button
									onclick={openInputModal}
									class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium whitespace-nowrap"
									type="button"
								>
									전망실적 입력
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- 실적 테이블 (레이아웃: 1~12월 가로 | 1~6/7~12 분리) -->
				<div class="performance-table-scroll max-w-full min-w-0 overflow-x-auto rounded-lg shadow-sm">
					{#if tableLayoutMode === 'split'}
						<!-- 1~6월 위, 7~12월 아래 -->
						<table class="performance-main-table w-full min-w-208 border-collapse">
							<thead>
								<!-- 상반기 헤더 -->
								<tr class="bg-gray-50 border-b border-gray-200">
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">구분</th>
									<PerformanceRowLegendColumn as="th" visible={showPlanActualLegendColumns} />
									<MonthHeaderCell month={1} yoySalesCompare={getMonthSalesYoY(1)} compareYear={selectedYear} />
									<MonthHeaderCell month={2} yoySalesCompare={getMonthSalesYoY(2)} compareYear={selectedYear} />
									<MonthHeaderCell month={3} yoySalesCompare={getMonthSalesYoY(3)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200">1분기 합계</th>
									<MonthHeaderCell month={4} yoySalesCompare={getMonthSalesYoY(4)} compareYear={selectedYear} />
									<MonthHeaderCell month={5} yoySalesCompare={getMonthSalesYoY(5)} compareYear={selectedYear} />
									<MonthHeaderCell month={6} yoySalesCompare={getMonthSalesYoY(6)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200">2분기 합계</th>
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200">상반기 합계</th>
								</tr>
							</thead>
							<tbody>
								<!-- 상반기: 매출 / 원가 / 이익 -->
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">매출</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(1).plannedSales} expected={getQuarterData(1).forecastSales} actual={getQuarterData(1).sales} bgColor="blue" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(2).plannedSales} expected={getQuarterData(2).forecastSales} actual={getQuarterData(2).sales} bgColor="green" />
									<SummaryDataCell type="sales" planned={getHalfData(1).plannedSales} expected={getHalfData(1).forecastSales} actual={getHalfData(1).sales} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">원가</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(1).plannedCost} expected={getQuarterData(1).forecastCost} actual={getQuarterData(1).cost} bgColor="blue" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(2).plannedCost} expected={getQuarterData(2).forecastCost} actual={getQuarterData(2).cost} bgColor="green" />
									<SummaryDataCell type="cost" planned={getHalfData(1).plannedCost} expected={getHalfData(1).forecastCost} actual={getHalfData(1).cost} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(1).plannedProfit} expected={getQuarterData(1).forecastProfit} actual={getQuarterData(1).profit} bgColor="blue-dark" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(2).plannedProfit} expected={getQuarterData(2).forecastProfit} actual={getQuarterData(2).profit} bgColor="green-dark" />
									<SummaryDataCell type="profit" planned={getHalfData(1).plannedProfit} expected={getHalfData(1).forecastProfit} actual={getHalfData(1).profit} bgColor="yellow-dark" />
								</tr>

								<!-- 구분선 -->
								<tr class="border-b border-gray-200">
									<td colspan={showPlanActualLegendColumns ? 11 : 10} class="px-4 py-2 bg-gray-100"></td>
								</tr>

								<!-- 하반기 헤더 (7월~12월) -->
								<tr class="bg-gray-50 border-b border-gray-200">
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">구분</th>
									<PerformanceRowLegendColumn as="th" visible={showPlanActualLegendColumns} />
									<MonthHeaderCell month={7} yoySalesCompare={getMonthSalesYoY(7)} compareYear={selectedYear} />
									<MonthHeaderCell month={8} yoySalesCompare={getMonthSalesYoY(8)} compareYear={selectedYear} />
									<MonthHeaderCell month={9} yoySalesCompare={getMonthSalesYoY(9)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200">3분기 합계</th>
									<MonthHeaderCell month={10} yoySalesCompare={getMonthSalesYoY(10)} compareYear={selectedYear} />
									<MonthHeaderCell month={11} yoySalesCompare={getMonthSalesYoY(11)} compareYear={selectedYear} />
									<MonthHeaderCell month={12} yoySalesCompare={getMonthSalesYoY(12)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200">4분기 합계</th>
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200">하반기 합계</th>
								</tr>

								<!-- 하반기: 매출 / 원가 / 이익 -->
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">매출</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(3).plannedSales} expected={getQuarterData(3).forecastSales} actual={getQuarterData(3).sales} bgColor="blue" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(4).plannedSales} expected={getQuarterData(4).forecastSales} actual={getQuarterData(4).sales} bgColor="green" />
									<SummaryDataCell type="sales" planned={getHalfData(2).plannedSales} expected={getHalfData(2).forecastSales} actual={getHalfData(2).sales} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">원가</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(3).plannedCost} expected={getQuarterData(3).forecastCost} actual={getQuarterData(3).cost} bgColor="blue" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(4).plannedCost} expected={getQuarterData(4).forecastCost} actual={getQuarterData(4).cost} bgColor="green" />
									<SummaryDataCell type="cost" planned={getHalfData(2).plannedCost} expected={getHalfData(2).forecastCost} actual={getHalfData(2).cost} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(3).plannedProfit} expected={getQuarterData(3).forecastProfit} actual={getQuarterData(3).profit} bgColor="blue-dark" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(4).plannedProfit} expected={getQuarterData(4).forecastProfit} actual={getQuarterData(4).profit} bgColor="green-dark" />
									<SummaryDataCell type="profit" planned={getHalfData(2).plannedProfit} expected={getHalfData(2).forecastProfit} actual={getHalfData(2).profit} bgColor="yellow-dark" />
								</tr>
							</tbody>
						</table>
					{:else}
						<!-- 1~12월 가로 한 줄 -->
						<table class="performance-main-table w-full min-w-6xl border-collapse">
							<thead>
								<tr class="bg-gray-50 border-b border-gray-200">
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">구분</th>
									<PerformanceRowLegendColumn as="th" visible={showPlanActualLegendColumns} />
									<MonthHeaderCell month={1} yoySalesCompare={getMonthSalesYoY(1)} compareYear={selectedYear} />
									<MonthHeaderCell month={2} yoySalesCompare={getMonthSalesYoY(2)} compareYear={selectedYear} />
									<MonthHeaderCell month={3} yoySalesCompare={getMonthSalesYoY(3)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200">1분기 합계</th>
									<MonthHeaderCell month={4} yoySalesCompare={getMonthSalesYoY(4)} compareYear={selectedYear} />
									<MonthHeaderCell month={5} yoySalesCompare={getMonthSalesYoY(5)} compareYear={selectedYear} />
									<MonthHeaderCell month={6} yoySalesCompare={getMonthSalesYoY(6)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200">2분기 합계</th>
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200">상반기 합계</th>
									<PerformanceRowLegendColumn as="th" visible={showPlanActualLegendColumns} />
									<MonthHeaderCell month={7} yoySalesCompare={getMonthSalesYoY(7)} compareYear={selectedYear} />
									<MonthHeaderCell month={8} yoySalesCompare={getMonthSalesYoY(8)} compareYear={selectedYear} />
									<MonthHeaderCell month={9} yoySalesCompare={getMonthSalesYoY(9)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-200">3분기 합계</th>
									<MonthHeaderCell month={10} yoySalesCompare={getMonthSalesYoY(10)} compareYear={selectedYear} />
									<MonthHeaderCell month={11} yoySalesCompare={getMonthSalesYoY(11)} compareYear={selectedYear} />
									<MonthHeaderCell month={12} yoySalesCompare={getMonthSalesYoY(12)} compareYear={selectedYear} />
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-green-50 border-r border-gray-200">4분기 합계</th>
									<th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-yellow-50 border-r border-gray-200">하반기 합계</th>
								</tr>
							</thead>
							<tbody>
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">매출</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(1).plannedSales} expected={getQuarterData(1).forecastSales} actual={getQuarterData(1).sales} bgColor="blue" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(2).plannedSales} expected={getQuarterData(2).forecastSales} actual={getQuarterData(2).sales} bgColor="green" />
									<SummaryDataCell type="sales" planned={getHalfData(1).plannedSales} expected={getHalfData(1).forecastSales} actual={getHalfData(1).sales} bgColor="yellow" />
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(3).plannedSales} expected={getQuarterData(3).forecastSales} actual={getQuarterData(3).sales} bgColor="blue" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="sales" planned={monthData.plannedSales} expected={monthData.forecastSales} actual={monthData.sales} yoySalesBeatPrev={isSalesBeatPriorYear(month)} />
									{/each}
									<SummaryDataCell type="sales" planned={getQuarterData(4).plannedSales} expected={getQuarterData(4).forecastSales} actual={getQuarterData(4).sales} bgColor="green" />
									<SummaryDataCell type="sales" planned={getHalfData(2).plannedSales} expected={getHalfData(2).forecastSales} actual={getHalfData(2).sales} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">원가</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(1).plannedCost} expected={getQuarterData(1).forecastCost} actual={getQuarterData(1).cost} bgColor="blue" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(2).plannedCost} expected={getQuarterData(2).forecastCost} actual={getQuarterData(2).cost} bgColor="green" />
									<SummaryDataCell type="cost" planned={getHalfData(1).plannedCost} expected={getHalfData(1).forecastCost} actual={getHalfData(1).cost} bgColor="yellow" />
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(3).plannedCost} expected={getQuarterData(3).forecastCost} actual={getQuarterData(3).cost} bgColor="blue" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="cost" planned={monthData.plannedCost} expected={monthData.forecastCost} actual={monthData.cost} />
									{/each}
									<SummaryDataCell type="cost" planned={getQuarterData(4).plannedCost} expected={getQuarterData(4).forecastCost} actual={getQuarterData(4).cost} bgColor="green" />
									<SummaryDataCell type="cost" planned={getHalfData(2).plannedCost} expected={getHalfData(2).forecastCost} actual={getHalfData(2).cost} bgColor="yellow" />
								</tr>
								<tr class="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
									<td class="text-center px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">이익</td>
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [1, 2, 3] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(1).plannedProfit} expected={getQuarterData(1).forecastProfit} actual={getQuarterData(1).profit} bgColor="blue-dark" />
									{#each [4, 5, 6] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(2).plannedProfit} expected={getQuarterData(2).forecastProfit} actual={getQuarterData(2).profit} bgColor="green-dark" />
									<SummaryDataCell type="profit" planned={getHalfData(1).plannedProfit} expected={getHalfData(1).forecastProfit} actual={getHalfData(1).profit} bgColor="yellow-dark" />
									<PerformanceRowLegendColumn visible={showPlanActualLegendColumns} />
									{#each [7, 8, 9] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(3).plannedProfit} expected={getQuarterData(3).forecastProfit} actual={getQuarterData(3).profit} bgColor="blue-dark" />
									{#each [10, 11, 12] as month (month)}
										{@const monthData = getMonthData(month)}
										<MonthDataCell type="profit" planned={monthData.plannedSales - monthData.plannedCost} expected={monthData.forecastSales - monthData.forecastCost} actual={monthData.profit} />
									{/each}
									<SummaryDataCell type="profit" planned={getQuarterData(4).plannedProfit} expected={getQuarterData(4).forecastProfit} actual={getQuarterData(4).profit} bgColor="green-dark" />
									<SummaryDataCell type="profit" planned={getHalfData(2).plannedProfit} expected={getHalfData(2).forecastProfit} actual={getHalfData(2).profit} bgColor="yellow-dark" />
								</tr>
							</tbody>
						</table>
					{/if}

					<!-- 연간 합계: 왼쪽 표(구분·연간 누계) + 오른쪽 차트(헤더~본문 전체 높이에 맞춤) -->
					<div class="mt-4 space-y-2">
						<div class="flex items-center justify-items-start gap-10">
							<label class="flex flex-wrap items-center gap-2 text-sm text-gray-700">
								<span class="shrink-0 font-medium">연간누계 차트 높이</span>
								<input
									type="range"
									class="h-2 w-full max-w-xs cursor-pointer accent-blue-600"
									min="12"
									max="50"
									step="1"
									bind:value={yearTotalChartsMinHeightRem}
									aria-label="연간 합계 차트 영역 최소 높이 rem"
								/>
							</label>
						</div>
						<div
							class="year-total-summary-wrap flex w-full min-w-0 max-w-full flex-col items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white md:flex-row"
						>
							<div
								class="year-total-left-col shrink-0 overflow-x-auto border-b border-gray-200 md:border-b-0 md:border-r"
								style="width: {yearTotalDataTableWidthPct}%; min-width: 14rem;"
							>
								<table
									class="year-total-summary-table w-full min-w-0 table-fixed border-collapse text-sm font-semibold"
								>
									<colgroup>
										<col style="width: {YEAR_TOTAL_CATEGORY_COL_PCT}%;" />
										<col style="width: {yearTotalItemColWidthPct}%;" />
										<col style="width: {yearTotalAmountColWidthPct}%;" />
									</colgroup>
									<thead>
										<tr class="bg-gray-100 border-b border-gray-200">
											<th class="px-4 py-3 text-center text-gray-700 border-r border-gray-200" rowspan="2"
												>구분</th
											>
											<th class="px-2 py-3 text-center text-gray-700 border-r border-gray-200" colspan="2"
												>연간 누계</th
											>
										</tr>
										<tr class="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
											<th class="px-2 py-2 text-center border-r border-gray-200">항목</th>
											<th class="px-2 py-2 text-center border-r border-gray-200">금액</th>
										</tr>
									</thead>
									<tbody>
									{#each PLAN_FORECAST_ACTUAL_ROW_DEFS as def, idx (def.fullLabel)}
										{@const amounts = [yearTotal.plannedSales, yearTotal.forecastSales, yearTotal.sales]}
										{@const val = amounts[idx]}
										{@const valClass = idx === 0 ? 'text-gray-700' : idx === 1 ? 'text-blue-700' : 'text-gray-700'}
										<tr class="border-b border-gray-200">
											{#if idx === 0}
												<td
													class="px-2 py-1.5 text-center text-gray-700 border-r border-gray-200 align-top"
													rowspan="3">매출</td
												>
											{/if}
											<td
												class="px-2 py-1.5 text-center font-medium border-r border-gray-200 align-top {def.labelClass}"
												title={def.fullLabel}>{def.shortLabel}</td
											>
											<td class="px-2 py-1.5 text-right border-r border-gray-200 align-top">
												<span
													class="relative inline-block cursor-default amount-tooltip-trigger {valClass}"
													aria-label={toKoreanAmount(val)}
													>{formatCurrency(val)}<span class="amount-tooltip" role="tooltip"
														>{toKoreanAmount(val)}</span
													></span
												>
											</td>
										</tr>
									{/each}
									{#each PLAN_FORECAST_ACTUAL_ROW_DEFS as def, idx (def.fullLabel)}
										{@const amounts = [yearTotal.plannedCost, yearTotal.forecastCost, yearTotal.cost]}
										{@const val = amounts[idx]}
										{@const valClass = idx === 0 ? 'text-gray-700' : idx === 1 ? 'text-blue-700' : 'text-gray-700'}
										<tr class="border-b border-gray-200">
											{#if idx === 0}
												<td
													class="px-2 py-1.5 text-center text-gray-700 border-r border-gray-200 align-top"
													rowspan="3">원가</td
												>
											{/if}
											<td
												class="px-2 py-1.5 text-center font-medium border-r border-gray-200 align-top {def.labelClass}"
												title={def.fullLabel}>{def.shortLabel}</td
											>
											<td class="px-2 py-1.5 text-right border-r border-gray-200 align-top">
												<span
													class="relative inline-block cursor-default amount-tooltip-trigger {valClass}"
													aria-label={toKoreanAmount(val)}
													>{formatCurrency(val)}<span class="amount-tooltip" role="tooltip"
														>{toKoreanAmount(val)}</span
													></span
												>
											</td>
										</tr>
									{/each}
									{#each PLAN_FORECAST_ACTUAL_ROW_DEFS as def, idx (def.fullLabel)}
										{@const amounts = [yearTotal.plannedProfit, yearTotal.forecastProfit, yearTotal.profit]}
										{@const val = amounts[idx]}
										{@const valClass =
											idx === 2
												? yearTotal.profit >= 0
													? 'text-green-600'
													: 'text-red-600'
												: idx === 0
													? 'text-gray-700'
													: 'text-blue-700'}
										<tr class="border-b border-gray-200 bg-blue-50">
											{#if idx === 0}
												<td
													class="px-2 py-1.5 text-center text-gray-700 border-r border-gray-200 align-top"
													rowspan="3">이익</td
												>
											{/if}
											<td
												class="px-2 py-1.5 text-center font-medium border-r border-gray-200 align-top {idx === 2
													? valClass
													: def.labelClass}"
												title={def.fullLabel}>{def.shortLabel}</td
											>
											<td class="px-2 py-1.5 text-right border-r border-gray-200 align-top">
												<span
													class="relative inline-block cursor-default amount-tooltip-trigger font-medium {valClass}"
													aria-label={toKoreanAmount(val)}
													>{formatCurrency(val)}<span class="amount-tooltip" role="tooltip"
														>{toKoreanAmount(val)}</span
													></span
												>
											</td>
										</tr>
									{/each}
									</tbody>
								</table>
							</div>
							<div
								class="year-total-charts flex min-h-0 min-w-0 w-full flex-1 flex-col self-stretch bg-gray-50 p-2 sm:p-3"
								style="min-height: {yearTotalChartsMinHeightRem}rem;"
							>
								<div class="year-total-charts-inner flex min-h-0 flex-1 flex-col gap-3 sm:flex-row">
									<div class="year-total-chart-slot min-h-48 min-w-0 flex-1 sm:min-h-0">
										<canvas bind:this={salesProfitChartCanvas} class="year-total-chart-canvas"></canvas>
									</div>
									<div class="year-total-chart-slot min-h-48 min-w-0 flex-1 sm:min-h-0">
										<canvas bind:this={salesCostChartCanvas} class="year-total-chart-canvas"></canvas>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
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
		canEditPlanRevenue={currentUserDepartmentRecord?.can_edit_business_plan ?? false}
		canEditExpectedRevenue={currentUserDepartmentRecord?.can_edit_expected_sales ?? false}
		canEditPlanCost={currentUserDepartmentRecord?.can_edit_plan_cost ?? false}
		canEditExpectedCost={currentUserDepartmentRecord?.can_edit_expected_cost ?? false}
		onClose={closeInputModal}
		onSave={savePerformanceData}
		{formatNumberWithComma}
		{parseNumberFromComma}
	/>
{/if}

<style>
	/* 연간 합계: 표(헤더+본문) 높이에 맞춰 차트 열이 세로로 꽉 참 */
	.year-total-summary-wrap {
		align-items: stretch;
	}
	/* 모바일: 인라인 width(%)를 덮어 표·차트를 세로 풀폭으로 */
	@media (max-width: 767px) {
		.year-total-left-col {
			width: 100% !important;
			min-width: 0 !important;
		}
	}
	/* .year-total-charts min-height:0 제거 — Tailwind min-h-* 및 인라인 min-height가 먹도록 함(내부 flex는 min-h-0 유지) */
	.year-total-chart-slot {
		position: relative;
		min-height: 0;
	}
	.year-total-chart-canvas {
		position: absolute;
		inset: 0;
		width: 100% !important;
		height: 100% !important;
		max-width: 100%;
		max-height: 100%;
	}
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
