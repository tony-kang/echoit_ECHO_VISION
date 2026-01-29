<script>
	import YearMonthDataPage from '$lib/components/YearMonthDataPage.svelte';
	import { getSales } from '$lib/salesService';

	/**
	 * 매출 데이터 로드 함수
	 * @param {number} year - 연도
	 * @param {string[]} [evCodeItems] - ev_code의 items 배열 (평탄화된 중복 제거된 배열)
	 * @returns {Promise<{ data: any[] | null, error: any }>}
	 */
	async function loadSalesData(year, evCodeItems) {
		return await getSales({
			year,
			evCodeItems,
			orderByYear: true,
			orderByMonth: true
		});
	}

	/**
	 * 매출 데이터를 ev_code별로 그룹화하고 월별 데이터를 구성
	 * ev_code를 행으로, 1~12월을 열로 표시하기 위한 데이터 구조 생성
	 * ev_code의 item_code와 rawData의 org_code가 일치하는 항목만 사용
	 * @param {Array<any>} rawData - 원본 데이터
	 * @param {Array<any>} evCodes - ev_code 목록
	 * @param {Record<string, any>} filters - 필터 객체
	 * @returns {Array<any>} ev_code별로 그룹화된 데이터 (각 항목에 1~12월 데이터 포함)
	 */
	function organizeSalesDataByOrgCode(rawData, evCodes, filters) {
		if (!rawData || rawData.length === 0) {
			return [];
		}

		// ev_code별로 데이터 구성
		/** @type {Map<string, any>} */
		const evCodeDataMap = new Map();

		// 각 ev_code에 대해 초기화
		// evCodes는 ev_code 테이블에서 조회한 데이터
		for (const evCode of evCodes) {
			if (!evCode.item_code) continue;

			evCodeDataMap.set(evCode.item_code, {
				evCode: evCode,
				year: filters.year ? parseInt(filters.year) : null,
				monthData: {}, // 1~12월 데이터
				monthDataDetail: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] } // 1~12월 데이터 상세
			});
		}

		// rawData를 순회하면서 각 항목의 excel_file_data에서 ev_code.item_code를 키로 사용하여 금액 찾기
		// rawData는 ev_sales 테이블에서 조회한 데이터 = 여러개의 엑셀로 입력한 매출 데이터
		// rawData의 org_code는 "SUM_000" 등이고, excel_file_data에는 "SALES_1400", "SALES_1300" 등의 키로 금액이 저장됨
		for (const item of rawData) {
			const orgCode = item.org_code;
			const year = item.year;
			const month = item.month;

			if (!orgCode || !year || !month || month < 1 || month > 12) {
				continue; // 필수 값이 없으면 제외
			}

			// excel_file_data가 없으면 제외
			if (!item.excel_file_data || typeof item.excel_file_data !== 'object') {
				continue;
			}

			// evCodeDataMap의 각 ev_code에 대해 처리
			for (const [evCodeItemCode, evCodeItem] of evCodeDataMap.entries()) {
				// ev_code.item_code를 excel_file_data의 키로 사용하여 금액 찾기
				const value = item.excel_file_data[evCodeItemCode];
				if (value === null || value === undefined) {
					continue; // 해당 키의 값이 없으면 제외
				}

				const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
				if (isNaN(numValue)) {
					continue; // 숫자가 아니면 제외
				}

				// 해당 월의 데이터에 합산 (같은 월에 여러 데이터가 있을 수 있으므로 합산)
				if (evCodeItem.monthData[month] === undefined) {
					evCodeItem.monthData[month] = 0;
				}
				//console.log(`evCodeItem.monthData[${month}]: ${numValue}`);
				evCodeItem.monthData[month] += numValue; // 합산
				evCodeItem.monthDataDetail[month].push({year: year, month: month, value: numValue});
			}
		}

		// 배열로 변환하여 반환
		return Array.from(evCodeDataMap.values());
	}
</script>

<YearMonthDataPage
	title="매출 정보"
	category="sales"
	loadData={loadSalesData}
	organizeData={organizeSalesDataByOrgCode}
	emptyMessage="매출 데이터가 없습니다."
	tableName="ev_sales"
/>
