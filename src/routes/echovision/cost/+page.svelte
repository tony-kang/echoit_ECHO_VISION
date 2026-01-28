<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { getSettings, getEvCodes } from '$lib/settingsService';
	import { getCosts } from '$lib/costService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);
	
	/** @type {Array<any>} 전체 환경설정 코드 목록 */
	let allSettings = $state([]);
	/** @type {Array<any>} 표시할 원가 데이터 */
	let costData = $state([]);
	let isLoading = $state(false);
	/** @type {Array<any>} ev_code 목록 (cost 카테고리) */
	let evCodes = $state([]);
	let isLoadingEvCodes = $state(false);
	
	/** @type {Record<string, any>} 필터 객체 */
	let filters = $state({ year: null });
	/** @type {string | null} 이전 연도 값 (무한루프 방지) */
	let previousYear = $state(null);

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
	 * ev_code 목록 로드 (cost 카테고리)
	 * @returns {Promise<void>}
	 */
	async function loadEvCodes() {
		isLoadingEvCodes = true;
		try {
			const { data, error } = await getEvCodes({ category: 'cost' });
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
			isLoadingEvCodes = false;
		}
	}

	/**
	 * 사용자 및 인증 상태가 준비되면 ev_code 로드
	 */
	$effect(() => {
		if (user && !authLoading && userProfile) {
			loadEvCodes();
		}
	});

	/**
	 * 연도 변경 시 원가 데이터 로드 (무한루프 방지)
	 */
	$effect(() => {
		const currentYear = filters.year;
		
		// 연도가 변경되었고, 사용자가 로그인했고, 로딩 중이 아닐 때만 호출
		if (user && !authLoading && currentYear && currentYear !== previousYear && !isLoading) {
			previousYear = currentYear;
			loadCostData();
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
	 * 원가 데이터 로드 (중복 호출 방지)
	 * @returns {Promise<void>}
	 */
	async function loadCostData() {
		if (!filters.year) {
			costData = [];
			return;
		}

		// 이미 로딩 중이면 중복 호출 방지
		if (isLoading) {
			return;
		}

		isLoading = true;
		try {
			const { data, error } = await getCosts({
				year: parseInt(filters.year),
				orderByYear: true,
				orderByMonth: true
			});

			if (error) {
				console.error('원가 데이터 로드 실패:', error);
				// 테이블이 없는 경우 에러 메시지 표시
				if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
					console.error('⚠️ ev_cost 테이블이 생성되지 않았습니다. docs/supabase/ev_cost.sql 파일을 Supabase SQL Editor에서 실행하세요.');
				}
				costData = [];
			} else {
				// org_code별로 그룹화
				costData = organizeCostDataByOrgCode(data || []);
			}
		} catch (err) {
			console.error('원가 데이터 로드 예외:', err);
			costData = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 원가 데이터를 ev_code별로 그룹화하고 월별 데이터를 구성
	 * ev_code를 행으로, 1~12월을 열로 표시하기 위한 데이터 구조 생성
	 * ev_code의 item_code와 rawData의 org_code가 일치하는 항목만 사용
	 * @param {Array<any>} rawData - 원본 데이터
	 * @returns {Array<any>} ev_code별로 그룹화된 데이터 (각 항목에 1~12월 데이터 포함)
	 */
	function organizeCostDataByOrgCode(rawData) {
		if (!rawData || rawData.length === 0) {
			return [];
		}

		// ev_code별로 데이터 구성
		/** @type {Map<string, any>} */
		const evCodeDataMap = new Map();

		// 각 ev_code에 대해 초기화
		// evCodes는 ev_code 테이블에서 조회한 데이터
		for (const evCode of evCodes) {
			if (!evCode.item_code) continue;
			
			evCodeDataMap.set(evCode.item_code, {
				evCode: evCode,
				year: filters.year ? parseInt(filters.year) : null,
				monthData: {} // 1~12월 데이터
			});
		}

		// rawData를 순회하면서 각 항목의 excel_file_data에서 ev_code.item_code를 키로 사용하여 금액 찾기
		// rawData는 ev_cost 테이블에서 조회한 데이터 = 여러개의 엑셀로 입력한 비용 데이터
		// rawData의 org_code는 "SUM_000" 등이고, excel_file_data에는 "COST_1400", "COST_1300" 등의 키로 금액이 저장됨
		for (const item of rawData) {
			const orgCode = item.org_code;
			const year = item.year;
			const month = item.month;

			if (orgCode !== 'SUM_000') continue;
			
			if (!orgCode || !year || !month || month < 1 || month > 12) {
				continue; // 필수 값이 없으면 제외
			}

			// excel_file_data가 없으면 제외
			if (!item.excel_file_data || typeof item.excel_file_data !== 'object') {
				continue;
			}

			// evCodeDataMap의 각 ev_code에 대해 처리
			for (const [evCodeItemCode, evCodeItem] of evCodeDataMap.entries()) {
				// ev_code.item_code를 excel_file_data의 키로 사용하여 금액 찾기
				const value = item.excel_file_data[evCodeItemCode];
				if (value === null || value === undefined) {
					continue; // 해당 키의 값이 없으면 제외
				}

				const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
				if (isNaN(numValue)) {
					continue; // 숫자가 아니면 제외
				}

				// 해당 월의 데이터에 합산 (같은 월에 여러 데이터가 있을 수 있으므로 합산)
				if (evCodeItem.monthData[month] === undefined) {
					evCodeItem.monthData[month] = 0;
				}
				evCodeItem.monthData[month] += numValue;
			}
		}

		// 배열로 변환하여 반환
		return Array.from(evCodeDataMap.values());
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
	 * 금액 포맷팅
	 * @param {number} amount - 금액
	 * @returns {string}
	 */
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
	 * 연도/월 표시
	 * @param {number} year - 연도
	 * @param {number|null} month - 월
	 * @returns {string}
	 */
	function formatPeriod(year, month) {
		if (month === null || month === undefined) {
			return `${year}년`;
		}
		return `${year}년 ${month}월`;
	}

	/**
	 * ev_code의 items 배열에 해당하는 excel_file_data 값들의 합계 계산
	 * @param {any} evCode - ev_code 항목
	 * @param {any} costItem - ev_cost 항목
	 * @returns {number}
	 */
	function calculateEvCodeTotal(evCode, costItem) {
		if (!evCode?.items || !Array.isArray(evCode.items) || !costItem?.excel_file_data) {
			return 0;
		}

		let total = 0;
		for (const itemCode of evCode.items) {
			const value = costItem.excel_file_data[itemCode];
			if (value !== null && value !== undefined) {
				// 숫자 문자열인 경우 파싱
				const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
				if (!isNaN(numValue)) {
					total += numValue;
				}
			}
		}
		return total;
	}

	/**
	 * 표시할 ev_code 항목 목록 (모든 cost 카테고리 ev_code 표시)
	 * @type {Array<any>}
	 */
	const filteredEvCodes = $derived.by(() => {
		// 모든 cost 카테고리 ev_code 반환
		return evCodes || [];
	});

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
									<h1 class="text-2xl font-bold text-gray-900">원가 정보</h1>
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
							filters = { year: null };
							costData = [];
						}}
					/>

						<!-- 원가 데이터 테이블 -->
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							{#if isLoading}
								<div class="flex items-center justify-center py-12">
									<div class="text-gray-500">데이터 로딩 중...</div>
								</div>
							{:else if costData.length === 0}
								<div class="flex flex-col items-center justify-center py-12">
									<div class="text-gray-500 mb-2">원가 데이터가 없습니다.</div>
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
												<th class="w-12 !text-center">코드</th>
												<th class="w-8 !text-center">년도</th>
												{#each months as month}
													<th class="!text-right">{month}월</th>
												{/each}
											</tr>
										</thead>
										<tbody>
											{#each costData as item}
												<tr>
													<td>{item.evCode.title}</td>
													<td>{item.evCode.item_code}</td>
													<td>{item.year}</td>
													{#each months as month}
														<td class="w-40 !text-right">
															{formatAmount(item.monthData[month] || 0)}
														</td>
													{/each}
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
