/**
 * 가결산 실적(ev_provisional_sales) 서비스
 * 회사코드 + 부서(ev_department.id) + 년도 + 월 별 항목 입력/수정
 */
import { supabase } from './supabaseClient';

/** 항목 키(DB 컬럼명) ↔ 라벨 */
export const PROV_SALES_ITEMS = [
	{ key: 'sales_amount', label: '매출액' },
	{ key: 'cost_of_sales', label: '매출원가' },
	{ key: 'gross_loss_sales', label: '매출총손실' },
	{ key: 'selling_admin_expenses', label: '판매관리비' },
	{ key: 'operating_loss', label: '영업손실' },
	{ key: 'non_operating_income', label: '영업외 수익' },
	{ key: 'non_operating_expenses', label: '영업외 비용' },
	{ key: 'net_loss_before_tax', label: '법인세비용 차감전 순손실' },
	{ key: 'income_tax_expense', label: '법인세 비용' },
	{ key: 'net_loss_period', label: '당기 순 손실' },
	{ key: 'gross_profit', label: '매출 총 이익' },
	{ key: 'operating_profit', label: '영업 이익' },
	{ key: 'net_profit_before_tax', label: '법인세비용 차감전 순이익' },
	{ key: 'net_profit_period', label: '당기 순 이익' }
];

const ITEM_KEYS = PROV_SALES_ITEMS.map((i) => i.key);

/**
 * 회사코드·연도별 가결산 데이터 조회
 * @param {string} companyCode - 회사코드
 * @param {number} year - 연도
 * @returns {Promise<{ data: Array<any>, error: Error | null }>}
 */
export async function getProvisionalSalesByCompanyYear(companyCode, year) {
	if (!companyCode || !year) {
		return { data: [], error: null };
	}
	const { data, error } = await supabase
		.from('ev_provisional_sales')
		.select('*')
		.eq('company_code', companyCode)
		.eq('year', year)
		.order('department_id', { ascending: true })
		.order('month', { ascending: true });

	if (error) {
		console.error('가결산 실적 조회 실패:', error);
		return { data: [], error };
	}
	return { data: data || [], error: null };
}

/**
 * 1건 upsert (company_code, department_id, year, month 기준)
 * @param {{
 *   company_code: string,
 *   department_id: string,
 *   year: number,
 *   month: number,
 *   [key: string]: any
 * }} row - 저장할 행 (항목 키별 금액 포함)
 * @returns {Promise<{ data: any | null, error: Error | null }>}
 */
export async function upsertProvisionalSales(row) {
	const { company_code, department_id, year, month } = row;
	const payload = {
		company_code,
		department_id,
		year,
		month
	};
	ITEM_KEYS.forEach((k) => {
		const v = row[k];
		payload[k] = v === '' || v === null || v === undefined ? 0 : Number(v);
	});

	const { data, error } = await supabase
		.from('ev_provisional_sales')
		.upsert(payload, {
			onConflict: 'company_code,department_id,year,month',
			ignoreDuplicates: false
		})
		.select()
		.single();

	if (error) {
		console.error('가결산 실적 저장 실패:', error);
		return { data: null, error };
	}
	return { data, error: null };
}
