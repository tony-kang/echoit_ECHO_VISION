<script>
	import MainContent from '$lib/C/MainContent.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import PerformanceCompanyModal from './PerformanceCompanyModal.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { getSettings, createSetting, updateSetting, deleteSetting } from '$lib/settingsService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);

	/** @type {Array<{ code: string, title: string, order: number, value: number, created_at?: string, updated_at?: string }>} 엑셀용 회사 목록 (env_code, category=excel_company) */
	let list = $state([]);
	/** @type {boolean} 로딩 여부 */
	let isLoading = $state(false);
	/** @type {boolean} 저장/삭제 중 */
	let isSaving = $state(false);
	/** @type {boolean} 등록 모달 표시 (item 없이 열림) */
	let showAddModal = $state(false);
	/** @type {{ code: string, title: string } | null} 수정 대상 (설정 시 수정 모드) */
	let editingItem = $state(null);
	/** @type {boolean} 초기 로드 완료 */
	let dataLoaded = $state(false);

	/** 모달 표시 여부: 등록 클릭 또는 수정 대상 선택 시 */
	let modalOpen = $derived(showAddModal || !!editingItem);

	const CATEGORY = 'excel_company';

	$effect(() => {
		if (user && !dataLoaded) {
			dataLoaded = true;
			loadList();
		}
	});

	/**
	 * 엑셀용 회사 목록 로드 (env_code, category=excel_company)
	 * @returns {Promise<void>}
	 */
	async function loadList() {
		isLoading = true;
		try {
			const { data, error } = await getSettings({ category: CATEGORY, orderByOrder: true });
			if (error) {
				console.error('엑셀용 회사 목록 로드 실패:', error);
				list = [];
			} else {
				list = (data || []).map((row) => ({
					code: row.code,
					title: row.title || row.code,
					order: row.order ?? 0,
					value: row.value ?? 1,
					created_at: row.created_at,
					updated_at: row.updated_at
				}));
			}
		} catch (e) {
			console.error('엑셀용 회사 목록 로드 예외:', e);
			list = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 등록 모달 열기
	 */
	function openAddModal() {
		editingItem = null;
		showAddModal = true;
	}

	/**
	 * 수정 모달 열기
	 * @param {{ code: string, title: string }} item
	 */
	function openEdit(item) {
		showAddModal = false;
		editingItem = item;
	}

	/**
	 * 모달 닫기
	 */
	function closeModal() {
		showAddModal = false;
		editingItem = null;
	}

	/**
	 * 등록/수정 저장 (통합 모달에서 호출)
	 * @param {string} code - 코드 (등록 시 자동생성값, 수정 시 기존 코드)
	 * @param {string} title - 엑셀용 회사 이름
	 * @returns {Promise<void>}
	 */
	async function handleSave(code, title) {
		isSaving = true;
		try {
			if (editingItem) {
				const { error } = await updateSetting(editingItem.code, { title, category: CATEGORY });
				if (error) {
					alert(error.message || '수정에 실패했습니다.');
					return;
				}
			} else {
				const { error } = await createSetting({
					code,
					title,
					value: 1,
					order: list.length,
					category: CATEGORY,
					parent_code: null
				});
				if (error) {
					alert(error.message || '등록에 실패했습니다.');
					return;
				}
			}
			closeModal();
			await loadList();
		} catch (e) {
			alert(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
	}

	/**
	 * 엑셀용 회사 삭제
	 * @param {{ code: string, title: string }} item
	 * @returns {Promise<void>}
	 */
	async function handleDelete(item) {
		if (!confirm(`"${item.title}" 항목을 삭제하시겠습니까?`)) return;
		isSaving = true;
		try {
			const { error } = await deleteSetting(item.code, CATEGORY);
			if (error) {
				alert(error.message || '삭제에 실패했습니다.');
				return;
			}
			await loadList();
		} catch (e) {
			alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
	}
</script>

<MainContent>
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-800">엑셀용 회사</h1>
		<p class="text-gray-600 mt-2">엑셀에서 사용할 회사 이름을 등록·관리합니다.</p>
	</div>

	<div class="mb-4 flex justify-end">
		<button
			type="button"
			onclick={openAddModal}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
			disabled={isSaving}
		>
			등록
		</button>
	</div>

	{#if isLoading}
		<div class="text-center py-12 text-gray-500">목록을 불러오는 중...</div>
	{:else if list.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
			등록된 엑셀용 회사가 없습니다.
		</div>
	{:else}
		<DataTable
			headers={[
				// { label: '코드' },
				{ label: '엑셀용 회사 이름' },
				{ label: '작업', align: 'center' }
			]}
			rowCount={list.length}
			emptyMessage="등록된 항목이 없습니다."
		>
			{#each list as item (item.code)}
				<tr>
					<!-- <td class="font-mono text-sm">{item.code}</td> -->
					<td>{item.title || '-'}</td>
					<td class="text-center">
						<button
							type="button"
							onclick={() => openEdit(item)}
							class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm mr-2 disabled:opacity-50"
							disabled={isSaving}
						>
							수정
						</button>
						<button
							type="button"
							onclick={() => handleDelete(item)}
							class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
							disabled={isSaving}
						>
							삭제
						</button>
					</td>
				</tr>
			{/each}
		</DataTable>
	{/if}

	<PerformanceCompanyModal
		open={modalOpen}
		item={editingItem}
		existingCodes={list.map((i) => i.code)}
		isSaving={isSaving}
		onClose={closeModal}
		onSave={handleSave}
	/>
</MainContent>
