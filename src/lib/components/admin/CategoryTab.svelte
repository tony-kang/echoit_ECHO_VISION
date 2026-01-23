<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		getAllCategories,
		createCategory,
		updateCategory,
		deleteCategory,
		toggleCategoryStatus
	} from '$lib/scheduleCategoryService';
	import { SCHEDULE_COLORS } from '$lib/scheduleService';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DataTable from './DataTable.svelte';
	import Pagination from './Pagination.svelte';

	/**
	 * @typedef {Object} Category
	 * @property {string} id
	 * @property {string} value
	 * @property {string} label
	 * @property {string} color
	 * @property {string} [level]
	 * @property {number} [display_order]
	 * @property {boolean} [is_active]
	 */

	/** @type {Category[]} 전체 카테고리 목록 */
	let allCategories = $state([]);
	/** @type {Category[]} 필터링된 카테고리 목록 */
	let categories = $state([]);
	/** @type {number | null} 전체 카테고리 개수 */
	let totalCount = $state(null);
	/** @type {number} 현재 페이지 */
	let currentPage = $state(1);
	/** @type {number} 페이지당 항목 수 */
	const pageSize = 20;
	let isLoading = $state(false);
	let showFormModal = $state(false);
	/** @type {Category | null} */
	let editingCategory = $state(null);
	
	/** @type {Object} 필터 상태 */
	let filters = $state({
		search: ''
	});

	// 폼 상태
	let formValue = $state('');
	let formLabel = $state('');
	let formColor = $state(SCHEDULE_COLORS.blue);
	let formLevel = $state('default');
	let formDisplayOrder = $state(0);
	let formIsActive = $state(true);

	onMount(() => {
		loadCategories();
	});

	// 검색어 변경 시 자동 필터링
	$effect(() => {
		if (allCategories.length > 0) {
			applyFilters();
		}
	});

	/**
	 * 카테고리 목록 로드
	 */
	async function loadCategories() {
		isLoading = true;
		// 검색어가 있으면 페이지네이션 없이 전체를 가져와서 필터링
		const { data, total, error } = await getAllCategories(null, filters.search ? {} : {
			page: currentPage,
			pageSize: pageSize
		});
		if (error) {
			console.error('카테고리 로드 실패:', error);
			alert('카테고리를 불러오는데 실패했습니다.');
		} else {
			allCategories = data || [];
			applyFilters();
		}
		isLoading = false;
	}

	/**
	 * 필터 적용
	 */
	function applyFilters() {
		let filtered = [...allCategories];
		
		// 검색어로 필터링 (값 또는 표시명)
		if (filters.search && filters.search.trim()) {
			const searchLower = filters.search.trim().toLowerCase();
			filtered = filtered.filter(category => 
				(category.value && category.value.toLowerCase().includes(searchLower)) ||
				(category.label && category.label.toLowerCase().includes(searchLower))
			);
		}
		
		// 전체 개수 업데이트
		totalCount = filtered.length;
		
		// 페이지네이션 적용
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		categories = filtered.slice(start, end);
	}

	/**
	 * 필터 적용 핸들러
	 */
	function handleApplyFilters() {
		currentPage = 1; // 필터 적용 시 첫 페이지로 이동
		applyFilters();
	}

	/**
	 * 필터 초기화 핸들러
	 */
	function handleResetFilters() {
		filters.search = '';
		currentPage = 1;
		applyFilters();
	}

	/**
	 * 총 페이지 수 계산
	 * @type {number}
	 */
	const totalPages = $derived.by(() => {
		if (totalCount === null || totalCount === 0) return 0;
		return Math.ceil(totalCount / pageSize);
	});

	/**
	 * 페이지 변경 핸들러
	 * @param {number} page - 변경할 페이지 번호
	 */
	function handlePageChange(page) {
		if (page < 1 || page > totalPages) return;
		currentPage = page;
		applyFilters();
	}

	/**
	 * 표시할 페이지 번호 목록 생성
	 * @type {number[]}
	 */
	const pageNumbers = $derived.by(() => {
		const pages = [];
		const maxVisible = 5;
		
		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
			let end = Math.min(totalPages, start + maxVisible - 1);
			
			if (end - start < maxVisible - 1) {
				start = Math.max(1, end - maxVisible + 1);
			}
			
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
		}
		
		return pages;
	});

	function handleCreate() {
		editingCategory = null;
		formValue = '';
		formLabel = '';
		formColor = SCHEDULE_COLORS.blue;
		formDisplayOrder = 0;
		formIsActive = true;
		showFormModal = true;
	}

	/**
	 * @param {Category} category
	 */
	function handleEdit(category) {
		editingCategory = category;
		formValue = category.value;
		formLabel = category.label;
		formColor = category.color;
		formLevel = category.level || 'default';
		formDisplayOrder = category.display_order || 0;
		formIsActive = category.is_active !== false;
		showFormModal = true;
	}

	async function handleSubmit() {
		if (!formValue.trim() || !formLabel.trim()) {
			alert('값과 표시명을 입력해주세요.');
			return;
		}

		// 색상 형식 검증
		if (!/^#[0-9A-Fa-f]{6}$/.test(formColor)) {
			alert('올바른 색상 형식(HEX)을 입력해주세요. 예: #3b82f6');
			return;
		}

		try {
			let result;
			if (editingCategory && editingCategory.id) {
				result = await updateCategory(editingCategory.id, {
					value: formValue.trim(),
					label: formLabel.trim(),
					color: formColor,
					level: formLevel,
					display_order: formDisplayOrder,
					is_active: formIsActive
				});
			} else {
				result = await createCategory({
					value: formValue.trim(),
					label: formLabel.trim(),
					color: formColor,
					level: formLevel,
					display_order: formDisplayOrder,
					is_active: formIsActive
				});
			}

			if (result.error) {
				throw result.error;
			}

			showFormModal = false;
			editingCategory = null;
			currentPage = 1; // 생성/수정 후 첫 페이지로 이동
			await loadCategories();
		} catch (error) {
			console.error('카테고리 저장 실패:', error);
			/** @type {Error} */
			const err = error instanceof Error ? error : new Error(String(error));
			alert('카테고리 저장에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
		}
	}

	function handleCancel() {
		showFormModal = false;
		editingCategory = null;
	}

	/**
	 * @param {Category} category
	 */
	async function handleDelete(category) {
		if (!confirm(`"${category.label}" 카테고리를 삭제하시겠습니까?`)) {
			return;
		}

		const { error } = await deleteCategory(category.id);
		if (error) {
			console.error('카테고리 삭제 실패:', error);
			alert('카테고리 삭제에 실패했습니다.');
		} else {
			// 삭제 후 현재 페이지에 항목이 없으면 이전 페이지로 이동
			await loadCategories();
			if (categories.length === 0 && currentPage > 1) {
				currentPage = currentPage - 1;
				applyFilters();
			}
		}
	}

	/**
	 * @param {Category} category
	 */
	async function handleToggleStatus(category) {
		const { error } = await toggleCategoryStatus(category.id);
		if (error) {
			console.error('카테고리 상태 변경 실패:', error);
			alert('카테고리 상태 변경에 실패했습니다.');
		} else {
			await loadCategories();
		}
	}
</script>

<div class="space-y-4">
	<!-- 필터 및 액션 -->
	<FilterBar
		bind:filters={filters}
		fields={[
			{
				key: 'search',
				type: 'input',
				placeholder: '값 또는 표시명으로 검색...'
			}
		]}
		onApply={handleApplyFilters}
		onReset={handleResetFilters}
		actions={[
			{
				label: '카테고리 추가',
				onClick: handleCreate,
				variant: 'primary',
				icon: '+'
			}
		]}
	/>

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-gray-500">카테고리를 불러오는 중...</p>
		</div>
	{:else}
		<!-- 카테고리 목록 -->
		<DataTable
			headers={[
				{ label: '색상' },
				{ label: '값' },
				{ label: '표시명' },
				{ label: '레벨' },
				{ label: '순서' },
				{ label: '상태' },
				{ label: '작업', align: 'right' }
			]}
			rowCount={categories.length}
			emptyMessage="카테고리가 없습니다."
		>
			{#each categories as category}
				<tr>
					<td>
						<div
							class="color-box"
							style="background-color: {category.color}"
						></div>
					</td>
					<td>{category.value}</td>
					<td>{category.label}</td>
					<td>
						<span class="badge badge-info">
							{category.level || 'default'}
						</span>
					</td>
					<td>{category.display_order || 0}</td>
					<td>
						<span class="badge {category.is_active ? 'badge-success' : 'badge-gray'}">
							{category.is_active ? '활성' : '비활성'}
						</span>
					</td>
					<td>
						<div class="action-buttons">
							<button
								onclick={() => handleToggleStatus(category)}
								class="btn-small btn-primary"
							>
								{category.is_active ? '비활성화' : '활성화'}
							</button>
							<button
								onclick={() => handleEdit(category)}
								class="btn-small btn-secondary"
							>
								수정
							</button>
							<button
								onclick={() => handleDelete(category)}
								class="btn-small btn-danger"
							>
								삭제
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</DataTable>
		
		<!-- Pagination -->
		<Pagination
			currentPage={currentPage}
			totalPages={totalPages}
			totalCount={totalCount || 0}
			pageSize={pageSize}
			onPageChange={handlePageChange}
		/>
	{/if}
</div>

<!-- 카테고리 생성/수정 모달 -->
{#if showFormModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleCancel}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{editingCategory ? '카테고리 수정' : '카테고리 추가'}</h2>
				<button onclick={handleCancel} class="modal-close">×</button>
			</div>
			<div class="modal-body">
				<div class="space-y-4">
					<!-- 값 -->
					<div>
						<label for="formValue" class="block text-sm font-medium text-gray-700 mb-1">
							값 (고유 식별자) <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formValue"
							bind:value={formValue}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="예: contract, move_in"
							required
							disabled={!!editingCategory}
						/>
						<p class="text-xs text-gray-500 mt-1">영문 소문자, 언더스코어만 사용 가능 (수정 불가)</p>
					</div>

					<!-- 표시명 -->
					<div>
						<label for="formLabel" class="block text-sm font-medium text-gray-700 mb-1">
							표시명 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formLabel"
							bind:value={formLabel}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="예: 전자계약, 입주"
							required
						/>
					</div>

					<!-- 레벨 -->
					<div>
						<label for="formLevel" class="block text-sm font-medium text-gray-700 mb-1">
							레벨 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formLevel"
							bind:value={formLevel}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="예: default, contract"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">카테고리 레벨 (예: default, contract)</p>
					</div>

					<!-- 색상 -->
					<div>
						<label for="formColor" class="block text-sm font-medium text-gray-700 mb-2">
							색상 <span class="text-red-500">*</span>
						</label>
						<div class="flex gap-2 mb-2">
							{#each Object.entries(SCHEDULE_COLORS) as [name, hex]}
								<button
									type="button"
									onclick={() => formColor = hex}
									class="w-8 h-8 rounded-full border-2 {formColor === hex ? 'border-gray-800' : 'border-gray-300'}"
									style="background-color: {hex}"
									title={name}
								></button>
							{/each}
						</div>
						<input
							type="text"
							id="formColor"
							bind:value={formColor}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="#3b82f6"
							pattern="^#[0-9A-Fa-f]{6}$"
						/>
						<p class="text-xs text-gray-500 mt-1">HEX 형식 (예: #3b82f6)</p>
					</div>

					<!-- 표시 순서 -->
					<div>
						<label for="formDisplayOrder" class="block text-sm font-medium text-gray-700 mb-1">
							표시 순서
						</label>
						<input
							type="number"
							id="formDisplayOrder"
							bind:value={formDisplayOrder}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							min="0"
						/>
					</div>

					<!-- 활성화 여부 -->
					<div class="flex items-center">
						<input
							type="checkbox"
							id="formIsActive"
							bind:checked={formIsActive}
							class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
						/>
						<label for="formIsActive" class="ml-2 text-sm text-gray-700">
							활성화
						</label>
					</div>

					<!-- 버튼 -->
					<div class="flex gap-2 pt-4">
						<button
							type="button"
							onclick={handleCancel}
							class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
						>
							취소
						</button>
						<button
							type="button"
							onclick={handleSubmit}
							class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
						>
							{editingCategory ? '수정' : '생성'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		background: white;
		z-index: 10;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5em;
		color: #333;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 2em;
		cursor: pointer;
		color: #999;
		line-height: 1;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		color: #333;
	}

	.modal-body {
		padding: 1rem;
	}

	.color-box {
		width: 16px;
		height: 16px;
		border-radius: 8px;
		display: inline-block;
	}
	
	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 6px;
		font-size: 0.75em;
		font-weight: 500;
	}
	
	.badge-info {
		background-color: #dbeafe;
		color: #1e40af;
		border: 1px solid #bfdbfe;
	}
	
	.badge-success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}
	
	.badge-gray {
		background-color: #e5e7eb;
		color: #374151;
		border: 1px solid #d1d5db;
	}
	
	.action-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 4px;
	}
	
	.btn-small {
		padding: 4px 8px;
		font-size: 0.8em;
		border-radius: 4px;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
		white-space: nowrap;
	}
	
	.btn-small.btn-primary {
		background: #667eea;
		color: white;
	}
	
	.btn-small.btn-primary:hover {
		background: #5568d3;
	}
	
	.btn-small.btn-secondary {
		background: #6c757d;
		color: white;
	}
	
	.btn-small.btn-secondary:hover {
		background: #5a6268;
	}
	
	.btn-small.btn-danger {
		background: #dc3545;
		color: white;
	}
	
	.btn-small.btn-danger:hover {
		background: #c82333;
	}
</style>
