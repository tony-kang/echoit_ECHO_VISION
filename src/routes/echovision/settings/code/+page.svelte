<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import {
		getSettings,
		getRootSettings,
		getChildSettings,
		createSetting,
		updateSetting,
		deleteSetting
	} from '$lib/settingsService';
	import { authStore } from '$lib/stores/authStore';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);
	/** @type {Array<any>} 전체 환경설정 코드 목록 (부모 이름 조회용) */
	let allSettings = $state([]);
	/** @type {Array<any>} 현재 표시할 환경설정 코드 목록 */
	let displayedSettings = $state([]);
	let isLoading = $state(false);
	let showFormModal = $state(false);
	/** @type {any} 수정 중인 항목 */
	let editingSetting = $state(null);
	/** @type {Array<any>} 상위 코드 목록 (최상위 항목) */
	let parentOptions = $state([]);
	/** @type {string|null|undefined} 현재 선택된 상위 코드 (undefined = 아직 초기화 안됨) */
	let currentParentCode = $state(undefined);

	// 폼 상태
	/** @type {string} */
	let formCode = $state('');
	/** @type {string|null} */
	let formParentCode = $state(null);
	/** @type {number} */
	let formOrder = $state(0);
	/** @type {number} */
	let formValue = $state(1);
	/** @type {string} */
	let formTitle = $state('');
	/** @type {string} */
	let formComment = $state('');

	/**
	 * URL 쿼리 파라미터에서 sCode 읽기
	 * @type {string|null}
	 */
	const sCodeParam = $derived(page.url.searchParams.get('sCode'));

	/**
	 * 현재 선택된 상위 코드 결정 (sCode가 없으면 null = 최상위)
	 * @type {string|null}
	 */
	const selectedCode = $derived(sCodeParam || null);

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;

			if (!state.loading && !state.user) {
				goto('/login');
			} else if (state.user) {
				loadParentOptions();
			}
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * 사용자 인증 후 초기 로드 및 sCode 변경 시 설정 로드
	 */
	$effect(() => {
		if (user && !authLoading) {
			// sCode가 없으면 null (최상위)로 설정
			const codeToUse = selectedCode || null;
			// 초기화되지 않았거나 값이 변경된 경우에만 로드
			if (currentParentCode === undefined || currentParentCode !== codeToUse) {
				currentParentCode = codeToUse;
				loadSettings();
			}
		}
	});

	/**
	 * 환경설정 코드 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadSettings() {
		if (!user) return;

		isLoading = true;
		
		// 전체 설정 로드 (부모 이름 조회용)
		const { data: allData } = await getSettings({
			orderByOrder: true
		});
		if (allData) {
			allSettings = allData;
		}
		
		// currentParentCode가 undefined이면 null로 처리 (최상위)
		const parentCodeToLoad = currentParentCode === undefined ? null : currentParentCode;
		
		// sCode가 있으면 해당 부모의 자식만, 없으면 최상위만 조회
		const { data, error } = await getSettings({
			orderByOrder: true,
			parentCode: parentCodeToLoad
		});

		if (error) {
			console.error('환경설정 코드 목록 로드 실패:', error);
			displayedSettings = [];
		} else {
			displayedSettings = data || [];
		}
		isLoading = false;
	}

	/**
	 * 상위 코드 옵션 로드
	 * @returns {Promise<void>}
	 */
	async function loadParentOptions() {
		const { data, error } = await getRootSettings();
		if (!error && data) {
			parentOptions = data || [];
		}
	}

	/**
	 * 부모 코드로 이동 (URL 업데이트)
	 * @param {string|null} code - 상위 코드 (null이면 최상위)
	 * @returns {Promise<void>}
	 */
	async function navigateToCode(code) {
		const url = new URL(page.url);
		if (code) {
			url.searchParams.set('sCode', code);
		} else {
			url.searchParams.delete('sCode');
		}
		await goto(url.pathname + url.search, { replaceState: true, noScroll: true });
		// URL 변경 후 currentParentCode 업데이트 및 로드
		currentParentCode = code || null;
		await loadSettings();
	}

	/**
	 * 상위 코드 이름 가져오기
	 * @param {string|null} parentCode - 상위 코드
	 * @returns {string}
	 */
	function getParentName(parentCode) {
		if (!parentCode) return '-';
		const parent = allSettings.find((s) => s.code === parentCode);
		return parent ? parent.title : parentCode;
	}

	/**
	 * 코드에 자식이 있는지 확인
	 * @param {string} code - 확인할 코드
	 * @returns {boolean}
	 */
	function hasChildren(code) {
		return allSettings.some((s) => s.parent_code === code);
	}

	/**
	 * 현재 부모 코드의 제목 가져오기
	 * @returns {string}
	 */
	function getCurrentParentTitle() {
		if (!currentParentCode) return '최상위';
		return getParentName(currentParentCode);
	}

	/**
	 * 환경설정 코드 생성 핸들러
	 * @returns {void}
	 */
	function handleCreate() {
		editingSetting = null;
		resetForm();
		showFormModal = true;
	}

	/**
	 * 환경설정 코드 수정 핸들러
	 * @param {any} setting - 환경설정 데이터
	 * @returns {void}
	 */
	function handleEdit(setting) {
		editingSetting = setting;
		formCode = setting.code || '';
		formParentCode = setting.parent_code || null;
		formOrder = setting.order || 0;
		formValue = setting.value || 1;
		formTitle = setting.title || '';
		formComment = setting.comment || '';
		showFormModal = true;
	}

	/**
	 * 폼 초기화
	 * @returns {void}
	 */
	function resetForm() {
		formCode = '';
		formParentCode = null;
		formOrder = 0;
		formValue = 1;
		formTitle = '';
		formComment = '';
	}

	/**
	 * 폼 제출 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleSubmit() {
		if (!formCode || formCode.length > 16) {
			alert('코드는 필수이며 최대 16자리까지 가능합니다.');
			return;
		}
		if (formValue < 1) {
			alert('값은 1 이상이어야 합니다.');
			return;
		}
		if (!formTitle) {
			alert('제목은 필수입니다.');
			return;
		}

		const settingData = {
			code: formCode,
			parent_code: formParentCode || null,
			order: formOrder,
			value: formValue,
			title: formTitle,
			comment: formComment || null
		};

		let result;
		if (editingSetting) {
			result = await updateSetting(editingSetting.code, settingData);
		} else {
			result = await createSetting(settingData);
		}

		if (result.error) {
			alert(`저장 실패: ${result.error.message || '알 수 없는 오류'}`);
			return;
		}

		showFormModal = false;
		resetForm();
		await loadParentOptions();
		await loadSettings();
	}

	/**
	 * 폼 취소 핸들러
	 * @returns {void}
	 */
	function handleCancel() {
		showFormModal = false;
		resetForm();
		editingSetting = null;
	}

	/**
	 * 환경설정 코드 삭제 핸들러
	 * @param {any} setting - 환경설정 데이터
	 * @returns {Promise<void>}
	 */
	async function handleDelete(setting) {
		if (!confirm(`정말로 "${setting.title}" 코드를 삭제하시겠습니까?`)) {
			return;
		}

		const { error } = await deleteSetting(setting.code);
		if (error) {
			alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
			return;
		}

		await loadParentOptions();
		await loadSettings();
	}

</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<PrjMainSidebar bind:isOpen={isSidebarOpen} />

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
								<h1 class="text-3xl font-bold text-gray-800">환경설정 코드 관리</h1>
							</div>
							<p class="text-gray-600">환경설정 코드 및 값을 관리합니다</p>
						</div>

						<!-- 네비게이션 및 액션 -->
						<div class="mb-4 flex items-center justify-between">
							<!-- 상위 코드 네비게이션 -->
							<div class="flex items-center gap-2">
								{#if currentParentCode}
									<button
										onclick={() => navigateToCode(null)}
										class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
										</svg>
										최상위로
									</button>
									<span class="text-gray-400">/</span>
									<span class="text-sm text-gray-700">{getCurrentParentTitle()}</span>
								{:else}
									<span class="text-sm text-gray-700 font-medium">최상위 코드</span>
								{/if}
							</div>
							
							<!-- 코드 추가 버튼 -->
							<button
								onclick={handleCreate}
								class="btn-primary flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								코드 추가
							</button>
						</div>

						{#if isLoading}
							<div class="text-center py-12">
								<p class="text-gray-500">환경설정 코드 목록을 불러오는 중...</p>
							</div>
						{:else if displayedSettings.length === 0}
							<div class="text-center py-12">
								<p class="text-gray-500">환경설정 코드가 등록되지 않았습니다.</p>
							</div>
						{:else}
							<!-- 환경설정 코드 목록 -->
							<DataTable
								headers={[
									{ label: '코드', align: 'center' },
									{ label: '제목' },
									{ label: '표시 순서', align: 'center' },
									{ label: '값', align: 'center' },
									{ label: '상위 코드', align: 'center' },
									{ label: '설명', align: 'center' },
									{ label: '작업', align: 'center' }
								]}
								rowCount={displayedSettings.length}
								emptyMessage="환경설정 코드가 없습니다."
							>
								{#each displayedSettings as setting}
									<tr class="hover:bg-gray-50 cursor-pointer" onclick={() => navigateToCode(setting.code)}>
										<td class="text-center font-mono text-sm font-medium">{setting.code}</td>
										<td class="font-medium">
											<div class="flex items-center gap-2">
												{setting.title}
												{#if hasChildren(setting.code)}
													<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
													</svg>
												{/if}
											</div>
										</td>
										<td class="text-center">{setting.order || 0}</td>
										<td class="text-center font-semibold">{setting.value}</td>
										<td class="text-center">
											{#if setting.parent_code}
												<span class="badge badge-info">
													{getParentName(setting.parent_code)}
												</span>
											{:else}
												<span class="text-gray-400">-</span>
											{/if}
										</td>
										<td class="text-center">
											{setting.comment || '-'}
										</td>
										<td class="flex justify-center" onclick={(e) => e.stopPropagation()}>
											<div class="action-buttons">
												<button
													onclick={() => handleEdit(setting)}
													class="btn-small btn-secondary"
												>
													수정
												</button>
												<button
													onclick={() => handleDelete(setting)}
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

<!-- 환경설정 코드 생성/수정 모달 -->
{#if showFormModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleCancel}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{editingSetting ? '환경설정 코드 수정' : '환경설정 코드 추가'}</h2>
				<button onclick={handleCancel} class="modal-close">×</button>
			</div>
			<div class="modal-body">
				<div class="space-y-4">
					<!-- 코드 -->
					<div>
						<label for="formCode" class="block text-sm font-medium text-gray-700 mb-1">
							코드 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formCode"
							bind:value={formCode}
							maxlength="16"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="최대 16자리 코드 입력"
							required
							disabled={!!editingSetting}
						/>
						<p class="text-xs text-gray-500 mt-1">
							{editingSetting
								? '코드는 수정할 수 없습니다.'
								: '고유한 코드를 입력하세요. (최대 16자리)'}
						</p>
					</div>

					<!-- 상위 코드 -->
					<div>
						<label for="formParentCode" class="block text-sm font-medium text-gray-700 mb-1">
							상위 코드
						</label>
						<select
							id="formParentCode"
							bind:value={formParentCode}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value={null}>없음 (최상위)</option>
							{#each parentOptions as parent}
								{#if !editingSetting || parent.code !== editingSetting.code}
									<option value={parent.code}>
										{parent.code} - {parent.title}
									</option>
								{/if}
							{/each}
						</select>
						<p class="text-xs text-gray-500 mt-1">부모 코드를 선택하면 계층 구조가 생성됩니다.</p>
					</div>

					<!-- 표시 순서 -->
					<div>
						<label for="formOrder" class="block text-sm font-medium text-gray-700 mb-1">
							표시 순서
						</label>
						<input
							type="number"
							id="formOrder"
							bind:value={formOrder}
							min="0"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0"
						/>
					</div>

					<!-- 값 -->
					<div>
						<label for="formValue" class="block text-sm font-medium text-gray-700 mb-1">
							값 <span class="text-red-500">*</span>
						</label>
						<input
							type="number"
							id="formValue"
							bind:value={formValue}
							min="1"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="1 이상의 숫자"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">값은 1 이상이어야 합니다.</p>
					</div>

					<!-- 제목 -->
					<div>
						<label for="formTitle" class="block text-sm font-medium text-gray-700 mb-1">
							제목 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formTitle"
							bind:value={formTitle}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="제목을 입력하세요"
							required
						/>
					</div>

					<!-- 설명 -->
					<div>
						<label for="formComment" class="block text-sm font-medium text-gray-700 mb-1">
							설명
						</label>
						<textarea
							id="formComment"
							bind:value={formComment}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="설명을 입력하세요 (선택사항)"
						></textarea>
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
