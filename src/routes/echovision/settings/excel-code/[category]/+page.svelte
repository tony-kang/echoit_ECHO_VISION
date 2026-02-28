<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PrjSidebar from '$lib/components/PrjSidebar.svelte';
	import CodeManagement from '$lib/components/settings/CodeManagement.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	/** @type {boolean} */
	let authLoading = $derived(authStore.loading);

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

	$effect(() => {
		if (!authStore.loading && !authStore.user) {
			goto('/login');
			return;
		}
		if (authStore.user && !isValidCategory) {
			goto('/echovision/settings/code');
		}
	});
</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<PrjSidebar />

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
