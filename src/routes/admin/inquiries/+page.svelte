<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import {
		getAllInquiries,
		getInquiryStatistics,
		updateInquiryStatus,
		updatePriority,
		addAdminResponse,
		downloadCSV as downloadInquiryCSV
	} from '$lib/inquiryService';
	import { isAdmin } from '$lib/userService';
	import InquiryTab from '$lib/components/admin/InquiryTab.svelte';
	import ___prjConst from '$prj/prjConst';
	
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let loading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	let userProfileLoading = $state(true);
	let profileChecked = $state(false);
	
	/** @type {Array<any>} */
	let inquiries = $state([]);
	/** @type {{ total: number; byStatus: Record<string, number>; byType: Record<string, number>; byPriority: Record<string, number>; } | null} */
	let inquiryStats = $state(null);
	let loadingData = $state(false);
	let error = $state('');
	let selectedInquiry = $state(null);
	let adminResponse = $state('');
	
	let inquiryFilters = $state({
		status: '',
		inquiry_type: '',
		priority: '',
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
			const filters = inquiryFilters;
			const result = await getAllInquiries(filters);
			if (result.data) {
				inquiries = result.data;
			} else {
				const err = result.error;
				error = err?.message || '문의를 불러오는데 실패했습니다.';
			}
			
			// 문의 통계도 가져오기
			const inquiryStatsResult = await getInquiryStatistics();
			if (inquiryStatsResult.data) {
				inquiryStats = inquiryStatsResult.data;
			}
		} catch (err) {
			error = '데이터를 불러오는 중 오류가 발생했습니다.';
			console.error(err);
		} finally {
			loadingData = false;
			isLoadingData = false;
		}
	}
	
	function applyInquiryFilters() {
		loadData();
	}
	
	function resetInquiryFilters() {
		inquiryFilters = { status: '', inquiry_type: '', priority: '', search: '' };
		loadData();
	}
	
	function exportInquiryCSV() {
		downloadInquiryCSV(inquiries);
	}
	
	/**
	 * @param {string} inquiryId
	 * @param {string} newStatus
	 */
	async function handleStatusChange(inquiryId, newStatus) {
		const status = newStatus;
		const { error } = await updateInquiryStatus(inquiryId, status);
		if (error) {
			alert('상태 변경에 실패했습니다.');
		} else {
			await loadData();
		}
	}
	
	/**
	 * @param {string} inquiryId
	 * @param {string} newPriority
	 */
	async function handlePriorityChange(inquiryId, newPriority) {
		const priority = newPriority;
		const { error } = await updatePriority(inquiryId, priority);
		if (error) {
			alert('우선순위 변경에 실패했습니다.');
		} else {
			await loadData();
		}
	}
	
	/**
	 * @param {string} inquiryId
	 */
	async function handleAddResponse(inquiryId) {
		if (!adminResponse.trim()) {
			alert('응답 내용을 입력해주세요.');
			return;
		}
		
		if (!user?.id) {
			alert('사용자 정보를 찾을 수 없습니다.');
			return;
		}
		
		const { error } = await addAdminResponse(inquiryId, adminResponse, user.id);
		if (error) {
			alert('응답 추가에 실패했습니다.');
		} else {
			alert('응답이 추가되었습니다.');
			adminResponse = '';
			selectedInquiry = null;
			await loadData();
		}
	}
	
	/**
	 * @param {any} inquiry
	 */
	function openResponseModal(inquiry) {
		selectedInquiry = inquiry;
		adminResponse = inquiry.admin_response || '';
	}
	
	function closeResponseModal() {
		selectedInquiry = null;
		adminResponse = '';
	}
</script>

<svelte:head>
	<title>A-문의 관리 - {___prjConst.oAuth.appName}</title>
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
					<h1>A-문의 관리</h1>
					<p>사용자 문의를 확인하고 응답할 수 있는 관리 기능을 제공합니다</p>
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
					<InquiryTab
						inquiries={inquiries}
						inquiryFilters={inquiryFilters}
						selectedInquiry={selectedInquiry}
						adminResponse={adminResponse}
						onApplyFilters={applyInquiryFilters}
						onResetFilters={resetInquiryFilters}
						onStatusChange={handleStatusChange}
						onPriorityChange={handlePriorityChange}
						onOpenModal={openResponseModal}
						onCloseModal={closeResponseModal}
						onSaveResponse={handleAddResponse}
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

