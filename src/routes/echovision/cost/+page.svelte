<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import YearMonthCodeFilter from '$lib/components/YearMonthCodeFilter.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { getSettings } from '$lib/settingsService';
	import { getCosts } from '$lib/costService';
	import { getChildCodes } from '$lib/salesService';
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
	/** @type {Array<any>} 표시할 원가 데이터 */
	let costData = $state([]);
	let isLoading = $state(false);
	
	/** @type {number|null} 선택된 연도 */
	let selectedYear = $state(null);
	/** @type {number|null} 선택된 월 (null이면 전체) */
	let selectedMonth = $state(null);

	/**
	 * 사용자가 접근 가능한 최상위 코드 목록
	 * @type {string[]|null}
	 */
	const accessibleTopLevelCodes = $derived.by(() => {
		if (!userProfile) return null;
		/** @type {any} */
		const profile = userProfile;
		const topLevelCodes = Array.isArray(profile?.top_level_codes) ? profile.top_level_codes : [];
		
		// top_level_codes가 있으면 그것을 사용 (관리자/마스터도 포함)
		if (topLevelCodes.length > 0) {
			return topLevelCodes;
		}
		
		// top_level_codes가 없고 관리자/마스터인 경우 모든 코드 접근 가능
		if (profile?.role && isAdmin(profile.role)) {
			return null; // null이면 모든 코드 접근 가능
		}
		
		// 일반 사용자이고 top_level_codes가 없으면 빈 배열
		return [];
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
	 * 선택된 코드, 연도, 월 변경 시 원가 데이터 로드
	 */
	$effect(() => {
		if (user && !authLoading && selectedTopLevelCode && allSettings.length > 0 && selectedCodes.length > 0 && initialSelectionDone && selectedYear) {
			loadCostData();
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
			// userProfile이 준비될 때까지 기다림
			if (userProfile) {
				loadAccessibleTopLevelOptions();
			} else {
				// userProfile이 아직 없으면 잠시 후 다시 시도
				setTimeout(() => {
					if (userProfile && allSettings.length > 0) {
						loadAccessibleTopLevelOptions();
					}
				}, 100);
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
		if (!userProfile || allSettings.length === 0) {
			console.log('loadAccessibleTopLevelOptions: userProfile 또는 allSettings가 없음');
			return;
		}
		
		const accessibleCodes = accessibleTopLevelCodes;
		const topLevelCodesFromProfile = Array.isArray(userProfile.top_level_codes) ? userProfile.top_level_codes : [];
		
		console.log('loadAccessibleTopLevelOptions 호출:', {
			accessibleCodes,
			topLevelCodesFromProfile,
			allSettingsCount: allSettings.length,
			userProfileRole: userProfile?.role,
			isAdmin: userProfile?.role && isAdmin(userProfile.role)
		});
		
		/** @type {Array<any>} */
		let newOptions = [];
		
		if (accessibleCodes === null) {
			// 관리자/마스터: 모든 최상위 코드 표시
			newOptions = allSettings.filter((/** @type {any} */ s) => !s.parent_code);
		} else if (accessibleCodes.length > 0) {
			// 일반 사용자: 접근 가능한 코드만 표시 (최상위 코드가 아니어도 포함)
			const accessibleCodesSet = new Set(accessibleCodes);
			console.log('접근 가능한 코드:', Array.from(accessibleCodesSet));
			
			// 접근 가능한 코드 목록을 기준으로 allSettings에서 직접 찾기
			newOptions = accessibleCodes.map((code) => {
				const setting = allSettings.find((/** @type {any} */ s) => s.code === code);
				if (setting) {
					console.log(`코드 ${code} 찾음:`, {
						code: setting.code,
						title: setting.title,
						parent_code: setting.parent_code,
						isTopLevel: !setting.parent_code
					});
				} else {
					console.warn(`코드 ${code}를 allSettings에서 찾을 수 없음`);
				}
				return setting;
			}).filter((/** @type {any} */ s) => {
				// 설정이 존재하면 포함 (최상위 코드가 아니어도 포함)
				return s !== undefined;
			});
			
			console.log('필터링된 옵션:', newOptions.map((/** @type {any} */ s) => `${s.code} - ${s.title} (parent: ${s.parent_code || '최상위'})`));
		}
		
		console.log('필터링된 옵션:', newOptions.map((/** @type {any} */ o) => `${o.code} - ${o.title}`));
		accessibleTopLevelOptions = newOptions;

		// 기본 선택: 첫 번째 옵션 (이미 선택된 값이 없을 때만)
		if (accessibleTopLevelOptions.length > 0 && !selectedTopLevelCode && !initialSelectionDone) {
			selectedTopLevelCode = accessibleTopLevelOptions[0].code;
			initialSelectionDone = true;
			console.log('기본 선택 설정:', selectedTopLevelCode);
		}
	}

	/**
	 * 원가 데이터 로드
	 * @returns {Promise<void>}
	 */
	async function loadCostData() {
		if (!selectedTopLevelCode || selectedCodes.length === 0 || !selectedYear) {
			costData = [];
			return;
		}

		isLoading = true;
		try {
			const { data, error } = await getCosts({
				codes: selectedCodes,
				year: selectedYear,
				month: selectedMonth || undefined,
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
				costData = data || [];
			}
		} catch (err) {
			console.error('원가 데이터 로드 예외:', err);
			costData = [];
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
									<h1 class="text-2xl font-bold text-gray-900">원가 정보</h1>
								</div>
								{#if userProfile}
									{@const topLevelCodes = Array.isArray(userProfile.top_level_codes) ? userProfile.top_level_codes : []}
									{#if topLevelCodes.length > 0}
										<div class="flex items-center gap-2 flex-wrap">
											<span class="text-sm text-gray-600 whitespace-nowrap">접근 가능한 원가 코드:</span>
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
						<YearMonthCodeFilter
							bind:selectedYear
							bind:selectedMonth
							bind:selectedCode={selectedTopLevelCode}
							bind:codeOptions={accessibleTopLevelOptions}
							codeLabel="원가 구분"
							onFilterChange={() => {
								initialSelectionDone = true;
								loadCostData();
							}}
						/>

						<!-- 원가 데이터 테이블 -->
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							{#if isLoading}
								<div class="flex items-center justify-center py-12">
									<div class="text-gray-500">데이터 로딩 중...</div>
								</div>
							{:else if !selectedTopLevelCode}
								<div class="flex items-center justify-center py-12">
									<div class="text-gray-500">코드를 선택해주세요.</div>
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
												<th>코드</th>
												<th>기간</th>
												<th>목표 원가</th>
												<th>원재료비</th>
												<th>노무비</th>
												<th>외주비</th>
												<th>경비</th>
												<th>당기 총공사 비용</th>
												<th>공사손실 충당금 전입</th>
												<th>공사손실 충당금 환입</th>
												<th>기초 미완성 공사액</th>
												<th>타계정에서 대체액</th>
												<th>합계</th>
												<th>기말 미완성 공사액</th>
												<th>타계정으로 대체액</th>
												<th>당기 공사 원가</th>
											</tr>
										</thead>
										<tbody>
											{#each costData as item}
												<tr>
													<td>
														<div class="font-mono text-sm">{item.code}</div>
														<div class="text-xs text-gray-500">{getCodeTitle(item.code)}</div>
													</td>
													<td>{formatPeriod(item.year, item.month)}</td>
													<td class="text-right">{formatAmount(item.target_cost)}</td>
													<td class="text-right">{formatAmount(item.material_cost)}</td>
													<td class="text-right">{formatAmount(item.labor_cost)}</td>
													<td class="text-right">{formatAmount(item.subcontract_cost)}</td>
													<td class="text-right">{formatAmount(item.expenses)}</td>
													<td class="text-right">{formatAmount(item.total_construction_cost)}</td>
													<td class="text-right">{formatAmount(item.construction_loss_provision_transfer)}</td>
													<td class="text-right">{formatAmount(item.construction_loss_provision_reversal)}</td>
													<td class="text-right">{formatAmount(item.opening_unfinished_construction)}</td>
													<td class="text-right">{formatAmount(item.transfer_from_other_accounts)}</td>
													<td class="text-right font-semibold">{formatAmount(item.total_amount)}</td>
													<td class="text-right">{formatAmount(item.closing_unfinished_construction)}</td>
													<td class="text-right">{formatAmount(item.transfer_to_other_accounts)}</td>
													<td class="text-right font-semibold">{formatAmount(item.current_period_construction_cost)}</td>
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
