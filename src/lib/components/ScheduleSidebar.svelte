<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sidebarStore } from '$lib/stores/sidebarStore';

	let {
		categories = [],
		selectedCategories = $bindable([]),
		searchQuery = $bindable(''),
		onCategoryToggle = () => {}
	} = $props();
	
	/** @type {boolean} 사이드바 열림 상태 */
	let isOpen = $state(false);
	
	// sidebarStore 구독
	onMount(() => {
		const unsubscribe = sidebarStore.subscribe((state) => {
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

	/**
	 * @param {string} category
	 */
	function toggleCategory(category) {
		if (selectedCategories.includes(category)) {
			selectedCategories = selectedCategories.filter(c => c !== category);
		} else {
			selectedCategories = [...selectedCategories, category];
		}
		onCategoryToggle(selectedCategories);
	}

	function clearFilters() {
		selectedCategories = [];
		searchQuery = '';
		onCategoryToggle([]);
	}
</script>

<!-- 오버레이 (사이드바가 열렸을 때만 표시) -->
{#if isOpen}
	<button
		type="button"
		class="fixed inset-0 z-40"
		onclick={closeSidebar}
		aria-label="사이드바 닫기"
	></button>
{/if}

<!-- 사이드바 -->
<div
	class="sidebar-container inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col h-full transform transition-transform duration-300 ease-in-out {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<!-- 사이드바 헤더 -->
	<div class="p-4 border-b border-gray-200 flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-800">필터</h2>
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

	<!-- 검색 -->
	<div class="p-4 border-b border-gray-200">
		<label for="search" class="block text-sm font-medium text-gray-700 mb-2">
			검색
		</label>
		<div class="relative">
			<input
				type="text"
				id="search"
				bind:value={searchQuery}
				placeholder="일정 제목 검색..."
				class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
			/>
			<button
				onclick={clearFilters}
				class="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border border-red-500 text-red-500 hover:text-red-600 hover:border-red-600 flex items-center justify-center transition-colors"
				aria-label="필터 초기화"
				title="필터 초기화"
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>
	</div>

	<!-- 카테고리 필터 -->
	<div class="flex-1 overflow-y-auto p-4">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-semibold text-gray-700">카테고리</h3>
			<a
				href="/admin/categories"
				class="p-1.5 text-blue-700 hover:text-blue-800 transition-colors"
				aria-label="카테고리 편집"
				title="카테고리 편집"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
				</svg>
			</a>
		</div>
		<div class="space-y-2">
			{#each categories as category}
				{@const isSelected = selectedCategories.includes(category.value)}
				{@const checkboxId = `category-${category.value}`}
				<label for={checkboxId} class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition">
					<input
						type="checkbox"
						id={checkboxId}
						checked={isSelected}
						onchange={() => toggleCategory(category.value)}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<span class="ml-2 text-sm text-gray-700 flex items-center flex-1">
						{#if category.color}
							<span
								class="w-3 h-3 rounded-full mr-2"
								style="background-color: {category.color}"
							></span>
						{/if}
						<span class="flex-1">{category.label || category.value}</span>
						{#if category.count !== undefined}
							<span class="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
								{category.count}
							</span>
						{/if}
					</span>
				</label>
			{/each}
		</div>
	</div>
</div>

<style>
	.sidebar-container {
		position: fixed;
		z-index: 50;
		height: calc(100vh - 100px);
		top: 100px;
	}

	/* 모바일 전용 스타일 제거 - 이제 모든 기기에서 동일하게 작동 */
</style>
