<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import EchoVisionSidebar from '$lib/components/EchoVisionSidebar.svelte';
	import DashboardStats from '$lib/components/echovision/DashboardStats.svelte';
	import QuickAccess from '$lib/components/echovision/QuickAccess.svelte';
	import { authStore } from '$lib/stores/authStore'; 

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);

	let evYear = $state(new Date().getFullYear());

	/**
	 * 대시보드 통계 데이터 타입
	 * @typedef {Object} DashboardStat
	 * @property {string} label - 라벨
	 * @property {number} value - 값
	 * @property {string} icon - 아이콘 SVG 경로
	 * @property {string} path - 이동 경로
	 * @property {string} color - 색상 클래스
	 */

	/** @type {Array<DashboardStat>} 경영지표 통계 데이터 */
	let stats = $state([
		{
			label: '총 매출',
			value: 0,
			icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			path: '/echovision/sales',
			color: 'bg-blue-500'
		},
		{
			label: '총 비용',
			value: 0,
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			path: '/echovision/costs',
			color: 'bg-red-500'
		},
		{
			label: '순이익',
			value: 0,
			icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
			path: '/echovision/profit',
			color: 'bg-green-500'
		},
		{
			label: '성과지표',
			value: 0,
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			path: '/echovision/performance',
			color: 'bg-purple-500'
		}
	]);

	/**
	 * 빠른 액세스 메뉴 항목 타입
	 * @typedef {Object} QuickAccessItem
	 * @property {string} label - 라벨
	 * @property {string} path - 이동 경로
	 * @property {string} icon - 아이콘 SVG 경로
	 * @property {string} description - 설명
	 */

	/** @type {Array<QuickAccessItem>} 빠른 액세스 항목 목록 */
	const quickAccessItems = [
		{
			label: '경영지표 입력',
			path: '/echovision/input',
			icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
			description: '경영지표 데이터를 입력합니다'
		},
		{
			label: '리포트 생성',
			path: '/echovision/report',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			description: '경영지표 리포트를 생성합니다'
		},
		{
			label: '데이터 분석',
			path: '/echovision/analysis',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			description: '경영 데이터를 분석합니다'
		},
		{
			label: 'Excel 내보내기',
			path: '/echovision/excel',
			icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			description: '경영지표를 Excel로 내보냅니다'
		}
	];

	onMount(() => {
		// 레이아웃에서 이미 초기화되므로 여기서는 구독만 함
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;

			if (!state.loading && !state.user) {
				goto('/login');
			}
		});

		return () => {
			unsubscribe();
		};
	});

	// TODO: 실제 데이터를 가져오는 로직 추가 필요
	// $effect(() => {
	// 	if (user && !authLoading) {
	// 		loadDashboardData();
	// 	}
	// });
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
							<h1 class="text-3xl font-bold text-gray-800">{evYear} 경영지표</h1>
						</div>

						<!-- 통계 카드 -->
						<DashboardStats bind:stats={stats} />

						<!-- 빠른 액세스 -->
						<QuickAccess items={quickAccessItems} />
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<style>
	.admin-content-page {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
	}
</style>
