<script>
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { isAdmin, isMaster } from '$lib/userService';
	import ___prjConst from '$prj/prjConst';
	import SupabaseTab from '$lib/components/admin/system-guide/SupabaseTab.svelte';
	import GoogleTab from '$lib/components/admin/system-guide/GoogleTab.svelte';
	import SupabaseProviderTab from '$lib/components/admin/system-guide/SupabaseProviderTab.svelte';
	import PRSettingsTab from '$lib/components/admin/system-guide/PRSettingsTab.svelte';
	import TroubleshootingTab from '$lib/components/admin/system-guide/TroubleshootingTab.svelte';
	import VercelDomainTab from '$lib/components/admin/system-guide/VercelDomainTab.svelte';
	import BoardTab from '$lib/components/admin/system-guide/BoardTab.svelte';
	import AIMusicTab from '$lib/components/admin/system-guide/AIMusicTab.svelte';
	import MultiSchemaTab from '$lib/components/admin/system-guide/MultiSchemaTab.svelte';
	import GitHubSSHTab from '$lib/components/admin/system-guide/GitHubSSHTab.svelte';
	import SupabaseTransferTab from '$lib/components/admin/system-guide/SupabaseTransferTab.svelte';
	import SupabaseMigrationTab from '$lib/components/admin/system-guide/SupabaseMigrationTab.svelte';
	import SupabaseStorageMigrationTab from '$lib/components/admin/system-guide/SupabaseStorageMigrationTab.svelte';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	/** @type {boolean} */
	let authLoading = $derived(authStore.loading);
	/** @type {Object | null} */
	let userProfile = $derived(authStore.profile);
	/** @type {string} */
	let activeTab = $state('supabase');

	$effect(() => {
		if (!authStore.loading && !authStore.user) {
			goto('/login');
			return;
		}
		if (authStore.user && !authStore.loading && authStore.profile) {
			const profile = authStore.profile;
			if (profile && !isAdmin(profile.role) && !isMaster(profile.role)) {
				goto('/mypage');
			}
		}
	});

	const tabs = [
		{ id: 'supabase', label: '1. Supabase 설정', icon: '🔐' },
		{ id: 'google', label: '2. Google Cloud Console', icon: '☁️' },
		{ id: 'supabase-provider', label: '3. Supabase Provider', icon: '🔗' },
		{ id: 'pr-settings', label: '4. GitHub PR 설정', icon: '🔀' },
		{ id: 'vercel-domain', label: '5. Vercel 커스텀 도메인', icon: '🌐' },
		{ id: 'board', label: '6. 게시판 스타일 가이드', icon: '📋' },
		{ id: 'ai-music', label: '7. AI 음악 생성 가이드', icon: '🎵' },
		{ id: 'multi-schema', label: '8. 멀티 스키마 가이드', icon: '🗄️' },
		{ id: 'github-ssh', label: '9. GitHub SSH 전환', icon: '🔑' },
		{ id: 'supabase-transfer', label: '10. Supabase 프로젝트 이전', icon: '🔄' },
		{ id: 'supabase-migration', label: '11. Supabase Region 마이그레이션', icon: '🌍' },
		{ id: 'supabase-storage-migration', label: '12. Supabase Storage 마이그레이션', icon: '📦' },
		{ id: 'troubleshooting', label: '문제 해결', icon: '🔧' }
	];

	/**
	 * @param {string} text
	 */
	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			alert('클립보드에 복사되었습니다.');
		});
	}
</script>

<svelte:head>
	<title>Google OAuth 설정 - {___prjConst.oAuth.appName}</title>
</svelte:head>

{#if authLoading}
	<div class="loading-container">
		<div class="spinner"></div>
		<p>로딩 중...</p>
	</div>
{:else if user && userProfile && (isAdmin(userProfile.role) || isMaster(userProfile.role))}
	<div class="admin-page">
		
		<main class="admin-main">
			<div class="container">
				<div class="page-header">
					<h1>시스템 구성 가이드</h1>
					<p>Google OAuth 및 서비스 구성 & 설정 가이드</p>
				</div>

				<!-- 탭 네비게이션 -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
					<div class="flex flex-wrap border-b border-gray-200">
						{#each tabs as tab}
							<button
								onclick={() => activeTab = tab.id}
								class="px-6 py-4 text-sm font-medium transition-colors border-b-2 {activeTab === tab.id 
									? 'border-blue-600 text-blue-600 bg-blue-50' 
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							>
								<span class="mr-2">{tab.icon}</span>
								{tab.label}
							</button>
						{/each}
					</div>

					<!-- 탭 컨텐츠 -->
					<div class="p-6">
					{#if activeTab === 'supabase'}
						<SupabaseTab onCopy={copyToClipboard} />

					{:else if activeTab === 'google'}
						<GoogleTab onCopy={copyToClipboard} />

					{:else if activeTab === 'supabase-provider'}
						<SupabaseProviderTab />

					{:else if activeTab === 'pr-settings'}
						<PRSettingsTab onCopy={copyToClipboard} />

					{:else if activeTab === 'vercel-domain'}
						<VercelDomainTab />

					{:else if activeTab === 'board'}
						<BoardTab />

					{:else if activeTab === 'ai-music'}
						<AIMusicTab />

					{:else if activeTab === 'multi-schema'}
						<MultiSchemaTab />

					{:else if activeTab === 'github-ssh'}
						<GitHubSSHTab />

					{:else if activeTab === 'supabase-transfer'}
						<SupabaseTransferTab />

					{:else if activeTab === 'supabase-migration'}
						<SupabaseMigrationTab />

					{:else if activeTab === 'supabase-storage-migration'}
						<SupabaseStorageMigrationTab />

						{:else if activeTab === 'troubleshooting'}
							<TroubleshootingTab />
						{/if}
					</div>
				</div>

				<!-- 참고 사항 -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">📌 참고 사항</h3>
					<ul class="text-sm text-gray-700 space-y-2 list-disc list-inside">
						<li><strong>개발 포트 변경 시:</strong> Supabase와 Google Cloud Console 모두에 새 포트 URL 추가 필요</li>
						<li><strong>새 도메인 추가 시:</strong> 위의 설정 단계를 반복하여 새 도메인 추가</li>
						<li><strong>Vercel 도메인 추가 시:</strong> Vercel Dashboard에서 도메인 추가 후 DNS 설정 필요</li>
						<li><strong>보안:</strong> Client Secret은 절대 공개 저장소에 커밋하지 마세요</li>
					</ul>
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
