<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { getAllCategories } from '$lib/boardCategoryService';
	import { getPostsByCategory, deletePost } from '$lib/postService';
	import { supabase } from '$lib/supabaseClient';
	import LoadingSpinner from '$lib/components/board/LoadingSpinner.svelte';
	import ErrorMessage from '$lib/components/board/ErrorMessage.svelte';

	let categories = $state([]);
	let categoryStats = $state({});
	let categoryPosts = $state({});
	/** @type {Record<string, number>} 카테고리별 전체 게시물 개수 */
	let categoryPostTotals = $state({});
	/** @type {Record<string, number>} 카테고리별 현재 페이지 */
	let categoryCurrentPages = $state({});
	/** @type {number} 페이지당 항목 수 */
	const pageSize = 20;
	let expandedCategories = $state({});
	let loading = $state(true);
	let error = $state(null);
	let selectedCategoryId = $state(null);

	onMount(() => {
		loadData();
	});

	/**
	 * 모든 데이터를 한 번에 로드하여 API 호출 최소화
	 */
	async function loadData() {
		loading = true;
		error = null;

		try {
			// 1. 모든 카테고리 가져오기
			const { data: cats, error: catsError } = await getAllCategories();
			if (catsError) throw catsError;

			categories = cats || [];

			if (categories.length === 0) {
				loading = false;
				return;
			}

			const categoryIds = categories.map(c => c.id);

			// 2. 모든 게시물을 한 번에 가져오기 (통계 및 최근 게시물용)
			// author 정보도 함께 가져와서 최근 게시물 조회를 생략
			const { data: allPosts, error: postsError } = await supabase
				.from('posts')
				.select(`
					id,
					category_id,
					created_at,
					title,
					view_count,
					author:profiles!author_id(id, full_name)
				`)
				.in('category_id', categoryIds)
				.order('created_at', { ascending: false });

			if (postsError) throw postsError;

			// 3. 모든 댓글을 한 번에 가져오기
			const postIds = (allPosts || []).map(p => p.id);
			let allComments = [];
			if (postIds.length > 0) {
				const { data: comments, error: commentsError } = await supabase
					.from('comments')
					.select('post_id')
					.in('post_id', postIds);
				
				if (commentsError) {
					console.warn('댓글 조회 실패:', commentsError);
				} else {
					allComments = comments || [];
				}
			}

			// 4. 클라이언트에서 카테고리별 통계 계산
			const statsMap = {};
			const postMap = new Map((allPosts || []).map(p => [p.id, p]));
			/** @type {Map<string, number>} */
			const commentMap = new Map();
			
			// 댓글 수 집계
			(allComments || []).forEach(comment => {
				const post = postMap.get(comment.post_id);
				if (post) {
					const categoryId = post.category_id;
					commentMap.set(categoryId, (commentMap.get(categoryId) || 0) + 1);
				}
			});

			// 카테고리별 통계 계산
			categories.forEach(category => {
				const categoryPosts = (allPosts || []).filter(p => p.category_id === category.id);
				// 각 카테고리당 최근 10개 게시물
				const categoryRecentPosts = categoryPosts
					.slice(0, 10)
					.map(p => ({
						id: p.id,
						title: p.title,
						created_at: p.created_at,
						view_count: p.view_count,
						author: p.author
					}));

				statsMap[category.id] = {
					postCount: categoryPosts.length,
					commentCount: commentMap.get(category.id) || 0,
					recentPosts: categoryRecentPosts
				};
			});

			categoryStats = statsMap;
			loading = false;
		} catch (err) {
			error = err.message || '데이터를 불러오는데 실패했습니다.';
			loading = false;
		}
	}

	/**
	 * 단일 카테고리 통계 조회 (삭제 후 새로고침용)
	 * @param {string} categoryId
	 * @returns {Promise<any>}
	 */
	async function getCategoryStatistics(categoryId) {
		// 게시물 수
		const { count: postCount } = await supabase
			.from('posts')
			.select('*', { count: 'exact', head: true })
			.eq('category_id', categoryId);

		// 해당 카테고리의 게시물 ID 목록 가져오기
		const { data: posts } = await supabase
			.from('posts')
			.select('id')
			.eq('category_id', categoryId);

		const postIds = posts?.map(p => p.id) || [];

		// 댓글 수
		let commentCount = 0;
		if (postIds.length > 0) {
			const { count } = await supabase
				.from('comments')
				.select('*', { count: 'exact', head: true })
				.in('post_id', postIds);
			commentCount = count || 0;
		}

		// 최근 게시물 (최대 10개)
		const { data: recentPosts } = await supabase
			.from('posts')
			.select(`
				id,
				title,
				created_at,
				view_count,
				author:profiles!author_id(id, full_name)
			`)
			.eq('category_id', categoryId)
			.order('created_at', { ascending: false })
			.limit(10);

		return {
			postCount: postCount || 0,
			commentCount: commentCount,
			recentPosts: recentPosts || []
		};
	}

	/**
	 * 카테고리 토글 및 게시물 목록 로드
	 * @param {string} categoryId
	 */
	async function toggleCategory(categoryId) {
		if (expandedCategories[categoryId]) {
			expandedCategories[categoryId] = false;
			delete categoryPosts[categoryId];
			delete categoryPostTotals[categoryId];
			delete categoryCurrentPages[categoryId];
		} else {
			expandedCategories[categoryId] = true;
			selectedCategoryId = categoryId;
			categoryCurrentPages[categoryId] = 1;
			
			await loadCategoryPosts(categoryId, 1);
		}
	}

	/**
	 * 카테고리별 게시물 목록 로드
	 * @param {string} categoryId
	 * @param {number} page
	 */
	async function loadCategoryPosts(categoryId, page) {
		const { data, total, error: err } = await getPostsByCategory(categoryId, {
			page: page,
			limit: pageSize,
			sortBy: 'created_at'
		});

		if (err) {
			alert('게시물을 불러오는데 실패했습니다.');
			return;
		}

		categoryPosts[categoryId] = data || [];
		categoryPostTotals[categoryId] = total || 0;
		categoryCurrentPages[categoryId] = page;
	}

	/**
	 * 카테고리별 페이지 변경 핸들러
	 * @param {string} categoryId
	 * @param {number} page
	 */
	async function handleCategoryPageChange(categoryId, page) {
		await loadCategoryPosts(categoryId, page);
	}

	/**
	 * 카테고리별 총 페이지 수 계산
	 * @param {string} categoryId
	 * @returns {number}
	 */
	function getCategoryTotalPages(categoryId) {
		const total = categoryPostTotals[categoryId] || 0;
		if (total === 0) return 0;
		return Math.ceil(total / pageSize);
	}

	/**
	 * 카테고리별 페이지 번호 목록 생성
	 * @param {string} categoryId
	 * @returns {number[]}
	 */
	function getCategoryPageNumbers(categoryId) {
		const pages = [];
		const totalPages = getCategoryTotalPages(categoryId);
		const currentPage = categoryCurrentPages[categoryId] || 1;
		const maxVisible = 5;
		
		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
			let end = Math.min(totalPages, start + maxVisible - 1);
			
			if (end - start < maxVisible - 1) {
				start = Math.max(1, end - maxVisible + 1);
			}
			
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
		}
		
		return pages;
	}

	async function handleDeletePost(postId, categoryId) {
		if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) return;

		const { error: err } = await deletePost(postId);
		if (err) {
			alert('삭제에 실패했습니다.');
			return;
		}

		// 통계 및 게시물 목록 새로고침
		categoryStats[categoryId] = await getCategoryStatistics(categoryId);
		const currentPage = categoryCurrentPages[categoryId] || 1;
		// 삭제 후 현재 페이지에 항목이 없으면 이전 페이지로 이동
		if (categoryPosts[categoryId]?.length === 1 && currentPage > 1) {
			await loadCategoryPosts(categoryId, currentPage - 1);
		} else {
			await loadCategoryPosts(categoryId, currentPage);
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="board-management-tab">
	<div class="mb-6">
		<div class="flex items-center justify-between">

		</div>
	</div>

	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<ErrorMessage message={error} onRetry={loadData} />
	{:else if categories.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
			<p class="text-gray-500">게시판이 없습니다.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each categories as category (category.id)}
				<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
					<!-- 카테고리 헤더 -->
					<button
						onclick={() => toggleCategory(category.id)}
						class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
					>
						<div class="flex items-center gap-4 flex-1">
							<div class="flex-1 text-left">
								<h3 class="text-lg font-semibold text-gray-900">{category.name}</h3>
								<p class="text-sm text-gray-500 mt-1">{category.description || '설명 없음'}</p>
							</div>
							<div class="flex items-center gap-6 text-sm">
								<div class="text-center">
									<div class="text-2xl font-bold text-blue-600">{categoryStats[category.id]?.postCount || 0}</div>
									<div class="text-gray-500">게시물</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-green-600">{categoryStats[category.id]?.commentCount || 0}</div>
									<div class="text-gray-500">댓글</div>
								</div>
								<div class="text-center">
									<span class="px-2 py-1 text-xs rounded-full {category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
										{category.is_active ? '활성' : '비활성'}
									</span>
								</div>
							</div>
						</div>
						<svg
							class="w-5 h-5 text-gray-400 transition-transform {expandedCategories[category.id] ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					<!-- 게시물 목록 -->
					{#if expandedCategories[category.id]}
						<div class="border-t border-gray-200">
							<div class="p-4 bg-gray-50">
								<h4 class="text-sm font-semibold text-gray-700 mb-3">최근 게시물</h4>
								{#if categoryStats[category.id]?.recentPosts?.length > 0}
									<div class="space-y-2">
										{#each categoryStats[category.id].recentPosts as post (post.id)}
											<div class="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
												<div class="flex-1 min-w-0">
													<div class="text-sm font-medium text-gray-900 truncate">{post.title}</div>
													<div class="text-xs text-gray-500 mt-1">
														{post.author?.full_name || '알 수 없음'} · {formatDate(post.created_at)} · 조회 {post.view_count || 0}
													</div>
												</div>
												<button
													onclick={() => handleDeletePost(post.id, category.id)}
													class="ml-4 text-red-600 hover:text-red-800 text-sm"
												>
													삭제
												</button>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-gray-500">게시물이 없습니다.</p>
								{/if}
							</div>

							<!-- 전체 게시물 목록 -->
							{#if categoryPosts[category.id]?.length > 0}
								<div class="p-4 border-t border-gray-200">
									<h4 class="text-sm font-semibold text-gray-700 mb-3">
										전체 게시물 ({categoryPostTotals[category.id] || 0}개)
									</h4>
									<div class="space-y-2 max-h-96 overflow-y-auto">
										{#each categoryPosts[category.id] as post (post.id)}
											<div class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
												<div class="flex-1 min-w-0">
													<div class="text-sm font-medium text-gray-900 truncate">{post.title}</div>
													<div class="text-xs text-gray-500 mt-1">
														{post.author?.full_name || '알 수 없음'} · {formatDate(post.created_at)} · 조회 {post.view_count || 0}
													</div>
												</div>
												<button
													onclick={() => handleDeletePost(post.id, category.id)}
													class="ml-4 text-red-600 hover:text-red-800 text-sm"
												>
													삭제
												</button>
											</div>
										{/each}
									</div>
									
									<!-- Pagination -->
									{#if getCategoryTotalPages(category.id) > 1}
										{@const totalPages = getCategoryTotalPages(category.id)}
										{@const currentPage = categoryCurrentPages[category.id] || 1}
										{@const pageNumbers = getCategoryPageNumbers(category.id)}
										<div class="pagination-container">
											<div class="pagination-info">
												전체 {categoryPostTotals[category.id] || 0}개 중 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, categoryPostTotals[category.id] || 0)}개 표시
											</div>
											<div class="pagination">
												<button 
													class="pagination-btn"
													class:disabled={currentPage === 1}
													onclick={() => handleCategoryPageChange(category.id, 1)}
													disabled={currentPage === 1}
													aria-label="첫 페이지"
												>
													««
												</button>
												<button 
													class="pagination-btn"
													class:disabled={currentPage === 1}
													onclick={() => handleCategoryPageChange(category.id, currentPage - 1)}
													disabled={currentPage === 1}
													aria-label="이전 페이지"
												>
													‹
												</button>
												
												{#each pageNumbers as pageNum}
													<button 
														class="pagination-btn"
														class:active={currentPage === pageNum}
														onclick={() => handleCategoryPageChange(category.id, pageNum)}
														aria-label="페이지 {pageNum}"
													>
														{pageNum}
													</button>
												{/each}
												
												<button 
													class="pagination-btn"
													class:disabled={currentPage === totalPages}
													onclick={() => handleCategoryPageChange(category.id, currentPage + 1)}
													disabled={currentPage === totalPages}
													aria-label="다음 페이지"
												>
													›
												</button>
												<button 
													class="pagination-btn"
													class:disabled={currentPage === totalPages}
													onclick={() => handleCategoryPageChange(category.id, totalPages)}
													disabled={currentPage === totalPages}
													aria-label="마지막 페이지"
												>
													»»
												</button>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.board-management-tab {
		padding: 20px 0;
	}

	.pagination-container {
		margin-top: 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 16px;
		padding: 16px;
		background: white;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.pagination-info {
		font-size: 0.875em;
		color: #666;
	}

	.pagination {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.pagination-btn {
		min-width: 36px;
		height: 36px;
		padding: 6px 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: white;
		color: #333;
		font-size: 0.875em;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pagination-btn:hover:not(:disabled) {
		background: #f8f9ff;
		border-color: #667eea;
		color: #667eea;
	}

	.pagination-btn.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-color: #667eea;
	}

	.pagination-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: #f3f4f6;
	}

	.pagination-btn:disabled:hover {
		background: #f3f4f6;
		border-color: #ddd;
		color: #333;
	}
</style>

