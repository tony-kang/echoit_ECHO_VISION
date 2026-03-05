<script>
	import { tick, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/authStore.svelte.js';
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
		// tableName
	} = $props();

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	let authLoading = $derived(authStore.loading);
	/** @type {Object | null} */
	let userProfile = $derived(authStore.profile);

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
	 * URL 쿼리 파라미터에서 초기값 읽기 (evCodeItems가 ["xxx","xxx"] 형태로 오면 parentCodes로 복원)
	 * @returns {Record<string, any>}
	 */
	function getInitialFilters() {
		const urlYear = page.url.searchParams.get('year');
		const urlEvCodeItems = page.url.searchParams.get('evCodeItems');
		/** @type {string[]} */
		let parentCodes = [];
		if (urlEvCodeItems) {
			try {
				const parsed = JSON.parse(decodeURIComponent(urlEvCodeItems));
				if (Array.isArray(parsed) && parsed.every((/** @type {any} */ p) => typeof p === 'string')) {
					parentCodes = [...parsed];
				}
			} catch {
				// ignore
			}
		}
		return {
			year: urlYear || new Date().getFullYear().toString(),
			parentCodes,
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
	/** @type {string | null} 이전 parentCodes 정렬 JSON 문자열 (무한루프 방지) */
	let previousParentCodesStr = $state(null);
	/** @type {string[]} 이전 선택된 코드 배열 (무한루프 방지) */
	let previousSelectedCodes = $state([]);
	/** @type {string[]} 이전 선택된 하위 코드의 하위 코드 배열 (무한루프 방지) */
	let previousSelectedCodes2 = $state([]);
	/** @type {string | null} 이전 evCodeItems 문자열 (무한루프 방지) */
	let previousEvCodeItemsStr = $state(null);

	/** @type {boolean} env_code(전체 설정) 로드 완료 여부 */
	let allSettingsLoaded = $state(false);
	/** @type {boolean} loadAllSettings 호출 중 여부 (중복 호출 방지) */
	let allSettingsLoading = $state(false);
	/** @type {string[]} 조직 체크박스 선택 코드 (체크 시 여기만 갱신, URL/초기화 시에만 filters에서 동기화) */
	let selectedOrgCodes = $state((() => {
		const f = getInitialFilters();
		return Array.isArray(f.parentCodes) ? [...f.parentCodes] : [];
	})());

	$effect(() => {
		if (!authStore.loading && !authStore.user) {
			goto('/login');
			return;
		}
		if (authStore.user && authStore.profile && !allSettingsLoaded && !allSettingsLoading) {
			allSettingsLoading = true;
			loadAllSettings();
		}
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
				const parentCodes = Array.isArray(filters.parentCodes) ? filters.parentCodes : [];
				if (parentCodes.length === 0) {
					// ev_sales/ev_cost 데이터를 로드할 때 사용할 evCode의 items를 평탄화하고 중복 제거
					const allItems = evCodes.flatMap(evCode => evCode.items || []);
					evCodeItems = [...new Set(allItems)];
				}

				// console.log('ev_code 목록:', $state.snapshot(evCodes));
				console.log('evCodeItems:', filters.year,  category, $state.snapshot(evCodeItems));
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
	 * 조직(상위 코드) 다중 선택 시 evCodeItems를 선택된 코드 배열로 설정 → URL 갱신 및 데이터 로드 effect에서 처리
	 */
	$effect(() => {
		const currentParentCodes = Array.isArray(filters.parentCodes) ? [...filters.parentCodes] : [];
		const currentStr = JSON.stringify([...currentParentCodes].sort());

		if (!user || authLoading) return;

		if (currentStr !== (previousParentCodesStr ?? '')) {
			previousParentCodesStr = currentParentCodes.length > 0 ? currentStr : null;
			evCodeItems = currentParentCodes.length > 0 ? [...currentParentCodes] : [];
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
	/** URL 변경 시에만 실행 (filters 구독 제거 → 체크 시 effect 재실행으로 selectedOrgCodes 덮어쓰기 방지) */
	$effect(() => {
		const urlYear = page.url.searchParams.get('year');
		const urlEvCodeItems = page.url.searchParams.get('evCodeItems');

		// URL의 year가 변경되었으면 filters 업데이트 (filters는 untrack으로 읽어 effect 의존성에서 제외)
		if (urlYear && urlYear !== untrack(() => filters.year)) {
			filters = { ...filters, year: urlYear };
		}

		// URL의 evCodeItems가 변경되었을 때만 evCodeItems·filters·selectedOrgCodes 동기화
		if (urlEvCodeItems) {
			try {
				const parsed = JSON.parse(decodeURIComponent(urlEvCodeItems));
				if (!Array.isArray(parsed) || !parsed.every((/** @type {any} */ p) => typeof p === 'string')) return;
				const parsedStr = JSON.stringify([...parsed].sort());
				const currentStr = untrack(() => JSON.stringify([...evCodeItems].sort()));
				if (currentStr !== parsedStr) {
					evCodeItems = [...parsed];
					filters = { ...filters, parentCodes: [...parsed] };
					selectedOrgCodes = [...parsed];
				}
			} catch {
				// 파싱 실패 시 무시
			}
		} else {
			const currentCodes = untrack(() => (Array.isArray(filters.parentCodes) ? filters.parentCodes : []));
			if (currentCodes.length > 0 || untrack(() => evCodeItems.length) > 0) {
				evCodeItems = [];
				filters = { ...filters, parentCodes: [] };
				selectedOrgCodes = [];
			}
		}
	});

	/**
	 * 연도/evCodeItems 변경 시 주소창 동기화 (tick 후 호출로 상태 반영 보장)
	 * evCodeItems·filters.year를 읽어 의존성 등록 → 조직 선택 시에도 effect 재실행되어 URL 갱신
	 */
	$effect(() => {
		if (!user || authLoading) return;
		// evCodeItems·filters.year 구독으로 조직 선택 시 effect 재실행
		void filters.year;
		void JSON.stringify([...evCodeItems].sort());
		untrack(async () => {
			await tick();
			updateUrlParams();
		});
	});

	/**
	 * 연도 또는 evCodeItems 변경 시 데이터 로드 (loadAllSettings 완료 후에만 실행)
	 */
	$effect(() => {
		const currentYear = filters.year;
		const currentEvCodeItems = [...evCodeItems];
		const currentEvCodeItemsStr = JSON.stringify([...currentEvCodeItems].sort());
		// allSettings 로드 완료 후에만 데이터 로드 (breadcrumb·organizeData 등에서 allSettings 사용)
		void allSettings.length;

		if (!user || authLoading || !allSettingsLoaded || !currentYear || isLoading || currentEvCodeItems.length === 0) {
			if (!currentYear) {
				previousYear = null;
				previousEvCodeItemsStr = null;
			}
			return;
		}
		if (currentYear !== previousYear || currentEvCodeItemsStr !== (previousEvCodeItemsStr || '')) {
			previousYear = currentYear;
			previousEvCodeItemsStr = currentEvCodeItemsStr;
			const yearNum = parseInt(currentYear, 10);
			untrack(async () => {
				await loadDataByYear(yearNum, currentEvCodeItems);
				await updateUrlParams();
			});
		}
	});

	/**
	 * 전체 환경설정 코드 로드
	 * @returns {Promise<void>}
	 */
	async function loadAllSettings() {
		if (!user) return;

		try {
			const { data, error } = await getSettings({
				orderByOrder: true
			});

			if (error) {
				console.error('환경설정 코드 로드 실패:', error);
				allSettings = [];
				return;
			}

			allSettings = data || [];
			await loadSecondLevelOrgCodes();
			allSettingsLoaded = true;
		} catch (err) {
			console.error('환경설정 코드 로드 예외:', err);
			allSettings = [];
		} finally {
			allSettingsLoading = false;
		}
	}

	/** env_code에서 organization 카테고리만 사용할 때 쓰는 상수 */
	const ORG_CATEGORY = 'organization';

	/**
	 * env_code의 organization 카테고리 항목을 레벨 구분 없이 전부 나열해 로드
	 * @returns {Promise<void>}
	 */
	async function loadSecondLevelOrgCodes() {
		try {
			const { data, error } = await getSettings({
				category: ORG_CATEGORY,
				orderByOrder: true
			});

			if (error) {
				console.error('조직 코드 로드 실패:', error);
				secondLevelOrgCodes = [];
				return;
			}

			const list = (data || []).filter((row) => row.category === ORG_CATEGORY);
			secondLevelOrgCodes = list.map((row) => ({
				value: row.code,
				label: `${row.code} - ${row.title || ''}`
			}));
		} catch (err) {
			console.error('조직 코드 로드 예외:', err);
			secondLevelOrgCodes = [];
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
			const allGrandChildCodesSet = new SvelteSet();
			
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

		// 조직(상위 코드)만 선택된 경우 선택된 코드 배열 사용
		const parentCodes = Array.isArray(filters.parentCodes) ? filters.parentCodes : [];
		if (parentCodes.length > 0 && allCodes.length === 0) {
			newEvCodeItems = [...parentCodes];
		} else if (allCodes.length > 0) {
			newEvCodeItems = [...new Set(allCodes)];
		} else {
			// parentCode도 없고 하위 선택도 없을 때만 evCodes 전체 사용
			if (evCodes.length > 0) {
				const allItems = evCodes.flatMap(evCode => evCode.items || []);
				newEvCodeItems = [...new Set(allItems)];
			} else {
				newEvCodeItems = [];
			}
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
	 * @param {number} [year] - 연도 (미지정 시 filters.year 사용)
	 * @param {string[]} [items] - evCodeItems (미지정 시 evCodeItems 상태 사용, effect에서 호출 시 현재값 전달 권장)
	 * @returns {Promise<void>}
	 */
	async function loadDataByYear(year, items) {
		const y = year ?? (filters.year ? parseInt(filters.year, 10) : 0);
		const itemsToUse = items ?? evCodeItems;
		if (!y || !itemsToUse || itemsToUse.length === 0) {
			displayData = [];
			return;
		}

		// 이미 로딩 중이면 중복 호출 방지
		if (isLoading) {
			return;
		}

		isLoading = true;
		try {
			const { data, error } = await loadData(y, itemsToUse);

			if (error) {
				console.error(`${title} 데이터 로드 실패:`, error);
				// 테이블이 없는 경우 에러 메시지 표시
				// if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
				// 	const tableFile = tableName ? `docs/supabase/${tableName}.sql` : `docs/supabase/ev_${category}.sql`;
				// 	console.error(`⚠️ ev_${category} 테이블이 생성되지 않았습니다. ${tableFile} 파일을 Supabase SQL Editor에서 실행하세요.`);
				// }
				displayData = [];
			} else {
				displayData = organizeData(data || [], evCodes, filters);
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
	// function getCodeTitle(code) {
	// 	const setting = allSettings.find((/** @type {any} */ s) => s.code === code);
	// 	return setting?.title || code;
	// }

	/**
	 * Breadcrumb 텍스트 생성
	 * @returns {string}
	 */
	// const breadcrumbText = $derived.by(() => {
	// 	// allSettings가 로드되지 않았으면 빈 문자열 반환
	// 	if (!allSettings || allSettings.length === 0) {
	// 		return '';
	// 	}

	// 	/** @type {string[]} */
	// 	const parts = [];

	// 	// 년도
	// 	if (filters.year) {
	// 		parts.push(`${filters.year}년`);
	// 	}

	// 	// 상위 코드(다중)
	// 	const parentCodes = Array.isArray(filters.parentCodes) ? filters.parentCodes : [];
	// 	if (parentCodes.length > 0) {
	// 		const parentTitles = parentCodes.map((code) => getCodeTitle(code)).filter((t) => t);
	// 		if (parentTitles.length > 0) {
	// 			parts.push(parentTitles.join(', '));
	// 		}
	// 	}

	// 	// 하위 코드
	// 	const currentSelectedCodes = Array.isArray(filters.selectedCodes) ? filters.selectedCodes : [];
	// 	if (currentSelectedCodes.length > 0) {
	// 		const selectedTitles = currentSelectedCodes
	// 			.map(code => getCodeTitle(code))
	// 			.filter(title => title);
	// 		if (selectedTitles.length > 0) {
	// 			parts.push(selectedTitles.join(', '));
	// 		}
	// 	}

	// 	// 하위 코드의 하위 코드
	// 	const currentSelectedCodes2 = Array.isArray(filters.selectedCodes2) ? filters.selectedCodes2 : [];
	// 	if (currentSelectedCodes2.length > 0) {
	// 		const selectedTitles2 = currentSelectedCodes2
	// 			.map(code => getCodeTitle(code))
	// 			.filter(title => title);
	// 		if (selectedTitles2.length > 0) {
	// 			parts.push(selectedTitles2.join(', '));
	// 		}
	// 	}

	// 	return parts.join(' > ');
	// });

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

	/**
	 * 조직 체크박스 토글
	 * @param {string} value - 코드 값
	 * @param {boolean} checked - 체크 여부
	 */
	function handleOrgCheck(value, checked) {
		const next = checked
			? (selectedOrgCodes.includes(value) ? selectedOrgCodes : [...selectedOrgCodes, value])
			: selectedOrgCodes.filter((c) => c !== value);
		selectedOrgCodes = next;
		filters = { ...filters, parentCodes: next };
	}

	/**
	 * 조직 전체 선택/해제
	 * @param {boolean} selectAll - true: 전체 선택, false: 전체 해제
	 */
	function handleOrgSelectAll(selectAll) {
		const next = selectAll ? secondLevelOrgCodes.map((o) => o.value) : [];
		selectedOrgCodes = next;
		filters = { ...filters, parentCodes: next };
	}

	/**
	 * 필터 초기화 (년도·조직 초기화 후 URL 갱신)
	 * @returns {Promise<void>}
	 */
	async function handleFilterReset() {
		const currentYear = new Date().getFullYear().toString();
		filters = {
			year: currentYear,
			parentCodes: [],
			selectedCodes: [],
			selectedCodes2: []
		};
		selectedOrgCodes = [];
		displayData = [];
		evCodeItems = [];
		childCodes = [];
		grandChildCodes = [];
		previousParentCodesStr = null;
		previousSelectedCodes = [];
		previousSelectedCodes2 = [];
		previousYear = currentYear;
		await updateUrlParams();
	}
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
					<p>엑셀 데이터 확인용 페이지입니다. 데이터를 확인하고 싶은 조직을 선택해주세요.</p>
					<!-- {#if breadcrumbText && breadcrumbText.trim() !== ''}
						<div class="breadcrumb-container">
							{#each breadcrumbText.split(' > ') as part, index (index)}
								{#if index > 0}
									<span class="breadcrumb-separator"> > </span>
								{/if}
								<span class="breadcrumb-item">{part}</span>
							{/each}
						</div>
					{/if} -->
				</div>

				<!-- 년도 + 조직 체크박스 (펼쳐진 형태, 10 x 6 그리드) -->
				<div class="org-checkbox-section">
					<div class="org-checkbox-header">
						<div class="org-header-left">
							<label class="org-header-year-label">
								<span class="org-checkbox-title">년도</span>
								<select
									class="org-header-year-select"
									value={filters.year}
									onchange={(e) => {
										const y = e.target.value;
										filters = { ...filters, year: y };
									}}
								>
									<option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}년</option>
									<option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}년</option>
									<option value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}년</option>
								</select>
							</label>
							<span class="org-checkbox-title">조직</span>
						</div>
						<div class="org-checkbox-actions">
							<button type="button" class="org-checkbox-btn" onclick={() => handleOrgSelectAll(true)}>전체 선택</button>
							<button type="button" class="org-checkbox-btn" onclick={() => handleOrgSelectAll(false)}>전체 해제</button>
							<button type="button" class="org-checkbox-btn org-checkbox-btn-reset" onclick={() => handleFilterReset()}>초기화</button>
						</div>
					</div>
					<div class="org-checkbox-grid">
						{#each secondLevelOrgCodes as option (option.value)}
							{@const selected = selectedOrgCodes.includes(option.value)}
							<label class="org-checkbox-item">
								<input
									type="checkbox"
									checked={selected}
									onchange={(e) => handleOrgCheck(option.value, e.target.checked)}
									class="org-checkbox-input"
								/>
								<span class="org-checkbox-label">{option.label}</span>
							</label>
						{/each}
					</div>
				</div>

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
										<th class="w-60 text-left!">항목</th>
										<!-- <th class="w-8 text-center!">년도</th> -->
										{#each months as month (month)}
											<th class="text-right!">{month}월</th>
										{/each}
										<th class="text-right!">합계</th>
									</tr>
								</thead>
								<tbody>
									{#each displayData as item, i (item.evCode?.code ?? `row-${i}`)}
										<tr>
											<td class="text-blue-500!">{item.evCode.title}</td>
											<!-- <td class="text-blue-500!">{item.year}</td> -->
											{#each months as month (month)}
												<td class="w-40 text-right!">
													{formatAmount(item.monthData[month] || 0)}
												</td>
											{/each}
											<td class="w-40 text-right! text-blue-500!">
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
		padding: 5px 12px;
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

	/* 조직 체크박스: 펼쳐진 형태, 가로 10 x 세로 6 그리드 */
	.org-checkbox-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 12px 16px;
		margin-bottom: 20px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.org-checkbox-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid #e5e7eb;
	}

	.org-header-left {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.org-checkbox-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: #374151;
	}

	.org-header-year-label {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.org-header-year-select {
		height: 32px;
		padding: 0 8px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		background: white;
		color: #374151;
		min-width: 90px;
		cursor: pointer;
	}

	.org-header-year-select:focus {
		outline: none;
		border-color: #2563eb;
	}

	.org-checkbox-btn-reset {
		margin-left: 4px;
		border-color: #f87171;
		color: #dc2626;
	}

	.org-checkbox-btn-reset:hover {
		background: #fef2f2;
		border-color: #dc2626;
	}

	.org-checkbox-actions {
		display: flex;
		gap: 8px;
	}

	.org-checkbox-btn {
		padding: 4px 10px;
		font-size: 0.8rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: #f9fafb;
		color: #374151;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.org-checkbox-btn:hover {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	.org-checkbox-grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 6px 16px;
	}

	.org-checkbox-item {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		user-select: none;
		font-size: 0.8rem;
		color: #374151;
		min-width: 0;
	}

	.org-checkbox-item:hover {
		color: #1f2937;
	}

	.org-checkbox-input {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		cursor: pointer;
		accent-color: #2563eb;
	}

	.org-checkbox-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
