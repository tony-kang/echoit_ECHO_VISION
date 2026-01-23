<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import LogisticsSidebar from '$lib/components/LogisticsSidebar.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import {
		getCustomers,
		createCustomer,
		updateCustomer,
		deleteCustomer,
		CUSTOMER_TYPES,
		CUSTOMER_TYPE_LABELS
	} from '$lib/customerService';
	import { authStore } from '$lib/stores/authStore';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);
	/** @type {Array<any>} */
	let customers = $state([]);
	let isLoading = $state(false);
	let showFormModal = $state(false);
	/** @type {any} */
	let editingCustomer = $state(null);

	/** @type {Object} 필터 상태 */
	let filters = $state({
		search: '',
		custType: '',
		activeOnly: false
	});

	// 폼 상태
	/** @type {string} */
	let formCode = $state('');
	/** @type {string} */
	let formCustType = $state('demand');
	/** @type {string} */
	let formName = $state('');
	/** @type {string} */
	let formCompanyRegNo = $state('');
	/** @type {Array<{name: string, email: string, phone: string}>} */
	let formContactPersons = $state([]);
	/** @type {string} */
	let formAddress = $state('');
	/** @type {string} */
	let formNotes = $state('');
	/** @type {boolean} */
	let formIsActive = $state(true);

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;

			if (!state.loading && !state.user) {
				goto('/login');
			} else if (state.user) {
				loadCustomers();
			}
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * 고객 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadCustomers() {
		if (!user) return;

		isLoading = true;
		const { data, error } = await getCustomers({
			activeOnly: filters.activeOnly,
			custType: filters.custType || null,
			search: filters.search || null
		});

		if (error) {
			console.error('고객 목록 로드 실패:', error);
			customers = [];
		} else {
			customers = data || [];
		}
		isLoading = false;
	}

	/**
	 * 필터 적용 핸들러
	 * @returns {void}
	 */
	function handleApplyFilters() {
		loadCustomers();
	}

	/**
	 * 필터 초기화 핸들러
	 * @returns {void}
	 */
	function handleResetFilters() {
		filters = {
			search: '',
			custType: '',
			activeOnly: false
		};
		loadCustomers();
	}

	/**
	 * 고객 생성 핸들러
	 * @returns {void}
	 */
	function handleCreate() {
		editingCustomer = null;
		resetForm();
		showFormModal = true;
	}

	/**
	 * 고객 수정 핸들러
	 * @param {any} customer - 고객 데이터
	 * @returns {void}
	 */
	function handleEdit(customer) {
		editingCustomer = customer;
		formCode = customer.code || '';
		formCustType = customer.cust_type;
		formName = customer.name || '';
		formCompanyRegNo = customer.company_reg_no || '';
		formContactPersons = Array.isArray(customer.contact_persons)
			? customer.contact_persons
			: [];
		formAddress = customer.address || '';
		formNotes = customer.notes || '';
		formIsActive = customer.is_active !== undefined ? customer.is_active : true;
		showFormModal = true;
	}

	/**
	 * 폼 초기화
	 * @returns {void}
	 */
	function resetForm() {
		formCode = '';
		formCustType = 'demand';
		formName = '';
		formCompanyRegNo = '';
		formContactPersons = [];
		formAddress = '';
		formNotes = '';
		formIsActive = true;
	}

	/**
	 * 담당자 추가 핸들러
	 * @returns {void}
	 */
	function handleAddContactPerson() {
		formContactPersons = [...formContactPersons, { name: '', email: '', phone: '' }];
	}

	/**
	 * 담당자 제거 핸들러
	 * @param {number} index - 인덱스
	 * @returns {void}
	 */
	function handleRemoveContactPerson(index) {
		formContactPersons = formContactPersons.filter((_, i) => i !== index);
	}

	/**
	 * 담당자 정보 업데이트 핸들러
	 * @param {number} index - 인덱스
	 * @param {string} field - 필드명
	 * @param {string} value - 값
	 * @returns {void}
	 */
	function handleUpdateContactPerson(index, field, value) {
		formContactPersons = formContactPersons.map((person, i) =>
			i === index ? { ...person, [field]: value } : person
		);
	}

	/**
	 * 폼 제출 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleSubmit() {
		if (!formName) {
			alert('고객명은 필수입니다.');
			return;
		}

		const customerData = {
			code: formCode || null,
			cust_type: formCustType,
			name: formName,
			company_reg_no: formCompanyRegNo || null,
			contact_persons: formContactPersons.length > 0 ? formContactPersons : [],
			address: formAddress || null,
			notes: formNotes || null,
			is_active: formIsActive
		};

		let result;
		if (editingCustomer) {
			const { id, ...updates } = customerData;
			result = await updateCustomer(editingCustomer.id, updates);
		} else {
			result = await createCustomer(customerData);
		}

		if (result.error) {
			alert(`저장 실패: ${result.error.message || '알 수 없는 오류'}`);
			return;
		}

		// code가 없을 경우 안내 메시지 표시
		if (!formCode && !editingCustomer) {
			alert('등록된 이후에 고객 코드를 등록해야 합니다.');
		}

		showFormModal = false;
		resetForm();
		loadCustomers();
	}

	/**
	 * 폼 취소 핸들러
	 * @returns {void}
	 */
	function handleCancel() {
		showFormModal = false;
		resetForm();
		editingCustomer = null;
	}

	/**
	 * 고객 삭제 핸들러
	 * @param {any} customer - 고객 데이터
	 * @returns {Promise<void>}
	 */
	async function handleDelete(customer) {
		if (!confirm(`정말로 "${customer.name}" 고객을 삭제하시겠습니까?`)) {
			return;
		}

		const { error } = await deleteCustomer(customer.id);
		if (error) {
			alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
			return;
		}

		loadCustomers();
	}
</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<LogisticsSidebar bind:isOpen={isSidebarOpen} />

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto bg-gray-50">
			<div class="p-3">
				{#if authLoading}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로딩 중...</div>
					</div>
				{:else if !user}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로그인이 필요합니다.</div>
					</div>
				{:else}
					<div class="admin-content-page">
						<!-- 헤더 -->
						<div class="mb-6">
							<div class="flex items-center gap-3 mb-2">
								<!-- 모바일 햄버거 버튼 -->
								<button
									onclick={() => (isSidebarOpen = true)}
									class="md:hidden p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
									aria-label="메뉴 열기"
								>
									<svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6h16M4 12h16M4 18h16"
										></path>
									</svg>
								</button>
								<h1 class="text-3xl font-bold text-gray-800">고객 관리</h1>
							</div>
							<p class="text-gray-600">고객 정보를 관리합니다</p>
						</div>

						<!-- 필터 및 액션 -->
						<FilterBar
							bind:filters={filters}
							fields={[
								{
									key: 'search',
									type: 'input',
									placeholder: '고객명으로 검색...'
								},
								{
									key: 'custType',
									type: 'select',
									label: '고객 유형',
									options: [
										{ value: '', label: '전체' },
										...Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => ({
											value,
											label
										}))
									]
								}
							]}
							onApply={handleApplyFilters}
							onReset={handleResetFilters}
							actions={[
								{
									label: '고객 추가',
									onClick: handleCreate,
									variant: 'primary',
									icon: '+'
								}
							]}
						/>

						<!-- 활성화 필터 -->
						<div class="mb-4">
							<label class="flex items-center gap-2">
								<input
									type="checkbox"
									bind:checked={filters.activeOnly}
									onchange={handleApplyFilters}
									class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								<span class="text-sm text-gray-700">활성화된 고객만 보기</span>
							</label>
						</div>

						{#if isLoading}
							<div class="text-center py-12">
								<p class="text-gray-500">고객 목록을 불러오는 중...</p>
							</div>
						{:else if customers.length === 0}
							<div class="text-center py-12">
								<p class="text-gray-500">고객이 등록되지 않았습니다.</p>
							</div>
						{:else}
							<!-- 고객 목록 -->
							<DataTable
								headers={[
									{ label: '고객명/회사명' },
									{ label: '고객 코드', align: 'center' },
									{ label: '고객 유형', align: 'center' },
									{ label: '사업자등록번호', align: 'center' },
									{ label: '담당자 수', align: 'center' },
									{ label: '주소' },
									{ label: '상태', align: 'center' },
									{ label: '작업', align: 'center' }
								]}
								rowCount={customers.length}
								emptyMessage="고객이 없습니다."
							>
								{#each customers as customer}
									<tr>
										<td class="font-medium">{customer.name}</td>
										<td class="text-center font-mono text-sm">{customer.code || '-'}</td>
										<td class="text-center">
											<span class="badge badge-info">
												{CUSTOMER_TYPE_LABELS[customer.cust_type] || customer.cust_type}
											</span>
										</td>
										<td class="text-center">{customer.company_reg_no || '-'}</td>
										<td class="text-center">
											{Array.isArray(customer.contact_persons)
												? customer.contact_persons.length
												: 0}
										</td>
										<td class="max-w-xs truncate">{customer.address || '-'}</td>
										<td class="text-center">
											<span
												class="badge {customer.is_active ? 'badge-success' : 'badge-gray'}"
											>
												{customer.is_active ? '활성' : '비활성'}
											</span>
										</td>
										<td class="flex justify-center">
											<div class="action-buttons">
												<button
													onclick={() => handleEdit(customer)}
													class="btn-small btn-secondary"
												>
													수정
												</button>
												<button
													onclick={() => handleDelete(customer)}
													class="btn-small btn-danger"
												>
													삭제
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</DataTable>
						{/if}
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<!-- 고객 생성/수정 모달 -->
{#if showFormModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleCancel}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{editingCustomer ? '고객 수정' : '고객 추가'}</h2>
				<button onclick={handleCancel} class="modal-close">×</button>
			</div>
			<div class="modal-body">
				<div class="space-y-4">
					<!-- 고객 코드 -->
					<div>
						<label for="formCode" class="block text-sm font-medium text-gray-700 mb-1">
							고객 코드
						</label>
						<input
							type="text"
							id="formCode"
							bind:value={formCode}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="예: CUST001 (선택사항)"
							disabled={!!editingCustomer}
						/>
						<p class="text-xs text-gray-500 mt-1">
							{editingCustomer
								? '고객 코드는 수정할 수 없습니다.'
								: '고유한 고객 코드를 입력하세요. 비워두면 자동으로 생성됩니다.'}
						</p>
					</div>

					<!-- 고객 유형 -->
					<div>
						<label for="formCustType" class="block text-sm font-medium text-gray-700 mb-1">
							고객 유형 <span class="text-red-500">*</span>
						</label>
						<select
							id="formCustType"
							bind:value={formCustType}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{#each Object.entries(CUSTOMER_TYPE_LABELS) as [value, label]}
								<option value={value}>{label}</option>
							{/each}
						</select>
					</div>

					<!-- 고객명/회사명 -->
					<div>
						<label for="formName" class="block text-sm font-medium text-gray-700 mb-1">
							고객명/회사명 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formName"
							bind:value={formName}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="고객명 또는 회사명을 입력하세요"
							required
						/>
					</div>

					<!-- 사업자등록번호 -->
					<div>
						<label for="formCompanyRegNo" class="block text-sm font-medium text-gray-700 mb-1">
							사업자등록번호
						</label>
						<input
							type="text"
							id="formCompanyRegNo"
							bind:value={formCompanyRegNo}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="사업자등록번호를 입력하세요"
						/>
					</div>

					<!-- 담당자 정보 -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<span class="block text-sm font-medium text-gray-700">담당자 정보</span>
							<button
								type="button"
								onclick={handleAddContactPerson}
								class="text-sm text-blue-600 hover:text-blue-700"
							>
								+ 담당자 추가
							</button>
						</div>
						<div class="space-y-2">
							{#each formContactPersons as person, index}
								<div class="flex gap-2 items-start p-2 border border-gray-200 rounded">
									<div class="flex-1 grid grid-cols-3 gap-2">
										<input
											type="text"
											bind:value={person.name}
											oninput={(e) =>
												handleUpdateContactPerson(
													index,
													'name',
													e.target.value
												)}
											placeholder="이름"
											class="px-2 py-1 text-sm border border-gray-300 rounded"
										/>
										<input
											type="email"
											bind:value={person.email}
											oninput={(e) =>
												handleUpdateContactPerson(
													index,
													'email',
													e.target.value
												)}
											placeholder="이메일"
											class="px-2 py-1 text-sm border border-gray-300 rounded"
										/>
										<input
											type="tel"
											bind:value={person.phone}
											oninput={(e) =>
												handleUpdateContactPerson(
													index,
													'phone',
													e.target.value
												)}
											placeholder="전화번호"
											class="px-2 py-1 text-sm border border-gray-300 rounded"
										/>
									</div>
									<button
										type="button"
										onclick={() => handleRemoveContactPerson(index)}
										class="text-red-600 hover:text-red-700 px-2"
									>
										×
									</button>
								</div>
							{:else}
								<p class="text-sm text-gray-500">담당자가 없습니다. 추가 버튼을 클릭하여 추가하세요.</p>
							{/each}
						</div>
					</div>

					<!-- 주소 -->
					<div>
						<label for="formAddress" class="block text-sm font-medium text-gray-700 mb-1">
							주소
						</label>
						<input
							type="text"
							id="formAddress"
							bind:value={formAddress}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="주소를 입력하세요"
						/>
					</div>

					<!-- 비고 -->
					<div>
						<label for="formNotes" class="block text-sm font-medium text-gray-700 mb-1">
							비고
						</label>
						<textarea
							id="formNotes"
							bind:value={formNotes}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="비고를 입력하세요"
						></textarea>
					</div>

					<!-- 활성화 여부 -->
					<div>
						<label for="formIsActive" class="flex items-center gap-2">
							<input
								type="checkbox"
								id="formIsActive"
								bind:checked={formIsActive}
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">활성화</span>
						</label>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button onclick={handleCancel} class="btn-secondary">취소</button>
				<button onclick={handleSubmit} class="btn-primary">저장</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-content-page {
		width: 100%;
	}

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
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #6b7280;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.modal-close:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.modal-body {
		padding: 1rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
		padding: 8px 16px;
		border-radius: 6px;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		padding: 8px 16px;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	.badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.badge-info {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-success {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-gray {
		background: #f3f4f6;
		color: #6b7280;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.btn-small {
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-small.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-small.btn-secondary:hover {
		background: #e5e7eb;
	}

	.btn-small.btn-danger {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	.btn-small.btn-danger:hover {
		background: #fecaca;
		color: #7f1d1d;
	}
</style>
