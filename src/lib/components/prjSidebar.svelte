<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { sidebarStore } from '$lib/stores/sidebarStore.svelte.js';
	import { prjMenuItems } from './prjMenuItems.js';

	/**
	 * @type {{ forceHidden?: boolean }}
	 * forceHidden: true면 사이드바 메뉴를 출력하지 않음
	 */
	let { forceHidden = false } = $props();

	/** @type {boolean} 사이드바 열림 상태 */
	let isOpen = $derived(sidebarStore.isOpen);
	/** @type {boolean} 모바일/태블릿 (1024px 이하) */
	let isMobile = $state(false);

	/** @type {string | null} 확장된 메뉴 ID */
	let expandedMenu = $state(null);

	onMount(() => {
		const mq = window.matchMedia('(max-width: 1024px)');
		isMobile = mq.matches;
		sidebarStore.setOpen(!mq.matches);
		const handler = () => {
			isMobile = mq.matches;
			sidebarStore.setOpen(!mq.matches);
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	/** 새로고침 시 현재 경로에 해당하는 메뉴 확장 */
	$effect(() => {
		const currentPath = page.url.pathname;
		console.log('currentPath',currentPath);
		for (const item of prjMenuItems) {
			// 하위 메뉴(submenu) path와 일치할 때만 확장
			const subMatch = item.subMenus?.some(
				(sub) => currentPath === sub.path
			);
			if (subMatch) {
				expandedMenu = item.id;
				return;
			}
		}
	});

	/**
	 * 사이드바 닫기
	 */
	function closeSidebar() {
		sidebarStore.close();
	}

	/**
	 * 현재 경로와 매칭되는 가장 긴 sub path를 가진 메뉴 ID (여러 메뉴가 겹치면 가장 구체적인 것만 활성)
	 * @type {string | null}
	 */
	let activeMenuIdByLongestMatch = $derived.by(() => {
		const currentPath = page.url.pathname;
		let bestLength = 0;
		let bestId = null;
		for (const item of prjMenuItems) {
			if (item.subMenus?.length) {
				for (const sub of item.subMenus) {
					const match =
						currentPath === sub.path || currentPath.startsWith(sub.path + '/');
					if (match && sub.path.length > bestLength) {
						bestLength = sub.path.length;
						bestId = item.id;
					}
				}
			} else {
				const match =
					currentPath === item.path || currentPath.startsWith(item.path + '/');
				if (match && item.path.length > bestLength) {
					bestLength = item.path.length;
					bestId = item.id;
				}
			}
		}
		return bestId;
	});

	/**
	 * 현재 경로가 메뉴 항목과 일치하는지 확인 (가장 긴 경로 매칭인 메뉴만 활성)
	 * @param {{ id: string, path: string, subMenus?: Array<{path: string}> }} menuItem
	 * @returns {boolean}
	 */
	function isActiveMenu(menuItem) {
		return activeMenuIdByLongestMatch === menuItem.id;
	}

	/**
	 * 현재 경로가 하위 메뉴와 일치하는지 확인
	 * @param {string} path
	 * @returns {boolean}
	 */
	function isActiveSubMenu(path) {
		return page.url.pathname === path;
	}

	/**
	 * 메뉴 확장/축소 토글
	 * @param {string} menuId
	 */
	function toggleMenu(menuId) {
		expandedMenu = expandedMenu === menuId ? null : menuId;
	}

	/**
	 * 메인 메뉴 클릭 핸들러
	 * @param {{ id: string, path: string, subMenus?: Array<{path: string}> }} menuItem
	 */
	function handleMenuClick(menuItem) {
		if (menuItem.subMenus?.length) {
			toggleMenu(menuItem.id);
		} else {
			if (isMobile) closeSidebar();
			goto(menuItem.path);
		}
	}

	/**
	 * 하위 메뉴 클릭 핸들러
	 * @param {string} path
	 */
	function handleSubMenuClick(path) {
		if (isMobile) closeSidebar();
		goto(path);
	}
</script>

{#if !forceHidden}
{#if isOpen && isMobile}
	<button
		type="button"
		class="fixed z-40 bg-black/30 lg:hidden"
		style="top: 100px; left: 0; right: 0; bottom: 0;"
		onclick={closeSidebar}
		aria-label="사이드바 닫기"
	></button>
{/if}

<aside
	class="prj-sidebar shrink-0 flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 ease-in-out {isOpen
		? 'w-64 min-w-64'
		: 'w-0 min-w-0'}"
>
	<div class="p-4 border-b border-gray-200 flex items-center justify-between w-64 shrink-0">
		<h2 class="text-lg font-semibold text-gray-800">메뉴</h2>
		<button
			onclick={closeSidebar}
			class="p-1 text-gray-500 hover:text-gray-700"
			aria-label="사이드바 닫기"
			type="button"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
			</svg>
		</button>
	</div>

	<nav class="flex-1 overflow-y-auto p-2 w-64">
		<div class="space-y-1">
			{#each prjMenuItems as menuItem}
				{@const isActive = isActiveMenu(menuItem)}
				{@const isExpanded = expandedMenu === menuItem.id}
				<div class="mb-1">
					<button
						onclick={() => handleMenuClick(menuItem)}
						class="w-full flex items-center justify-between px-4 py-1 text-left rounded-lg transition-colors {isActive
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
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={menuItem.icon}></path>
							</svg>
							<span class="font-medium">{menuItem.label}</span>
						</div>
						{#if menuItem.subMenus?.length}
							<svg
								class="w-4 h-4 transition-transform {isExpanded ? 'rotate-90' : ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						{/if}
					</button>

					{#if menuItem.subMenus?.length && isExpanded}
						<div class="ml-4 mt-1 space-y-1">
							{#each menuItem.subMenus as subMenu}
								{@const isSubActive = isActiveSubMenu(subMenu.path)}
								<button
									onclick={() => handleSubMenuClick(subMenu.path)}
									class="w-full flex items-center px-4 py-1 text-sm rounded-lg transition-colors {isSubActive
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
</aside>

{/if}

<style>
	.prj-sidebar {
		position: relative;
		z-index: 50;
	}
</style>
