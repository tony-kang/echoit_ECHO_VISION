<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import { authStore } from '$lib/stores/authStore';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);

	/**
	 * 카테고리 목록
	 * @type {Array<{code: string, label: string}>}
	 */
	const categories = [
		{ code: 'all', label: '전체' , bgColor: 'bg-gray-100'},
		{ code: 'organization', label: '조직' , bgColor: 'bg-blue-100'},
		{ code: 'sales', label: '매출' , bgColor: 'bg-green-100'},
		{ code: 'cost', label: '비용' , bgColor: 'bg-red-100'}
	];

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

	/**
	 * 카테고리 클릭 핸들러
	 * @param {string} categoryCode - 카테고리 코드
	 * @returns {void}
	 */
	function handleCategoryClick(categoryCode) {
		goto(`/echovision/settings/code/${categoryCode}`);
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
								<h1 class="text-3xl font-bold text-gray-800">환경설정 코드 관리</h1>
							</div>
							<p class="text-gray-600">카테고리를 선택하여 코드를 관리합니다</p>
						</div>

						<!-- 카테고리 목록 -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							{#each categories as category}
								<button
									onclick={() => handleCategoryClick(category.code)}
									class="{category.bgColor} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
								>
									<div class="flex items-center justify-between mb-2">
										<h2 class="text-xl font-semibold text-gray-800">{category.label}</h2>
										<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</div>
									<p class="text-sm text-gray-600">카테고리: {category.code}</p>
								</button>
							{/each}
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
