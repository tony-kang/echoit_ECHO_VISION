<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { getEvCodes, createEvCode, updateEvCode, deleteEvCode } from '$lib/settingsService';
	import { getSettings } from '$lib/settingsService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);
	/** @type {Array<any>} ev_code 목록 */
	let evCodes = $state([]);
	/** @type {Record<string, any>} 필터 객체 */
	let filters = $state({ code: '', category: '' });
	/** @type {boolean} 로딩 중 여부 */
	let isLoading = $state(false);
	/** @type {boolean} 폼 저장 중 여부 */
	let isSaving = $state(false);
	/** @type {boolean} 폼 모달 표시 여부 */
	let showFormModal = $state(false);
	/** @type {any} 수정 중인 항목 */
	let editingEvCode = $state(null);
	/** @type {Array<any>} env_code 목록 (items 선택용) */
	let envCodeOptions = $state([]);
	/** @type {Array<any>} env_code 최상위 레벨 항목 (코드 선택용) */
	let topLevelEnvCodes = $state([]);
	/** @type {boolean} 데이터 로드 완료 여부 */
	let dataLoaded = $state(false);

	// 폼 상태
	/** @type {string} 코드 */
	let formCode = $state('');
	/** @type {string} 구분 */
	let formCategory = $state('');
	/** @type {string} 제목 */
	let formTitle = $state('');
	/** @type {string[]} 항목 배열 */
	let formItems = $state([]);
	/** @type {string} 설명 */
	let formComment = $state('');
	/** @type {number} 출력순서 */
	let formDisplayOrder = $state(0);
	/** @type {string} 새 항목 입력값 */
	let newItemValue = $state('');
	/** @type {string} 항목 검색어 */
	let itemSearchQuery = $state('');
	/** @type {boolean} 항목 드롭다운 표시 여부 */
	let showItemDropdown = $state(false);
	/** @type {Set<string>} 선택된 항목들 (체크박스) */
	let selectedItems = $state(new Set());

	/**
	 * ev_code 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadEvCodes() {
		isLoading = true;
		try {
			const { data, error } = await getEvCodes({ category: filters.category || undefined });
			if (error) {
				console.error('ev_code 로드 실패:', error);
				evCodes = [];
			} else {
				evCodes = data || [];
			}
		} catch (error) {
			console.error('ev_code 로드 중 예외 발생:', error);
			evCodes = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * env_code 목록 로드 (items 선택용)
	 * @returns {Promise<void>}
	 */
	async function loadEnvCodeOptions() {
		try {
			// organization 카테고리의 env_code만 로드
			const organizationResult = await getSettings({ category: 'organization' });

			console.log('[loadEnvCodeOptions] organizationResult:', $state.snapshot(organizationResult));

			if (organizationResult.data) {
				envCodeOptions = organizationResult.data.map(code => ({
					value: code.code,
					label: `${code.code} - ${code.title}`,
					code: code.code,
					title: code.title,
					category: code.category,
					param: code.param || []
				}));
			} else {
				envCodeOptions = [];
			}
		} catch (error) {
			console.error('env_code 옵션 로드 실패:', error);
			envCodeOptions = [];
		}
	}

	/**
	 * env_code 최상위 레벨 항목 로드 (코드 선택용)
	 * @returns {Promise<void>}
	 */
	async function loadTopLevelEnvCodes() {
		try {
			// sales와 cost 카테고리의 최상위 레벨 env_code만 로드 (parent_code가 없는 항목)
			const [salesResult, costResult] = await Promise.all([
				getSettings({ category: 'sales' }),
				getSettings({ category: 'cost' })
			]);

			const allCodes = [];
			if (salesResult.data) allCodes.push(...salesResult.data);
			if (costResult.data) allCodes.push(...costResult.data);
			
			// 최상위 레벨만 필터링 (parent_code가 null이거나 없는 항목)
			topLevelEnvCodes = allCodes
				.filter(code => !code.parent_code)
				.map(code => ({
					value: code.code,
					label: `${code.code} - ${code.title}`,
					code: code.code,
					title: code.title,
					category: code.category
				}));
		} catch (error) {
			console.error('env_code 최상위 레벨 항목 로드 실패:', error);
			topLevelEnvCodes = [];
		}
	}

	/**
	 * 필터 적용 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleFilterApply() {
		await loadEvCodes();
	}

	/**
	 * 필터 초기화 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleFilterReset() {
		filters = { code: '', category: '' };
		await loadEvCodes();
	}

	/**
	 * 코드 추가 핸들러
	 * @returns {void}
	 */
	function handleCreate() {
		resetForm();
		editingEvCode = null;
		showFormModal = true;
	}

	/**
	 * 코드 수정 핸들러
	 * @param {any} evCode - ev_code 데이터
	 * @returns {void}
	 */
	function handleEdit(evCode) {
		editingEvCode = evCode;
		formCode = evCode.item_code;
		formCategory = evCode.category;
		formTitle = evCode.title || '';
		formItems = evCode.items ? [...evCode.items] : [];
		formComment = evCode.comment || '';
		formDisplayOrder = evCode.display_order || 0;
		showFormModal = true;
	}

	/**
	 * 코드 삭제 핸들러
	 * @param {any} evCode - ev_code 데이터
	 * @returns {Promise<void>}
	 */
	async function handleDelete(evCode) {
		if (!confirm(`정말로 "${evCode.item_code}" 코드를 삭제하시겠습니까?`)) {
			return;
		}

		try {
			const { error } = await deleteEvCode(evCode.item_code);
			
			if (error) {
				alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
				console.error('삭제 실패:', error);
				return;
			}

			await loadEvCodes();
		} catch (error) {
			console.error('삭제 중 예외 발생:', error);
			alert(`삭제 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
		}
	}

	/**
	 * 선택된 카테고리에 해당하는 최상위 레벨 env_code 목록 가져오기
	 * @type {Array<any>}
	 */
	const filteredTopLevelEnvCodes = $derived.by(() => {
		if (!formCategory) return [];
		return topLevelEnvCodes.filter(code => code.category === formCategory);
	});


	/**
	 * 폼 초기화
	 * @returns {void}
	 */
	function resetForm() {
		formCode = '';
		formCategory = '';
		formTitle = '';
		formItems = [];
		formComment = '';
		formDisplayOrder = 0;
		newItemValue = '';
		itemSearchQuery = '';
		showItemDropdown = false;
		selectedItems.clear();
	}

	/**
	 * 카테고리 변경 핸들러
	 * @returns {void}
	 */
	function handleCategoryChange() {
		// 카테고리가 변경되면 코드 초기화
		formCode = '';
	}

	/**
	 * 폼 저장 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleSave() {
		if (!formCode || formCode.trim() === '') {
			alert('코드를 입력해주세요.');
			return;
		}

		if (!formCategory || !['sales', 'cost'].includes(formCategory)) {
			alert('구분을 선택해주세요.');
			return;
		}

		isSaving = true;
		
		try {
			const evCodeData = {
				code: formCode.trim(),
				category: formCategory,
				title: formTitle.trim() || null,
				items: formItems.filter(item => item && item.trim() !== ''),
				comment: formComment || null,
				display_order: formDisplayOrder || 0
			};

			let result;
			if (editingEvCode) {
				result = await updateEvCode(editingEvCode.item_code, evCodeData);
			} else {
				result = await createEvCode(evCodeData);
			}

			if (result.error) {
				alert(`저장 실패: ${result.error.message || '알 수 없는 오류'}`);
				console.error('저장 오류:', result.error);
				return;
			}

			showFormModal = false;
			resetForm();
			editingEvCode = null;
			await loadEvCodes();
		} catch (error) {
			console.error('저장 중 예외 발생:', error);
			alert(`저장 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
		} finally {
			isSaving = false;
		}
	}

	/**
	 * 폼 취소 핸들러
	 * @returns {void}
	 */
	function handleCancel() {
		showFormModal = false;
		resetForm();
		editingEvCode = null;
	}

	/**
	 * 필터링된 항목 옵션 목록
	 * @type {Array<{value: string, label: string}>}
	 */
	const filteredItemOptions = $derived.by(() => {
		if (!formCategory) return [];
		
		const query = itemSearchQuery.toLowerCase().trim();
		
		// organization 카테고리 항목만 사용 (이미 loadEnvCodeOptions에서 organization만 로드됨)
		const categoryOptions = envCodeOptions;

		if (!query) {
			return categoryOptions;
		}

		return categoryOptions.filter(option => {
			// 코드로 검색
			if (option.value.toLowerCase().includes(query)) {
				return true;
			}
			// 제목으로 검색
			if (option.title && option.title.toLowerCase().includes(query)) {
				return true;
			}
			// param 배열로 검색
			if (option.param && Array.isArray(option.param)) {
				for (const param of option.param) {
					if (param && param.toLowerCase().includes(query)) {
						return true;
					}
				}
			}
			// label로 검색 (fallback)
			if (option.label && option.label.toLowerCase().includes(query)) {
				return true;
			}
			return false;
		});
	});

	/**
	 * 선택 가능한 항목 목록 (이미 추가되지 않은 항목만)
	 * @type {Array<{value: string, label: string}>}
	 */
	const selectableItemOptions = $derived.by(() => {
		return filteredItemOptions.filter(option => !formItems.includes(option.value));
	});

	/**
	 * 전체 선택 가능 여부
	 * @type {boolean}
	 */
	const canSelectAll = $derived.by(() => {
		return selectableItemOptions.length > 0 && selectedItems.size < selectableItemOptions.length;
	});

	/**
	 * 전체 해제 가능 여부
	 * @type {boolean}
	 */
	const canDeselectAll = $derived.by(() => {
		return selectedItems.size > 0;
	});

	/**
	 * 항목 추가 핸들러
	 * @returns {void}
	 */
	function handleAddItem() {
		const trimmed = newItemValue.trim();
		if (trimmed && !formItems.includes(trimmed)) {
			formItems = [...formItems, trimmed];
			newItemValue = '';
			itemSearchQuery = '';
			showItemDropdown = false;
		}
	}

	/**
	 * 항목 선택 핸들러 (단일 클릭 - 기존 방식 유지)
	 * @param {string} value - 선택된 항목 값
	 * @returns {void}
	 */
	function handleSelectItem(value) {
		if (value && !formItems.includes(value)) {
			formItems = [...formItems, value];
			newItemValue = value;
			itemSearchQuery = '';
			showItemDropdown = false;
			selectedItems.clear();
		}
	}

	/**
	 * 체크박스 선택/해제 핸들러
	 * @param {string} value - 항목 값
	 * @param {boolean} checked - 체크 상태
	 * @returns {void}
	 */
	function handleCheckboxChange(value, checked) {
		if (checked) {
			selectedItems.add(value);
		} else {
			selectedItems.delete(value);
		}
		selectedItems = new Set(selectedItems); // 반응성 유지
	}

	/**
	 * 선택된 항목들을 한 번에 추가
	 * @param {MouseEvent} event - 클릭 이벤트
	 * @returns {void}
	 */
	function handleAddSelectedItems(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		
		const itemsToAdd = Array.from(selectedItems).filter(
			value => value && !formItems.includes(value)
		);
		
		if (itemsToAdd.length > 0) {
			formItems = [...formItems, ...itemsToAdd];
			selectedItems = new Set(); // 반응성 유지를 위해 새 Set 생성
			itemSearchQuery = '';
			showItemDropdown = false;
		}
	}

	/**
	 * 전체 선택/해제 핸들러
	 * @param {boolean} selectAll - true면 전체 선택, false면 전체 해제
	 * @returns {void}
	 */
	function handleSelectAll(selectAll) {
		if (selectAll) {
			const availableItems = selectableItemOptions.map(option => option.value);
			selectedItems = new Set(availableItems);
		} else {
			selectedItems.clear();
		}
		selectedItems = new Set(selectedItems); // 반응성 유지
	}

	/**
	 * 항목 검색어 변경 핸들러
	 * @param {Event} event - 입력 이벤트
	 * @returns {void}
	 */
	function handleItemSearchInput(event) {
		const value = event.currentTarget.value;
		itemSearchQuery = value;
		showItemDropdown = true;
		
		// 정확히 일치하는 항목이 있으면 자동 선택
		if (formCategory) {
			// organization 카테고리 항목만 사용 (이미 loadEnvCodeOptions에서 organization만 로드됨)
			const trimmedValue = value.toLowerCase().trim();
			const exactMatch = envCodeOptions.find(opt => {
				// 코드 정확 일치
				if (opt.value.toLowerCase() === trimmedValue) {
					return true;
				}
				// 제목 정확 일치
				if (opt.title && opt.title.toLowerCase() === trimmedValue) {
					return true;
				}
				// param 배열에서 정확 일치
				if (opt.param && Array.isArray(opt.param)) {
					for (const param of opt.param) {
						if (param && param.toLowerCase() === trimmedValue) {
							return true;
						}
					}
				}
				return false;
			});
			
			if (exactMatch && !formItems.includes(exactMatch.value)) {
				newItemValue = exactMatch.value;
			} else {
				newItemValue = '';
			}
		} else {
			newItemValue = '';
		}
	}

	/**
	 * 항목 삭제 핸들러
	 * @param {number} index - 삭제할 인덱스
	 * @returns {void}
	 */
	function handleRemoveItem(index) {
		formItems = formItems.filter((_, i) => i !== index);
	}

	/**
	 * 필터링된 ev_code 목록 (display_order 순서대로 정렬)
	 * @type {Array<any>}
	 */
	const filteredEvCodes = $derived.by(() => {
		let filtered = evCodes;
		if (filters.code) {
			const codeFilter = filters.code.toLowerCase();
			filtered = evCodes.filter(evCode => 
				evCode.item_code?.toLowerCase().includes(codeFilter)
			);
		}
		// display_order 순서대로 정렬 (작은 값이 먼저, 같으면 item_code 순서)
		// 복사본을 만들어서 정렬 (원본 배열 변경 방지)
		return [...filtered].sort((a, b) => {
			const orderA = a.display_order || 0;
			const orderB = b.display_order || 0;
			if (orderA !== orderB) {
				return orderA - orderB;
			}
			// display_order가 같으면 item_code로 정렬
			return (a.item_code || '').localeCompare(b.item_code || '');
		});
	});

	/**
	 * FilterBar 필드 정의
	 * @type {Array<{key: string, type: string, label: string, placeholder?: string, options?: Array<{value: string, label: string}>}>}
	 */
	const filterFields = [
		{
			key: 'category',
			type: 'select',
			label: '구분',
			options: [
				{ value: '', label: '전체' },
				{ value: 'sales', label: '매출' },
				{ value: 'cost', label: '비용' }
			]
		},
		{
			key: 'code',
			type: 'input',
			label: '코드',
			placeholder: '코드 검색...'
		}
	];

	/**
	 * FilterBar 액션 버튼 정의
	 * @type {Array<{label: string, onClick: Function, variant: string, icon: string}>}
	 */
	const actionButtons = [
		{
			label: '코드 추가',
			onClick: handleCreate,
			variant: 'primary',
			icon: '+'
		}
	];

	onMount(() => {
		// 타임아웃 설정: 10초 후에도 로딩이 끝나지 않으면 에러 처리
		let timeoutId = null;
		
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;

			if (!state.loading) {
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = null;
				}
			} else if (!timeoutId) {
				timeoutId = setTimeout(() => {
					if (authLoading) {
						console.error('[amount-code/+page] 인증 로딩 타임아웃 (10초)');
						authLoading = false;
					}
					timeoutId = null;
				}, 10000);
			}

			if (!state.loading && !state.user) {
				goto('/login');
			}
		});

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			unsubscribe();
		};
	});

	// 사용자 변경 시 데이터 로드 (한 번만 실행)
	$effect(() => {
		if (user && !authLoading && !dataLoaded) {
			dataLoaded = true;
			loadEvCodes();
			loadEnvCodeOptions();
			loadTopLevelEnvCodes();
		}
	});
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
										/>
									</svg>
								</button>
								<h1 class="text-3xl font-bold text-gray-800">매출/비용 코드 관리</h1>
							</div>
							<p class="text-gray-600">매출과 비용의 세부항목(코드)을 관리합니다.</p>
						</div>

						<!-- FilterBar -->
						<FilterBar
							bind:filters={filters}
							fields={filterFields}
							onApply={handleFilterApply}
							onReset={handleFilterReset}
							actions={actionButtons}
						/>

						{#if isLoading}
							<div class="text-center py-12">
								<p class="text-gray-500">데이터를 불러오는 중...</p>
							</div>
						{:else if filteredEvCodes.length === 0}
							<div class="text-center py-12">
								<p class="text-gray-500">등록된 코드가 없습니다.</p>
							</div>
						{:else}
							<!-- DataTable -->
							<DataTable
								headers={[
									{ label: '코드' },
									{ label: '구분' },
									{ label: '제목' },
									{ label: '항목 수' },
									{ label: '항목' },
									{ label: '출력순서', align: 'center' },	
									{ label: '설명' },
									{ label: '생성일' },
									{ label: '수정일' },
									{ label: '작업', align: 'center' }
								]}
								rowCount={filteredEvCodes.length}
								emptyMessage="등록된 코드가 없습니다."
							>
								{#each filteredEvCodes as evCode}
									<tr>
										<td class="font-mono text-sm">{evCode.item_code}</td>
										<td>
											<span class="px-2 py-1 rounded text-xs font-semibold {evCode.category === 'sales' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
												{evCode.category === 'sales' ? '매출' : '비용'}
											</span>
										</td>
										<td>{evCode.title || '-'}</td>
										<td>{evCode.items?.length || 0}</td>
										<td>
											<div class="flex flex-wrap gap-1">
												{#each (evCode.items || []).slice(0, 3) as item}
													<span class="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{item}</span>
												{/each}
												{#if (evCode.items || []).length > 3}
													<span class="px-2 py-1 bg-gray-100 rounded text-xs">+{(evCode.items || []).length - 3}</span>
												{/if}
											</div>
										</td>
										<td class="text-center">{evCode.display_order || 0}</td>
										<td class="max-w-xs truncate" title={evCode.comment || ''}>{evCode.comment || '-'}</td>
										<td class="text-sm text-gray-600">{new Date(evCode.created_at).toLocaleDateString('ko-KR')}</td>
										<td class="text-sm text-gray-600">{new Date(evCode.updated_at).toLocaleDateString('ko-KR')}</td>
										<td>
											<div class="flex gap-2 justify-center">
												<button
													onclick={() => handleEdit(evCode)}
													class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
													title="수정"
												>
													수정
												</button>
												<button
													onclick={() => handleDelete(evCode)}
													class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
													title="삭제"
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

<!-- 폼 모달 -->
{#if showFormModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleCancel}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="text-xl font-bold">{editingEvCode ? '코드 수정' : '코드 추가'}</h2>
				<button onclick={handleCancel} class="modal-close">×</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label class="form-label">구분 *</label>
					<select 
						bind:value={formCategory} 
						onchange={handleCategoryChange}
						class="form-input" 
						disabled={!!editingEvCode}
					>
						<option value="">구분을 선택하세요</option>
						<option value="sales">매출</option>
						<option value="cost">비용</option>
					</select>
					{#if editingEvCode}
						<p class="text-xs text-gray-500 mt-1">구분은 수정할 수 없습니다.</p>
					{:else if !formCategory}
						<p class="text-xs text-gray-500 mt-1">구분을 먼저 선택해주세요.</p>
					{/if}
				</div>

				{#if formCategory || editingEvCode}
					<div class="form-group">
						<label class="form-label">코드 *</label>
						{#if editingEvCode}
							<input
								type="text"
								value={formCode}
								class="form-input"
								readonly
								disabled
							/>
							<p class="text-xs text-gray-500 mt-1">코드는 수정할 수 없습니다.</p>
						{:else}
							<select
								bind:value={formCode}
								class="form-input"
								disabled={!formCategory || filteredTopLevelEnvCodes.length === 0}
							>
								<option value="">코드를 선택하세요</option>
								{#each filteredTopLevelEnvCodes as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
							{#if !formCategory}
								<p class="text-xs text-gray-500 mt-1">구분을 먼저 선택해주세요.</p>
							{:else if filteredTopLevelEnvCodes.length === 0}
								<p class="text-xs text-gray-500 mt-1">선택 가능한 최상위 레벨 코드가 없습니다.</p>
							{:else if formCode}
								<p class="text-xs text-green-600 mt-1">코드가 선택되었습니다.</p>
							{/if}
						{/if}
					</div>

					<div class="form-group">
						<label class="form-label">제목</label>
						<input
							type="text"
							bind:value={formTitle}
							placeholder="제목을 입력하세요"
							class="form-input"
						/>
					</div>

					<div class="form-group">
						<label class="form-label">구성항목</label>
						<div class="item-search-container relative">
							<div class="flex gap-2 mb-2">
								<div class="flex-1 relative">
									<input
										type="text"
										bind:value={itemSearchQuery}
										oninput={handleItemSearchInput}
										onfocus={() => showItemDropdown = true}
										onblur={() => {
											// 드롭다운이 닫히지 않도록 약간의 지연
											setTimeout(() => {
												// 포커스가 드롭다운 내부로 이동했는지 확인
												const activeElement = document.activeElement;
												const dropdown = document.querySelector('.item-dropdown');
												if (!dropdown?.contains(activeElement)) {
													showItemDropdown = false;
												}
											}, 200);
										}}
										placeholder="코드 또는 제목으로 검색..."
										class="form-input w-full"
									/>
									{#if showItemDropdown && selectableItemOptions.length > 0}
										<div 
											class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto item-dropdown"
											onmousedown={(e) => e.preventDefault()}
										>
											<!-- 전체 선택/해제 헤더 -->
											<div class="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
												<div class="flex items-center gap-2">
													<input
														type="checkbox"
														checked={selectedItems.size === selectableItemOptions.length && selectableItemOptions.length > 0}
														onchange={(e) => {
															e.stopPropagation();
															handleSelectAll(e.target.checked);
														}}
														onmousedown={(e) => e.stopPropagation()}
														class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
													/>
													<span class="text-sm font-medium text-gray-700">
														전체 선택 ({selectedItems.size}/{selectableItemOptions.length})
													</span>
												</div>
												{#if selectedItems.size > 0}
													<button
														type="button"
														onclick={handleAddSelectedItems}
														onmousedown={(e) => e.preventDefault()}
														class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
													>
														선택한 {selectedItems.size}개 추가
													</button>
												{/if}
											</div>
											<!-- 항목 목록 -->
											{#each selectableItemOptions as option}
												<label 
													class="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
													onmousedown={(e) => e.preventDefault()}
												>
													<input
														type="checkbox"
														checked={selectedItems.has(option.value)}
														onchange={(e) => {
															e.stopPropagation();
															handleCheckboxChange(option.value, e.target.checked);
														}}
														onmousedown={(e) => e.stopPropagation()}
														class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
													/>
													<div class="flex-1">
														<div class="font-mono text-sm text-gray-700">{option.value}</div>
														<div class="text-xs text-gray-500">{option.label.replace(`${option.value} - `, '')}</div>
													</div>
													<!-- 단일 클릭으로도 추가 가능 (기존 방식 유지) -->
													<button
														type="button"
														onmousedown={(e) => {
															e.preventDefault();
															e.stopPropagation();
														}}
														onclick={(e) => {
															e.stopPropagation();
															handleSelectItem(option.value);
														}}
														class="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
													>
														추가
													</button>
												</label>
											{/each}
										</div>
									{/if}
									{#if showItemDropdown && itemSearchQuery && filteredItemOptions.length === 0}
										<div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-500">
											검색 결과가 없습니다.
										</div>
									{/if}
								</div>
								<button
									type="button"
									onclick={handleAddItem}
									class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
									disabled={!newItemValue || formItems.includes(newItemValue)}
								>
									추가
								</button>
							</div>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each formItems as item, index}
								<span class="px-3 py-1 bg-gray-100 rounded flex items-center gap-2">
									<span class="font-mono text-sm">{item}</span>
									<button
										type="button"
										onclick={() => handleRemoveItem(index)}
										class="text-red-500 hover:text-red-700"
										title="삭제"
									>
										×
									</button>
								</span>
							{/each}
						</div>
						{#if formItems.length === 0}
							<p class="text-xs text-gray-500 mt-1">항목이 없습니다. 위에서 항목을 검색하여 추가하세요.</p>
						{/if}
					</div>

					<div class="form-group">
						<label class="form-label">설명</label>
						<textarea
							bind:value={formComment}
							placeholder="설명을 입력하세요"
							class="form-input"
							rows="3"
						></textarea>
					</div>

					<div class="form-group">
						<label class="form-label">출력순서</label>
						<input
							type="number"
							bind:value={formDisplayOrder}
							placeholder="출력순서를 입력하세요 (작은 값이 먼저 표시됨)"
							class="form-input"
							min="0"
						/>
						<p class="text-xs text-gray-500 mt-1">작은 값이 먼저 표시됩니다. 기본값은 0입니다.</p>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button
					onclick={handleCancel}
					class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
					disabled={isSaving}
				>
					취소
				</button>
				{#if formCategory || editingEvCode}
					<button
						onclick={handleSave}
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						disabled={isSaving}
					>
						{isSaving ? '저장 중...' : '저장'}
					</button>
				{/if}
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
		padding: 20px;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		width: 100%;
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

	.modal-close {
		background: none;
		border: none;
		font-size: 24px;
		color: #6b7280;
		cursor: pointer;
		padding: 0;
		width: 30px;
		height: 30px;
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
		padding: 20px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #374151;
	}

	.form-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.form-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-input:disabled {
		background: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}
</style>
