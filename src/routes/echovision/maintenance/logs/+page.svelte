<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import EchoVisionSidebar from '$lib/components/EchoVisionSidebar.svelte';
	import { authStore } from '$lib/stores/authStore';
	import {
		getActionLogs,
		getLogStatistics
	} from '$lib/logService';
	import { isAdmin } from '$lib/userService';
	import LogTab from '$lib/components/admin/LogTab.svelte';
	
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let loading = $state(true);
	/** @type {boolean} 인증 로딩 상태 */
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	let userProfileLoading = $state(true);
	let profileChecked = $state(false);
	
	/**
	 * URL 파라미터에서 초기 페이지 번호 가져오기
	 * @returns {number}
	 */
	function getInitialLogPage() {
		const pageFromUrl = page.url.searchParams.get('logPage');
		if (pageFromUrl) {
			const pageNum = parseInt(pageFromUrl, 10);
			return isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
		}
		return 1;
	}
	
	/** @type {Array<any>} */
	let logs = $state([]);
	/** @type {Object | null} */
	let logStats = $state(null);
	/** @type {number} 로그 현재 페이지 */
	let logCurrentPage = $state(getInitialLogPage());
	/** @type {number | null} 로그 전체 개수 */
	let logTotalCount = $state(null);
	/** @type {number} 로그 페이지당 항목 수 */
	const logPageSize = 10;
	let loadingData = $state(false);
	let error = $state('');
	
	let logFilters = $state({
		actionCategory: '',
		result: '',
		startDate: null,
		endDate: null
	});
	
	// 관리자 권한 확인
	let isAdminUser = $derived(() => {
		const profile = userProfile;
		if (!profile?.role) return false;
		return isAdmin(profile.role);
	});
	
	// 인증 및 권한 체크
	onMount(() => {
		const unsubscribe = authStore.subscribe(async (state) => {
			user = state.user;
			loading = state.loading;
			authLoading = state.loading;
			userProfile = state.userProfile;
			userProfileLoading = state.profileLoading;

			if (user && !loading && !userProfileLoading && userProfile && !profileChecked) {
				profileChecked = true;
				
				// 관리자 권한 체크
				if (!isAdminUser()) {
					alert('관리자 권한이 필요합니다.');
					goto('/mypage');
					return;
				}
				
				await loadData();
			} else if (!user && !loading) {
				goto('/login');
			}
		});

		return () => {
			unsubscribe();
		};
	});
	
	// URL 파라미터 변경 감지 및 동기화
	$effect(() => {
		const pageFromUrl = page.url.searchParams.get('logPage');
		const expectedPage = pageFromUrl ? parseInt(pageFromUrl, 10) : 1;
		if (!isNaN(expectedPage) && expectedPage >= 1 && expectedPage !== logCurrentPage) {
			logCurrentPage = expectedPage;
			loadData();
		}
	});
	
	let isLoadingData = $state(false);
	
	async function loadData() {
		if (isLoadingData) return;
		
		isLoadingData = true;
		loadingData = true;
		error = '';
		
		try {
			// 로그 데이터 로드
			const logsResult = await getActionLogs({
				actionCategory: logFilters.actionCategory || null,
				result: logFilters.result || null,
				startDate: logFilters.startDate,
				endDate: logFilters.endDate,
				page: logCurrentPage,
				limit: logPageSize
			});
			if (logsResult.data) {
				logs = logsResult.data;
				logTotalCount = logsResult.total;
			} else {
				error = '로그를 불러오는데 실패했습니다.';
				console.error(logsResult.error);
			}

			// 로그 통계 로드
			const statsResult = await getLogStatistics({
				startDate: logFilters.startDate,
				endDate: logFilters.endDate
			});
			if (statsResult.data) {
				logStats = statsResult.data;
			}
		} catch (err) {
			error = '데이터를 불러오는 중 오류가 발생했습니다.';
			console.error(err);
		} finally {
			loadingData = false;
			isLoadingData = false;
		}
	}
	
	/**
	 * 로그 페이지 변경 핸들러
	 * @param {number} newPage - 변경할 페이지 번호
	 */
	async function handleLogPageChange(newPage) {
		logCurrentPage = newPage;
		// URL 파라미터 업데이트
		const currentUrl = new URL(page.url);
		if (newPage === 1) {
			// 첫 페이지면 파라미터 제거
			currentUrl.searchParams.delete('logPage');
		} else {
			currentUrl.searchParams.set('logPage', newPage.toString());
		}
		await goto(currentUrl.pathname + currentUrl.search, { replaceState: true, noScroll: true });
		await loadData();
	}

	async function applyLogFilters() {
		logCurrentPage = 1; // 필터 적용 시 첫 페이지로 이동
		// URL 파라미터 업데이트
		const url = new URL(page.url);
		url.searchParams.delete('logPage');
		await goto(url.pathname + url.search, { replaceState: true, noScroll: true });
		await loadData();
	}

	function resetLogFilters() {
		logFilters = {
			actionCategory: '',
			result: '',
			startDate: null,
			endDate: null
		};
		logCurrentPage = 1; // 필터 초기화 시 첫 페이지로 이동
		// URL 파라미터 업데이트
		const url = new URL(page.url);
		url.searchParams.delete('logPage');
		goto(url.pathname + url.search, { replaceState: true, noScroll: true });
		loadData();
	}
</script>

<svelte:head>
	<title>액션 로그</title>
</svelte:head>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<EchoVisionSidebar />

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto bg-gray-50">
			<div class="p-3">
				{#if authLoading || userProfileLoading}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로딩 중...</div>
					</div>
				{:else if !user}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로그인이 필요합니다.</div>
					</div>
				{:else if !isAdminUser()}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">관리자 권한이 필요합니다.</div>
					</div>
				{:else}
					<div class="admin-content-page">
						<!-- 헤더 -->
						<div class="mb-6">
							<div class="flex items-center gap-3 mb-2">
								<h1 class="text-3xl font-bold text-gray-800">액션 로그</h1>
							</div>
							<p class="text-gray-600">시스템의 모든 액션 로그를 확인하고 분석할 수 있는 관리 기능을 제공합니다</p>
						</div>
						
						{#if error}
							<div class="error-message">{error}</div>
						{/if}
						
						{#if loadingData}
							<div class="loading-data">
								<div class="spinner-small"></div>
								<p>데이터 로딩 중...</p>
							</div>
						{:else}
							<LogTab
								logs={logs}
								stats={logStats}
								loading={loadingData}
								filters={logFilters}
								currentPage={logCurrentPage}
								totalCount={logTotalCount}
								pageSize={logPageSize}
								onPageChange={handleLogPageChange}
								onApplyFilters={applyLogFilters}
								onResetFilters={resetLogFilters}
							/>
						{/if}
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<style>
	.spinner-small {
		width: 30px;
		height: 30px;
		border: 3px solid #e2e8f0;
		border-top: 3px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.loading-data {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
	}
	
	.loading-data p {
		margin-top: 20px;
		color: #718096;
	}
	
	.error-message {
		background: #fed7d7;
		color: #c53030;
		padding: 16px;
		border-radius: 8px;
		margin-bottom: 20px;
	}
</style>

