<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { isAdmin } from '$lib/userService';
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

	/**
	 * 관리 메뉴 목록
	 * @type {Array<{title: string, description: string, path: string, icon: string}>}
	 */
	const adminMenus = [
		{
			title: '사용자 관리',
			description: '사용자 역할 변경, 상태 관리, 비밀번호 초기화',
			path: '/admin/users',
			icon: '👥'
		},
		{
			title: '문의 관리',
			description: '사용자 문의를 확인하고 응답할 수 있는 관리 기능',
			path: '/admin/inquiries',
			icon: '💬'
		},
		{
			title: '일정 카테고리 관리',
			description: '일정 카테고리를 생성, 수정, 삭제할 수 있는 관리 기능',
			path: '/admin/categories',
			icon: '📁'
		},
		{
			title: '게시판 카테고리 관리',
			description: '게시판 카테고리를 생성하고 관리할 수 있는 관리 기능',
			path: '/admin/board-categories',
			icon: '📋'
		},
		{
			title: '게시판 관리',
			description: '게시판과 게시물을 관리할 수 있는 관리 기능',
			path: '/admin/boards',
			icon: '📊'
		},
		{
			title: 'Database 관리',
			description: '데이터베이스를 관리할 수 있는 관리 기능',
			path: '/admin/database',
			icon: '🗄️'
		},
		{
			title: '액션 로그',
			description: '시스템의 모든 액션 로그를 확인하고 분석할 수 있는 관리 기능',
			path: '/admin/logs',
			icon: '📝'
		}
	];
</script>

<svelte:head>
	<title>관리자 대시보드 - {___prjConst.oAuth.appName}</title>
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
					<h1>🔐 관리자 대시보드</h1>
					<p>사용자 관리, 문의 관리 등 모든 관리 기능을 제공합니다</p>
				</div>
				
				<!-- 관리 메뉴 그리드 -->
				<div class="menu-grid">
					{#each adminMenus as menu}
						<a href={menu.path} class="menu-card">
							<div class="menu-icon">{menu.icon}</div>
							<div class="menu-content">
								<h3 class="menu-title">{menu.title}</h3>
								<p class="menu-description">{menu.description}</p>
							</div>
							<div class="menu-arrow">→</div>
						</a>
					{/each}
				</div>
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
		margin-bottom: 30px;
	}
	
	.page-header h1 {
		font-size: 2.2em;
		color: #333;
		margin-bottom: 8px;
	}
	
	.page-header p {
		color: #666;
	}
	
	.menu-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 24px;
		margin-top: 30px;
	}
	
	.menu-card {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 24px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		text-decoration: none;
		color: inherit;
		border: 2px solid transparent;
	}
	
	.menu-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		border-color: #667eea;
	}
	
	.menu-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
	}
	
	.menu-content {
		flex: 1;
		min-width: 0;
	}
	
	.menu-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a202c;
		margin-bottom: 8px;
	}
	
	.menu-description {
		font-size: 0.9rem;
		color: #718096;
		line-height: 1.5;
	}
	
	.menu-arrow {
		font-size: 1.5rem;
		color: #667eea;
		flex-shrink: 0;
		transition: transform 0.3s ease;
	}
	
	.menu-card:hover .menu-arrow {
		transform: translateX(4px);
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
	
	@media (max-width: 768px) {
		.menu-grid {
			grid-template-columns: 1fr;
		}
		
		.page-header h1 {
			font-size: 1.6em;
		}
	}
</style>
