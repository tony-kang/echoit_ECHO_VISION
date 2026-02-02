<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import CodeManagement from '$lib/components/settings/CodeManagement.svelte';
	import { authStore } from '$lib/stores/authStore';  

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);

	/**
	 * URL 파라미터에서 카테고리 가져오기
	 * @type {string}
	 */
	const category = $derived(page.params.category || '');

	/**
	 * 카테고리 라벨 가져오기
	 * @type {string}
	 */
	const categoryLabel = $derived.by(() => {
		const labels = {
			all: '전체',
			organization: '조직',
			sales: '매출',
			cost: '비용'
		};
		return labels[category] || category;
	});

	/**
	 * 유효한 카테고리인지 확인
	 * @type {boolean}
	 */
	const isValidCategory = $derived.by(() => {
		return ['all', 'organization', 'sales', 'cost'].includes(category);
	});

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;

			if (!state.loading && !state.user) {
				goto('/login');
			} else if (state.user && !isValidCategory) {
				// 유효하지 않은 카테고리면 메인 페이지로 리다이렉트
				goto('/echovision/settings/code');
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
		<PrjMainSidebar />

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
				{:else if !isValidCategory}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">유효하지 않은 카테고리입니다.</div>
					</div>
				{:else}
					<div class="admin-content-page">
						<!-- 헤더 -->
						<div class="mb-6">
							<div class="flex items-center gap-3 mb-2">
									<h1 class="text-3xl font-bold text-gray-800">{categoryLabel} 컬럼 관리</h1>
							</div>
							<!-- <p class="text-gray-600">카테고리: {category}</p> -->
						</div>

						<!-- 코드 관리 컴포넌트 -->
						<CodeManagement category={category} />
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
