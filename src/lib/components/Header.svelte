<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import InquiryForm from '$lib/components/InquiryForm.svelte';
	import MobileMenuButton from '$lib/components/MobileMenuButton.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { authStore } from '$lib/stores/authStore';
	import { isAdmin } from '$lib/userService';
	import { isDevDomain } from '$lib/utils/domainUtils';
	import ___prjConst from '$prj/prjConst';

	let isMenuOpen = $state(false);
	let isUserMenuOpen = $state(false);
	let showInquiryModal = $state(false);
	let showInquirySuccess = $state(false);
	let user = $state(null);
	let authLoading = $state(true);
	let userProfile = $state(null);
	let activeDropdown = $state(null);
	let isSidebarOpen = $state(false); // 사이드바 열림 상태
	const showHamburgerIcon = true;
	
	/**
	 * 햄버거 버튼을 숨겨야 할 페이지 경로 목록
	 * @type {string[]}
	 */
	const hideHamburgerPaths = ['/', '/mypage'];
	
	/**
	 * 현재 페이지에서 햄버거 버튼을 표시할지 여부
	 */
	const shouldShowHamburger = $derived.by(() => {
		if (!user || authLoading) return false;
		const currentPath = page.url.pathname;
		return !hideHamburgerPaths.includes(currentPath);
	});
	

	// 관리자 권한 확인
	const isAdminUser = $derived.by(() => {
		const profile = userProfile;
		if (!profile?.role) return false;
		return isAdmin(profile.role);
	});

	onMount(() => {
		// 레이아웃에서 이미 초기화되므로 여기서는 구독만 함
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			userProfile = state.userProfile;
		});

		return () => {
			unsubscribe();
		};
	});

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function toggleUserMenu() {
		isUserMenuOpen = !isUserMenuOpen;
	}

	/**
	 * 로그아웃 처리
	 * @param {MouseEvent} event
	 */
	async function handleLogout(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		isUserMenuOpen = false;
		const { error } = await authStore.signOut();
		if (error) {
			console.error('로그아웃 실패:', error);
		} else {
			goto('/');
		}
	}
	
	/**
	 * 사용자 메뉴 링크 클릭 핸들러
	 */
	function handleUserMenuLinkClick() {
		isUserMenuOpen = false;
	}

	// 외부 클릭 시 메뉴 닫기
	/** @param {MouseEvent} event */
	function handleClickOutside(event) {
		const target = event.target;
		if (!target || !(target instanceof Element)) return;
		
		// 모바일 메뉴 영역은 제외 (메뉴 내부 클릭은 허용)
		if (target.closest('.mobile-menu-container')) {
			return;
		}
		
		// 모바일 메뉴 토글 버튼은 제외
		if (target.closest('.mobile-menu-toggle')) {
			return;
		}
		
		// 사용자 메뉴 컨테이너 내부 클릭은 제외 (드롭다운 내부 클릭 허용)
		const userMenuContainer = target.closest('.user-menu-container');
		if (userMenuContainer) {
			// 사용자 메뉴 버튼이 아닌 드롭다운 내부 클릭인 경우는 허용 (링크/버튼 클릭은 각각의 핸들러에서 처리)
			return;
		}
		
		// 사용자 메뉴 외부 클릭 시 닫기
		isUserMenuOpen = false;
		
		// 데스크톱 드롭다운 외부 클릭 시 닫기
		if (!target.closest('.dropdown-container')) {
			activeDropdown = null;
		}
		
		// 모바일 메뉴 외부 클릭 시 닫기
		if (!target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-toggle')) {
			isMenuOpen = false;
		}
	}
	
	/**
	 * 모바일 메뉴 내부 링크 클릭 핸들러
	 * @param {MouseEvent} event
	 * @returns {void}
	 */
	function handleMobileLinkClick(event) {
		// 이벤트 전파를 막지 않고, 메뉴만 닫기
		toggleMenu();
	}

	function closeDropdown() {
		activeDropdown = null;
	}

	/**
	 * 경영지표 관리 페이지로 이동
	 * @returns {void}
	 */
	function goToLogistics() {
		if (!user) {
			alert('경영지표 관리는 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
			goto('/login');
			return;
		}
		goto('/echovision');
	}

	/**
	 * 주요일정 페이지로 이동
	 * @returns {void}
	 */
	function goToSchedules() {
		if (!user) {
			alert('주요일정은 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
			goto('/login');
			return;
		}
		goto('/schedules');
	}

	
	function handleInquiryClick() {
		if (!user) {
			alert('문의하기는 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
			goto('/login');
			return;
		}
		showInquiryModal = true;
		showInquirySuccess = false;
	}
	
	/**
	 * @param {any} data
	 */
	function handleInquirySuccess(data) {
		showInquiryModal = false;
		showInquirySuccess = true;
		setTimeout(() => {
			showInquirySuccess = false;
		}, 5000);
	}
	
	function handleInquiryCancel() {
		showInquiryModal = false;
	}
</script>

<svelte:window onclick={handleClickOutside} />

<header class="p-3 fixed top-0 w-full bg-white z-50 shadow-sm">
	<div class="max-w-7xl mx-auto py-1">
		<div class="flex items-center justify-between">
			<!-- Logo with Hamburger Button -->
			<div class="flex items-center shrink-0 gap-2">
				<!-- 햄버거 버튼 (로그인 상태이고 특정 페이지가 아닐 때만 표시) -->
				{#if shouldShowHamburger}
					<MobileMenuButton />
				{/if}
				<a href="/" class="flex items-center">
					<Logo size="sm" />
				</a>
			</div>

			<!-- Desktop Navigation (가운데) - PC에서 표시 -->
			{#if !authLoading && user}
				<nav class="desktop-only flex grow justify-center items-center space-x-4 xl:space-x-6">
					<!-- 경영지표 관리 아이콘 -->
					<button
						onclick={goToLogistics}
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors"
						aria-label="경영지표 관리"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
						</svg>
					</button>

					<!-- 주요일정 아이콘 -->
					<button
						onclick={goToSchedules}
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors"
						aria-label="주요일정"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
						</svg>
					</button>

					<!-- 게시판 아이콘 -->
					<!-- <a 
						href="/board" 
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors" 
						aria-label="게시판"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
					</a> -->

					<!-- 문의 아이콘 -->
					<button 
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors" 
						onclick={handleInquiryClick}
						aria-label="문의"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
						</svg>
					</button>
				</nav>
			{/if}

			<!-- Right Icons -->
			<div class="flex items-center space-x-4 shrink-0">
				{#if !authLoading && user}
					<!-- 사용자 드롭다운 메뉴 -->
					<div class="relative user-menu-container">
						<button 
							onclick={toggleUserMenu}
							class="flex items-center space-x-2 hover:opacity-80 transition" 
							aria-label="사용자 메뉴"
						>
							<span class="text-2xl" style="color: #3b82f6;">👤</span>
						</button>
						
						{#if isUserMenuOpen}
							<div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
								<!-- 사용자 정보 -->
								<div class="px-4 py-3 border-b border-gray-200">
									<p class="text-sm font-semibold text-gray-900">{user.user_metadata?.full_name || '사용자'}</p>
									<p class="text-xs text-gray-500 truncate">{user.email}</p>
								</div>
								
								<!-- 메뉴 항목 -->
								<a 
									href="/mypage" 
									onclick={handleUserMenuLinkClick}
									class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
								>
									👤 마이페이지
								</a>
								
								{#if isAdminUser}
									<a 
										href="/admin/dashboard" 
										onclick={handleUserMenuLinkClick}
										class="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition font-medium"
									>
										🔐 관리자 대시보드
									</a>
								{/if}
								
								<button 
									type="button"
									onclick={handleLogout}
									class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
								>
									🚪 로그아웃
								</button>
								<hr class="my-2 border-gray-200" />
								<span class="block px-4 py-2 text-sm text-gray-500">Version {___prjConst.VERSION}</span>
								<hr class="my-2 border-gray-200" />
								<span class="block px-4 py-2 text-sm text-gray-500">{isDevDomain() ? `개발 환경` : `프로덕션 환경`}({window.location.hostname})</span>
							</div>
						{/if}
					</div>
				{:else}
					<!-- 로그인 링크 (로딩 중이거나 사용자가 없을 때, 단 로그인 페이지에서는 제외) -->
					<a href="/login" class="flex items-center space-x-2 hover:text-blue-600 transition" aria-label="로그인">
						<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
						</svg>
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if isMenuOpen}
		<div class="mobile-menu-container mobile-only bg-white border-t">
			<nav class="px-4 py-4 space-y-3">
				<!-- 아이콘 메뉴 -->
				<div class="flex items-center justify-center space-x-6 py-4">
					<!-- 경영지표 관리 아이콘 -->
					<button
						onclick={() => { toggleMenu(); goToLogistics(); }}
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors"
						aria-label="경영지표 관리"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
						</svg>
					</button>

					<!-- 주요일정 아이콘 -->
					<button
						onclick={() => { toggleMenu(); goToSchedules(); }}
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors"
						aria-label="주요일정"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
						</svg>
					</button>

					<!-- 게시판 아이콘 -->
					<a
						href="/board"
						onclick={handleMobileLinkClick}
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors"
						aria-label="게시판"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
					</a>

					<!-- 문의 아이콘 -->
					<button
						type="button"
						onclick={() => { toggleMenu(); handleInquiryClick(); }}
						class="flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors"
						aria-label="문의"
					>
						<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
						</svg>
					</button>
				</div>

				{#if !authLoading}
					<hr class="my-2 border-gray-200" />
					{#if user}
						<!-- 사용자 정보 섹션 -->
						<div class="bg-blue-50 rounded-lg px-3 py-3 mb-2">
							<p class="text-sm font-semibold" style="color: #3b82f6;">👤 {user.user_metadata?.full_name || '사용자'}</p>
							<p class="text-xs text-gray-500 truncate">{user.email}</p>
						</div>
						
						<!-- 마이페이지 버튼 -->
						<a 
							href="/mypage" 
							class="block py-2 px-3 hover:bg-gray-100 transition font-semibold text-gray-700 rounded-lg" 
							onclick={handleMobileLinkClick}
						>
							📄 마이페이지
						</a>
						
						{#if isAdminUser}
							<!-- 관리자 대시보드 버튼 -->
							<a 
								href="/admin/dashboard" 
								class="block py-2 px-3 hover:bg-blue-50 transition font-semibold text-blue-600 rounded-lg" 
								onclick={handleMobileLinkClick}
							>
								🔐 관리자 대시보드
							</a>
						{/if}
						
						<!-- 로그아웃 버튼 -->
						<button 
							type="button"
							onclick={handleLogout}
							class="w-full text-left block py-2 px-3 hover:bg-red-50 transition font-semibold text-red-600 rounded-lg"
						>
							🚪 로그아웃
						</button>
					{:else}
						<a href="/login" class="block py-2 hover:text-blue-600 transition font-semibold" onclick={handleMobileLinkClick}>로그인</a>
					{/if}
				{/if}
			</nav>
		</div>
	{/if}
</header>

<!-- 문의하기 모달 -->
{#if showInquiryModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => showInquiryModal = false}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>문의하기</h2>
				<button onclick={() => showInquiryModal = false} class="modal-close">×</button>
			</div>
			<div class="modal-body">
				<InquiryForm 
					onSuccess={handleInquirySuccess}
					onCancel={handleInquiryCancel}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- 문의 성공 메시지 -->
{#if showInquirySuccess}
	<div class="success-toast">
		<div class="success-content">
			<span class="success-icon">✅</span>
			<p>문의가 성공적으로 접수되었습니다!</p>
		</div>
	</div>
{/if}

<style>
	.user-menu-container {
		position: relative;
	}
	
	/* 모달 스타일 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}
	
	.modal-content {
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 700px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}
	
	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		background: white;
		z-index: 10;
	}
	
	.modal-header h2 {
		margin: 0;
		font-size: 1.5em;
		color: #333;
	}
	
	.modal-close {
		background: none;
		border: none;
		font-size: 2em;
		cursor: pointer;
		color: #999;
		line-height: 1;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.modal-close:hover {
		color: #333;
	}
	
	.modal-body {
		padding: 0;
	}
	
	/* 성공 토스트 */
	.success-toast {
		position: fixed;
		top: 80px;
		right: 20px;
		z-index: 1001;
		animation: slideIn 0.3s ease-out;
	}
	
	.success-content {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		padding: 16px 24px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.success-icon {
		font-size: 1.5em;
	}
	
	.success-content p {
		margin: 0;
		font-weight: 500;
	}
	
	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* 모바일 및 태블릿 스타일 (아이패드 포함) */
	@media (max-width: 1024px) {
		header {
			padding: 0.5rem 0.75rem;
		}

		/* 모바일 메뉴 컨테이너 스타일 개선 */
		.mobile-menu-container {
			position: fixed;
			top: 60px;
			left: 0;
			right: 0;
			bottom: 0;
			background: white;
			z-index: 40;
			overflow-y: auto;
			box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		}
	}
</style>

