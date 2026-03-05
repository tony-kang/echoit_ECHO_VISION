<script>
	import { SvelteSet } from 'svelte/reactivity';
	import MainContent from '$lib/C/MainContent.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import DepartmentAddModal from './DepartmentAddModal.svelte';
	import DepartmentEditModal from './DepartmentEditModal.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import {
		getDepartments,
		createDepartment,
		updateDepartment,
		deleteDepartment,
		getDepartmentUsers,
		addDepartmentUser,
		deleteDepartmentUsersByDepartmentId
	} from '$lib/departmentService';
	import { getSettings } from '$lib/settingsService';
	import { getAllUsers } from '$lib/userService';

	/** @type {import('@supabase/supabase-js').User | null} (레이아웃에서 인증 처리) */
	let user = $derived(authStore.user);

	/** @type {Array<{ id: string, code: string, title: string, param?: string[] | null }>} */
	let departments = $state([]);
	/** @type {Array<{ code: string, title: string }>} organization 목록 (수정 팝업용) */
	let organizationList = $state([]);
	/** @type {boolean} 로딩 여부 */
	let isLoading = $state(false);
	/** @type {boolean} 저장 중 여부 */
	let isSaving = $state(false);
	/** @type {boolean} 부서 추가 모달 표시 */
	let showAddModal = $state(false);
	/** @type {boolean} 수정 레이어 팝업 표시 */
	let showEditPopup = $state(false);
	/** @type {{ id: string, code: string, title: string, param?: string[] | null } | null} 수정 중인 부서 */
	let editingDept = $state(null);
	/** @type {string} 추가 시 부서명 입력 */
	let newDeptTitle = $state('');
	/** @type {Set<string>} 수정 팝업에서 선택된 organization 코드 집합 */
	let selectedOrgCodes = $state(new Set());
	/** @type {Array<{ id?: string, user_id: string, can_edit_business_plan: boolean, can_edit_expected_sales: boolean, can_edit_plan_cost: boolean, can_edit_expected_cost: boolean, email?: string | null, full_name?: string | null }>} 수정 팝업 내 담당자 목록 */
	let departmentUsers = $state([]);
	/** @type {Array<{ id: string, email?: string, full_name?: string }>} 담당자 추가용 사용자 목록 */
	let userList = $state([]);
	/** @type {boolean} 초기 데이터 로드 완료 여부 */
	let dataLoaded = $state(false);
	/** @type {Record<string, Array<{ full_name?: string | null, email?: string | null }>>} 부서별 담당자 표시용 (목록) */
	let departmentUsersMap = $state(/** @type {Record<string, Array<{ full_name?: string | null, email?: string | null }>>} */ ({}));

	$effect(() => {
		if (user && !dataLoaded) {
			dataLoaded = true;
			loadDepartments();
			loadOrganizations();
		}
	});

	/**
	 * 부서 목록 로드 (ev_department)
	 * @returns {Promise<void>}
	 */
	async function loadDepartments() {
		isLoading = true;
		try {
			const { data, error } = await getDepartments();
			if (error) {
				console.error('부서 목록 로드 실패:', error);
				departments = [];
			} else {
				const list = data || [];
				departments = list;
				const map = /** @type {Record<string, Array<{ full_name?: string | null, email?: string | null }>>} */ ({});
				if (list.length > 0) {
					const results = await Promise.all(list.map((d) => getDepartmentUsers(d.id)));
					list.forEach((d, i) => {
						map[d.id] = (results[i]?.data || []).map((u) => ({
							full_name: u.full_name ?? null,
							email: u.email ?? null
						}));
					});
				}
				departmentUsersMap = map;
			}
		} catch (e) {
			console.error('부서 목록 로드 예외:', e);
			departments = [];
			departmentUsersMap = {};
		} finally {
			isLoading = false;
		}
	}

	/**
	 * organization 카테고리 목록 로드 (수정 팝업용, env_code)
	 * @returns {Promise<void>}
	 */
	async function loadOrganizations() {
		try {
			const { data, error } = await getSettings({ category: 'organization', orderByOrder: true });
			if (error) {
				console.error('organization 목록 로드 실패:', error);
				organizationList = [];
			} else {
				organizationList = (data || []).map((/** @type {{ code: string, title: string }} */ row) => ({
					code: row.code,
					title: row.title || row.code
				}));
			}
		} catch (e) {
			console.error('organization 목록 로드 예외:', e);
			organizationList = [];
		}
	}

	/**
	 * 다음 부서 코드 자동 생성 (DEPARTMENT_001, DEPARTMENT_002, ...)
	 * @returns {string}
	 */
	function getNextDepartmentCode() {
		const prefix = 'DEPARTMENT_';
		const numbers = departments
			.map((d) => {
				const m = d.code && d.code.startsWith(prefix) ? d.code.slice(prefix.length) : '';
				const n = parseInt(m, 10);
				return Number.isNaN(n) ? 0 : n;
			});
		const max = numbers.length ? Math.max(...numbers) : 0;
		return `${prefix}${String(max + 1).padStart(3, '0')}`;
	}

	/**
	 * 부서 추가 모달 열기
	 */
	function openAddModal() {
		newDeptTitle = '';
		showAddModal = true;
	}

	/**
	 * 부서 추가 실행 (ev_department)
	 * @param {string} title - 부서명
	 * @returns {Promise<void>}
	 */
	async function handleAddDept(title) {
		const t = (title || newDeptTitle || '').trim();
		if (!t) {
			alert('부서명을 입력하세요.');
			return;
		}
		isSaving = true;
		try {
			const code = getNextDepartmentCode();
			const { error } = await createDepartment({ code, title: t, param: [] });
			if (error) {
				alert(error.message || '부서 추가에 실패했습니다.');
				return;
			}
			showAddModal = false;
			newDeptTitle = '';
			await loadDepartments();
		} catch (e) {
			alert(e instanceof Error ? e.message : '부서 추가 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
	}

	/**
	 * 수정 레이어 팝업 열기 (담당자·사용자 목록 로드)
	 * @param {{ id: string, code: string, title: string, param?: string[] | null }} dept
	 */
	async function openEditPopup(dept) {
		editingDept = dept;
		selectedOrgCodes = new SvelteSet(Array.isArray(dept.param) ? dept.param : []);
		departmentUsers = [];
		userList = [];
		showEditPopup = true;
		const [usersRes, deptUsersRes] = await Promise.all([
			getAllUsers({ page: 1, pageSize: 500 }),
			getDepartmentUsers(dept.id)
		]);
		if (usersRes?.data) userList = usersRes.data.map((u) => ({ id: u.id, email: u.email ?? '', full_name: u.full_name ?? '' }));
		if (deptUsersRes?.data) departmentUsers = deptUsersRes.data.map((r) => ({
			id: r.id,
			user_id: r.user_id,
			can_edit_business_plan: !!r.can_edit_business_plan,
			can_edit_expected_sales: !!r.can_edit_expected_sales,
			can_edit_plan_cost: !!r.can_edit_plan_cost,
			can_edit_expected_cost: !!r.can_edit_expected_cost,
			email: r.email ?? null,
			full_name: r.full_name ?? null
		}));
	}

	/**
	 * 부서 삭제
	 * @param {{ id: string, code: string, title: string, param?: string[] | null }} dept
	 * @returns {Promise<void>}
	 */
	async function handleDeleteDepartment(dept) {
		if (!confirm('정말 삭제하시겠습니까?')) return;
		isSaving = true;
		try {
			const { error: delUsersErr } = await deleteDepartmentUsersByDepartmentId(dept.id);
			if (delUsersErr) {
				alert(delUsersErr.message || '담당자 데이터 정리 중 오류가 발생했습니다.');
				return;
			}
			const { error } = await deleteDepartment(dept.id);
			if (error) {
				alert(error.message || '삭제에 실패했습니다.');
				return;
			}
			await loadDepartments();
		} catch (e) {
			alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
	}

	/**
	 * 수정 팝업에서 organization 선택/해제
	 * @param {string} code
	 * @param {boolean} checked
	 */
	function toggleOrgSelection(code, checked) {
		if (checked) {
			selectedOrgCodes.add(code);
		} else {
			selectedOrgCodes.delete(code);
		}
		selectedOrgCodes = new SvelteSet(selectedOrgCodes);
	}

	/**
	 * 수정 팝업에서 담당자 추가
	 * @param {string} userId - user_profiles.id
	 */
	function handleAddDepartmentUser(userId) {
		const u = userList.find((x) => x.id === userId);
		if (!u || departmentUsers.some((d) => d.user_id === userId)) return;
		departmentUsers = [
			...departmentUsers,
			{
				user_id: userId,
				can_edit_business_plan: false,
				can_edit_expected_sales: false,
				can_edit_plan_cost: false,
				can_edit_expected_cost: false,
				email: u.email ?? null,
				full_name: u.full_name ?? null
			}
		];
	}

	/**
	 * 수정 팝업에서 담당자 제거
	 * @param {{ user_id: string }} entry
	 */
	function handleRemoveDepartmentUser(entry) {
		departmentUsers = departmentUsers.filter((d) => d.user_id !== entry.user_id);
	}

	/**
	 * 수정 팝업에서 담당자 권한 변경
	 * @param {{ user_id: string }} entry
	 * @param {{ can_edit_business_plan?: boolean, can_edit_expected_sales?: boolean, can_edit_plan_cost?: boolean, can_edit_expected_cost?: boolean }} payload
	 */
	function handleUpdateDepartmentUserPermission(entry, payload) {
		departmentUsers = departmentUsers.map((d) =>
			d.user_id !== entry.user_id
				? d
				: {
						...d,
						can_edit_business_plan: payload.can_edit_business_plan ?? d.can_edit_business_plan,
						can_edit_expected_sales: payload.can_edit_expected_sales ?? d.can_edit_expected_sales,
						can_edit_plan_cost: payload.can_edit_plan_cost ?? d.can_edit_plan_cost,
						can_edit_expected_cost: payload.can_edit_expected_cost ?? d.can_edit_expected_cost
					}
		);
	}

	/**
	 * 수정 저장 (ev_department param + ev_department_user 전체 교체)
	 * @returns {Promise<void>}
	 */
	async function handleSaveEdit() {
		if (!editingDept) return;
		isSaving = true;
		try {
			const param = Array.from(selectedOrgCodes);
			const { error: updateErr } = await updateDepartment(editingDept.id, { param });
			if (updateErr) {
				alert(updateErr.message || '저장에 실패했습니다.');
				return;
			}
			const { error: delErr } = await deleteDepartmentUsersByDepartmentId(editingDept.id);
			if (delErr) {
				alert(delErr.message || '담당자 정리 중 오류가 발생했습니다.');
				return;
			}
			for (const du of departmentUsers) {
				const { error: addErr } = await addDepartmentUser({
					department_id: editingDept.id,
					user_id: du.user_id,
					can_edit_business_plan: du.can_edit_business_plan,
					can_edit_expected_sales: du.can_edit_expected_sales,
					can_edit_plan_cost: du.can_edit_plan_cost,
					can_edit_expected_cost: du.can_edit_expected_cost
				});
				if (addErr) {
					alert(addErr.message || '담당자 저장 중 오류가 발생했습니다.');
					return;
				}
			}
			showEditPopup = false;
			editingDept = null;
			departmentUsers = [];
			await loadDepartments();
		} catch (e) {
			alert(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
	}

	/**
	 * 수정 팝업 닫기
	 */
	function closeEditPopup() {
		showEditPopup = false;
		editingDept = null;
		departmentUsers = [];
	}

	/** organization 코드 → 제목 맵 (소속 조직 표시용) */
	const orgCodeToTitle = $derived.by(() => {
		const map = /** @type {Record<string, string>} */ ({});
		for (const o of organizationList) {
			map[o.code] = o.title;
		}
		return map;
	});

	/**
	 * param 코드 배열을 제목 문자열로 표시
	 * @param {string[] | null | undefined} param
	 * @returns {string}
	 */
	function paramToDisplayLabels(param) {
		const arr = Array.isArray(param) ? param : [];
		return arr.map((code) => orgCodeToTitle[code] || code).join(', ') || '-';
	}

	/**
	 * 담당자 배열을 화면 표시 문자열로 변환
	 * @param {Array<{ full_name?: string | null, email?: string | null }>} users
	 * @returns {string}
	 */
	function formatDepartmentUsers(users) {
		if (!Array.isArray(users) || users.length === 0) return '-';
		return users
			.map((u) => ((u.full_name || '').trim() || (u.email || '').trim() || '-'))
			.filter(Boolean)
			.join(', ');
	}
</script>

<MainContent>
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-800">부서 코드 관리</h1>
		<p class="text-gray-600">실제 존재하는 부서별로 회계상의 부서를 연결합니다.</p>
	</div>

	<div class="mb-4 flex justify-end">
		<button
			type="button"
			onclick={openAddModal}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
		>
			부서 추가
		</button>
	</div>

	{#if isLoading}
		<div class="text-center py-12 text-gray-500">목록을 불러오는 중...</div>
	{:else if departments.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
			등록된 부서가 없습니다. "부서 추가"로 추가하세요.
		</div>
	{:else}
		<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<DataTable
				headers={[
					// { label: '코드' },
					{ label: '실제 부서명' },
					{ label: '회계상 부서(조직)' },
					{ label: '담당자' },
					{ label: '작업', align: 'center' }
				]}
				rowCount={departments.length}
				emptyMessage="등록된 부서가 없습니다."
			>
				{#each departments as dept (dept.id)}
					<tr>
						<!-- <td class="font-mono text-sm">{dept.code}</td> -->
						<td>{dept.title || '-'}</td>
						<td class="max-w-md text-sm text-gray-700">
							{paramToDisplayLabels(dept.param)}
						</td>
						<td class="max-w-xs text-sm text-gray-700">
							{formatDepartmentUsers(departmentUsersMap[dept.id] ?? [])}
						</td>
						<td class="text-center">
							<button
								type="button"
								onclick={() => openEditPopup(dept)}
								class="btn-edit btn-xs"
							>
								조직 수정
							</button>
							<button
								type="button"
								onclick={() => handleDeleteDepartment(dept)}
								class="btn-danger btn-xs"
								disabled={isSaving}
							>
								조직 삭제
							</button>
						</td>
					</tr>
				{/each}
			</DataTable>
		</div>
	{/if}
</MainContent>

<DepartmentAddModal
	open={showAddModal}
	bind:title={newDeptTitle}
	onClose={() => !isSaving && (showAddModal = false)}
	onSave={handleAddDept}
	isSaving={isSaving}
/>

<DepartmentEditModal
	open={showEditPopup && !!editingDept}
	department={editingDept}
	organizationList={organizationList}
	selectedOrgCodes={selectedOrgCodes}
	onToggle={toggleOrgSelection}
	departmentUsers={departmentUsers}
	userList={userList}
	onAddUser={handleAddDepartmentUser}
	onRemoveUser={handleRemoveDepartmentUser}
	onUpdateUserPermission={handleUpdateDepartmentUserPermission}
	onClose={closeEditPopup}
	onSave={handleSaveEdit}
	isSaving={isSaving}
/>
