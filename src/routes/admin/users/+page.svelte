<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import {
		getAllUsers,
		updateUserRole,
		toggleUserStatus,
		getUserStatistics,
		downloadUsersCSV,
		resetUserPassword,
		USER_ROLE_LABELS,
		isAdmin
	} from '$lib/userService';
	import UserTab from '$lib/components/admin/UserTab.svelte';
	import ___prjConst from '$prj/prjConst';
	
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let loading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	let userProfileLoading = $state(true);
	let profileChecked = $state(false);
	
	/** @type {Array<any>} */
	let users = $state([]);
	/** @type {{ total: number; admins: number; activeUsers: number; bannedUsers: number; } | null} */
	let userStats = $state(null);
	let loadingData = $state(false);
	let error = $state('');
	
	let userFilters = $state({
		role: '',
		status: '',
		search: ''
	});
	
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
				
				await loadData();
			} else if (!user && !loading) {
				goto('/login');
			}
		});

		return () => {
			unsubscribe();
		};
	});
	
	let isLoadingData = $state(false);
	
	async function loadData() {
		if (isLoadingData) return;
		
		isLoadingData = true;
		loadingData = true;
		error = '';
		
		try {
			const result = await getAllUsers();
			if (result.data) {
				users = result.data;
				const statsResult = await getUserStatistics(result.data);
				userStats = statsResult;
			} else if (result.error) {
				error = '사용자 데이터를 불러올 수 없습니다.';
				console.error(result.error);
			}
		} catch (err) {
			error = '데이터를 불러오는 중 오류가 발생했습니다.';
			console.error(err);
		} finally {
			loadingData = false;
			isLoadingData = false;
		}
	}
	
	// 사용자 관리 함수
	/**
	 * @param {string} userId
	 * @param {string} newRole
	 */
	async function handleRoleChange(userId, newRole) {
		const roleLabel = USER_ROLE_LABELS[newRole] || newRole;
		
		if (!confirm(`정말로 이 사용자의 권한을 "${roleLabel}"로 변경하시겠습니까?`)) {
			return;
		}
		
		const { error } = await updateUserRole(userId, newRole);
		if (error) {
			alert('역할 변경에 실패했습니다.');
		} else {
			alert('역할이 변경되었습니다.');
			await loadData();
		}
	}

	/**
	 * @param {string} userId
	 * @param {boolean} currentBanned
	 */
	async function handleToggleUserStatus(userId, currentBanned) {
		const action = currentBanned ? '활성화' : '비활성화';
		if (!confirm(`정말로 이 사용자를 ${action}하시겠습니까?`)) {
			return;
		}
		
		const { error } = await toggleUserStatus(userId, !currentBanned);
		if (error) {
			alert(`${action}에 실패했습니다.`);
		} else {
			alert(`사용자가 ${action}되었습니다.`);
			await loadData();
		}
	}

	/**
	 * @param {string} userId
	 */
	async function handleResetPassword(userId) {
		if (!confirm('정말로 이 사용자의 비밀번호를 초기화하시겠습니까?')) {
			return;
		}
		
		const { error } = await resetUserPassword(userId);
		if (error) {
			alert('비밀번호 초기화에 실패했습니다.');
		} else {
			alert('비밀번호가 초기화되었습니다.');
		}
	}
	
	function applyUserFilters() {
		loadData();
	}
	
	function resetUserFilters() {
		userFilters = { role: '', status: '', search: '' };
		loadData();
	}
	
	function exportUsersCSV() {
		downloadUsersCSV(users);
	}
	
	// 필터링된 사용자 목록
	let filteredUsers = $derived(() => {
		let filtered = users;
		
		if (userFilters.role) {
			filtered = filtered.filter((u) => u.role === userFilters.role);
		}
		
		if (userFilters.status === 'active') {
			filtered = filtered.filter((u) => !u.banned);
		} else if (userFilters.status === 'banned') {
			filtered = filtered.filter((u) => u.banned);
		}
		
		if (userFilters.search) {
			const searchLower = userFilters.search.toLowerCase();
			filtered = filtered.filter((/** @type {any} */ u) => 
				(u.email && u.email.toLowerCase().includes(searchLower)) ||
				(u.full_name && u.full_name.toLowerCase().includes(searchLower))
			);
		}
		
		return filtered;
	});
</script>

<svelte:head>
	<title>A-사용자 관리 - {___prjConst.oAuth.appName}</title>
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
					<h1>A-사용자 관리</h1>
					<p>사용자 역할 변경, 상태 관리, 비밀번호 초기화 등 사용자 관리 기능을 제공합니다</p>
				</div>
				
				{#if error}
					<div class="error-message">{error}</div>
				{/if}
				
				{#if loadingData}
					<div class="loading-data">
						<div class="spinner-small"></div>
						<p>데이터 로딩 중...</p>
					</div>
				{:else}
					<UserTab
						users={filteredUsers()}
						userStats={userStats}
						userFilters={userFilters}
						currentUserId={user?.id || null}
						onApplyFilters={applyUserFilters}
						onResetFilters={resetUserFilters}
						onRoleChange={handleRoleChange}
						onToggleStatus={handleToggleUserStatus}
						onResetPassword={handleResetPassword}
					/>
				{/if}
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
		padding: 0 20px;
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
	
	.spinner-small {
		width: 30px;
		height: 30px;
		border: 3px solid #e2e8f0;
		border-top: 3px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.loading-data {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
	}
	
	.loading-data p {
		margin-top: 20px;
		color: #718096;
	}
	
	.error-message {
		background: #fed7d7;
		color: #c53030;
		padding: 16px;
		border-radius: 8px;
		margin-bottom: 20px;
	}
</style>

