<script>
	import MainContent from '$lib/C/MainContent.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { getDepartments } from '$lib/departmentService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);

	/** @type {Array<{ id: string, code: string, title: string, param?: string[] | null }>} 부서 목록 */
	let departments = $state([]);
	/** @type {boolean} 로딩 여부 */
	let loading = $state(false);
	/** @type {boolean} 초기 로드 완료 여부 */
	let loaded = $state(false);

	$effect(() => {
		if (!user || loaded) return;
		loaded = true;
		loadDepartments();
	});

	/**
	 * 부서 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadDepartments() {
		loading = true;
		try {
			const { data, error } = await getDepartments();
			if (error) {
				console.error('부서 목록 로드 실패:', error);
				departments = [];
			} else {
				departments = data ?? [];
			}
		} catch (e) {
			console.error('부서 목록 로드 예외:', e);
			departments = [];
		} finally {
			loading = false;
		}
	}
</script>

<MainContent>
	{#snippet children()}
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-gray-800">부서별 실적</h1>
			<p class="text-gray-600 mt-2">부서를 선택하면 해당 부서의 월별/분기별 실적을 확인할 수 있습니다.</p>
		</div>

		{#if loading}
			<div class="flex items-center justify-center min-h-[200px]">
				<div class="text-gray-500">부서 목록 로딩 중...</div>
			</div>
		{:else if departments.length === 0}
			<div class="flex items-center justify-center min-h-[200px]">
				<p class="text-gray-600">등록된 부서가 없습니다.</p>
			</div>
		{:else}
			<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each departments as dept (dept.id)}
					<li>
						<a
							href="../performance/{dept.id}"
							class="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<span class="block font-medium text-gray-800">{dept.title || dept.code}</span>
							<span class="mt-1 block text-sm text-gray-500">{dept.code}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/snippet}
</MainContent>
