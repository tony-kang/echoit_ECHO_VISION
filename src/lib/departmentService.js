/**
 * 부서(ev_department) 및 부서 담당자(ev_department_user) 서비스
 */
import { supabase } from './supabaseClient';

/**
 * 부서 목록 조회
 * @returns {Promise<{ data: Array<{ id: string, code: string, title: string, param: string[] | null, created_at: string, updated_at: string }> | null, error: Error | null }>}
 */
export async function getDepartments() {
	const { data, error } = await supabase
		.from('ev_department')
		.select('id, code, title, param, prov_sales_target, display_order,created_at, updated_at')
		.order('display_order', { ascending: true });
	if (error) return { data: null, error };
	return { data: data || [], error: null };
}

/**
 * 부서 목록 조회 (담당자 정보 조인). FK 없으면 담당자 없이 부서만 반환하거나 폴백으로 개별 조회
 * ev_department ← ev_department_user ← user_profiles FK 권장
 * @returns {Promise<{ data: Array<{ id: string, code: string, title: string, param: string[] | null, ev_department_user?: Array<{ id: string, user_id: string, can_edit_business_plan: boolean, can_edit_expected_sales: boolean, user_profiles?: { email: string | null, full_name: string | null } }> }> | null, error: Error | null }>}
 */
export async function getDepartmentsWithUsers() {
	const { data: joinData, error: joinError } = await supabase
		.from('ev_department')
		.select(`
			id,
			code,
			title,
			param,
			prov_sales_target,
			ev_department_user (
				id,
				user_id,
				can_edit_business_plan,
				can_edit_expected_sales,
				can_edit_plan_cost,
				can_edit_expected_cost,
				user_profiles (
					email,
					full_name
				)
			)
		`)
		.order('display_order', { ascending: true });
	if (!joinError && joinData) {
		return { data: joinData, error: null };
	}
	// FK 미설정 등으로 조인 실패 시: 부서 목록 + 부서별 담당자 개별 조회
	const { data: deptData, error: deptError } = await getDepartments();
	if (deptError || !deptData?.length) return { data: deptData ?? [], error: deptError ?? null };
	const results = await Promise.all(
		deptData.map(async (d) => {
			const { data: users } = await getDepartmentUsers(d.id);
			return {
				...d,
				ev_department_user: users?.map((u) => ({
					id: u.id,
					user_id: u.user_id,
					can_edit_business_plan: u.can_edit_business_plan,
					can_edit_expected_sales: u.can_edit_expected_sales,
					can_edit_plan_cost: u.can_edit_plan_cost,
					can_edit_expected_cost: u.can_edit_expected_cost,
					user_profiles: { email: u.email ?? null, full_name: u.full_name ?? null }
				})) ?? []
			};
		})
	);
	return { data: results, error: null };
}

/**
 * 부서 한 건 조회
 * @param {string} id - 부서 id
 * @returns {Promise<{ data: object | null, error: Error | null }>}
 */
export async function getDepartment(id) {
	const { data, error } = await supabase
		.from('ev_department')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	return { data, error: error || null };
}

/**
 * 부서 생성
 * @param {{ code: string, title: string, param?: string[] | null }} payload
 * @returns {Promise<{ data: object | null, error: Error | null }>}
 */
export async function createDepartment(payload) {
	const { code, title, param } = payload;
	const insert = { code, title, param: Array.isArray(param) && param.length ? param : [] };
	const { data, error } = await supabase.from('ev_department').insert(insert).select().single();
	return { data, error: error || null };
}

/**
 * 부서 수정
 * @param {string} id - 부서 id
 * @param {{ title?: string, param?: string[] | null, prov_sales_target?: boolean, display_order?: number }} payload
 * @returns {Promise<{ data: object | null, error: Error | null }>}
 */
export async function updateDepartment(id, payload) {
	const updateFields = {};
	if (payload.title !== undefined) updateFields.title = payload.title;
	if (payload.param !== undefined) updateFields.param = Array.isArray(payload.param) ? payload.param : [];
	if (payload.prov_sales_target !== undefined) updateFields.prov_sales_target = !!payload.prov_sales_target;
	if (payload.display_order !== undefined) updateFields.display_order = Number(payload.display_order);
	if (Object.keys(updateFields).length === 0) return { data: null, error: new Error('수정할 필드가 없습니다.') };
	const { data, error } = await supabase.from('ev_department').update(updateFields).eq('id', id).select().single();
	return { data, error: error || null };
}

/**
 * 부서 삭제
 * @param {string} id - 부서 id
 * @returns {Promise<{ error: Error | null }>}
 */
export async function deleteDepartment(id) {
	const { error } = await supabase.from('ev_department').delete().eq('id', id);
	return { error: error || null };
}

/**
 * 부서별 담당자 목록 조회 (user_profiles와 조인하여 이메일/이름 포함)
 * @param {string} departmentId - 부서 id
 * @returns {Promise<{ data: Array<{ id: string, department_id: string, user_id: string, can_edit_business_plan: boolean, can_edit_expected_sales: boolean, can_edit_plan_cost: boolean, can_edit_expected_cost: boolean, email?: string, full_name?: string }>, error: Error | null }>}
 */
export async function getDepartmentUsers(departmentId) {
	const { data: rows, error } = await supabase
		.from('ev_department_user')
		.select('id, department_id, user_id, can_edit_business_plan, can_edit_expected_sales, can_edit_plan_cost, can_edit_expected_cost, created_at, updated_at')
		.eq('department_id', departmentId)
		.order('created_at', { ascending: true });
	if (error) return { data: [], error };

	const userIds = [...new Set((rows || []).map((r) => r.user_id))];
	if (userIds.length === 0) return { data: rows || [], error: null };

	const { data: profiles } = await supabase
		.from('user_profiles')
		.select('id, email, full_name')
		.in('id', userIds);
	const profileMap = {};
	for (const p of profiles || []) {
		profileMap[p.id] = p;
	}
	const data = (rows || []).map((r) => ({
		...r,
		email: profileMap[r.user_id]?.email ?? null,
		full_name: profileMap[r.user_id]?.full_name ?? null
	}));
	return { data, error: null };
}

/**
 * 부서 담당자 추가
 * @param {{ department_id: string, user_id: string, can_edit_business_plan?: boolean, can_edit_expected_sales?: boolean, can_edit_plan_cost?: boolean, can_edit_expected_cost?: boolean }} payload
 * @returns {Promise<{ data: object | null, error: Error | null }>}
 */
export async function addDepartmentUser(payload) {
	const {
		department_id,
		user_id,
		can_edit_business_plan = false,
		can_edit_expected_sales = false,
		can_edit_plan_cost = false,
		can_edit_expected_cost = false
	} = payload;
	const insert = {
		department_id,
		user_id,
		can_edit_business_plan: !!can_edit_business_plan,
		can_edit_expected_sales: !!can_edit_expected_sales,
		can_edit_plan_cost: !!can_edit_plan_cost,
		can_edit_expected_cost: !!can_edit_expected_cost
	};
	const { data, error } = await supabase.from('ev_department_user').insert(insert).select().single();
	return { data, error: error || null };
}

/**
 * 부서 담당자 권한 수정
 * @param {string} id - ev_department_user id
 * @param {{ can_edit_business_plan?: boolean, can_edit_expected_sales?: boolean, can_edit_plan_cost?: boolean, can_edit_expected_cost?: boolean }} payload
 * @returns {Promise<{ data: object | null, error: Error | null }>}
 */
export async function updateDepartmentUser(id, payload) {
	const updateFields = {};
	if (payload.can_edit_business_plan !== undefined) updateFields.can_edit_business_plan = payload.can_edit_business_plan;
	if (payload.can_edit_expected_sales !== undefined) updateFields.can_edit_expected_sales = payload.can_edit_expected_sales;
	if (payload.can_edit_plan_cost !== undefined) updateFields.can_edit_plan_cost = payload.can_edit_plan_cost;
	if (payload.can_edit_expected_cost !== undefined) updateFields.can_edit_expected_cost = payload.can_edit_expected_cost;
	if (Object.keys(updateFields).length === 0) return { data: null, error: new Error('수정할 필드가 없습니다.') };
	const { data, error } = await supabase.from('ev_department_user').update(updateFields).eq('id', id).select().single();
	return { data, error: error || null };
}

/**
 * 부서 담당자 제거
 * @param {string} id - ev_department_user id
 * @returns {Promise<{ error: Error | null }>}
 */
export async function removeDepartmentUser(id) {
	const { error } = await supabase.from('ev_department_user').delete().eq('id', id);
	return { error: error || null };
}

/**
 * 부서의 모든 담당자 일괄 삭제 (저장 시 전체 교체용)
 * @param {string} departmentId - 부서 id
 * @returns {Promise<{ error: Error | null }>}
 */
export async function deleteDepartmentUsersByDepartmentId(departmentId) {
	const { error } = await supabase.from('ev_department_user').delete().eq('department_id', departmentId);
	return { error: error || null };
}
