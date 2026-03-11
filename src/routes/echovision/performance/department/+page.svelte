<script>
	import MainContent from '$lib/C/MainContent.svelte';
	import PermissionBar from '$lib/components/PermissionBar.svelte';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { getDepartmentsWithUsers } from '$lib/departmentService';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);

	/** @type {Array<{ id: string, code: string, title: string, param?: string[] | null, ev_department_user?: Array<{ id: string, user_profiles?: { email: string | null, full_name: string | null } }> }>} 부서 목록(담당자 포함) */
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
	 * 부서 목록 로드 (담당자 조인)
	 * @returns {Promise<void>}
	 */
	async function loadDepartments() {
		loading = true;
		try {
			const { data, error } = await getDepartmentsWithUsers();
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

	/**
	 * 해당 부서 담당자에 현재 사용자가 포함되어 있는지 여부
	 * @param {{ ev_department_user?: Array<{ user_id: string }> }} dept
	 * @returns {boolean}
	 */
	function isCurrentUserInDept(dept) {
		const userId = user?.id;
		if (!userId) return false;
		const users = dept.ev_department_user ?? [];
		return users.some((u) => u.user_id === userId);
	}

	/**
	 * 담당자 배열을 표시 문자열로 변환 (이름 또는 이메일)
	 * @param {Array<{ user_profiles?: { email?: string | null, full_name?: string | null } }>} users
	 * @returns {string}
	 */
	function formatDepartmentUsers(users) {
		if (!Array.isArray(users) || users.length === 0) return '-';
		return users
			.map((u) => {
				const p = u.user_profiles;
				const name = (p?.full_name ?? '').trim();
				const email = (p?.email ?? '').trim();
				return name || email || '-';
			})
			.filter(Boolean)
			.join(', ');
	}
</script>

<MainContent>
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-800">부서별 실적</h1>
		<p class="text-gray-600 mt-2">부서를 선택하면 해당 부서의 월별/분기별 실적을 확인할 수 있습니다.</p>
	</div>
	<PermissionBar />

	{#if loading}
		<div class="flex items-center justify-center min-h-[200px]">
			<div class="text-gray-500">부서 목록 로딩 중...</div>
		</div>
	{:else if departments.length === 0}
		<div class="flex items-center justify-center min-h-[200px]">
			<p class="text-gray-600">등록된 부서가 없습니다.</p>
		</div>
	{:else}
		<ul class="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{#each departments as dept (dept.id)}
				{@const canAccess = isCurrentUserInDept(dept)}
				<li>
					{#if canAccess}
						<a
							href="../performance/{dept.id}"
							class="block rounded-lg border-2 border-blue-500 bg-white p-4 shadow-sm transition-colors hover:border-blue-600 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<span class="block font-medium text-gray-800 text-bold text-xl">{dept.title || dept.code}</span>
							<!-- <span class="mt-1 block text-sm text-gray-500">{dept.code}</span> -->
							<span class="mt-2 block text-xs text-gray-600">
								담당자: {formatDepartmentUsers(dept.ev_department_user ?? [])}
							</span>
						</a>
					{:else}
						<div
							class="block rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60 cursor-not-allowed pointer-events-none"
							aria-disabled="true"
						>
							<span class="block font-medium text-gray-600 text-bold text-xl">{dept.title || dept.code}</span>
							<!-- <span class="mt-1 block text-sm text-gray-400">{dept.code}</span> -->
							<span class="mt-2 block text-xs text-gray-500">
								담당자: {formatDepartmentUsers(dept.ev_department_user ?? [])}
							</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</MainContent>
