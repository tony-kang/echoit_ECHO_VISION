<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { isAdmin } from '$lib/userService';
	import BoardCategoryTab from '$lib/components/admin/BoardCategoryTab.svelte';
	import ___prjConst from '$prj/prjConst';
	
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let loading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	let userProfileLoading = $state(true);
	let profileChecked = $state(false);
	
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
			} else if (!user && !loading) {
				goto('/login');
			}
		});

		return () => {
			unsubscribe();
		};
	});
</script>

<svelte:head>
	<title>A-게시판 카테고리 관리 - {___prjConst.oAuth.appName}</title>
</svelte:head>

{#if loading || userProfileLoading}
	<div class="loading-container">
		<div class="spinner"></div>
		<p>로딩 중...</p>
	</div>
{:else if user && isAdminUser()}
	<div class="admin-page">
		
		<main class="admin-main">
			<div class="container">
				<div class="page-header">
					<h1>A-게시판 카테고리 관리</h1>
					<p>게시판 카테고리를 생성하고 관리할 수 있는 관리 기능을 제공합니다</p>
				</div>
				
				<BoardCategoryTab />
			</div>
		</main>
	</div>
{/if}

<style>
	.admin-page {
		min-height: 100vh;
		background: #f5f7fa;
	}
	
	.admin-main {
		padding: 120px 20px 40px;
	}
	
	.container {
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.page-header {
		margin-bottom: 20px;
	}
	
	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1a202c;
		margin-bottom: 10px;
	}
	
	.page-header p {
		font-size: 1.1rem;
		color: #718096;
	}
	
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}
	
	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>

