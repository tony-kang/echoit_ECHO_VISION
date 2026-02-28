<script>
	import { tick, untrack } from 'svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { getSettings, getEvCodes } from '$lib/settingsService';

	/**
	 * 컴포넌트 Props
	 * @type {{ 
	 *   title: string, 
	 *   category: 'sales' | 'cost',
	 *   loadData: (year: number, evCodeItems?: string[]) => Promise<{ data: any[] | null, error: any }>,
	 *   organizeData: (rawData: any[], evCodes: any[], filters: Record<string, any>) => any[],
	 *   emptyMessage?: string,
	 *   tableName?: string
	 * }}
	 */
	let {
		title,
		category,
		loadData,
		organizeData,
		emptyMessage = '데이터가 없습니다.',
		tableName
	} = $props();

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);

	/** @type {Array<any>} 전체 환경설정 코드 목록 */
	let allSettings = $state([]);
	/** @type {Array<any>} 표시할 데이터 */
	let displayData = $state([]);
	let isLoading = $state(false);
	/** @type {Array<any>} ev_code 목록 */
	let evCodes = $state([]);
	let evCodeItems = $state(getInitialEvCodeItems());
	let isLoadingEvCodes = $state(false);

	/** @type {Array<any>} organization 카테고리의 두 번째 레벨 코드 목록 (최상위의 자식 코드들) */
	let secondLevelOrgCodes = $state([]);
	/** @type {Array<any>} 선택된 상위 코드의 하위 코드 목록 */
	let childCodes = $state([]);
	/** @type {boolean} 하위 코드 목록 로딩 상태 */
	let isLoadingChildCodes = $state(false);
	/** @type {Array<any>} 선택된 하위 코드들의 하위 코드 목록 (3단계) */
	let grandChildCodes = $state([]);
	/** @type {boolean} 하위 코드의 하위 코드 목록 로딩 상태 */
	let isLoadingGrandChildCodes = $state(false);

	/**
	 * URL 쿼리 파라미터에서 초기값 읽기
	 * @returns {Record<string, any>}
	 */
	function getInitialFilters() {
		const urlYear = page.url.searchParams.get('year');
		const urlEvCodeItems = page.url.searchParams.get('evCodeItems');
		
		return {
			year: urlYear || new Date().getFullYear().toString(),
			parentCode: 'SUM_000',
			selectedCodes: [],
			selectedCodes2: []
		};
	}

	/**
	 * URL 쿼리 파라미터에서 evCodeItems 읽기
	 * @returns {string[]}
	 */
	function getInitialEvCodeItems() {
		const urlEvCodeItems = page.url.searchParams.get('evCodeItems');
		if (urlEvCodeItems) {
			try {
				return JSON.parse(decodeURIComponent(urlEvCodeItems));
			} catch {
				return [];
			}
		}
		return [];
	}

	/** @type {Record<string, any>} 필터 객체 */
	let filters = $state(getInitialFilters());
	/** @type {string | null} 이전 연도 값 (무한루프 방지) */
	let previousYear = $state(new Date().getFullYear().toString());
	/** @type {string | null} 이전 상위 코드 값 (무한루프 방지) */
	let previousParentCode = $state(null);
	/** @type {string[]} 이전 선택된 코드 배열 (무한루프 방지) */
	let previousSelectedCodes = $state([]);
	/** @type {string[]} 이전 선택된 하위 코드의 하위 코드 배열 (무한루프 방지) */
	let previousSelectedCodes2 = $state([]);
	/** @type {string | null} 이전 evCodeItems 문자열 (무한루프 방지) */
	let previousEvCodeItemsStr = $state(null);

	let allSettingsLoaded = $state(false);

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			userProfile = state.userProfile;

			if (!state.loading && !state.user) {
				goto('/login');
			} else if (state.user && state.userProfile) {
				// 사용자 프로필이 로드된 후에만 설정 로드
				if (!allSettingsLoaded) {
					allSettingsLoaded = true;
					console.log('loadAllSettings');
					loadAllSettings();
				}
			}
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * ev_code 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadEvCodes() {
		isLoadingEvCodes = true;
		try {
			const { data, error } = await getEvCodes({ category });
			if (error) {
				console.error('ev_code 로드 실패:', error);
				evCodes = [];
			} else {
				// display_order 순서대로 정렬 (작은 값이 먼저, 같으면 item_code 순서)
				// 복사본을 만들어서 정렬 (원본 배열 변경 방지)
				evCodes = [...(data || [])].sort((a, b) => {
					const orderA = a.display_order || 0;
					const orderB = b.display_order || 0;
					if (orderA !== orderB) {
						return orderA - orderB;
					}
					// display_order가 같으면 item_code로 정렬
					return (a.item_code || '').localeCompare(b.item_code || '');
				});

				// 상위 코드가 선택되지 않은 경우에만 기본 evCodeItems 설정
				if (!filters.parentCode) {
					// ev_sales/ev_cost 데이터를 로드할 때 사용할 evCode의 items를 평탄화하고 중복 제거
					const allItems = evCodes.flatMap(evCode => evCode.items || []);
					evCodeItems = [...new Set(allItems)];
				}

				// console.log('ev_code 목록:', $state.snapshot(evCodes));
				console.log('evCodeItems:', $state.snapshot(evCodeItems));
			}
		} catch (error) {
			console.error('ev_code 로드 중 예외 발생:', error);
			evCodes = [];
		} finally {
			isLoadingEvCodes = false;
		}
	}

	/**
	 * 사용자 및 인증 상태가 준비되면 ev_code 로드 (중복 호출 방지)
	 */
	$effect(() => {
		// 이미 로드되었거나 로딩 중이면 실행하지 않음
		if (evCodes.length > 0 || isLoadingEvCodes) {
			return;
		}

		// 사용자 및 인증 상태가 준비되었을 때만 로드
		if (user && !authLoading && userProfile) {
			loadEvCodes();
		}
	});

	/**
	 * 상위 코드 변경 시 하위 코드 목록 업데이트 (무한루프 방지)
	 */
	$effect(() => {
		const currentParentCode = filters.parentCode || null;
		
		// 상위 코드가 변경되었고, 사용자가 로그인했고, 설정이 로드되었을 때만 실행
		if (user && !authLoading && allSettings.length > 0 && currentParentCode && currentParentCode !== previousParentCode && !isLoadingChildCodes) {
			previousParentCode = currentParentCode;
			console.log('updateChildCodes 1 >>>>>', allSettings.length, currentParentCode, previousParentCode, isLoadingChildCodes);
			updateChildCodes();
		} else if (!currentParentCode) {
			// 상위 코드가 없으면 이전 값도 초기화
			previousParentCode = null;
		}
	});

	/**
	 * 하위 코드 선택 변경 시 하위 코드의 하위 코드 목록 업데이트 (무한루프 방지)
	 */
	$effect(() => {
		if (!user || authLoading || allSettings.length === 0 || isLoadingGrandChildCodes) {
			return;
		}

		const currentSelectedCodes = Array.isArray(filters.selectedCodes) ? filters.selectedCodes : [];
		const currentSelectedCodesStr = JSON.stringify([...currentSelectedCodes].sort());
		const previousSelectedCodesStr = JSON.stringify([...previousSelectedCodes].sort());
		
		// 하위 코드 선택이 변경되었을 때만 실행
		if (currentSelectedCodesStr !== previousSelectedCodesStr) {
			previousSelectedCodes = [...currentSelectedCodes];
			
			if (currentSelectedCodes.length === 0) {
				// 하위 코드가 선택되지 않으면 하위 코드의 하위 코드도 초기화
				grandChildCodes = [];
				previousSelectedCodes2 = [];
				updateEvCodeItemsFromFilters();
			} else {
				updateGrandChildCodes();
			}
		}
	});

	/**
	 * URL 쿼리 파라미터 업데이트 (주소창과 다를 때만 goto하여 무한루프 방지)
	 * @returns {Promise<void>}
	 */
	async function updateUrlParams() {
		const url = new URL(page.url);
		if (filters.year) {
			url.searchParams.set('year', filters.year);
		} else {
			url.searchParams.delete('year');
		}
		if (evCodeItems.length > 0) {
			url.searchParams.set('evCodeItems', encodeURIComponent(JSON.stringify(evCodeItems)));
		} else {
			url.searchParams.delete('evCodeItems');
		}
		const newUrl = url.pathname + url.search;
		if (page.url.pathname + page.url.search === newUrl) return;
		await goto(newUrl, { replaceState: true, noScroll: true });
	}

	/**
	 * URL 쿼리 파라미터 변경 감지 및 상태 동기화 (evCodeItems 읽기는 untrack으로 순환 방지)
	 */
	$effect(() => {
		const urlYear = page.url.searchParams.get('year');
		const urlEvCodeItems = page.url.searchParams.get('evCodeItems');
		
		// URL의 year가 변경되었으면 filters 업데이트
		if (urlYear && urlYear !== filters.year) {
			filters = { ...filters, year: urlYear };
		}
		
		// URL의 evCodeItems가 변경되었으면 evCodeItems 업데이트 (비교만 untrack으로 의존성 차단)
		if (urlEvCodeItems) {
			try {
				const parsed = JSON.parse(decodeURIComponent(urlEvCodeItems));
				const parsedStr = JSON.stringify([...parsed].sort());
				const currentStr = untrack(() => JSON.stringify([...evCodeItems].sort()));
				if (currentStr !== parsedStr) {
					evCodeItems = parsed;
				}
			} catch {
				// 파싱 실패 시 무시
			}
		}
	});

	/**
	 * 연도/evCodeItems 변경 시 주소창 동기화 (tick 후 호출로 상태 반영 보장)
	 */
	$effect(() => {
		const year = filters.year;
		const itemsStr = JSON.stringify([...evCodeItems].sort());
		if (!user || authLoading) return;
		untrack(async () => {
			await tick();
			updateUrlParams();
		});
	});

	/**
	 * 연도 또는 evCodeItems 변경 시 데이터 로드 및 URL 업데이트 (무한루프 방지)
	 */
	$effect(() => {
		const currentYear = filters.year;
		const currentEvCodeItemsStr = JSON.stringify([...evCodeItems].sort());

		// 연도나 evCodeItems가 변경되었고, 사용자가 로그인했고, 로딩 중이 아닐 때만 호출
		if (user && !authLoading && currentYear && !isLoading && evCodeItems.length > 0) {
			// 연도가 변경되었거나 evCodeItems가 변경된 경우
			if (currentYear !== previousYear || currentEvCodeItemsStr !== (previousEvCodeItemsStr || '')) {
				previousYear = currentYear;
				previousEvCodeItemsStr = currentEvCodeItemsStr;
				untrack(async () => {
					await loadDataByYear();
					await updateUrlParams();
				});
			}
		} else if (!currentYear) {
			// 연도가 없으면 이전 연도도 초기화
			previousYear = null;
			previousEvCodeItemsStr = null;
		}
	});

	/**
	 * 전체 환경설정 코드 로드
	 * @returns {Promise<void>}
	 */
	async function loadAllSettings() {
		if (!user) return;

		try {
			console.log('>>>>loadAllSettings');
			const { data, error } = await getSettings({
				orderByOrder: true
			});

			if (error) {
				console.error('환경설정 코드 로드 실패:', error);
				allSettings = [];
				return;
			}

			allSettings = data || [];
			
			// organization 카테고리의 두 번째 레벨 코드 목록 로드
			console.log('>>>>----------loadSecondLevelOrgCodes');
			await loadSecondLevelOrgCodes();
		} catch (err) {
			console.error('환경설정 코드 로드 예외:', err);
			allSettings = [];
		}
	}

	/**
	 * organization 카테고리의 두 번째 레벨 코드 목록 로드 (최상위의 자식 코드들)
	 * @returns {Promise<void>}
	 */
	async function loadSecondLevelOrgCodes() {
		try {
			// 먼저 최상위 코드들을 가져옴
			console.log('먼저 최상위 코드들을 가져옴');
			const { data: topLevelData, error: topLevelError } = await getSettings({
				category: 'organization',
				parentCode: null,
				orderByOrder: true
			});

			if (topLevelError) {
				console.error('최상위 조직 코드 로드 실패:', topLevelError);
				secondLevelOrgCodes = [];
				return;
			}

			// 최상위 코드들의 자식 코드들을 가져옴
			const secondLevelCodes = [];
			for (const topCode of topLevelData || []) {
				secondLevelCodes.push({
					value: topCode.code,
					label: `🔸 ${topCode.code} - ${topCode.title}`
				});
				console.log('최상위 코드의 자식 코드들을 가져옴');
				const { data: childrenData, error: childrenError } = await getSettings({
					category: 'organization',
					parentCode: topCode.code,
					orderByOrder: true
				});

				if (!childrenError && childrenData) {
					for (const child of childrenData) {
						secondLevelCodes.push({
							value: child.code,
							label: `◾ ${child.code} - ${child.title}`
						});
					}
				}
			}

			secondLevelOrgCodes = secondLevelCodes;
		} catch (err) {
			console.error('두 번째 레벨 조직 코드 로드 예외:', err);
			secondLevelOrgCodes = [];
		}
	}

	/**
	 * 상위 코드의 모든 하위 코드를 재귀적으로 찾는 함수
	 * @param {string} parentCode - 상위 코드
	 * @param {Array<any>} allCodes - 전체 코드 목록
	 * @returns {string[]} 하위 코드 배열
	 */
	function getAllChildCodes(parentCode, allCodes) {
		/** @type {string[]} */
		const result = [];
		
		/**
		 * 재귀적으로 하위 코드 찾기
		 * @param {string} code - 현재 코드
		 */
		function findChildren(code) {
			const children = allCodes.filter((/** @type {any} */ c) => c.parent_code === code);
			for (const child of children) {
				result.push(child.code);
				findChildren(child.code);
			}
		}
		
		findChildren(parentCode);
		return result;
	}

	/**
	 * 상위 코드 변경 시 하위 코드 목록 업데이트
	 * @returns {Promise<void>}
	 */
	async function updateChildCodes() {
		if (!filters.parentCode) {
			childCodes = [];
			previousSelectedCodes = [];
			grandChildCodes = [];
			previousSelectedCodes2 = [];
			updateEvCodeItemsFromFilters();
			return;
		}

		isLoadingChildCodes = true;
		try {
			// organization 카테고리의 모든 코드 로드
			const { data, error } = await getSettings({
				category: 'organization',
				orderByOrder: true
			});

			if (error) {
				console.error('조직 코드 로드 실패:', error);
				childCodes = [];
				return;
			}

			// 선택된 상위 코드의 모든 하위 코드 찾기 (자기 자신 제외)
			const allChildCodes = getAllChildCodes(filters.parentCode, data || []);
			
			// 하위 코드 목록 생성 (상위 코드 제외, 하위 코드만)
			childCodes = allChildCodes.map((code) => {
				const codeData = (data || []).find((/** @type {any} */ c) => c.code === code);
				// 해당 코드의 직접 자식이 있는지 확인
				const hasChildren = (data || []).some((/** @type {any} */ c) => c.parent_code === code);
				return {
					value: code,
					label: codeData ? `${code} - ${codeData.title}` : code,
					hasChildren
				};
			});

			// 하위 코드 선택이 초기화되면 하위 코드의 하위 코드도 초기화
			filters.selectedCodes = [];
			grandChildCodes = [];
			previousSelectedCodes2 = [];

			// 필터의 하위 코드를 합쳐서 evCodeItems 업데이트
			updateEvCodeItemsFromFilters();
		} catch (err) {
			console.error('하위 코드 업데이트 예외:', err);
			childCodes = [];
		} finally {
			isLoadingChildCodes = false;
		}
	}

	/**
	 * 선택된 하위 코드들의 하위 코드 목록 업데이트 (3단계)
	 * @returns {Promise<void>}
	 */
	async function updateGrandChildCodes() {
		const currentSelectedCodes = Array.isArray(filters.selectedCodes) ? filters.selectedCodes : [];
		
		if (currentSelectedCodes.length === 0) {
			grandChildCodes = [];
			previousSelectedCodes2 = [];
			updateEvCodeItemsFromFilters();
			return;
		}

		isLoadingGrandChildCodes = true;
		try {
			// organization 카테고리의 모든 코드 로드
			const { data, error } = await getSettings({
				category: 'organization',
				orderByOrder: true
			});

			if (error) {
				console.error('조직 코드 로드 실패:', error);
				grandChildCodes = [];
				return;
			}

			/** @type {Set<string>} */
			const allGrandChildCodesSet = new Set();
			
			// 선택된 각 하위 코드의 직접 자식 코드들을 찾아서 합침
			for (const selectedCode of currentSelectedCodes) {
				const directChildren = (data || []).filter((/** @type {any} */ c) => c.parent_code === selectedCode);
				for (const child of directChildren) {
					allGrandChildCodesSet.add(child.code);
				}
			}

			// 하위 코드의 하위 코드 목록 생성
			grandChildCodes = Array.from(allGrandChildCodesSet).map((code) => {
				const codeData = (data || []).find((/** @type {any} */ c) => c.code === code);
				return {
					value: code,
					label: codeData ? `${code} - ${codeData.title}` : code
				};
			});

			// 필터의 하위 코드를 합쳐서 evCodeItems 업데이트
			updateEvCodeItemsFromFilters();
		} catch (err) {
			console.error('하위 코드의 하위 코드 업데이트 예외:', err);
			grandChildCodes = [];
		} finally {
			isLoadingGrandChildCodes = false;
		}
	}

	/**
	 * 필터의 하위 코드를 합쳐서 evCodeItems 업데이트
	 * @returns {void}
	 */
	function updateEvCodeItemsFromFilters() {
		/** @type {string[]} */
		const allCodes = [];

		// 하위 코드의 하위 코드가 선택된 경우 (3단계)
		const currentSelectedCodes2 = Array.isArray(filters.selectedCodes2) ? filters.selectedCodes2 : [];
		if (currentSelectedCodes2.length > 0) {
			allCodes.push(...currentSelectedCodes2);
		} else if (grandChildCodes.length > 0) {
			// 하위 코드의 하위 코드가 있지만 선택되지 않은 경우, 모두 사용
			const codes = grandChildCodes.map((/** @type {any} */ c) => c.value);
			allCodes.push(...codes);
		} else {
			// 하위 코드의 하위 코드가 없는 경우, 선택된 하위 코드 사용
			const currentSelectedCodes = Array.isArray(filters.selectedCodes) ? filters.selectedCodes : [];
			if (currentSelectedCodes.length > 0) {
				allCodes.push(...currentSelectedCodes);
			} else if (childCodes.length > 0) {
				// 하위 코드도 선택되지 않은 경우, 모든 하위 코드 사용
				const codes = childCodes.map((/** @type {any} */ c) => c.value);
				allCodes.push(...codes);
			}
		}

		/** @type {string[]} */
		let newEvCodeItems = [];
		
		// 필터가 모두 선택되지 않은 경우 기본 evCodeItems 사용
		if (allCodes.length === 0) {
			if (evCodes.length > 0) {
				const allItems = evCodes.flatMap(evCode => evCode.items || []);
				newEvCodeItems = [...new Set(allItems)];
			} else {
				newEvCodeItems = [];
			}
		} else {
			// 중복 제거
			newEvCodeItems = [...new Set(allCodes)];
		}

		// 이전 값과 비교해서 변경된 경우에만 업데이트 (무한루프 방지)
		const currentEvCodeItemsStr = JSON.stringify([...evCodeItems].sort());
		const newEvCodeItemsStr = JSON.stringify([...newEvCodeItems].sort());
		
		if (currentEvCodeItemsStr !== newEvCodeItemsStr) {
			evCodeItems = newEvCodeItems;
		}
	}

	/**
	 * 하위 코드의 하위 코드 선택 변경 시 evCodeItems 업데이트 (무한루프 방지)
	 */
	$effect(() => {
		if (isLoadingChildCodes || isLoadingGrandChildCodes || !user || authLoading) {
			return;
		}

		const currentSelectedCodes2 = Array.isArray(filters.selectedCodes2) ? filters.selectedCodes2 : [];
		const currentSelectedCodes2Str = JSON.stringify([...currentSelectedCodes2].sort());
		const previousSelectedCodes2Str = JSON.stringify([...previousSelectedCodes2].sort());
		
		// 선택된 코드가 실제로 변경되었을 때만 실행 (evCodeItems 쓰기 시 effect 재실행 방지)
		if (currentSelectedCodes2Str !== previousSelectedCodes2Str) {
			previousSelectedCodes2 = [...currentSelectedCodes2];
			untrack(() => updateEvCodeItemsFromFilters());
		}
	});

	/**
	 * childCodes 또는 grandChildCodes 변경 시 evCodeItems 업데이트 (초기 로드 시, evCodeItems 의존성으로 재실행 방지)
	 */
	$effect(() => {
		if (isLoadingChildCodes || isLoadingGrandChildCodes || !user || authLoading || allSettings.length === 0) {
			return;
		}

		if (childCodes.length > 0 || grandChildCodes.length > 0) {
			untrack(() => updateEvCodeItemsFromFilters());
		}
	});

	/**
	 * 데이터 로드 (중복 호출 방지)
	 * @returns {Promise<void>}
	 */
	async function loadDataByYear() {
		if (!filters.year || !evCodeItems || evCodeItems.length === 0) {
			displayData = [];
			return;
		}

		// 이미 로딩 중이면 중복 호출 방지
		if (isLoading) {
			return;
		}

		isLoading = true;
		try {
			// evCodeItems 만 데이터 로드
			console.log('loadDataByYear evCodeItems:', $state.snapshot(evCodeItems));
			const { data, error } = await loadData(parseInt(filters.year), evCodeItems);

			if (error) {
				console.error(`${title} 데이터 로드 실패:`, error);
				// 테이블이 없는 경우 에러 메시지 표시
				// if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
				// 	const tableFile = tableName ? `docs/supabase/${tableName}.sql` : `docs/supabase/ev_${category}.sql`;
				// 	console.error(`⚠️ ev_${category} 테이블이 생성되지 않았습니다. ${tableFile} 파일을 Supabase SQL Editor에서 실행하세요.`);
				// }
				displayData = [];
			} else {
				// 데이터 조직화
				displayData = organizeData(data || [], evCodes, filters);
				console.log(category === 'sales' ? '매출' : '원가', '데이터를 테이블 출력용으로 변환:', $state.snapshot(displayData));
			}
		} catch (err) {
			console.error(`${title} 데이터 로드 예외:`, err);
			displayData = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 코드 이름 가져오기
	 * @param {string} code - 코드
	 * @returns {string}
	 */
	function getCodeTitle(code) {
		const setting = allSettings.find((/** @type {any} */ s) => s.code === code);
		return setting?.title || code;
	}

	/**
	 * Breadcrumb 텍스트 생성
	 * @returns {string}
	 */
	const breadcrumbText = $derived.by(() => {
		// allSettings가 로드되지 않았으면 빈 문자열 반환
		if (!allSettings || allSettings.length === 0) {
			return '';
		}

		/** @type {string[]} */
		const parts = [];

		// 년도
		if (filters.year) {
			parts.push(`${filters.year}년`);
		}

		// 상위 코드
		if (filters.parentCode) {
			const parentTitle = getCodeTitle(filters.parentCode);
			if (parentTitle) {
				parts.push(parentTitle);
			}
		}

		// 하위 코드
		const currentSelectedCodes = Array.isArray(filters.selectedCodes) ? filters.selectedCodes : [];
		if (currentSelectedCodes.length > 0) {
			const selectedTitles = currentSelectedCodes
				.map(code => getCodeTitle(code))
				.filter(title => title);
			if (selectedTitles.length > 0) {
				parts.push(selectedTitles.join(', '));
			}
		}

		// 하위 코드의 하위 코드
		const currentSelectedCodes2 = Array.isArray(filters.selectedCodes2) ? filters.selectedCodes2 : [];
		if (currentSelectedCodes2.length > 0) {
			const selectedTitles2 = currentSelectedCodes2
				.map(code => getCodeTitle(code))
				.filter(title => title);
			if (selectedTitles2.length > 0) {
				parts.push(selectedTitles2.join(', '));
			}
		}

		return parts.join(' > ');
	});

	/**
	 * 금액 포맷팅 (천단위 콤마만, ₩ 기호 제거)
	 * @param {number} amount - 금액
	 * @returns {string}
	 */
	function formatAmount(amount) {
		if (amount === null || amount === undefined) return '-';
		return new Intl.NumberFormat('ko-KR', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	/**
	 * 1~12월 배열 생성
	 * @type {number[]}
	 */
	const months = $derived.by(() => {
		return Array.from({ length: 12 }, (_, i) => i + 1);
	});
</script>

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
					<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
					{#if breadcrumbText && breadcrumbText.trim() !== ''}
						<div class="breadcrumb-container">
							{#each breadcrumbText.split(' > ') as part, index}
								{#if index > 0}
									<span class="breadcrumb-separator"> > </span>
								{/if}
								<span class="breadcrumb-item">{part}</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- 필터 영역 -->
				<FilterBar
					bind:filters={filters}
					onApply={async () => {
						await updateUrlParams();
					}}
					fields={[
						{
							key: 'year',
							type: 'select',
							label: '년도',
							options: [
								{ value: new Date().getFullYear().toString(), label: `${new Date().getFullYear()}년` },
								{ value: (new Date().getFullYear() - 1).toString(), label: `${new Date().getFullYear() - 1}년` },
								{ value: (new Date().getFullYear() - 2).toString(), label: `${new Date().getFullYear() - 2}년` }
							]
						},
						{
							key: 'parentCode',
							type: 'select',
							label: '상위 코드',
							options: secondLevelOrgCodes
						},
						{
							key: 'selectedCodes',
							type: 'select-multiple',
							label: '하위 코드',
							options: childCodes
						},
						{
							key: 'selectedCodes2',
							type: 'select-multiple',
							label: '하위 코드의 하위 코드',
							options: grandChildCodes
						}
					]}
					onReset={async () => {
						filters = { 
							year: new Date().getFullYear().toString(),
							parentCode: 'SUM_000',
							selectedCodes: [],
							selectedCodes2: []
						};
						displayData = [];
						evCodeItems = [];
						childCodes = [];
						grandChildCodes = [];
						previousParentCode = 'SUM_000';
						previousSelectedCodes = [];
						previousSelectedCodes2 = [];
						previousYear = new Date().getFullYear().toString();
						await updateUrlParams();
					}}
				/>

				<!-- 데이터 테이블 -->
				<div class="bg-white rounded-lg shadow-md overflow-hidden">
					{#if isLoading}
						<div class="flex items-center justify-center py-12">
							<div class="text-gray-500">데이터 로딩 중...</div>
						</div>
					{:else if displayData.length === 0}
						<div class="flex flex-col items-center justify-center py-12">
							<div class="text-gray-500 mb-2">{emptyMessage}</div>
							{#if !filters.year}
								<div class="text-xs text-gray-400">년도를 선택해주세요.</div>
							{/if}
							<div class="text-xs text-gray-400">
								{#if isLoading}
									데이터를 불러오는 중...
								{/if}
							</div>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="data-table">
								<thead>
									<tr>
										<th class="w-60 !text-left">항목</th>
										<!-- <th class="w-8 !text-center">년도</th> -->
										{#each months as month}
											<th class="!text-right">{month}월</th>
										{/each}
										<th class="!text-right">합계</th>
									</tr>
								</thead>
								<tbody>
									{#each displayData as item}
										<tr>
											<td class="!text-blue-500">{item.evCode.title}</td>
											<!-- <td class="!text-blue-500">{item.year}</td> -->
											{#each months as month}
												<td class="w-40 !text-right">
													{formatAmount(item.monthData[month] || 0)}
												</td>
											{/each}
											<td class="w-40 !text-right !text-blue-500">
												{formatAmount(
													months.reduce((sum, month) => sum + (item.monthData[month] || 0), 0)
												)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>

<style>
	.admin-content-page {
		width: 100%;
	}

	.breadcrumb-container {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 8px;
		font-size: 0.9rem;
		color: #374151;
	}

	.breadcrumb-item {
		color: #374151;
	}

	.breadcrumb-separator {
		color: #ffffff;
		font-weight: 700;
		margin: 0 2px;
		background-color: #2563eb;
		padding: 0 2px 2px 2px;
		border-radius: 8px;
		height: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th {
		background-color: #f3f4f6;
		padding: 12px;
		text-align: left;
		font-weight: 600;
		font-size: 0.875rem;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
		white-space: nowrap;
	}

	.data-table td {
		padding: 12px;
		border: 1px solid #e5e7eb;
		font-size: 0.875rem;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.data-table tbody tr:hover {
		background-color: #f9fafb;
	}

	.text-right {
		text-align: right;
	}
</style>
