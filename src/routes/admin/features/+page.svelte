<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { isMaster } from '$lib/userService';
	import ___prjConst from '$prj/prjConst';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);

	// 기능 그룹 및 기능 목록
	const featureGroups = [
		{
			groupName: '일정관리',
			features: [
				{ name: '일정달력', path: '/schedules', description: '일정 관리 및 캘린더 뷰' }
			]
		},
		{
			groupName: '사용자 관리',
			features: [
				{ name: '관리자 대시보드', path: '/admin/dashboard', description: '사용자 및 문의 관리' }
			]
		},
		{
			groupName: '시스템 관리',
			features: [
				{ name: '시스템 구성 가이드', path: '/admin/system-guide', description: 'Google OAuth 및 서비스 구성 가이드' }
			]
		}
	];

	/**
	 * 인증 상태 구독 (레이아웃에서 이미 초기화됨)
	 */
	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			userProfile = state.userProfile;

			if (state.user && !state.loading && state.userProfile) {
				// Master 권한 확인
				/** @type {any} */
				const profile = state.userProfile;
				if (profile && !isMaster(profile.role)) {
					goto('/mypage');
				}
			} else if (!state.user && !state.loading) {
				goto('/login');
			}
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * @param {string} path
	 */
	function handleFeatureClick(path) {
		goto(path);
	}
</script>

<svelte:head>
	<title>기능 목록 - {___prjConst.oAuth.appName}</title>
</svelte:head>

{#if authLoading}
	<div class="loading-container">
		<div class="spinner"></div>
		<p>로딩 중...</p>
	</div>
{:else if user && isMaster(userProfile?.role)}
	<div class="admin-page">
		
		<main class="admin-main">
			<div class="container">
				<div class="page-header">
					<h1>기능 개발</h1>
					<p>개발 중인 기능 목록 및 관리 페이지</p>
				</div>
				
				<!-- 기능 그룹 목록 -->
				<div class="space-y-4">
					{#each featureGroups as group}
						<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
							<div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
								<!-- 그룹명 (왼쪽) -->
								<div class="bg-linear-to-r from-blue-50 to-indigo-50 p-6 border-r border-gray-200 flex items-center">
									<h2 class="text-lg font-semibold text-gray-900">{group.groupName}</h2>
								</div>

								<!-- 기능 목록 (오른쪽) -->
								<div class="p-6">
									<div class="flex flex-wrap gap-3">
										{#each group.features as feature}
											<button
												onclick={() => handleFeatureClick(feature.path)}
												class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-left"
												title={feature.description}
											>
												<div class="font-medium whitespace-nowrap">{feature.name}</div>
												{#if feature.description}
													<div class="text-xs text-blue-100 mt-1 opacity-90">{feature.description}</div>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>
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
