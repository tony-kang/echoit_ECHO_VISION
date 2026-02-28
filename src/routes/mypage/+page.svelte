<script>
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { USER_ROLES, isAdmin, isMaster } from '$lib/userService';
	import UserMypage from '$lib/components/mypage/UserMypage.svelte';
	import AdminMypage from '$lib/components/mypage/AdminMypage.svelte';
	import MasterMypage from '$lib/components/mypage/MasterMypage.svelte';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	let authLoading = $derived(authStore.loading);
	/** @type {Object | null} */
	let userProfile = $derived(authStore.profile);

	$effect(() => {
		if (!authStore.user && !authStore.loading) {
			goto('/login');
		}
	});

	/**
	 * 사용자 역할
	 * @type {string}
	 */
	const userRole = $derived.by(() => {
		/** @type {any} */
		const profile = userProfile;
		return profile?.role || USER_ROLES.USER;
	});

	/**
	 * 관리자 여부 (admin 또는 master)
	 * @type {boolean}
	 */
	const isAdminUser = $derived.by(() => isAdmin(userRole));

	/**
	 * 마스터 여부
	 * @type {boolean}
	 */
	const isMasterUser = $derived.by(() => isMaster(userRole));
</script>

<div class="main-content-page bg-gray-50">
	<main>
		{#if authLoading || (user && !userProfile)}
			<div class="max-w-7xl mx-auto px-4 py-8">
				<div class="text-center py-12">
					<div class="spinner"></div>
					<p class="mt-4 text-gray-600">로딩 중...</p>
				</div>
			</div>
		{:else if user && userProfile}
			{#if isMasterUser}
				<MasterMypage {user} {userProfile} />
			{:else if isAdminUser}
				<AdminMypage {user} {userProfile} />
			{:else}
				<UserMypage {user} {userProfile} />
			{/if}
		{/if}
	</main>
</div>

<style>
	.spinner {
		width: 40px;
		height: 40px;
		margin: 0 auto;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
