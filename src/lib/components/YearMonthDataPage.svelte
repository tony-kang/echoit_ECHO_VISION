<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import MobileMenuButton from '$lib/components/MobileMenuButton.svelte';
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
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);

	/** @type {Array<any>} 전체 환경설정 코드 목록 */
	let allSettings = $state([]);
	/** @type {Array<any>} 표시할 데이터 */
	let displayData = $state([]);
	let isLoading = $state(false);
	/** @type {Array<any>} ev_code 목록 */
	let evCodes = $state([]);
	let evCodeItems = $state([]);
	let isLoadingEvCodes = $state(false);

	/** @type {Record<string, any>} 필터 객체 */
	let filters = $state({ year: new Date().getFullYear().toString() });
	/** @type {string | null} 이전 연도 값 (무한루프 방지) */
	let previousYear = $state(new Date().getFullYear().toString());

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			userProfile = state.userProfile;

			if (!state.loading && !state.user) {
				goto('/login');
			} else if (state.user && state.userProfile) {
				// 사용자 프로필이 로드된 후에만 설정 로드
				loadAllSettings();
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

				// ev_sales/ev_cost 데이터를 로드할 때 사용할 evCode의 items를 평탄화하고 중복 제거
				const allItems = evCodes.flatMap(evCode => evCode.items || []);
				evCodeItems = [...new Set(allItems)];

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
	 * 연도 변경 시 데이터 로드 (무한루프 방지)
	 */
	$effect(() => {
		const currentYear = filters.year;

		// 연도가 변경되었고, 사용자가 로그인했고, 로딩 중이 아닐 때만 호출
		if (user && !authLoading && currentYear && currentYear !== previousYear && !isLoading) {
			previousYear = currentYear;
			loadDataByYear();
		} else if (!currentYear) {
			// 연도가 없으면 이전 연도도 초기화
			previousYear = null;
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
		} catch (err) {
			console.error('환경설정 코드 로드 예외:', err);
			allSettings = [];
		}
	}

	/**
	 * 데이터 로드 (중복 호출 방지)
	 * @returns {Promise<void>}
	 */
	async function loadDataByYear() {
		if (!filters.year) {
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
							<div class="flex items-center justify-between gap-3 mb-2">
								<div class="flex items-center gap-3">
									<MobileMenuButton bind:isOpen={isSidebarOpen} />
									<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
								</div>
							</div>
						</div>

						<!-- 필터 영역 -->
						<FilterBar
							bind:filters={filters}
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
								}
							]}
							onReset={() => {
								filters = { year: new Date().getFullYear().toString() };
								displayData = [];
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
	</div>
</div>

<style>
	.admin-content-page {
		width: 100%;
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
	}

	.data-table tbody tr:hover {
		background-color: #f9fafb;
	}

	.text-right {
		text-align: right;
	}
</style>
