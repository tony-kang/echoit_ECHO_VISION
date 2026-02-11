<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { sidebarStore } from '$lib/stores/sidebarStore';

	/** @type {boolean} 사이드바 열림 상태 */
	let isOpen = $state(true);
	
	// sidebarStore 구독
	onMount(() => {
		console.log('🎯 EchoVisionSidebar onMount');
		const unsubscribe = sidebarStore.subscribe((state) => {
			console.log('🎯 EchoVisionSidebar 상태 변경:', state);
			isOpen = state.isOpen;
		});
		return unsubscribe;
	});
	
	/**
	 * 사이드바 닫기
	 */
	function closeSidebar() {
		sidebarStore.close();
	}

	/** @type {string | null} */
	let expandedMenu = $state(null);

	/**
	 * 메뉴 항목 타입 정의
	 * @typedef {Object} MenuItem
	 * @property {string} id - 메뉴 ID
	 * @property {string} label - 메뉴 라벨
	 * @property {string} icon - 아이콘 SVG 경로
	 * @property {string} path - 기본 경로
	 * @property {Array<{label: string, path: string}>} subMenus - 하위 메뉴 목록
	 */

	/** @type {Array<MenuItem>} */
	const menuItems = [
		{
			id: 'profit', // profit and loss
			label: '손익',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
			path: '/echovision/profit',
			subMenus: [
				{ label: '경영 실적', path: '/echovision/performance' },
				{ label: '손익 현황', path: '/echovision/profit' },
			]
		},
		// {
		// 	id: 'sales',
		// 	label: '매출',
		// 	icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
		// 	path: '/echovision/sales',
		// 	subMenus: [
		// 		{ label: '매출 관리', path: '/echovision/sales' },
		// 		{ label: '매출 (엑셀)파일 관리', path: '/echovision/excel/sales' },
		// 		// { label: '매출 분석', path: '/echovision/compare/sales' },
		// 	]
		// },
		{
			id: 'cost',
			label: '매출 / 원가',
			icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
			path: '/echovision/cost',
			subMenus: [
				{ label: '매출 관리', path: '/echovision/sales' },
				{ label: '원가 관리', path: '/echovision/cost' },
				{ label: '매출 (엑셀)파일 관리', path: '/echovision/excel/sales' },
				{ label: '원가 (엑셀)파일 관리', path: '/echovision/excel/cost' },
				// { label: '원가 분석', path: '/echovision/compare/cost' },
			]
		},
		{
			id: 'settings',
			label: '환경설정',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
			path: '/echovision/settings',
			subMenus: [
				{ label: '사용자 관리', path: '/echovision/settings/user' },
				{ label: '엑셀 컬럼 관리', path: '/echovision/settings/excel-code' },
				{ label: '금액 코드 관리', path: '/echovision/settings/amount-code' },
				// { label: '시스템', path: '/echovision/settings/system' }
			]
		},
		{
			id: 'maintenance',
			label: '유지보수',
			icon: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.38.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 01-.16-3.38l.75-.75a2.548 2.548 0 013.38-.16l5.653 4.655M11.42 15.17l-2.496 3.03c-.317.38-.74.626-1.208.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 01-.16 3.38l.75.75a2.548 2.548 0 013.38.16l5.653-4.655',
			path: '/echovision/maintenance',
			subMenus: [
				{ label: '액션 로그', path: '/echovision/maintenance/logs' },
			]
		}
	];

	/**
	 * 현재 경로가 메뉴 항목과 일치하는지 확인
	 * @param {MenuItem} menuItem - 메뉴 항목
	 * @returns {boolean}
	 */
	function isActiveMenu(menuItem) {
		const currentPath = page.url.pathname;
		return currentPath.startsWith(menuItem.path);
	}

	/**
	 * 현재 경로가 하위 메뉴와 일치하는지 확인
	 * @param {string} path - 하위 메뉴 경로
	 * @returns {boolean}
	 */
	function isActiveSubMenu(path) {
		const currentPath = page.url.pathname;
		return currentPath === path;
	}

	/**
	 * 메뉴 토글
	 * @param {string} menuId - 메뉴 ID
	 * @returns {void}
	 */
	function toggleMenu(menuId) {
		if (expandedMenu === menuId) {
			expandedMenu = null;
		} else {
			expandedMenu = menuId;
		}
	}

	/**
	 * 메뉴 클릭 핸들러
	 * @param {MenuItem} menuItem - 메뉴 항목
	 * @returns {void}
	 */
	function handleMenuClick(menuItem) {
		if (menuItem.subMenus && menuItem.subMenus.length > 0) {
			toggleMenu(menuItem.id);
		} else {
			goto(menuItem.path);
		}
	}

	/**
	 * 하위 메뉴 클릭 핸들러
	 * @param {string} path - 하위 메뉴 경로
	 * @returns {void}
	 */
	function handleSubMenuClick(path) {
		goto(path);
	}

	// 현재 경로에 따라 자동으로 메뉴 확장
	$effect(() => {
		const currentPath = page.url.pathname;
		for (const menuItem of menuItems) {
			if (currentPath.startsWith(menuItem.path)) {
				expandedMenu = menuItem.id;
				break;
			}
		}
	});
</script>

<!-- 사이드바 -->
{#if isOpen}
	<div
		class="sidebar-container w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0"
	>
	<!-- 사이드바 헤더 -->
	<div class="p-4 border-b border-gray-200 flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-800">경영지표 관리</h2>
		<!-- 닫기 버튼 -->
		<button
			onclick={closeSidebar}
			class="p-1 text-gray-500 hover:text-gray-700"
			aria-label="사이드바 닫기"
			type="button"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				></path>
			</svg>
		</button>
	</div>

	<!-- 메뉴 목록 -->
	<nav class="flex-1 overflow-y-auto p-2">
		<div class="space-y-1">
			{#each menuItems as menuItem}
				{@const isActive = isActiveMenu(menuItem)}
				{@const isExpanded = expandedMenu === menuItem.id}
				<div class="mb-1">
					<!-- 메인 메뉴 항목 -->
					<button
						onclick={() => handleMenuClick(menuItem)}
						class="w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors {isActive
							? 'bg-blue-50 text-blue-700'
							: 'text-gray-700 hover:bg-gray-50'}"
						aria-label={menuItem.label}
					>
						<div class="flex items-center flex-1">
							<svg
								class="w-5 h-5 mr-3 {isActive ? 'text-blue-600' : 'text-gray-500'}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={menuItem.icon}
								></path>
							</svg>
							<span class="font-medium">{menuItem.label}</span>
						</div>
						{#if menuItem.subMenus && menuItem.subMenus.length > 0}
							<svg
								class="w-4 h-4 transition-transform {isExpanded ? 'rotate-90' : ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								></path>
							</svg>
						{/if}
					</button>

					<!-- 하위 메뉴 -->
					{#if menuItem.subMenus && menuItem.subMenus.length > 0 && isExpanded}
						<div class="ml-4 mt-1 space-y-1">
							{#each menuItem.subMenus as subMenu}
								{@const isSubActive = isActiveSubMenu(subMenu.path)}
								<button
									onclick={() => handleSubMenuClick(subMenu.path)}
									class="w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors {isSubActive
										? 'bg-blue-100 text-blue-700 font-medium'
										: 'text-gray-600 hover:bg-gray-50'}"
									aria-label={subMenu.label}
								>
									<span class="ml-6">{subMenu.label}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</nav>
	</div>
{/if}
