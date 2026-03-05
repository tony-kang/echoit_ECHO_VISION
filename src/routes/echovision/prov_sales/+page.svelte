<script>
	import { onMount } from 'svelte';
	import PrjSidebar from '$lib/components/PrjSidebar.svelte';
	import { getSettings } from '$lib/settingsService';
	import { getDepartments } from '$lib/departmentService';
	import {
		getProvisionalSalesByCompanyYear,
		upsertProvisionalSales,
		PROV_SALES_ITEMS
	} from '$lib/provSalesService';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { goto } from '$app/navigation';
	import { SvelteMap } from 'svelte/reactivity';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	let authLoading = $derived(authStore.loading);

	/** @type {Array<{ code: string, title: string }>} 회사 목록 (excel-company) */
	let companies = $state([]);
	/** @type {Array<{ id: string, code: string, title: string }>} 부서 목록 */
	let departments = $state([]);
	/** @type {string} 선택 회사코드 */
	let companyCode = $state('');
	/** @type {string} 선택 연도 */
	let selectedYear = $state(new Date().getFullYear().toString());
	/** @type {string} 선택 항목 키 */
	let itemKey = $state(PROV_SALES_ITEMS[0]?.key ?? 'sales_amount');
	/** @type {Array<any>} 가결산 원본 행 목록 (company_code, department_id, year, month + 항목별 금액) */
	let rows = $state([]);
	/** @type {boolean} 데이터 로딩 중 */
	let isLoading = $state(false);
	/** @type {boolean} 저장 중 */
	let isSaving = $state(false);
	/** 편집 중인 셀 값 (key: departmentId_month) */
	let pendingCells = new SvelteMap();

	/** department_id·month 별 행 맵 (한 행이 한 달 데이터) */
	const rowByDeptMonth = $derived.by(() => {
		const map = new SvelteMap();
		for (const r of rows) {
			const k = `${r.department_id}_${r.month}`;
			map.set(k, r);
		}
		return map;
	});

	/**
	 * 부서·월에 해당하는 항목 값 조회 (편집 중이면 pending 반환)
	 * @param {string} departmentId - ev_department.id
	 * @param {number} month - 1~12
	 * @returns {number}
	 */
	function getCellValue(departmentId, month) {
		const k = `${departmentId}_${month}`;
		if (pendingCells.has(k)) {
			const p = pendingCells.get(k);
			return p === '' ? 0 : parseFloat(String(p).replace(/,/g, '')) || 0;
		}
		const r = rowByDeptMonth.get(k);
		if (!r) return 0;
		const v = r[itemKey];
		return v === null || v === undefined ? 0 : Number(v);
	}

	/**
	 * 셀 표시 문자열 (input value용)
	 * @param {string} departmentId - ev_department.id
	 * @param {number} month - 1~12
	 * @returns {string}
	 */
	function getCellDisplay(departmentId, month) {
		const k = `${departmentId}_${month}`;
		if (pendingCells.has(k)) return pendingCells.get(k) ?? '';
		const r = rowByDeptMonth.get(k);
		if (!r) return '';
		const v = r[itemKey];
		if (v === null || v === undefined || v === 0) return '';
		return String(v);
	}

	/**
	 * 분기/반기/연도 합계
	 * @param {string} departmentId - ev_department.id
	 * @param {number[]} months - 합산할 월 (예: [1,2,3])
	 * @returns {number}
	 */
	function getSum(departmentId, months) {
		return months.reduce((s, m) => s + getCellValue(departmentId, m), 0);
	}

	/**
	 * 셀 입력 시 pending 반영
	 * @param {string} departmentId - ev_department.id
	 * @param {number} month - 1~12
	 * @param {string} value - 입력값
	 */
	function setPendingCell(departmentId, month, value) {
		const k = `${departmentId}_${month}`;
		if (value === '') pendingCells.delete(k);
		else pendingCells.set(k, value);
	}

	/**
	 * 셀 저장 (blur 시)
	 * @param {string} departmentId - ev_department.id
	 * @param {number} month - 1~12
	 * @param {string} value - 입력값
	 * @returns {Promise<void>}
	 */
	async function saveCell(departmentId, month, value) {
		if (!companyCode || !selectedYear || isSaving) return;
		const k = `${departmentId}_${month}`;
		pendingCells.delete(k);
		const num = value === '' ? 0 : parseFloat(String(value).replace(/,/g, '')) || 0;
		const existing = rowByDeptMonth.get(k);
		const base = existing
			? { ...existing }
			: {
					company_code: companyCode,
					department_id: departmentId,
					year: parseInt(selectedYear, 10),
					month
				};
		base[itemKey] = num;
		isSaving = true;
		try {
			const { data, error } = await upsertProvisionalSales(base);
			if (error) return;
			if (data) {
				rows = rows.filter(
					(r) => !(r.department_id === departmentId && r.month === month)
				);
				rows = [...rows, data];
			}
		} finally {
			isSaving = false;
		}
	}

	/** 회사·연도 변경 시 데이터 로드 */
	async function loadData() {
		if (!companyCode || !selectedYear) {
			rows = [];
			return;
		}
		isLoading = true;
		try {
			const { data, error } = await getProvisionalSalesByCompanyYear(
				companyCode,
				parseInt(selectedYear, 10)
			);
			if (error) rows = [];
			else rows = data ?? [];
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		if (!authStore.loading && !authStore.user) {
			goto('/login');
			return;
		}
		(async () => {
			const [settingsRes, deptRes] = await Promise.all([
				getSettings({ category: 'excel-company', orderByOrder: true }),
				getDepartments()
			]);
			companies = (settingsRes.data || []).map((r) => ({
				code: r.code,
				title: r.title || r.code
			}));
			departments = (deptRes.data || []).map((d) => ({
				id: d.id,
				code: d.code,
				title: d.title
			}));
			if (companies.length > 0 && !companyCode) companyCode = companies[0].code;
		})();
	});

	$effect(() => {
		if (!user || authLoading) return;
		if (companyCode && selectedYear) loadData();
	});

	/** 항목 변경 시 편집 중인 셀 초기화 (항목별로 값이 다르므로) */
	$effect(() => {
		void itemKey;
		pendingCells.clear();
	});

	/** 테이블 열 정의: 1~3월, 분기합계, 4~6월, 반기합계, 7~9월, 3분기합계, 10~12월, 연도합계 */
	const COLUMNS = [
		{ type: 'month', months: [1, 2, 3], labelSum: '분기합계' },
		{ type: 'month', months: [4, 5, 6], labelSum: '반기합계' },
		{ type: 'month', months: [7, 8, 9], labelSum: '3분기합계' },
		{ type: 'month', months: [10, 11, 12], labelSum: '연도합계' }
	];

	/**
	 * 금액 포맷 (천단위 콤마)
	 * @param {number} n - 숫자
	 * @returns {string}
	 */
	function fmt(n) {
		if (n === null || n === undefined) return '';
		return new Intl.NumberFormat('ko-KR', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(Number(n));
	}
</script>

<svelte:head>
	<title>가결산 실적</title>
</svelte:head>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<PrjSidebar />
		<main class="flex-1 overflow-y-auto bg-gray-50 p-4">
			{#if authLoading}
				<div class="flex items-center justify-center h-full text-gray-500">로딩 중...</div>
			{:else if !user}
				<div class="flex items-center justify-center h-full text-gray-500">로그인이 필요합니다.</div>
			{:else}
				<div class="max-w-full">
					<h1 class="text-2xl font-bold text-gray-900 mb-4">가결산 실적</h1>
					<p class="text-gray-600 mb-4">
						회사·부서·년도·월별로 항목 데이터를 입력/수정할 수 있습니다.
					</p>

					<!-- 필터 -->
					<div class="flex flex-wrap items-center gap-4 mb-4">
						<label class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-700">회사</span>
							<select
								class="border rounded px-3 py-1.5 text-sm"
								bind:value={companyCode}
								onchange={() => loadData()}
							>
								<option value="">선택</option>
								{#each companies as c (c.code)}
									<option value={c.code}>{c.title}</option>
								{/each}
							</select>
						</label>
						<label class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-700">년도</span>
							<select
								class="border rounded px-3 py-1.5 text-sm"
								bind:value={selectedYear}
								onchange={() => loadData()}
							>
								<option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}년</option>
								<option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}년</option>
								<option value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}년</option>
							</select>
						</label>
						<label class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-700">항목</span>
							<select class="border rounded px-3 py-1.5 text-sm min-w-[220px]" bind:value={itemKey}>
								{#each PROV_SALES_ITEMS as item (item.key)}
									<option value={item.key}>{item.label}</option>
								{/each}
							</select>
						</label>
					</div>

					{#if !companyCode}
						<p class="text-gray-500">회사를 선택하세요.</p>
					{:else if isLoading}
						<p class="text-gray-500">데이터 로딩 중...</p>
					{:else}
						<div class="overflow-x-auto bg-white rounded-lg shadow border">
							<table class="prov-table w-full border-collapse">
								<thead>
									<tr class="bg-gray-100">
										<th class="prov-th text-left sticky left-0 bg-gray-100 z-10 min-w-[120px]">부서명</th>
										{#each COLUMNS as col (col.labelSum)}
											{#each col.months as m (m)}
												<th class="prov-th text-right min-w-[90px]">{m}월</th>
											{/each}
											<th class="prov-th text-right font-semibold min-w-[100px]">{col.labelSum}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each departments as dept (dept.id)}
										<tr class="border-b hover:bg-gray-50">
											<td class="prov-td font-medium sticky left-0 bg-white z-10">{dept.title}</td>
											{#each COLUMNS as col (col.labelSum)}
												{#each col.months as m (m)}
													<td class="prov-td text-right">
														<input
															type="text"
															class="prov-input w-full text-right"
															value={getCellDisplay(dept.id, m)}
															oninput={(e) => setPendingCell(dept.id, m, e.currentTarget.value)}
															onblur={(e) => saveCell(dept.id, m, e.currentTarget.value)}
														/>
													</td>
												{/each}
												<td class="prov-td text-right text-gray-600 font-medium">
													{fmt(getSum(dept.id, col.months))}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						{#if isSaving}
							<p class="text-sm text-gray-500 mt-2">저장 중...</p>
						{/if}
					{/if}
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.main-content-page {
		width: 100%;
	}
	.prov-table {
		font-size: 0.875rem;
	}
	.prov-th {
		padding: 10px 8px;
		border: 1px solid #e5e7eb;
		color: #374151;
	}
	.prov-td {
		padding: 6px 8px;
		border: 1px solid #e5e7eb;
		color: #374151;
	}
	.prov-input {
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		padding: 4px 6px;
	}
	.prov-input:focus {
		outline: none;
		border-color: #2563eb;
	}
</style>
