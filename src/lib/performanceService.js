import { supabase } from './supabaseClient';

/**
 * 경영실적 데이터 타입 정의
 * @typedef {Object} PerformanceData
 * @property {string} id - 고유 ID
 * @property {number} year - 연도
 * @property {number} month - 월 (1~12)
 * @property {string} org_alias_id - 조직 별칭 ID
 * @property {number} p_revenue - 계획 매출 (planned_revenue)
 * @property {number} f_revenue - 예상 매출 (forecast_revenue)
 * @property {number} a_revenue - 실제 매출 (actual_revenue)
 * @property {number} p_expenses - 계획 비용 (planned_expenses)
 * @property {number} f_expenses - 예상 비용 (forecast_expenses)
 * @property {number} a_expenses - 실제 비용 (actual_expenses)
 * @property {string} notes - 메모/비고
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 */

/**
 * 경영실적 데이터 조회 옵션
 * @typedef {Object} GetPerformanceOptions
 * @property {number} [year] - 연도 필터
 * @property {number} [month] - 월 필터
 * @property {string} [org_alias_id] - 조직 별칭 ID 필터
 * @property {string[]} [org_alias_ids] - 조직 별칭 ID 배열 필터
 * @property {boolean} [orderByYear] - 연도순 정렬 (기본값: true)
 * @property {boolean} [orderByMonth] - 월순 정렬 (기본값: true)
 */

/**
 * 경영실적 데이터 조회
 * @param {GetPerformanceOptions} [options] - 조회 옵션
 * @returns {Promise<{data: Array<PerformanceData>|null, error: Error|null}>}
 */
export async function getPerformance(options = {}) {
	try {
		const { year, month, org_alias_id, org_alias_ids, orderByYear = true, orderByMonth = true } = options;

		let query = supabase
			.from('el_performance')
			.select('*');

		// 연도 필터링
		if (year !== undefined && year !== null) {
			query = query.eq('year', year);
		}

		// 월 필터링
		if (month !== undefined && month !== null) {
			query = query.eq('month', month);
		}

		// 조직 별칭 ID 필터링 (단일)
		if (org_alias_id) {
			query = query.eq('org_alias_id', org_alias_id);
		}

		// 조직 별칭 ID 필터링 (배열)
		if (org_alias_ids && Array.isArray(org_alias_ids) && org_alias_ids.length > 0) {
			query = query.in('org_alias_id', org_alias_ids);
		}

		// 정렬
		if (orderByYear) {
			query = query.order('year', { ascending: true });
		}
		if (orderByMonth) {
			query = query.order('month', { ascending: true });
		}

		const { data, error } = await query;

		if (error) {
			console.error('경영실적 데이터 조회 실패:', error);
			return { data: null, error };
		}

		return { data, error: null };
	} catch (error) {
		console.error('경영실적 데이터 조회 중 오류:', error);
		return { data: null, error };
	}
}

/**
 * 경영실적 데이터 생성 또는 업데이트
 * @param {Partial<PerformanceData>} performanceData - 경영실적 데이터
 * @returns {Promise<{data: PerformanceData|null, error: Error|null}>}
 */
export async function upsertPerformance(performanceData) {
	try {
		const { data, error } = await supabase
			.from('el_performance')
			.upsert(performanceData, {
				onConflict: 'year,month,org_alias_id'
			})
			.select()
			.single();

		if (error) {
			console.error('경영실적 데이터 저장 실패:', error);
			return { data: null, error };
		}

		return { data, error: null };
	} catch (error) {
		console.error('경영실적 데이터 저장 중 오류:', error);
		return { data: null, error };
	}
}

/**
 * 여러 월의 경영실적 데이터 일괄 저장
 * @param {Array<Partial<PerformanceData>>} performanceDataList - 경영실적 데이터 배열
 * @returns {Promise<{data: Array<PerformanceData>|null, error: Error|null}>}
 */
export async function upsertPerformanceBulk(performanceDataList) {
	try {
		const { data, error } = await supabase
			.from('el_performance')
			.upsert(performanceDataList, {
				onConflict: 'year,month,org_alias_id'
			})
			.select();

		if (error) {
			console.error('경영실적 데이터 일괄 저장 실패:', error);
			return { data: null, error };
		}

		return { data, error: null };
	} catch (error) {
		console.error('경영실적 데이터 일괄 저장 중 오류:', error);
		return { data: null, error };
	}
}

/**
 * 경영실적 데이터 삭제
 * @param {string} id - 경영실적 데이터 ID
 * @returns {Promise<{error: Error|null}>}
 */
export async function deletePerformance(id) {
	try {
		const { error } = await supabase
			.from('el_performance')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('경영실적 데이터 삭제 실패:', error);
			return { error };
		}

		return { error: null };
	} catch (error) {
		console.error('경영실적 데이터 삭제 중 오류:', error);
		return { error };
	}
}
