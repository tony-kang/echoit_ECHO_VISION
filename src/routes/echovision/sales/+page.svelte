<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { getSettings } from '$lib/settingsService';
	import { getSales, getChildCodes } from '$lib/salesService';
	import { isAdmin } from '$lib/userService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);
	
	/** @type {Array<any>} 전체 환경설정 코드 목록 */
	let allSettings = $state([]);
	/** @type {Array<any>} 접근 가능한 최상위 코드 목록 (select 옵션용) */
	let accessibleTopLevelOptions = $state([]);
	/** @type {string|null} 선택된 최상위 코드 */
	let selectedTopLevelCode = $state(null);
	/** @type {boolean} 초기 선택 완료 여부 */
	let initialSelectionDone = $state(false);
	/** @type {Array<any>} 표시할 매출 데이터 */
	let salesData = $state([]);
	let isLoading = $state(false);

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

	/**
	 * 선택된 코드와 그 하위 코드 목록
	 * @type {string[]}
	 */
	const selectedCodes = $derived.by(() => {
		if (!selectedTopLevelCode || !allSettings.length) return [];
		
		const accessibleCodes = accessibleTopLevelCodes;
		// 접근 가능한 코드인지 확인
		if (accessibleCodes !== null && accessibleCodes.length > 0) {
			if (!accessibleCodes.includes(selectedTopLevelCode)) {
				return [];
			}
		}
		
		// 선택된 코드와 그 하위 코드들 가져오기
		return getChildCodes(selectedTopLevelCode, allSettings);
	});

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
	 * 선택된 코드 변경 시 매출 데이터 로드
	 */
	$effect(() => {
		if (user && !authLoading && selectedTopLevelCode && allSettings.length > 0 && selectedCodes.length > 0 && initialSelectionDone) {
			loadSalesData();
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
			// 설정 로드 후 접근 가능한 최상위 코드 옵션 로드
			if (userProfile) {
				loadAccessibleTopLevelOptions();
			}
		} catch (err) {
			console.error('환경설정 코드 로드 예외:', err);
			allSettings = [];
		}
	}

	/**
	 * 접근 가능한 최상위 코드 옵션 로드
	 * @returns {void}
	 */
	function loadAccessibleTopLevelOptions() {
		const accessibleCodes = accessibleTopLevelCodes;
		
		if (accessibleCodes === null) {
			// 관리자/마스터: 모든 최상위 코드 표시
			accessibleTopLevelOptions = allSettings.filter((/** @type {any} */ s) => !s.parent_code);
		} else if (accessibleCodes.length > 0) {
			// 일반 사용자: 접근 가능한 최상위 코드만 표시
			accessibleTopLevelOptions = allSettings.filter((/** @type {any} */ s) => 
				!s.parent_code && accessibleCodes.includes(s.code)
			);
		} else {
			accessibleTopLevelOptions = [];
		}

		// 기본 선택: 첫 번째 옵션 (이미 선택된 값이 없을 때만)
		if (accessibleTopLevelOptions.length > 0 && !selectedTopLevelCode && !initialSelectionDone) {
			selectedTopLevelCode = accessibleTopLevelOptions[0].code;
			initialSelectionDone = true;
		}
	}

	/**
	 * 매출 데이터 로드
	 * @returns {Promise<void>}
	 */
	async function loadSalesData() {
		if (!selectedTopLevelCode || selectedCodes.length === 0) {
			salesData = [];
			return;
		}

		isLoading = true;
		try {
			const { data, error } = await getSales({
				codes: selectedCodes,
				orderByYear: true,
				orderByMonth: true
			});

			if (error) {
				console.error('매출 데이터 로드 실패:', error);
				// 테이블이 없는 경우 에러 메시지 표시
				if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
					console.error('⚠️ ev_sales 테이블이 생성되지 않았습니다. docs/supabase/ev_sales.sql 파일을 Supabase SQL Editor에서 실행하세요.');
				}
				salesData = [];
			} else {
				salesData = data || [];
			}
		} catch (err) {
			console.error('매출 데이터 로드 예외:', err);
			salesData = [];
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
	 * 금액 포맷팅
	 * @param {number} amount - 금액
	 * @returns {string}
	 */
	function formatAmount(amount) {
		if (amount === null || amount === undefined) return '-';
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW',
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
									<h1 class="text-2xl font-bold text-gray-900">매출 정보</h1>
								</div>
								{#if userProfile}
									{@const topLevelCodes = Array.isArray(userProfile.top_level_codes) ? userProfile.top_level_codes : []}
									{#if topLevelCodes.length > 0}
										<div class="flex items-center gap-2 flex-wrap">
											<span class="text-sm text-gray-600 whitespace-nowrap">접근 가능한 최상위 코드:</span>
											<div class="flex flex-wrap gap-2">
												{#each topLevelCodes as code}
													{@const setting = allSettings.find((/** @type {any} */ s) => s.code === code)}
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														{code}
														{#if setting?.title}
															<span class="ml-1 text-blue-600">- {setting.title}</span>
														{/if}
													</span>
												{/each}
											</div>
										</div>
									{:else if accessibleTopLevelCodes === null}
										<div class="text-sm text-gray-500">모든 코드 접근 가능</div>
									{/if}
								{/if}
							</div>
						</div>

						<!-- 필터 영역 -->
						<div class="bg-white rounded-lg shadow-md p-4 mb-6">
							<div class="flex items-center gap-4">
								<label for="top-level-code-select" class="text-sm font-medium text-gray-700 whitespace-nowrap">
									최상위 코드:
								</label>
								<select
									id="top-level-code-select"
									bind:value={selectedTopLevelCode}
									onchange={() => {
										initialSelectionDone = true;
										loadSalesData();
									}}
									class="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{#if accessibleTopLevelOptions.length === 0}
										<option value="">접근 가능한 코드가 없습니다</option>
									{:else}
										{#each accessibleTopLevelOptions as option}
											<option value={option.code}>
												{option.code} - {option.title}
											</option>
										{/each}
									{/if}
								</select>
							</div>
						</div>

						<!-- 매출 데이터 테이블 -->
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							{#if isLoading}
								<div class="flex items-center justify-center py-12">
									<div class="text-gray-500">데이터 로딩 중...</div>
								</div>
							{:else if !selectedTopLevelCode}
								<div class="flex items-center justify-center py-12">
									<div class="text-gray-500">최상위 코드를 선택해주세요.</div>
								</div>
							{:else if salesData.length === 0}
								<div class="flex flex-col items-center justify-center py-12">
									<div class="text-gray-500 mb-2">매출 데이터가 없습니다.</div>
									<div class="text-xs text-gray-400">
										{#if isLoading}
											데이터를 불러오는 중...
										{:else}
											테이블이 생성되지 않았다면 docs/supabase/ev_sales.sql 파일을 Supabase SQL Editor에서 실행하세요.
										{/if}
									</div>
								</div>
							{:else}
								<div class="overflow-x-auto">
									<table class="data-table">
										<thead>
											<tr>
												<th>코드</th>
												<th>기간</th>
												<th>목표 매출액</th>
												<th>매출액</th>
												<th>매출 원가</th>
												<th>매출 총손실</th>
												<th>판매 관리비</th>
												<th>영업 손실</th>
												<th>영업외 수익</th>
												<th>영업외 비용</th>
												<th>법인세 비용 차감전 순손실</th>
												<th>법인세 비용</th>
												<th>당기 순손실</th>
											</tr>
										</thead>
										<tbody>
											{#each salesData as item}
												<tr>
													<td>
														<div class="font-mono text-sm">{item.code}</div>
														<div class="text-xs text-gray-500">{getCodeTitle(item.code)}</div>
													</td>
													<td>{formatPeriod(item.year, item.month)}</td>
													<td class="text-right">{formatAmount(item.target_sales_amount)}</td>
													<td class="text-right">{formatAmount(item.sales_amount)}</td>
													<td class="text-right">{formatAmount(item.sales_cost)}</td>
													<td class="text-right">{formatAmount(item.sales_gross_loss)}</td>
													<td class="text-right">{formatAmount(item.selling_admin_expenses)}</td>
													<td class="text-right">{formatAmount(item.operating_loss)}</td>
													<td class="text-right">{formatAmount(item.non_operating_income)}</td>
													<td class="text-right">{formatAmount(item.non_operating_expenses)}</td>
													<td class="text-right">{formatAmount(item.loss_before_tax)}</td>
													<td class="text-right">{formatAmount(item.corporate_tax_expenses)}</td>
													<td class="text-right font-semibold">{formatAmount(item.net_loss)}</td>
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
		border-bottom: 1px solid #e5e7eb;
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
