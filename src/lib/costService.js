import { supabase } from './supabaseClient';

/**
 * 원가 데이터 타입 정의
 * @typedef {Object} CostData
 * @property {string} id - 고유 ID
 * @property {string} code - 환경설정 코드
 * @property {number} year - 연도
 * @property {number|null} month - 월 (1~12, null이면 연간 합계)
 * @property {number} target_cost - 목표 원가
 * @property {number} material_cost - 원재료비
 * @property {number} labor_cost - 노무비
 * @property {number} subcontract_cost - 외주비
 * @property {number} expenses - 경비
 * @property {number} total_construction_cost - 당기 총공사 비용
 * @property {number} construction_loss_provision_transfer - 공사손실 충당금 전입
 * @property {number} construction_loss_provision_reversal - 공사손실 충당금 환입
 * @property {number} opening_unfinished_construction - 기초 미완성 공사액
 * @property {number} transfer_from_other_accounts - 타계정에서 대체액
 * @property {number} total_amount - 합계
 * @property {number} closing_unfinished_construction - 기말 미완성 공사액
 * @property {number} transfer_to_other_accounts - 타계정으로 대체액
 * @property {number} current_period_construction_cost - 당기 공사 원가
 * @property {string|null} notes - 메모/비고
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 */

/**
 * 원가 데이터 조회 옵션
 * @typedef {Object} GetCostOptions
 * @property {string[]} [codes] - 조회할 코드 배열 (없으면 전체)
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
		const { codes, year, month, orderByYear = true, orderByMonth = true } = options;

		let query = supabase
			.from('ev_cost')
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
			console.error('원가 데이터 조회 실패:', error);
			return { data: [], error };
		}

		return { data: data || [], error: null };
	} catch (error) {
		console.error('원가 데이터 조회 실패:', error);
		return { data: [], error: error instanceof Error ? error : new Error(String(error)) };
	}
}
