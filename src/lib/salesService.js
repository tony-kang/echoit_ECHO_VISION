import { supabase } from './supabaseClient';

/**
 * 매출 데이터 타입 정의
 * @typedef {Object} SalesData
 * @property {string} id - 고유 ID
 * @property {string} code - 환경설정 코드
 * @property {number} year - 연도
 * @property {number|null} month - 월 (1~12, null이면 연간 합계)
 * @property {number} target_sales_amount - 목표 매출액
 * @property {number} sales_amount - 매출액
 * @property {number} sales_cost - 매출 원가
 * @property {number} sales_gross_loss - 매출 총손실
 * @property {number} selling_admin_expenses - 판매 관리비
 * @property {number} operating_loss - 영업 손실
 * @property {number} non_operating_income - 영업외 수익
 * @property {number} non_operating_expenses - 영업외 비용
 * @property {number} loss_before_tax - 법인세 비용 차감전 순손실
 * @property {number} corporate_tax_expenses - 법인세 비용
 * @property {number} net_loss - 당기 순손실
 * @property {string|null} notes - 메모/비고
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 */

/**
 * 매출 데이터 조회 옵션
 * @typedef {Object} GetSalesOptions
 * @property {string[]} [codes] - 조회할 코드 배열 (없으면 전체)
 * @property {number} [year] - 연도 필터
 * @property {number} [month] - 월 필터
 * @property {boolean} [orderByYear] - 연도순 정렬 (기본값: true)
 * @property {boolean} [orderByMonth] - 월순 정렬 (기본값: true)
 */

/**
 * 매출 데이터 조회
 * @param {GetSalesOptions} [options] - 조회 옵션
 * @returns {Promise<{data: Array<SalesData>|null, error: Error|null}>}
 */
export async function getSales(options = {}) {
	try {
		const { codes, year, month, orderByYear = true, orderByMonth = true } = options;

		let query = supabase
			.from('ev_sales')
			.select('*');

		// 코드 필터링
		if (codes && codes.length > 0) {
			query = query.in('code', codes);
		}

		// 연도 필터링
		if (year !== undefined && year !== null) {
			query = query.eq('year', year);
		}

		// 월 필터링
		if (month !== undefined && month !== null) {
			query = query.eq('month', month);
		}

		// 정렬
		if (orderByYear) {
			query = query.order('year', { ascending: false });
		}
		if (orderByMonth) {
			query = query.order('month', { ascending: true, nullsFirst: false });
		}
		query = query.order('code', { ascending: true });

		const { data, error } = await query;

		if (error) {
			console.error('매출 데이터 조회 실패:', error);
			return { data: [], error };
		}

		return { data: data || [], error: null };
	} catch (error) {
		console.error('매출 데이터 조회 실패:', error);
		return { data: [], error: error instanceof Error ? error : new Error(String(error)) };
	}
}

/**
 * 특정 코드의 하위 코드 목록 가져오기 (재귀적으로)
 * @param {string} parentCode - 부모 코드
 * @param {Array<any>} allSettings - 전체 설정 목록
 * @returns {string[]} 하위 코드 배열 (자기 자신 포함)
 */
export function getChildCodes(parentCode, allSettings) {
	/** @type {string[]} */
	const result = [parentCode];
	
	/**
	 * 재귀적으로 하위 코드 수집
	 * @param {string} code - 현재 코드
	 */
	function collectChildren(code) {
		const children = allSettings.filter((/** @type {any} */ s) => s.parent_code === code);
		for (const child of children) {
			result.push(child.code);
			collectChildren(child.code);
		}
	}
	
	collectChildren(parentCode);
	return result;
}
