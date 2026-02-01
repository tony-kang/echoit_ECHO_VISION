import { supabase } from './supabaseClient';

/**
 * 원가 데이터 타입 정의
 * @typedef {Object} CostData
 * @property {string} id - 고유 ID
 * @property {string} org_code - 조직 코드 (env_code 참조)
 * @property {number} year - 연도
 * @property {number|null} month - 월 (1~12, null이면 연간 합계)
 * @property {string|null} excel_file_id - 엑셀 파일 ID (ev_excel_file 참조)
 * @property {Object} excel_file_data - 엑셀 파일 데이터 (JSONB, org_code별 엑셀 컬럼 데이터)
 * @property {string|null} notes - 메모/비고
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 */

/**
 * 원가 데이터 조회 옵션
 * @typedef {Object} GetCostOptions
 * @property {string[]} [codes] - 조회할 코드 배열 (없으면 전체)
 * @property {string[]} [evCodeItems] - ev_code의 items 배열 (평탄화된 중복 제거된 배열)
 * @property {number} [year] - 연도 필터
 * @property {number} [month] - 월 필터
 * @property {boolean} [orderByYear] - 연도순 정렬 (기본값: true)
 * @property {boolean} [orderByMonth] - 월순 정렬 (기본값: true)
 */

/**
 * 원가 데이터 조회
 * @param {GetCostOptions} [options] - 조회 옵션
 * @returns {Promise<{data: Array<CostData>|null, error: Error|null}>}
 */
export async function getCosts(options = {}) {
	try {
		const { year, month, evCodeItems, orderByYear = true, orderByMonth = true } = options;

		let query = supabase
			.from('ev_cost')
			.select('*');

		// 코드 필터링
		// if (codes && codes.length > 0) {
		// 	query = query.in('org_code', codes);
		// }

		// 연도 필터링
		if (year !== undefined && year !== null) {
			query = query.eq('year', year);
		}

		// 월 필터링
		if (month !== undefined && month !== null) {
			query = query.eq('month', month);
		}

		// evCodeItems 필터링 (배열인 경우에만)
		if (evCodeItems && Array.isArray(evCodeItems) && evCodeItems.length > 0) {
			// console.log('evCodeItems 필터링:', evCodeItems);
			query = query.in('org_code', evCodeItems);
		}

		// 정렬
		if (orderByYear) {
			query = query.order('year', { ascending: false });
		}
		if (orderByMonth) {
			query = query.order('month', { ascending: true, nullsFirst: false });
		}
		query = query.order('org_code', { ascending: true });

		const { data, error } = await query;

		if (error) {
			console.error('원가 데이터 조회 실패:', error);
			return { data: [], error };
		}

		console.log('원가 데이터(원본):', evCodeItems, data);

		return { data: data || [], error: null };
	} catch (error) {
		console.error('원가 데이터 조회 실패:', error);
		return { data: [], error: error instanceof Error ? error : new Error(String(error)) };
	}
}
