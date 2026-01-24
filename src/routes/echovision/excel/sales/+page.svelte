<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import ExcelLoader from '$src/lib/components/excel/notUse_ExcelLoader.svelte';
	import { authStore } from '$lib/stores/authStore';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);

	/**
	 * ExcelLoader에 전달할 작업 옵션
	 * @type {Object}
	 */
	const workOption = {
		workList: [],
		requiredColumns: {},
		columnWidths: {
			'코드': '120px',
			'연도': '100px',
			'월': '80px',
			'목표 매출액': '150px',
			'매출액': '150px',
			'매출 원가': '150px',
			'매출 총손실': '150px',
			'판매 관리비': '150px',
			'영업 손실': '150px',
			'영업외 수익': '150px',
			'영업외 비용': '150px',
			'법인세 비용 차감전 순손실': '180px',
			'법인세 비용': '150px',
			'당기 순손실': '150px',
			'메모': '200px'
		},
		ignoreColumns: [],
		fixedColumns: 0,
		excelColumns: [
			{ caption: '코드', required: true },
			{ caption: '연도', required: true },
			{ caption: '월', required: false },
			{ caption: '목표 매출액', required: false },
			{ caption: '매출액', required: false },
			{ caption: '매출 원가', required: false },
			{ caption: '매출 총손실', required: false },
			{ caption: '판매 관리비', required: false },
			{ caption: '영업 손실', required: false },
			{ caption: '영업외 수익', required: false },
			{ caption: '영업외 비용', required: false },
			{ caption: '법인세 비용 차감전 순손실', required: false },
			{ caption: '법인세 비용', required: false },
			{ caption: '당기 순손실', required: false },
			{ caption: '메모', required: false }
		],
		sheetIndex: 1
	};

	onMount(() => {
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
							<div class="flex items-center gap-3 mb-2">
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
								<h1 class="text-2xl font-bold text-gray-900">매출 엑셀 업로드</h1>
							</div>
							<p class="text-sm text-gray-600">
								엑셀 파일을 업로드하여 매출 데이터를 확인할 수 있습니다.
							</p>
						</div>

						<!-- 엑셀 로더 컴포넌트 -->
						<div class="bg-white rounded-lg shadow-md p-6">
							<ExcelLoader {workOption} />
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
</style>
