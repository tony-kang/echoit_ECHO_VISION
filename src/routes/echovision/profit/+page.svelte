<script>
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import EchoVisionSidebar from '$lib/components/EchoVisionSidebar.svelte';
	import YearMonthCodeFilter from '$lib/components/YearMonthCodeFilter.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { getSettingsHierarchy, getSettings } from '$lib/settingsService';
	import { getSales, getChildCodes } from '$lib/salesService';
	import { isAdmin } from '$lib/userService'; 

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	
	/** @type {Array<any>} 전체 환경설정 코드 목록 (평면 구조) */
	let allSettings = $state([]);
	/** @type {Array<any>} 계층 구조 환경설정 코드 목록 */
	let hierarchySettings = $state([]);
	/** @type {Array<any>} 접근 가능한 최상위 코드 목록 (select 옵션용) */
	let accessibleTopLevelOptions = $state([]);
	/** @type {string|null} 선택된 최상위 코드 */
	let selectedTopLevelCode = $state(null);
	/** @type {boolean} 초기 선택 완료 여부 */
	let initialSelectionDone = $state(false);
	/** @type {Map<string, any>} 코드별 매출 데이터 맵 */
	let salesDataMap = $state(new Map());
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

	/**
	 * 접근 가능한 코드인지 확인 (재귀적으로 상위 코드 확인)
	 * @param {any} node - 확인할 노드
	 * @param {string[]|null} accessibleCodes - 접근 가능한 최상위 코드 목록
	 * @returns {boolean}
	 */
	function isNodeAccessible(node, accessibleCodes) {
		if (!accessibleCodes || accessibleCodes.length === 0) {
			return true; // 관리자/마스터는 모든 코드 접근 가능
		}
		
		// 현재 노드가 접근 가능한 코드 목록에 있는지 확인
		if (accessibleCodes.includes(node.code)) {
			return true;
		}
		
		// 부모 코드가 접근 가능한지 재귀적으로 확인
		if (node.parent_code) {
			const parent = allSettings.find((/** @type {any} */ s) => s.code === node.parent_code);
			if (parent) {
				return isNodeAccessible(parent, accessibleCodes);
			}
		}
		
		return false;
	}

	/**
	 * 접근 가능한 노드만 필터링
	 * @param {Array<any>} nodes - 노드 배열
	 * @param {string[]|null} accessibleCodes - 접근 가능한 최상위 코드 목록
	 * @returns {Array<any>}
	 */
	function filterAccessibleNodes(nodes, accessibleCodes) {
		return nodes
			.filter((/** @type {any} */ node) => isNodeAccessible(node, accessibleCodes))
			.map((/** @type {any} */ node) => {
				if (node.children && node.children.length > 0) {
					return {
						...node,
						children: filterAccessibleNodes(node.children, accessibleCodes)
					};
				}
				return node;
			});
	}

	/**
	 * 선택된 코드 기준으로 트리 필터링
	 * @param {Array<any>} nodes - 노드 배열
	 * @param {string|null} selectedCode - 선택된 코드
	 * @returns {Array<any>}
	 */
	function filterTreeBySelectedCode(nodes, selectedCode) {
		if (!selectedCode) {
			return nodes;
		}

		/** @type {Array<any>} */
		const result = [];

		/**
		 * 노드 찾기 (재귀)
		 * @param {Array<any>} nodeList - 노드 리스트
		 * @param {string} code - 찾을 코드
		 * @returns {any|null}
		 */
		function findNode(nodeList, code) {
			for (const node of nodeList) {
				if (node.code === code) {
					return node;
				}
				if (node.children && node.children.length > 0) {
					const found = findNode(node.children, code);
					if (found) {
						return found;
					}
				}
			}
			return null;
		}

		const selectedNode = findNode(nodes, selectedCode);
		if (selectedNode) {
			result.push(selectedNode);
		}

		return result;
	}

	/**
	 * 표시할 트리 노드 목록
	 * @type {Array<any>}
	 */
	const displayTree = $derived.by(() => {
		if (!selectedTopLevelCode || hierarchySettings.length === 0) {
			return hierarchySettings;
		}
		return filterTreeBySelectedCode(hierarchySettings, selectedTopLevelCode);
	});

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			const prevUserProfile = userProfile;
			userProfile = state.userProfile;

			if (!state.loading && !state.user) {
				goto('/login');
			} else if (state.user && state.userProfile) {
				// 사용자 프로필이 로드된 후에만 설정 로드
				if (!prevUserProfile && state.userProfile) {
					// 처음 프로필이 로드될 때만
					loadAllSettings();
				} else if (prevUserProfile && state.userProfile) {
					// top_level_codes가 변경된 경우 다시 로드
					const prevCodes = JSON.stringify(prevUserProfile?.top_level_codes || []);
					const newCodes = JSON.stringify(state.userProfile?.top_level_codes || []);
					if (prevCodes !== newCodes) {
						loadAllSettings();
					} else if (allSettings.length === 0) {
						// 설정이 없으면 로드
						loadAllSettings();
					} else {
						// 설정은 있지만 옵션이 업데이트되지 않은 경우
						loadAccessibleTopLevelOptions();
					}
				}
			}
		});

		return () => {
			unsubscribe();
		};
	});

	/** @type {boolean} 매출 데이터 로드 완료 여부 */
	let isSalesDataLoaded = $state(false);

	/**
	 * 선택된 코드, 연도, 월 변경 시 매출 데이터 로드
	 */
	$effect(() => {
		if (user && !authLoading && selectedTopLevelCode && allSettings.length > 0 && selectedCodes.length > 0 && initialSelectionDone && selectedYear && !isSalesDataLoaded) {
			untrack(async () => {
				isSalesDataLoaded = true;
				await loadSalesData();
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
			// 평면 구조와 계층 구조 모두 로드
			const [flatResult, hierarchyResult] = await Promise.all([
				getSettings({ orderByOrder: true }),
				getSettingsHierarchy()
			]);

			if (flatResult.error) {
				console.error('환경설정 코드 로드 실패:', flatResult.error);
				allSettings = [];
				return;
			}

			allSettings = flatResult.data || [];

			if (hierarchyResult.error) {
				console.error('계층 구조 환경설정 코드 로드 실패:', hierarchyResult.error);
				hierarchySettings = [];
			} else {
				// 접근 가능한 노드만 필터링
				const accessibleCodes = accessibleTopLevelCodes;
				hierarchySettings = filterAccessibleNodes(hierarchyResult.data || [], accessibleCodes);
			}

			// 설정 로드 후 접근 가능한 최상위 코드 옵션 로드
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
			hierarchySettings = [];
		}
	}

	/**
	 * 접근 가능한 최상위 코드 옵션 로드
	 * @returns {void}
	 */
	function loadAccessibleTopLevelOptions() {
		if (!userProfile || allSettings.length === 0) {
			return;
		}
		
		const accessibleCodes = accessibleTopLevelCodes;
		
		/** @type {Array<any>} */
		let newOptions = [];
		
		if (accessibleCodes === null) {
			// 관리자/마스터: 모든 최상위 코드 표시
			newOptions = allSettings.filter((/** @type {any} */ s) => !s.parent_code);
		} else if (accessibleCodes.length > 0) {
			// 일반 사용자: 접근 가능한 코드만 표시 (최상위 코드가 아니어도 포함)
			newOptions = accessibleCodes.map((code) => {
				return allSettings.find((/** @type {any} */ s) => s.code === code);
			}).filter((/** @type {any} */ s) => {
				return s !== undefined;
			});
		}
		
		accessibleTopLevelOptions = newOptions;

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
		if (!selectedTopLevelCode || selectedCodes.length === 0 || !selectedYear) {
			salesDataMap = new Map();
			return;
		}

		isLoading = true;
		try {
			const { data, error } = await getSales({
				codes: selectedCodes,
				year: selectedYear,
				month: selectedMonth || undefined,
				orderByYear: true,
				orderByMonth: true
			});

			if (error) {
				console.error('매출 데이터 로드 실패:', error);
				if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
					console.error('⚠️ ev_sales 테이블이 생성되지 않았습니다. docs/supabase/ev_sales.sql 파일을 Supabase SQL Editor에서 실행하세요.');
				}
				salesDataMap = new Map();
			} else {
				// 코드별로 매출 데이터 맵 생성
				const map = new Map();
				(data || []).forEach((/** @type {any} */ item) => {
					const key = item.code;
					if (!map.has(key)) {
						map.set(key, []);
					}
					map.get(key).push(item);
				});
				salesDataMap = map;
			}
		} catch (err) {
			console.error('매출 데이터 로드 예외:', err);
			salesDataMap = new Map();
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 코드의 매출 데이터 가져오기
	 * @param {string} code - 코드
	 * @returns {Array<any>}
	 */
	function getSalesForCode(code) {
		return salesDataMap.get(code) || [];
	}

	/**
	 * 코드의 매출 합계 계산 (하위 코드 포함)
	 * @param {any} node - 노드
	 * @returns {any}
	 */
	function calculateSalesTotal(node) {
		const sales = getSalesForCode(node.code);
		let total = {
			target_sales_amount: 0,
			sales_amount: 0,
			sales_cost: 0,
			sales_gross_loss: 0,
			selling_admin_expenses: 0,
			operating_loss: 0,
			non_operating_income: 0,
			non_operating_expenses: 0,
			loss_before_tax: 0,
			corporate_tax_expenses: 0,
			net_loss: 0
		};

		// 현재 노드의 매출 합산
		sales.forEach((/** @type {any} */ item) => {
			total.target_sales_amount += Number(item.target_sales_amount || 0);
			total.sales_amount += Number(item.sales_amount || 0);
			total.sales_cost += Number(item.sales_cost || 0);
			total.sales_gross_loss += Number(item.sales_gross_loss || 0);
			total.selling_admin_expenses += Number(item.selling_admin_expenses || 0);
			total.operating_loss += Number(item.operating_loss || 0);
			total.non_operating_income += Number(item.non_operating_income || 0);
			total.non_operating_expenses += Number(item.non_operating_expenses || 0);
			total.loss_before_tax += Number(item.loss_before_tax || 0);
			total.corporate_tax_expenses += Number(item.corporate_tax_expenses || 0);
			total.net_loss += Number(item.net_loss || 0);
		});

		// 하위 노드의 매출 합산 (재귀)
		if (node.children && node.children.length > 0) {
			node.children.forEach((/** @type {any} */ child) => {
				const childTotal = calculateSalesTotal(child);
				total.target_sales_amount += childTotal.target_sales_amount;
				total.sales_amount += childTotal.sales_amount;
				total.sales_cost += childTotal.sales_cost;
				total.sales_gross_loss += childTotal.sales_gross_loss;
				total.selling_admin_expenses += childTotal.selling_admin_expenses;
				total.operating_loss += childTotal.operating_loss;
				total.non_operating_income += childTotal.non_operating_income;
				total.non_operating_expenses += childTotal.non_operating_expenses;
				total.loss_before_tax += childTotal.loss_before_tax;
				total.corporate_tax_expenses += childTotal.corporate_tax_expenses;
				total.net_loss += childTotal.net_loss;
			});
		}

		return total;
	}

	/**
	 * 금액 포맷팅
	 * @param {number} amount - 금액
	 * @returns {string}
	 */
	function formatAmount(amount) {
		if (amount === null || amount === undefined || amount === 0) return '-';
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<EchoVisionSidebar />

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
								<h1 class="text-2xl font-bold text-gray-900">수익 정보</h1>
								{#if userProfile}
									{@const topLevelCodes = Array.isArray(userProfile.top_level_codes) ? userProfile.top_level_codes : []}
									{#if topLevelCodes.length > 0}
										<div class="flex items-center gap-2 flex-wrap">
											<span class="text-sm text-gray-600 whitespace-nowrap">접근 가능한 코드:</span>
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
							codeLabel="코드 구분"
							onFilterChange={() => {
								initialSelectionDone = true;
								loadSalesData();
							}}
						/>

						<!-- 트리 형태 매출 데이터 -->
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							{#if isLoading}
								<div class="flex items-center justify-center py-12">
									<div class="text-gray-500">데이터 로딩 중...</div>
								</div>
							{:else if !selectedTopLevelCode}
								<div class="flex items-center justify-center py-12">
									<div class="text-gray-500">코드를 선택해주세요.</div>
								</div>
							{:else if displayTree.length === 0}
								<div class="flex flex-col items-center justify-center py-12">
									<div class="text-gray-500 mb-2">표시할 데이터가 없습니다.</div>
								</div>
							{:else}
								<div class="overflow-x-auto">
									<table class="data-table">
										<thead>
											<tr>
												<th class="w-64">코드</th>
												<th class="text-right">목표 매출액</th>
												<th class="text-right">매출액</th>
												<th class="text-right">매출 원가</th>
												<th class="text-right">매출 총손실</th>
												<th class="text-right">판매 관리비</th>
												<th class="text-right">영업 손실</th>
												<th class="text-right">영업외 수익</th>
												<th class="text-right">영업외 비용</th>
												<th class="text-right">법인세 비용 차감전 순손실</th>
												<th class="text-right">법인세 비용</th>
												<th class="text-right">당기 순손실</th>
											</tr>
										</thead>
										<tbody>
											{#each displayTree as rootNode}
												{@const salesTotal = calculateSalesTotal(rootNode)}
												{@const hasChildren = rootNode.children && rootNode.children.length > 0}
												{@const isLast = rootNode === displayTree[displayTree.length - 1]}
												<!-- 루트 노드 -->
												<tr class="tree-row-root">
													<td class="font-semibold">
														<div class="flex items-center gap-2">
															<span class="font-mono text-sm">{rootNode.code}</span>
															<span>{rootNode.title}</span>
															{#if hasChildren}
																<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
																</svg>
															{/if}
														</div>
													</td>
													<td class="text-right">{formatAmount(salesTotal.target_sales_amount)}</td>
													<td class="text-right">{formatAmount(salesTotal.sales_amount)}</td>
													<td class="text-right">{formatAmount(salesTotal.sales_cost)}</td>
													<td class="text-right">{formatAmount(salesTotal.sales_gross_loss)}</td>
													<td class="text-right">{formatAmount(salesTotal.selling_admin_expenses)}</td>
													<td class="text-right">{formatAmount(salesTotal.operating_loss)}</td>
													<td class="text-right">{formatAmount(salesTotal.non_operating_income)}</td>
													<td class="text-right">{formatAmount(salesTotal.non_operating_expenses)}</td>
													<td class="text-right">{formatAmount(salesTotal.loss_before_tax)}</td>
													<td class="text-right">{formatAmount(salesTotal.corporate_tax_expenses)}</td>
													<td class="text-right font-semibold">{formatAmount(salesTotal.net_loss)}</td>
												</tr>
												<!-- 하위 노드 재귀 렌더링 -->
												{#if hasChildren}
													{#each rootNode.children as child, childIndex}
														{@const childSalesTotal = calculateSalesTotal(child)}
														{@const childHasChildren = child.children && child.children.length > 0}
														{@const isLastChild = childIndex === rootNode.children.length - 1}
														<tr class="tree-row-child">
															<td class="pl-6">
																<div class="flex items-center gap-2">
																	<span class="text-gray-400">{isLastChild ? '└─' : '├─'}</span>
																	<span class="font-mono text-sm">{child.code}</span>
																	<span>{child.title}</span>
																	{#if childHasChildren}
																		<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
																		</svg>
																	{/if}
																</div>
															</td>
															<td class="text-right">{formatAmount(childSalesTotal.target_sales_amount)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.sales_amount)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.sales_cost)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.sales_gross_loss)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.selling_admin_expenses)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.operating_loss)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.non_operating_income)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.non_operating_expenses)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.loss_before_tax)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.corporate_tax_expenses)}</td>
															<td class="text-right">{formatAmount(childSalesTotal.net_loss)}</td>
														</tr>
														<!-- 3단계 하위 노드 -->
														{#if childHasChildren}
															{#each child.children as grandChild, grandChildIndex}
																{@const grandChildSalesTotal = calculateSalesTotal(grandChild)}
																{@const grandChildHasChildren = grandChild.children && grandChild.children.length > 0}
																{@const isLastGrandChild = grandChildIndex === child.children.length - 1}
																<tr class="tree-row-grandchild">
																	<td class="pl-12">
																		<div class="flex items-center gap-2">
																			<span class="text-gray-400">{isLastChild ? '   ' : '│  '}{isLastGrandChild ? '└─' : '├─'}</span>
																			<span class="font-mono text-sm">{grandChild.code}</span>
																			<span>{grandChild.title}</span>
																			{#if grandChildHasChildren}
																				<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
																				</svg>
																			{/if}
																		</div>
																	</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.target_sales_amount)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.sales_amount)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.sales_cost)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.sales_gross_loss)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.selling_admin_expenses)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.operating_loss)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.non_operating_income)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.non_operating_expenses)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.loss_before_tax)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.corporate_tax_expenses)}</td>
																	<td class="text-right">{formatAmount(grandChildSalesTotal.net_loss)}</td>
																</tr>
																<!-- 4단계 하위 노드 (필요시 확장 가능) -->
																{#if grandChildHasChildren}
																	{#each grandChild.children as greatGrandChild, greatGrandChildIndex}
																		{@const greatGrandChildSalesTotal = calculateSalesTotal(greatGrandChild)}
																		{@const isLastGreatGrandChild = greatGrandChildIndex === grandChild.children.length - 1}
																		<tr class="tree-row-great-grandchild">
																			<td class="pl-20">
																				<div class="flex items-center gap-2">
																					<span class="text-gray-400">{isLastChild ? '   ' : '│  '}{isLastGrandChild ? '   ' : '│  '}{isLastGreatGrandChild ? '└─' : '├─'}</span>
																					<span class="font-mono text-sm">{greatGrandChild.code}</span>
																					<span>{greatGrandChild.title}</span>
																				</div>
																			</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.target_sales_amount)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.sales_amount)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.sales_cost)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.sales_gross_loss)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.selling_admin_expenses)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.operating_loss)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.non_operating_income)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.non_operating_expenses)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.loss_before_tax)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.corporate_tax_expenses)}</td>
																			<td class="text-right">{formatAmount(greatGrandChildSalesTotal.net_loss)}</td>
																		</tr>
																	{/each}
																{/if}
															{/each}
														{/if}
													{/each}
												{/if}
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

	.tree-row-root {
		background-color: #f9fafb;
		font-weight: 600;
	}

	.tree-row-root:hover {
		background-color: #f3f4f6;
	}

	.tree-row-child {
		background-color: #ffffff;
	}

	.tree-row-child:hover {
		background-color: #f9fafb;
	}

	.tree-row-grandchild {
		background-color: #ffffff;
	}

	.tree-row-grandchild:hover {
		background-color: #f9fafb;
	}

	.tree-row-great-grandchild {
		background-color: #ffffff;
	}

	.tree-row-great-grandchild:hover {
		background-color: #f9fafb;
	}

	.text-right {
		text-align: right;
	}
</style>
