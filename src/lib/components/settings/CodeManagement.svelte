<script>
	// import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import CodeManagementFormModal from '$lib/components/settings/CodeManagementFormModal.svelte';
	import OrderEditModal from '$lib/components/settings/OrderEditModal.svelte';
	import {
		getSettings,
		getRootSettings,
		// getChildSettings,
		getSetting,
		createSetting,
		updateSetting,
		deleteSetting,
		searchSettings
	} from '$lib/settingsService';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { isAdmin } from '$lib/userService';

	/**
	 * 컴포넌트 Props
	 * @type {{ category: string }}
	 */
	let { category = '' } = $props();

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	let authLoading = $derived(authStore.loading);
	/** @type {Object | null} */
	let userProfile = $derived(authStore.profile);
	/** @type {Array<any>} 전체 환경설정 코드 목록 (부모 이름 조회용) */
	let allSettings = $state([]);
	/** @type {Array<any>} 현재 표시할 환경설정 코드 목록 (필터링 전) */
	let displayedSettings = $state([]);
	/** @type {Record<string, any>} 필터 객체 (excel-code/all일 때 category 선택값 포함) */
	let filters = $state({ code: '', title: '', category: '' });
	/** @type {boolean} DB 검색 모드 여부 */
	let isSearchMode = $state(false);
	/** @type {Array<any>} DB 검색 결과 */
	let searchResults = $state([]);
	let isLoading = $state(false);
	/** @type {boolean} 폼 저장 중 여부 */
	let isSaving = $state(false);
	let showFormModal = $state(false);
	/** @type {boolean} 표시순서 전용 모달 표시 여부 */
	let showOrderModal = $state(false);
	/** @type {any} 표시순서 수정 대상 항목 */
	let orderEditSetting = $state(null);
	/** @type {number} 표시순서 모달에서 편집 중인 order 값 */
	let orderModalOrder = $state(0);
	/** @type {any} 수정 중인 항목 */
	let editingSetting = $state(null);
	/** @type {Array<any>} 상위 코드 목록 (최상위 항목) */
	let parentOptions = $state([]);
	/** @type {string|null|undefined} 현재 선택된 상위 코드 (undefined = 아직 초기화 안됨) */
	let currentParentCode = $state(undefined);
	/** @type {boolean} loadParentOptions 호출 여부 추적 */
	let parentOptionsLoaded = $state(false);

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
	 * URL 쿼리 파라미터에서 topCode 읽기
	 * @type {string|null}
	 */
	const topCodeParam = $derived(page.url.searchParams.get('topCode'));

	/** excel-code/all에서 카테고리 필터용 쿼리 파라미터 키 */
	const CATEGORY_PARAM = 'c';

	/** URL의 c 값과 동기화했던 마지막 값 (effect가 사용자 선택을 덮어쓰지 않도록) */
	let lastSyncedUrlC = $state(undefined);

	/**
	 * URL 쿼리 파라미터에서 카테고리(c) 읽기 → filters.category 동기화 (URL이 바뀐 경우만, 새로고침/뒤로가기 시 유지)
	 * c가 있으면 검색 실행해서 리스트에 반영
	 */
	$effect(() => {
		if (category !== 'all') return;
		const urlC = page.url.searchParams.get(CATEGORY_PARAM) || '';
		if (lastSyncedUrlC === undefined || lastSyncedUrlC !== urlC) {
			lastSyncedUrlC = urlC;
			filters.category = urlC;
			if (urlC) {
				performDBSearch();
			}
		}
	});

	/**
	 * filters.category 변경 시 URL에 c 파라미터 반영 (replaceState로 히스토리 누적 방지)
	 */
	$effect(() => {
		if (category !== 'all') return;
		const next = (filters.category || '').trim();
		const current = page.url.searchParams.get(CATEGORY_PARAM) || '';
		if (next === current) return;
		const url = new URL(page.url);
		if (next) {
			url.searchParams.set(CATEGORY_PARAM, next);
		} else {
			url.searchParams.delete(CATEGORY_PARAM);
		}
		goto(url.pathname + url.search, { replaceState: true, noScroll: true });
	});

	/**
	 * 현재 선택된 상위 코드 결정 (topCode가 없으면 null = 최상위)
	 * @type {string|null}
	 */
	const selectedTopCode = $derived(topCodeParam || null);

	$effect(() => {
		if (!authStore.loading && !authStore.user) {
			goto('/login');
		}
	});

	/**
	 * 사용자 인증 완료 후 loadParentOptions 호출 (한 번만)
	 */
	let i = 0;
	$effect(() => {
		if (!parentOptionsLoaded) {
			console.log('CodeManagement loadParentOptions 호출', category, parentOptionsLoaded, user && !authLoading, i++);
			parentOptionsLoaded = true;
			loadParentOptions();
		}
	});

	/**
	 * 카테고리 변경 시 폼 초기화 및 재로드
	 */
	$effect(() => {
		if (category) {
			// 'all' 카테고리는 폼 카테고리를 빈 문자열로 설정
			formCategory = category === 'all' ? '' : category;
			resetForm();
			// // 카테고리 변경 시 parentOptions 재로드를 위해 플래그 리셋
			// parentOptionsLoaded = false;
			// if (user && !authLoading) {
			// 	loadSettings();
			// }
		}
	});

	/**
	 * 사용자 인증 후 초기 로드 및 topCode 변경 시 설정 로드
	 */
	$effect(() => {
		if (user && !authLoading && category) {
			// topCode가 없으면 null (최상위)로 설정
			const codeToUse = selectedTopCode || null;
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
						return itopCodeAccessible(setting.code, accessibleCodes, allData);
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
			
			// topCode가 있으면 해당 부모의 자식만, 없으면 최상위만 조회
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
						return itopCodeAccessible(setting.code, accessibleCodes, allSettings);
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
	function itopCodeAccessible(code, accessibleCodes, allSettings) {
		const setting = allSettings.find((/** @type {any} */ s) => s.code === code);
		if (!setting) return false;
		
		// 최상위 코드인 경우
		if (!setting.parent_code) {
			return accessibleCodes.includes(code);
		}
		
		// 하위 코드인 경우, 부모 코드가 접근 가능한지 재귀적으로 확인
		return itopCodeAccessible(setting.parent_code, accessibleCodes, allSettings);
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
		console.log('loadParentOptions', category);
		if (!category) return;
		
		try {
			const { data, error } = await getRootSettings({ 
				category: category === 'all' ? '' : category 
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
			url.searchParams.set('topCode', code);
		} else {
			url.searchParams.delete('topCode');
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
	 * @returns {Promise<void>}
	 */
	async function handleCreate() {
		resetForm();
		editingSetting = null;
		if (formCategory) {
			formCode = getNextCodeForCategory(formCategory);
		}
		// 상위 코드 옵션이 로드되지 않았으면 먼저 로드
		if (parentOptions.length === 0) {
			await loadParentOptions();
		}
		
		// URL의 topCode 파라미터가 있으면 상위코드에 자동 설정
		if (topCodeParam) {
			// parentOptions에 topCodeParam이 있는지 확인
			const parentExists = parentOptions.some((/** @type {any} */ opt) => opt.code === topCodeParam);
			if (!parentExists) {
				// allSettings에서 부모 코드 찾기
				const parentInAllSettings = allSettings.find((/** @type {any} */ s) => s.code === topCodeParam);
				if (parentInAllSettings) {
					// 접근 제한 확인
					const accessibleCodes = accessibleTopLevelCodes;
					if (accessibleCodes === null || accessibleCodes.length === 0 || 
						itopCodeAccessible(parentInAllSettings.code, accessibleCodes, allSettings)) {
						parentOptions = [...parentOptions, parentInAllSettings];
					}
				} else {
					// allSettings에 없으면 직접 조회
					const { data: parentData, error: parentError } = await getSetting(
						topCodeParam,
						category === 'all' ? undefined : category
					);
					if (!parentError && parentData) {
						// 접근 제한 확인
						const accessibleCodes = accessibleTopLevelCodes;
						if (accessibleCodes === null || accessibleCodes.length === 0 || 
							itopCodeAccessible(parentData.code, accessibleCodes, allSettings)) {
							parentOptions = [...parentOptions, parentData];
						}
					}
				}
			}
			formParentCode = topCodeParam;
		}
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
	 * @returns {Promise<void>}
	 */
	async function handleEdit(setting) {
		// 상위 코드 옵션이 로드되지 않았으면 먼저 로드
		if (parentOptions.length === 0) {
			await loadParentOptions();
		}

		// setting.parent_code가 있고 parentOptions에 없으면 추가
		if (setting.parent_code) {
			const parentExists = parentOptions.some((/** @type {any} */ opt) => opt.code === setting.parent_code);
			if (!parentExists) {
				// allSettings에서 부모 코드 찾기 (이미 로드된 데이터 활용)
				const parentInAllSettings = allSettings.find((/** @type {any} */ s) => s.code === setting.parent_code);
				if (parentInAllSettings) {
					// 접근 제한 확인
					const accessibleCodes = accessibleTopLevelCodes;
					if (accessibleCodes === null || accessibleCodes.length === 0 || 
						itopCodeAccessible(parentInAllSettings.code, accessibleCodes, allSettings)) {
						parentOptions = [...parentOptions, parentInAllSettings];
					}
				} else {
					// allSettings에 없으면 직접 조회
					const parentCategory = setting.category || category || '';
					const { data: parentData, error: parentError } = await getSetting(
						setting.parent_code,
						parentCategory === 'all' ? undefined : parentCategory
					);
					if (!parentError && parentData) {
						// 접근 제한 확인
						const accessibleCodes = accessibleTopLevelCodes;
						if (accessibleCodes === null || accessibleCodes.length === 0 || 
							itopCodeAccessible(parentData.code, accessibleCodes, allSettings)) {
							parentOptions = [...parentOptions, parentData];
						}
					}
				}
			}
		}
		
		editingSetting = setting;
		formCode = setting.code || '';
		// parent_code가 null이면 빈 문자열로 변환 (select의 value와 매칭되도록)
		formParentCode = setting.parent_code || '';
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
	 * 등록 시 카테고리별 다음 코드 자동 생성 (예: sales_0001, cost_0002)
	 * @param {string} cat - 카테고리 (organization, sales, cost 등)
	 * @returns {string} 다음 사용 가능한 코드
	 */
	function getNextCodeForCategory(cat) {
		if (!cat || cat.trim() === '') return '';
		const prefix = cat.trim() + '_';
		const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$');
		let max = 0;
		for (const s of allSettings) {
			if (s.category !== cat || !s.code) continue;
			const m = String(s.code).match(re);
			if (m) max = Math.max(max, parseInt(m[1], 10));
		}
		return prefix + String(max + 1).padStart(4, '0');
	}

	/**
	 * 카테고리 변경 시 코드 자동 생성 (등록 모드일 때만)
	 * @returns {void}
	 */
	function handleCategoryChange() {
		if (!editingSetting && formCategory) {
			formCode = getNextCodeForCategory(formCategory);
		}
	}

	/**
	 * 폼 초기화
	 * @returns {void}
	 */
	function resetForm() {
		formCode = '';
		formParentCode = '';
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
			// formParam이 배열인지 확인하고, 빈 배열이 아닌 경우만 전달
			const paramValue = Array.isArray(formParam) && formParam.length > 0 
				? formParam.filter(p => p && p.trim() !== '') // 빈 문자열 제거
				: null;

			const settingData = {
				code: formCode,
				parent_code: formParentCode && formParentCode.trim() !== '' ? formParentCode : null,
				order: formOrder,
				value: formValue,
				title: formTitle,
				comment: formComment || null,
				category: formCategory || category,
				param: paramValue
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
	 * 표시순서 수정 모달 열기
	 * @param {any} setting - 수정할 항목
	 */
	function openOrderModal(setting) {
		orderEditSetting = setting;
		orderModalOrder = setting.order ?? 0;
		showOrderModal = true;
	}

	/**
	 * 표시순서 수정 모달 닫기
	 */
	function closeOrderModal() {
		showOrderModal = false;
		orderEditSetting = null;
	}

	/**
	 * 표시순서만 저장 (order 필드만 업데이트)
	 * @returns {Promise<void>}
	 */
	async function saveOrderModal() {
		if (!orderEditSetting) return;
		isSaving = true;
		try {
			const targetCategory = orderEditSetting.category || (category === 'all' ? 'organization' : category);
			const orderValue = Number(orderModalOrder);
			if (!Number.isInteger(orderValue) || orderValue < 0) {
				alert('표시순서는 0 이상의 정수만 입력 가능합니다.');
				isSaving = false;
				return;
			}
			const { error } = await updateSetting(orderEditSetting.code, {
				order: orderValue,
				category: targetCategory
			});
			if (error) {
				alert(error.message || '표시순서 저장에 실패했습니다.');
				return;
			}
			closeOrderModal();
			await loadSettings();
			if (isSearchMode && (filters.code || filters.title || filters.category)) {
				await performDBSearch();
			}
		} catch (e) {
			alert(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
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
			
			// 검색 모드일 경우 검색 결과도 갱신
			if (isSearchMode) {
				const codeQueryTrimmed = (filters.code || '').trim();
				const titleQueryTrimmed = (filters.title || '').trim();
				if (codeQueryTrimmed || titleQueryTrimmed) {
					await performDBSearch();
				} else {
					// 검색어가 없으면 검색 모드 해제
					isSearchMode = false;
					searchResults = [];
				}
			}
		} catch (error) {
			console.error('삭제 중 예외 발생:', error);
			alert(`삭제 실패: ${error.message || '알 수 없는 오류'}`);
		}
	}

	/**
	 * 검색어/필터 변경 감지 및 검색 모드 자동 해제
	 * excel-code/all일 때는 카테고리 선택도 검색 조건이므로, 코드·제목·카테고리 모두 비었을 때만 해제
	 */
	$effect(() => {
		const codeQueryTrimmed = (filters.code || '').trim();
		const titleQueryTrimmed = (filters.title || '').trim();
		const categorySelected = category === 'all' && (filters.category || '').trim();

		const hasSearchCriteria =
			codeQueryTrimmed ||
			titleQueryTrimmed ||
			(category === 'all' ? !!categorySelected : false);

		if (!hasSearchCriteria && isSearchMode) {
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
			cost: '비용',
			excel_company: '엑설실적 등록용 회사'
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

		// console.log('filters:', codeQueryTrimmed);
		// console.log('titleQueryTrimmed:', titleQueryTrimmed);
		// console.log('filters.category:', filters.category);
		// console.log('category:', category);

		// 검색어가 없으면 검색 모드 해제
		if (!codeQueryTrimmed && !titleQueryTrimmed && !filters.category) {
			isSearchMode = false;
			searchResults = [];
			isLoading = false;
			return;
		}

		isLoading = true;
		isSearchMode = true;

		/** excel-code/all일 때는 FilterBar에서 선택한 카테고리로 검색, 선택 없으면 'all' */
		const searchCategory =
			category === 'all'
				? (filters.category && String(filters.category).trim()) || 'all'
				: category;

		try {
			const { data, error } = await searchSettings({
				code: codeQueryTrimmed || undefined,
				title: titleQueryTrimmed || undefined,
				category: searchCategory
			});

			if (error) {
				console.error('DB 검색 실패:', error);
				searchResults = [];
			} else {
				// excel-code/all: 검색 결과 그대로 전체 리스트로 표시 (부모/접근 제한 없음)
				if (category === 'all') {
					searchResults = data || [];
				} else {
					// 특정 카테고리 페이지: 접근 제한 적용
					const accessibleCodes = accessibleTopLevelCodes;
					if (accessibleCodes !== null && accessibleCodes.length > 0) {
						const list = data || [];
						const mergedForAccess = [
							...allSettings,
							...list.filter((s) => !allSettings.some((a) => a.code === s.code))
						];
						searchResults = list.filter((/** @type {any} */ setting) => {
							if (!setting.parent_code) {
								return accessibleCodes.includes(setting.code);
							}
							return itopCodeAccessible(setting.code, accessibleCodes, mergedForAccess);
						});
					} else {
						searchResults = data || [];
					}
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
		filters.category = '';
		isSearchMode = false;
		searchResults = [];
	}

	/**
	 * FilterBar 필드 정의 (기본: 코드/제목). category === 'all'일 때만 카테고리 셀렉트 추가
	 * @type {Array<{key: string, type: string, placeholder?: string, label?: string, options?: Array<{value: string, label: string}>}>}
	 */
	const baseFilterFields = [
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

	/** category가 'all'일 때 카테고리 셀렉트 필드 */
	const categoryFilterField = {
		key: 'category',
		type: 'select',
		label: '카테고리',
		options: [
			{ value: 'organization', label: '조직' },
			{ value: 'sales', label: '매출' },
			{ value: 'cost', label: '비용' }
		]
	};

	/** FilterBar에 넘길 필드 목록 (category에 따라 파생) */
	const filterFields = $derived.by(() =>
		category === 'all' ? [...baseFilterFields, categoryFilterField] : baseFilterFields
	);

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
					{#if category === 'all'}
						<br /><span class="ml-5">조직등의 표시 순서를 정할 때는 표시순서값을 가능하면 큰값(8자리 이상)으로 설정하세요.</span>
						<br /><span class="ml-5">조직이 CEO, COO,... 등의 사람인경우  10000 미만 값으로 설정</span>
						<br /><span class="ml-5">조직이 회사부서인경우 사업부문 2자리 + 사업부 2자리 + 팀 2자리 + Index 2자리 형태로 이상 값으로 설정</span>
					{/if}
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
				// { label: '코드', align: 'center' },
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
			{#each filteredSettings as setting (setting.code)}
				<tr 
					class="hover:bg-gray-50 {isSearchMode ? 'cursor-default' : 'cursor-pointer'}" 
					onclick={isSearchMode ? undefined : () => navigateToCode(setting.code)}
				>
					<!-- <td class="text-center font-mono text-sm font-medium">{setting.code}</td> -->
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
					<td
						class="text-center order-cell-clickable"
						role="button"
						tabindex="0"
						onclick={(e) => { e.stopPropagation(); openOrderModal(setting); }}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openOrderModal(setting); } }}
						title="클릭하면 표시순서만 수정"
					>
						{setting.order ?? 0}
					</td>
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
								{#each setting.param as paramItem (paramItem)}
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

	<CodeManagementFormModal
		open={showFormModal}
		editingSetting={editingSetting}
		parentOptions={parentOptions}
		bind:formCode
		bind:formParentCode
		bind:formOrder
		bind:formValue
		bind:formTitle
		bind:formComment
		bind:formCategory
		bind:formParam
		bind:newParamValue
		isSaving={isSaving}
		onCategoryChange={handleCategoryChange}
		onCancel={handleCancel}
		onSubmit={handleSubmit}
		onAddParam={handleAddParam}
		onRemoveParam={handleRemoveParam}
	/>

	<OrderEditModal
		open={showOrderModal}
		setting={orderEditSetting}
		bind:order={orderModalOrder}
		isSaving={isSaving}
		onClose={closeOrderModal}
		onSave={saveOrderModal}
	/>

<style>
	.admin-content-page {
		width: 100%;
	}

	.order-cell-clickable {
		cursor: pointer;
	}

	.order-cell-clickable:hover {
		background-color: #eff6ff;
		color: #1d4ed8;
	}

	.btn-small {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}

	.btn-secondary {
		background-color: #6b7280;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background-color: #4b5563;
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
