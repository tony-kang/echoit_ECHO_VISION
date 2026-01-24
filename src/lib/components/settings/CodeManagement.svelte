<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import {
		getSettings,
		getRootSettings,
		getChildSettings,
		createSetting,
		updateSetting,
		deleteSetting,
		searchSettings
	} from '$lib/settingsService';
	import { authStore } from '$lib/stores/authStore';
	import { isAdmin } from '$lib/userService';

	/**
	 * 컴포넌트 Props
	 * @type {{ category: string }}
	 */
	let { category = '' } = $props();

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	/** @type {Array<any>} 전체 환경설정 코드 목록 (부모 이름 조회용) */
	let allSettings = $state([]);
	/** @type {Array<any>} 현재 표시할 환경설정 코드 목록 (필터링 전) */
	let displayedSettings = $state([]);
	/** @type {Record<string, any>} 필터 객체 */
	let filters = $state({ code: '', title: '' });
	/** @type {boolean} DB 검색 모드 여부 */
	let isSearchMode = $state(false);
	/** @type {Array<any>} DB 검색 결과 */
	let searchResults = $state([]);
	let isLoading = $state(false);
	/** @type {boolean} 폼 저장 중 여부 */
	let isSaving = $state(false);
	let showFormModal = $state(false);
	/** @type {any} 수정 중인 항목 */
	let editingSetting = $state(null);
	/** @type {Array<any>} 상위 코드 목록 (최상위 항목) */
	let parentOptions = $state([]);
	/** @type {string|null|undefined} 현재 선택된 상위 코드 (undefined = 아직 초기화 안됨) */
	let currentParentCode = $state(undefined);

	/**
	 * 사용자가 접근 가능한 최상위 코드 목록
	 * @type {string[]|null}
	 */
	const accessibleTopLevelCodes = $derived.by(() => {
		if (!userProfile) return null;
		/** @type {any} */
		const profile = userProfile;
		// 관리자/마스터는 모든 코드 접근 가능
		if (profile?.role && isAdmin(profile.role)) {
			return null; // null이면 모든 코드 접근 가능
		}
		// 일반 사용자는 top_level_codes 배열 사용
		return profile?.top_level_codes || [];
	});

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
	/** @type {string} */
	let formCategory = $state('');
	/** @type {string[]} 파라미터 배열 */
	let formParam = $state([]);
	/** @type {string} 새 파라미터 입력값 */
	let newParamValue = $state('');

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
			userProfile = state.userProfile;

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
	 * 카테고리 변경 시 폼 초기화 및 재로드
	 */
	$effect(() => {
		if (category) {
			// 'all' 카테고리는 폼 카테고리를 빈 문자열로 설정
			formCategory = category === 'all' ? '' : category;
			resetForm();
			if (user && !authLoading) {
				loadSettings();
			}
		}
	});

	/**
	 * 사용자 인증 후 초기 로드 및 sCode 변경 시 설정 로드
	 */
	$effect(() => {
		if (user && !authLoading && category) {
			// sCode가 없으면 null (최상위)로 설정
			const codeToUse = selectedCode || null;
			// 초기화되지 않았거나 값이 변경된 경우에만 로드
			if (currentParentCode === undefined || currentParentCode !== codeToUse) {
				currentParentCode = codeToUse;
				loadSettings().catch((error) => {
					console.error('loadSettings 실행 중 오류:', error);
					isLoading = false;
				});
			}
		} else if (!authLoading && (!user || !category)) {
			// 인증이 완료되었지만 user나 category가 없으면 로딩 상태 해제
			isLoading = false;
		}
	});

	/**
	 * 환경설정 코드 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadSettings() {
		// 조건 확인: user나 category가 없으면 로딩 상태를 false로 설정하고 종료
		if (!user || !category) {
			isLoading = false;
			displayedSettings = [];
			allSettings = [];
			return;
		}

		isLoading = true;
		
		try {
			// 전체 설정 로드 (부모 이름 조회용) - 'all'인 경우 카테고리 필터링 안함
			const { data: allData, error: allError } = await getSettings({
				orderByOrder: true,
				category: category === 'all' ? 'all' : category
			});
			
			if (allError) {
				console.error('전체 설정 로드 실패:', allError);
				allSettings = [];
			} else if (allData) {
				// 접근 제한 적용
				const accessibleCodes = accessibleTopLevelCodes;
				if (accessibleCodes !== null && accessibleCodes.length > 0) {
					// 접근 가능한 최상위 코드와 그 하위 코드만 필터링
					const filtered = allData.filter((/** @type {any} */ setting) => {
						// 최상위 코드인 경우
						if (!setting.parent_code) {
							return accessibleCodes.includes(setting.code);
						}
						// 하위 코드인 경우, 상위 코드가 접근 가능한지 확인
						return isCodeAccessible(setting.code, accessibleCodes, allData);
					});
					allSettings = filtered;
				} else {
					allSettings = allData;
				}
			} else {
				allSettings = [];
			}
			
			// currentParentCode가 undefined이면 null로 처리 (최상위)
			const parentCodeToLoad = currentParentCode === undefined ? null : currentParentCode;
			
			// sCode가 있으면 해당 부모의 자식만, 없으면 최상위만 조회
			const { data, error } = await getSettings({
				orderByOrder: true,
				parentCode: parentCodeToLoad,
				category: category === 'all' ? 'all' : category
			});

			if (error) {
				console.error('환경설정 코드 로드 실패:', error);
				displayedSettings = [];
			} else {
				// 접근 제한 적용
				const accessibleCodes = accessibleTopLevelCodes;
				if (accessibleCodes !== null && accessibleCodes.length > 0) {
					displayedSettings = (data || []).filter((/** @type {any} */ setting) => {
						// 최상위 코드인 경우
						if (!setting.parent_code) {
							return accessibleCodes.includes(setting.code);
						}
						// 하위 코드인 경우, 상위 코드가 접근 가능한지 확인
						return isCodeAccessible(setting.code, accessibleCodes, allSettings);
					});
				} else {
					displayedSettings = data || [];
				}
			}
		} catch (error) {
			console.error('환경설정 코드 로드 중 예외 발생:', error);
			displayedSettings = [];
			allSettings = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 코드가 접근 가능한지 확인 (재귀적으로 상위 코드 확인)
	 * @param {string} code - 확인할 코드
	 * @param {string[]} accessibleCodes - 접근 가능한 최상위 코드 목록
	 * @param {Array<any>} allSettings - 전체 설정 목록
	 * @returns {boolean}
	 */
	function isCodeAccessible(code, accessibleCodes, allSettings) {
		const setting = allSettings.find((/** @type {any} */ s) => s.code === code);
		if (!setting) return false;
		
		// 최상위 코드인 경우
		if (!setting.parent_code) {
			return accessibleCodes.includes(code);
		}
		
		// 하위 코드인 경우, 부모 코드가 접근 가능한지 재귀적으로 확인
		return isCodeAccessible(setting.parent_code, accessibleCodes, allSettings);
	}

	/**
	 * 상위 코드 옵션 로드
	 * @returns {Promise<void>}
	 */
	/**
	 * 상위 코드 옵션 로드
	 * @returns {Promise<void>}
	 */
	async function loadParentOptions() {
		if (!category) return;
		
		try {
			const { data, error } = await getRootSettings({ 
				category: category === 'all' ? 'all' : category 
			});
			if (error) {
				console.error('상위 코드 옵션 로드 실패:', error);
				parentOptions = [];
			} else if (data) {
				// 접근 제한 적용
				const accessibleCodes = accessibleTopLevelCodes;
				if (accessibleCodes !== null && accessibleCodes.length > 0) {
					parentOptions = (data || []).filter((/** @type {any} */ option) =>
						accessibleCodes.includes(option.code)
					);
				} else {
					parentOptions = data || [];
				}
			} else {
				parentOptions = [];
			}
		} catch (error) {
			console.error('상위 코드 옵션 로드 중 예외 발생:', error);
			parentOptions = [];
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
		const parent = allSettings.find((/** @type {any} */ s) => s.code === parentCode);
		return parent ? parent.title : parentCode;
	}

	/**
	 * 현재 부모 코드의 제목 가져오기
	 * @returns {string}
	 */
	function getCurrentParentTitle() {
		if (!currentParentCode) return '';
		return getParentName(currentParentCode);
	}

	/**
	 * 코드에 자식이 있는지 확인
	 * @param {string} code - 확인할 코드
	 * @returns {boolean}
	 */
	function hasChildren(code) {
		return allSettings.some((/** @type {any} */ s) => s.parent_code === code);
	}

	/**
	 * 코드 추가 핸들러
	 * @returns {void}
	 */
	function handleCreate() {
		resetForm();
		editingSetting = null;
		showFormModal = true;
	}

	/**
	 * 코드 수정 핸들러
	 * @param {any} setting - 환경설정 데이터
	 * @returns {void}
	 */
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
		formCategory = setting.category || category || '';
		formParam = setting.param && Array.isArray(setting.param) ? [...setting.param] : [];
		newParamValue = '';
		showFormModal = true;
	}

	/**
	 * 폼 초기화
	 * @returns {void}
	 */
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
		formCategory = category || '';
		formParam = [];
		newParamValue = '';
	}

	/**
	 * 폼 제출 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleSubmit() {
		if (isSaving) return; // 이미 저장 중이면 중복 실행 방지
		
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
		if (!formCategory) {
			alert('카테고리는 필수입니다.');
			return;
		}

		isSaving = true;
		
		try {
			const settingData = {
				code: formCode,
				parent_code: formParentCode || null,
				order: formOrder,
				value: formValue,
				title: formTitle,
				comment: formComment || null,
				category: formCategory || category,
				param: formParam.length > 0 ? formParam : null
			};

			let result;
			if (editingSetting) {
				result = await updateSetting(editingSetting.code, settingData);
			} else {
				result = await createSetting(settingData);
			}

			if (result.error) {
				alert(`저장 실패: ${result.error.message || '알 수 없는 오류'}`);
				console.error('저장 오류:', result.error);
				return;
			}

			showFormModal = false;
			resetForm();
			editingSetting = null;
			await loadSettings();
			await loadParentOptions();
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
		editingSetting = null;
	}

	/**
	 * 파라미터 추가 핸들러
	 * @returns {void}
	 */
	function handleAddParam() {
		const trimmed = newParamValue.trim();
		if (trimmed && !formParam.includes(trimmed)) {
			formParam = [...formParam, trimmed];
			newParamValue = '';
		}
	}

	/**
	 * 파라미터 삭제 핸들러
	 * @param {number} index - 삭제할 인덱스
	 * @returns {void}
	 */
	function handleRemoveParam(index) {
		formParam = formParam.filter((_, i) => i !== index);
	}

	/**
	 * 환경설정 코드 삭제 핸들러
	 * @param {any} setting - 환경설정 데이터
	 * @returns {Promise<void>}
	 */
	/**
	 * 코드 삭제 핸들러
	 * @param {any} setting - 환경설정 데이터
	 * @returns {Promise<void>}
	 */
	async function handleDelete(setting) {
		// 자식 코드가 있는지 확인
		if (hasChildren(setting.code)) {
			alert('하위 코드가 있는 코드는 삭제할 수 없습니다. 먼저 하위 코드를 삭제해주세요.');
			return;
		}

		if (!confirm(`정말로 "${setting.title}" 코드를 삭제하시겠습니까?`)) {
			return;
		}

		try {
			const { error } = await deleteSetting(
				setting.code,
				category === 'all' ? 'all' : category
			);
			
			if (error) {
				console.error('삭제 실패:', error);
				alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
				return;
			}

			// 삭제 성공 후 목록 새로고침
			await loadSettings();
			await loadParentOptions();
		} catch (error) {
			console.error('삭제 중 예외 발생:', error);
			alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
		}
	}

	/**
	 * 검색어 변경 감지 및 검색 모드 자동 해제
	 */
	$effect(() => {
		const codeQueryTrimmed = (filters.code || '').trim();
		const titleQueryTrimmed = (filters.title || '').trim();
		
		// 검색어가 모두 비어있으면 검색 모드 해제
		if (!codeQueryTrimmed && !titleQueryTrimmed && isSearchMode) {
			isSearchMode = false;
			searchResults = [];
		}
	});

	/**
	 * 검색어로 필터링된 설정 목록
	 * DB 검색 모드일 때는 searchResults 반환, 일반 모드일 때는 클라이언트 필터링
	 * @type {Array<any>}
	 */
	const filteredSettings = $derived.by(() => {
		// DB 검색 모드일 때는 검색 결과 반환
		if (isSearchMode) {
			return searchResults || [];
		}
		
		// 일반 모드: 클라이언트 사이드 필터링
		if (!displayedSettings || displayedSettings.length === 0) {
			return displayedSettings || [];
		}
		
		let result = displayedSettings;
		const codeQueryTrimmed = (filters.code || '').trim();
		const titleQueryTrimmed = (filters.title || '').trim();
		
		// 검색어가 없으면 전체 반환
		if (!codeQueryTrimmed && !titleQueryTrimmed) {
			return result;
		}
		
		// 코드 검색: 정확 일치 (EQ)
		if (codeQueryTrimmed !== '') {
			const codeQuery = codeQueryTrimmed.toLowerCase();
			result = result.filter((/** @type {any} */ setting) => {
				if (!setting || !setting.code) return false;
				const settingCode = String(setting.code).toLowerCase();
				return settingCode === codeQuery;
			});
		}
		
		// 제목 검색: 부분 일치 (LIKE)
		if (titleQueryTrimmed !== '') {
			const titleQuery = titleQueryTrimmed.toLowerCase();
			result = result.filter((/** @type {any} */ setting) => {
				if (!setting || !setting.title) return false;
				const settingTitle = String(setting.title).toLowerCase();
				return settingTitle.includes(titleQuery);
			});
		}
		
		return result;
	});

	/**
	 * 카테고리 라벨 가져오기
	 * @param {string} cat - 카테고리 코드
	 * @returns {string}
	 */
	function getCategoryLabel(cat) {
		const labels = {
			organization: '조직',
			sales: '매출',
			cost: '비용'
		};
		return labels[cat] || cat;
	}

	/**
	 * DB에서 검색 실행
	 * @returns {Promise<void>}
	 */
	async function performDBSearch() {
		if (!user || !category) return;
		
		const codeQueryTrimmed = (filters.code || '').trim();
		const titleQueryTrimmed = (filters.title || '').trim();
		
		// 검색어가 없으면 검색 모드 해제
		if (!codeQueryTrimmed && !titleQueryTrimmed) {
			isSearchMode = false;
			searchResults = [];
			isLoading = false;
			return;
		}
		
		isLoading = true;
		isSearchMode = true;
		
		try {
			const { data, error } = await searchSettings({
				code: codeQueryTrimmed || undefined,
				title: titleQueryTrimmed || undefined,
				category: category === 'all' ? 'all' : category
			});
			
			if (error) {
				console.error('DB 검색 실패:', error);
				searchResults = [];
			} else {
				// 접근 제한 적용
				const accessibleCodes = accessibleTopLevelCodes;
				if (accessibleCodes !== null && accessibleCodes.length > 0) {
					searchResults = (data || []).filter((/** @type {any} */ setting) => {
						// 최상위 코드인 경우
						if (!setting.parent_code) {
							return accessibleCodes.includes(setting.code);
						}
						// 하위 코드인 경우, 상위 코드가 접근 가능한지 확인
						return isCodeAccessible(setting.code, accessibleCodes, allSettings);
					});
				} else {
					searchResults = data || [];
				}
			}
		} catch (error) {
			console.error('DB 검색 중 예외 발생:', error);
			searchResults = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 검색어 초기화 핸들러
	 * @returns {void}
	 */
	function handleSearchClear() {
		filters.code = '';
		filters.title = '';
		isSearchMode = false;
		searchResults = [];
	}

	/**
	 * FilterBar 필드 정의
	 * @type {Array<{key: string, type: string, placeholder: string}>}
	 */
	const filterFields = [
		{
			key: 'code',
			type: 'input',
			placeholder: '코드 검색 (정확 일치, Enter: DB 검색)'
		},
		{
			key: 'title',
			type: 'input',
			placeholder: '제목 검색 (부분 일치, Enter: DB 검색)'
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
</script>

<div class="admin-content-page">
	<!-- 네비게이션 -->
	<div class="mb-4 flex items-center gap-2">
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
		{/if}
	</div>

	<!-- FilterBar -->
	<FilterBar
		bind:filters={filters}
		fields={filterFields}
		onApply={performDBSearch}
		onReset={handleSearchClear}
		actions={actionButtons}
	/>

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-gray-500">
				{isSearchMode ? 'DB에서 검색 중...' : '환경설정 코드 목록을 불러오는 중...'}
			</p>
		</div>
	{:else if !isSearchMode && displayedSettings.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-500">환경설정 코드가 등록되지 않았습니다.</p>
		</div>
	{:else if filteredSettings.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-500">
				{isSearchMode ? 'DB 검색 결과가 없습니다.' : '검색 결과가 없습니다.'}
			</p>
			{#if filters.code || filters.title}
				<button
					onclick={handleSearchClear}
					class="mt-2 text-sm text-blue-600 hover:text-blue-700"
				>
					검색 초기화
				</button>
			{/if}
		</div>
	{:else}
		<!-- 검색 모드 표시 -->
		{#if isSearchMode}
			<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
				<p class="text-sm text-blue-700">
					<strong>DB 검색 모드</strong> - 전체 데이터에서 검색한 결과입니다.
					{#if filters.code}
						<span class="ml-2">코드: "{filters.code}"</span>
					{/if}
					{#if filters.title}
						<span class="ml-2">제목: "{filters.title}"</span>
					{/if}
				</p>
			</div>
		{/if}
		
		<!-- 환경설정 코드 목록 -->
		<DataTable
			headers={[
				{ label: '코드', align: 'center' },
				{ label: '제목' },
				{ label: '카테고리', align: 'center' },
				{ label: '표시 순서', align: 'center' },
				{ label: '값', align: 'center' },
				{ label: '상위 코드', align: 'center' },
				{ label: '파라미터', align: 'center' },
				{ label: '설명', align: 'center' },
				{ label: '작업', align: 'center' }
			]}
			rowCount={filteredSettings.length}
			emptyMessage="환경설정 코드가 없습니다."
		>
			{#each filteredSettings as setting}
				<tr 
					class="hover:bg-gray-50 {isSearchMode ? 'cursor-default' : 'cursor-pointer'}" 
					onclick={isSearchMode ? undefined : () => navigateToCode(setting.code)}
				>
					<td class="text-center font-mono text-sm font-medium">{setting.code}</td>
					<td class="font-medium">
						<div class="flex items-center gap-2">
							{setting.title}
							{#if !isSearchMode && hasChildren(setting.code)}
								<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							{/if}
						</div>
					</td>
					<td class="text-center">
						{#if setting.category}
							<span class="badge badge-info">
								{getCategoryLabel(setting.category)}
							</span>
						{:else}
							<span class="text-gray-400">-</span>
						{/if}
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
						{#if setting.param && Array.isArray(setting.param) && setting.param.length > 0}
							<div class="flex flex-wrap gap-1 justify-center">
								{#each setting.param as paramItem}
									<span class="badge badge-info text-xs">
										{paramItem}
									</span>
								{/each}
							</div>
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
							코드는 수정할 수 없습니다.
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

					<!-- 카테고리 -->
					<div>
						<label for="formCategory" class="block text-sm font-medium text-gray-700 mb-1">
							카테고리 <span class="text-red-500">*</span>
						</label>
						<select
							id="formCategory"
							bind:value={formCategory}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						>
							<option value="">선택하세요</option>
							<option value="organization">organization (조직)</option>
							<option value="sales">sales (매출)</option>
							<option value="cost">cost (비용)</option>
						</select>
						<p class="text-xs text-gray-500 mt-1">코드의 분류를 선택하세요.</p>
					</div>

					<!-- 파라미터 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							파라미터 (엑셀 칼럼 매칭용)
						</label>
						<div class="space-y-2">
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={newParamValue}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddParam();
										}
									}}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="파라미터 입력 후 Enter 또는 추가 버튼 클릭"
								/>
								<button
									type="button"
									onclick={handleAddParam}
									class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
								>
									추가
								</button>
							</div>
							{#if formParam.length > 0}
								<div class="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg min-h-[3rem]">
									{#each formParam as paramItem, index}
										<span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
											{paramItem}
											<button
												type="button"
												onclick={() => handleRemoveParam(index)}
												class="ml-1 text-blue-600 hover:text-blue-800 font-bold"
												aria-label="삭제"
											>
												×
											</button>
										</span>
									{/each}
								</div>
							{:else}
								<p class="text-xs text-gray-500">파라미터가 없습니다. 엑셀 칼럼 매칭을 위해 파라미터를 추가하세요.</p>
							{/if}
						</div>
						<p class="text-xs text-gray-500 mt-1">엑셀 파일의 칼럼명과 매칭하기 위한 파라미터 목록입니다.</p>
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
				<button onclick={handleCancel} class="btn-secondary" disabled={isSaving}>취소</button>
				<button onclick={handleSubmit} class="btn-primary" disabled={isSaving}>
					{isSaving ? '저장 중...' : '저장'}
				</button>
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
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
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
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
	}

	.modal-close:hover {
		background-color: #f3f4f6;
		color: #111827;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background-color: #6b7280;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-secondary:hover {
		background-color: #4b5563;
	}

	.btn-small {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}

	.btn-danger {
		background-color: #ef4444;
		color: white;
	}

	.btn-danger:hover {
		background-color: #dc2626;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.badge-info {
		background-color: #dbeafe;
		color: #1e40af;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}
</style>
