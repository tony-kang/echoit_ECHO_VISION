<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getActiveCategories } from '$lib/boardCategoryService';
	import LoadingSpinner from '$lib/components/board/LoadingSpinner.svelte';
	import ErrorMessage from '$lib/components/board/ErrorMessage.svelte';
	import EmptyState from '$lib/components/board/EmptyState.svelte';

	/**
	 * @typedef {Object} BoardCategory
	 * @property {string} id - 카테고리 ID
	 * @property {string} name - 카테고리 이름
	 * @property {string} [description] - 카테고리 설명
	 * @property {string} slug - 카테고리 슬러그
	 * @property {number} display_order - 표시 순서
	 * @property {boolean} is_active - 활성화 여부
	 * @property {Object} [options] - 카테고리 옵션
	 */

	/** @type {Array<BoardCategory>} 활성화된 게시판 카테고리 목록 */
	let categories = $state([]);
	/** @type {boolean} 카테고리 로딩 상태 */
	let loading = $state(true);
	/** @type {string | null} 에러 메시지 */
	let error = $state(null);

	onMount(() => {
		loadCategories();
	});

	/**
	 * 게시판 카테고리 목록을 불러오는 함수
	 * @returns {Promise<void>}
	 */
	async function loadCategories() {
		loading = true;
		error = null;
		const { data, error: err } = await getActiveCategories();

		if (err) {
			error = err.message || '게시판 목록을 불러오는데 실패했습니다.';
			loading = false;
			return;
		}

		categories = data || [];
		loading = false;
	}

	/**
	 * 카테고리 클릭 핸들러
	 * @param {BoardCategory} category - 선택된 카테고리
	 * @returns {void}
	 */
	function handleCategoryClick(category) {
		goto(`/board/${category.slug}`);
	}
</script>

<svelte:head>
	<title>게시판 - Telepasi</title>
</svelte:head>

<div class="main-content-page bg-gray-50 flex flex-col">
	<main class="flex-1">
		<div class="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
			<div class="mb-6 sm:mb-8">
				<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">게시판</h1>
				<p class="text-sm sm:text-base text-gray-600">카테고리를 선택하여 게시판에 접속하세요.</p>
			</div>

	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<ErrorMessage message={error} onRetry={loadCategories} />
	{:else if categories.length === 0}
		<EmptyState
			title="게시판이 없습니다."
			message="관리자가 게시판을 생성하면 여기에 표시됩니다."
		/>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each categories as category (category.id)}
				<button
					onclick={() => handleCategoryClick(category)}
					class="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all text-left"
				>
					<h3 class="text-xl font-semibold text-gray-900 mb-2">
						{category.name}
					</h3>
					{#if category.description}
						<p class="text-gray-600 text-sm">
							{category.description}
						</p>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
		</div>
	</main>
</div>

