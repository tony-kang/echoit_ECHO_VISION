<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import PostDetail from '$lib/components/board/PostDetail.svelte';
	import PostForm from '$lib/components/board/PostForm.svelte';
	import { getPostById } from '$lib/postService';

	/**
	 * @typedef {Object} BoardCategory
	 * @property {string} id - 카테고리 ID
	 * @property {string} name - 카테고리 이름
	 * @property {string} slug - 카테고리 슬러그
	 */

	/**
	 * @typedef {Object} Post
	 * @property {string} id - 게시물 ID
	 * @property {string} title - 게시물 제목
	 * @property {string} content - 게시물 내용
	 * @property {string} category_id - 카테고리 ID
	 * @property {BoardCategory} category - 게시물이 속한 카테고리
	 */

	/** @type {string | undefined} 현재 카테고리 슬러그 */
	const categorySlug = $derived(page.params.slug);
	/** @type {string | undefined} 현재 게시물 ID */
	const postId = $derived(page.params.postId);

	/** @type {boolean} 수정 모드 여부 */
	let isEditMode = $state(false);
	/** @type {Post | null} 현재 게시물 */
	let post = $state(null);
	/** @type {BoardCategory | null} 게시물이 속한 카테고리 */
	let category = $state(null);

	/**
	 * 게시물 수정 모드로 전환하는 핸들러
	 * @param {Post} postData - 수정할 게시물 데이터
	 * @returns {void}
	 */
	function handleEdit(postData) {
		post = postData;
		category = postData.category;
		isEditMode = true;
	}

	/**
	 * 게시물 수정 취소 핸들러
	 * @returns {void}
	 */
	function handleCancel() {
		isEditMode = false;
		// PostDetail 컴포넌트가 자동으로 다시 로드함
	}

	/**
	 * 게시물 저장 완료 핸들러
	 * @param {Post} savedPost - 저장된 게시물 데이터
	 * @returns {void}
	 */
	function handlePostSaved(savedPost) {
		isEditMode = false;
		// PostDetail 컴포넌트가 자동으로 다시 로드함
		// postId가 변경되지 않았으므로 페이지 새로고침으로 강제 업데이트
		window.location.reload();
	}

	/**
	 * 게시물 삭제 후 카테고리 목록으로 이동하는 핸들러
	 * @returns {void}
	 */
	function handleDelete() {
		goto(`/board/${categorySlug}`);
	}
</script>

<svelte:head>
	<title>게시물 - Telepasi</title>
</svelte:head>

<div class="main-content-page bg-gray-50 flex flex-col">
	<main class="flex-1">
		<div class="max-w-7xl mx-auto px-4 py-8">
			{#if isEditMode && post && category}
				<PostForm
					categoryId={category.id}
					{category}
					{post}
					onSubmit={handlePostSaved}
					onCancel={handleCancel}
				/>
			{:else}
				<PostDetail
					{postId}
					categorySlug={categorySlug}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			{/if}
		</div>
	</main>
</div>


