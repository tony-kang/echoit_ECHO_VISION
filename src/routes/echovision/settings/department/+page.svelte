<script>
	import { SvelteSet } from 'svelte/reactivity';
	import MainContent from '$lib/C/MainContent.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import DepartmentAddModal from './DepartmentAddModal.svelte';
	import DepartmentEditModal from './DepartmentEditModal.svelte';
	import OrderEditModal from '$lib/components/settings/OrderEditModal.svelte';
	import CompanyCodeEditModal from '$lib/components/settings/CompanyCodeEditModal.svelte';
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
	import { formatDateOnly } from '$lib/utils/dateUtils';

	/** @type {import('@supabase/supabase-js').User | null} (레이아웃에서 인증 처리) */
	let user = $derived(authStore.user);

	/** @type {Array<{ id: string, code: string, title: string, param?: string[] | null }>} */
	let departments = $state([]);
	/** @type {Array<{ code: string, title: string }>} organization 목록 (수정 팝업용) */
	let organizationList = $state([]);
	/** @type {boolean} 가결산 대상 부서 선택 값 */
	let provSalesTarget = $state(false);
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
	/** @type {boolean} 표시순서 전용 모달 표시 여부 */
	let showOrderModal = $state(false);
	/** @type {any} 표시순서 수정 대상 부서 */
	let orderEditDept = $state(null);
	/** @type {number} 표시순서 모달에서 편집 중인 값 */
	let orderModalOrder = $state(0);
	/** @type {boolean} 회사 선택 모달 표시 여부 */
	let showCompanyModal = $state(false);
	/** @type {any} 회사 선택 수정 대상 부서 */
	let companyEditDept = $state(null);
	/** @type {Set<string>} 회사 선택 모달에서 선택된 회사 코드 집합 */
	let selectedCompanyCodes = $state(new Set());
	/** @type {Array<{ code: string, title: string }>} 회사 목록 (excel_company) */
	let companyList = $state([]);
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
			loadCompanyList();
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
		provSalesTarget = dept.prov_sales_target ?? false;
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
	 * 회사 목록 로드 (excel_company, 회사 선택 모달용)
	 * @returns {Promise<void>}
	 */
	async function loadCompanyList() {
		try {
			const { data, error } = await getSettings({ category: 'excel_company', orderByOrder: true });
			if (error) {
				console.error('회사 목록 로드 실패:', error);
				companyList = [];
			} else {
				companyList = (data || []).map((/** @type {{ code: string, title: string }} */ row) => ({
					code: row.code,
					title: row.title || row.code
				}));
			}
		} catch (e) {
			console.error('회사 목록 로드 예외:', e);
			companyList = [];
		}
	}

	/**
	 * 표시순서 수정 모달 열기
	 * @param {any} dept - 수정할 부서
	 */
	function openOrderModal(dept) {
		orderEditDept = dept;
		orderModalOrder = dept.display_order ?? 0;
		showOrderModal = true;
	}

	/**
	 * 표시순서 수정 모달 닫기
	 */
	function closeOrderModal() {
		showOrderModal = false;
		orderEditDept = null;
	}

	/**
	 * 표시순서만 저장 (display_order 필드만 업데이트)
	 * @returns {Promise<void>}
	 */
	async function saveOrderModal() {
		if (!orderEditDept) return;
		const orderValue = Number(orderModalOrder);
		if (!Number.isInteger(orderValue) || orderValue < 0) {
			alert('표시순서는 0 이상의 정수만 입력 가능합니다.');
			return;
		}
		isSaving = true;
		try {
			const { error } = await updateDepartment(orderEditDept.id, { display_order: orderValue });
			if (error) {
				alert(error.message || '표시순서 저장에 실패했습니다.');
				return;
			}
			closeOrderModal();
			await loadDepartments();
		} catch (e) {
			alert(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
	}

	/**
	 * 회사 선택 모달 열기
	 * @param {any} dept - 수정할 부서
	 */
	function openCompanyModal(dept) {
		companyEditDept = dept;
		selectedCompanyCodes = new SvelteSet(Array.isArray(dept.company_code) ? [...dept.company_code] : []);
		showCompanyModal = true;
	}

	/**
	 * 회사 선택 모달 닫기
	 */
	function closeCompanyModal() {
		showCompanyModal = false;
		companyEditDept = null;
	}

	/**
	 * 회사 선택 모달에서 체크박스 토글
	 * @param {string} code - 회사 코드
	 * @param {boolean} checked - 체크 여부
	 */
	function toggleCompanySelection(code, checked) {
		if (checked) {
			selectedCompanyCodes.add(code);
		} else {
			selectedCompanyCodes.delete(code);
		}
		selectedCompanyCodes = new SvelteSet(selectedCompanyCodes);
	}

	/**
	 * 회사 선택 저장 (company_code만 업데이트)
	 * @returns {Promise<void>}
	 */
	async function saveCompanyModal() {
		if (!companyEditDept) return;
		isSaving = true;
		try {
			const codes = Array.from(selectedCompanyCodes);
			const { error } = await updateDepartment(companyEditDept.id, { company_code: codes });
			if (error) {
				alert(error.message || '회사 저장에 실패했습니다.');
				return;
			}
			closeCompanyModal();
			await loadDepartments();
		} catch (e) {
			alert(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
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
			const { error: updateErr } = await updateDepartment(editingDept.id, { param, prov_sales_target: provSalesTarget, title: editingDept.title });
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
					can_edit_expected_cost: du.can_edit_expected_cost,
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

	/** 회사 코드 → 제목 맵 (excel_company, 회사 셀 표시용) */
	const companyCodeToTitle = $derived.by(() => {
		const map = /** @type {Record<string, string>} */ ({});
		for (const c of companyList) {
			map[c.code] = c.title;
		}
		return map;
	});

	/**
	 * 문자열을 음이 아닌 정수 해시로 변환 (회사 코드별 색 인덱스용)
	 * @param {string} str
	 * @returns {number}
	 */
	function hashStringToPositiveInt(str) {
		let h = 0;
		for (let i = 0; i < str.length; i++) {
			h = (h << 5) - h + str.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h);
	}

	/** @type {readonly string[]} 회사 코드 배지용 Tailwind 클래스 팔레트 */
	const COMPANY_CODE_CHIP_PALETTE = [
		'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200/80',
		'bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-200/80',
		'bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-200/80',
		'bg-violet-100 text-violet-900 ring-1 ring-inset ring-violet-200/80',
		'bg-rose-100 text-rose-900 ring-1 ring-inset ring-rose-200/80',
		'bg-cyan-100 text-cyan-900 ring-1 ring-inset ring-cyan-200/80',
		'bg-orange-100 text-orange-900 ring-1 ring-inset ring-orange-200/80',
		'bg-indigo-100 text-indigo-900 ring-1 ring-inset ring-indigo-200/80',
		'bg-lime-100 text-lime-900 ring-1 ring-inset ring-lime-200/80',
		'bg-fuchsia-100 text-fuchsia-900 ring-1 ring-inset ring-fuchsia-200/80',
		'bg-teal-100 text-teal-900 ring-1 ring-inset ring-teal-200/80',
		'bg-blue-100 text-blue-900 ring-1 ring-inset ring-blue-200/80'
	];

	/**
	 * 회사 코드마다 고정되는 배지용 Tailwind 클래스
	 * @param {string} code
	 * @returns {string}
	 */
	function companyCodeChipClass(code) {
		const idx = hashStringToPositiveInt(String(code)) % COMPANY_CODE_CHIP_PALETTE.length;
		return COMPANY_CODE_CHIP_PALETTE[idx];
	}

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
		<DataTable
			headers={[
				// { label: '코드' },
				{ label: '실제 부서명' },
				{ label: '표시 순서', align: 'center' },
				{ label: '엑셀 회사' },
				{ label: '회계상 부서(조직)' },
				{ label: '가결산 대상', align: 'center' },
				{ label: '담당자' },
				{ label: '등록일', align: 'center' },
				{ label: '작업', align: 'center' }
			]}
			rowCount={departments.length}
			emptyMessage="등록된 부서가 없습니다."
		>
			{#each departments as dept (dept.id)}
				<tr>
					<!-- <td class="font-mono text-sm">{dept.code}</td> -->
					<td>{dept.title || '-'}</td>
					<td
						class="text-center order-cell-clickable"
						role="button"
						tabindex="0"
						onclick={(e) => { e.stopPropagation(); openOrderModal(dept); }}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOrderModal(dept); } }}
						title="클릭하면 표시순서만 수정"
					>
						{dept.display_order ?? '-'}
					</td>
					<td
						class="max-w-lg min-w-40 text-sm order-cell-clickable company-code-cell"
						role="button"
						tabindex="0"
						onclick={(e) => { e.stopPropagation(); openCompanyModal(dept); }}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCompanyModal(dept); } }}
						title="클릭하면 엑셀 회사를 선택·수정할 수 있습니다"
						aria-label="엑셀 회사 선택·수정"
					>
						<div class="flex flex-wrap items-center gap-1.5">
							{#if !Array.isArray(dept.company_code) || dept.company_code.length === 0}
								<span class="text-gray-400">-</span>
							{:else}
								{#each dept.company_code as code (code)}
									<span
										class="company-code-chip inline-flex max-w-full shrink-0 items-center truncate rounded-md px-2 py-0.5 text-xs font-semibold {companyCodeChipClass(
											code
										)}"
										title={companyCodeToTitle[code] || code}
									>
										{companyCodeToTitle[code] || code}
									</span>
								{/each}
							{/if}
							<span
								class="company-code-edit-hint inline-flex shrink-0 items-center gap-0.5 rounded border border-dashed border-gray-300 bg-white/60 px-1.5 py-0.5 text-[11px] font-medium text-gray-500"
								aria-hidden="true"
							>
								<svg
									class="h-3.5 w-3.5 shrink-0 text-gray-500"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
									/>
								</svg>
							</span>
						</div>
					</td>
					<td class="max-w-md text-sm text-gray-700">
						{paramToDisplayLabels(dept.param)}
					</td>					
					<td class="max-w-xs text-sm text-gray-700 text-center">
						{dept.prov_sales_target ? '✅' : ''}
					</td>
					<td class="max-w-xs text-sm text-gray-700">
						{formatDepartmentUsers(departmentUsersMap[dept.id] ?? [])}
					</td>
					<td class="text-center">
						{dept.created_at ? formatDateOnly(dept.created_at) : '-'}
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
	bind:provSalesTarget={provSalesTarget}
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

<OrderEditModal
	open={showOrderModal}
	setting={orderEditDept ? { code: orderEditDept.code, title: orderEditDept.title, order: orderModalOrder } : null}
	bind:order={orderModalOrder}
	isSaving={isSaving}
	onClose={closeOrderModal}
	onSave={saveOrderModal}
/>

<CompanyCodeEditModal
	open={showCompanyModal}
	department={companyEditDept}
	companyOptions={companyList}
	selectedCompanyCodes={selectedCompanyCodes}
	onToggle={toggleCompanySelection}
	onClose={closeCompanyModal}
	onSave={saveCompanyModal}
	isSaving={isSaving}
/>

<style>
	.order-cell-clickable {
		cursor: pointer;
	}
	.order-cell-clickable:hover {
		background-color: #eff6ff;
		color: #1d4ed8;
	}
	.company-code-cell:hover .company-code-edit-hint {
		border-color: #93c5fd;
		color: #1d4ed8;
	}
	.company-code-cell:hover .company-code-edit-hint svg {
		color: #1d4ed8;
	}
</style>
