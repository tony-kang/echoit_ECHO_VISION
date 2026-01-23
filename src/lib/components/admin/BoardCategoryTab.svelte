<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getAllCategories, createCategory, updateCategory, deleteCategory } from '$lib/boardCategoryService';
	import LoadingSpinner from '$lib/components/board/LoadingSpinner.svelte';
	import ErrorMessage from '$lib/components/board/ErrorMessage.svelte';
	import EmptyState from '$lib/components/board/EmptyState.svelte';
	import CategoryForm from './CategoryForm.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DataTable from './DataTable.svelte';
	import Pagination from './Pagination.svelte';

	let categories = $state([]);
	/** @type {number | null} 전체 카테고리 개수 */
	let totalCount = $state(null);
	/** @type {number} 현재 페이지 */
	let currentPage = $state(1);
	/** @type {number} 페이지당 항목 수 */
	const pageSize = 20;
	let loading = $state(true);
	let error = $state(null);
	let showForm = $state(false);
	let editingCategory = $state(null);

	onMount(() => {
		loadCategories();
	});

	/**
	 * 카테고리 목록 로드
	 */
	async function loadCategories() {
		loading = true;
		error = null;
		const { data, total, error: err } = await getAllCategories({
			page: currentPage,
			pageSize: pageSize
		});

		if (err) {
			error = err.message || '카테고리를 불러오는데 실패했습니다.';
			loading = false;
			return;
		}

		categories = data || [];
		totalCount = total;
		loading = false;
	}

	/**
	 * 총 페이지 수 계산
	 * @type {number}
	 */
	const totalPages = $derived.by(() => {
		if (totalCount === null || totalCount === 0) return 0;
		return Math.ceil(totalCount / pageSize);
	});

	/**
	 * 페이지 변경 핸들러
	 * @param {number} page - 변경할 페이지 번호
	 */
	async function handlePageChange(page) {
		if (page < 1 || page > totalPages) return;
		currentPage = page;
		await loadCategories();
	}

	/**
	 * 표시할 페이지 번호 목록 생성
	 * @type {number[]}
	 */
	const pageNumbers = $derived.by(() => {
		const pages = [];
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
	});

	async function handleCategoryCreated() {
		showForm = false;
		currentPage = 1; // 생성 후 첫 페이지로 이동
		await loadCategories();
	}

	async function handleCategoryUpdated() {
		editingCategory = null;
		showForm = false;
		await loadCategories();
	}

	async function handleCategoryDeleted(categoryId) {
		if (!confirm('정말 삭제하시겠습니까? 관련 게시물도 모두 삭제됩니다.')) return;

		const { error: err } = await deleteCategory(categoryId);
		if (err) {
			alert('삭제에 실패했습니다.');
			return;
		}

		// 삭제 후 현재 페이지에 항목이 없으면 이전 페이지로 이동
		if (categories.length === 1 && currentPage > 1) {
			currentPage = currentPage - 1;
		}
		await loadCategories();
	}

	function handleEdit(category) {
		editingCategory = category;
		showForm = true;
	}

	function handleGoToBoard(category) {
		if (!category.is_active) {
			alert('비활성화된 게시판입니다. 활성화 후 이용해주세요.');
			return;
		}
		goto(`/board/${category.slug}`);
	}

	/**
	 * 편집 스타일 라벨 반환
	 * @param {string} editorStyle - 편집 스타일
	 * @returns {string} 라벨
	 */
	function getEditorStyleLabel(editorStyle) {
		return editorStyle === 'html' ? 'HTML' : '텍스트';
	}

	/**
	 * 디자인 스타일 라벨 반환
	 * @param {string} designStyle - 디자인 스타일
	 * @returns {string} 라벨
	 */
	function getDesignStyleLabel(designStyle) {
		const labels = {
			'list': '목록형',
			'card': '카드형',
			'webzine': '웹진형',
			'timeline': '타임라인형',
			'feed': '피드형'
		};
		return labels[designStyle] || designStyle;
	}

	/**
	 * 카드 서브타입 라벨 반환
	 * @param {string} cardSubtype - 카드 서브타입
	 * @returns {string} 라벨
	 */
	function getCardSubtypeLabel(cardSubtype) {
		const labels = {
			'image-heavy': '이미지 강조형',
			'news': '뉴스/기사형',
			'commerce': '상품/커머스형',
			'profile': '프로필/인물형'
		};
		return labels[cardSubtype] || cardSubtype || '뉴스/기사형';
	}

	// 테이블 헤더 정보
	const tableHeaders = [
		{ label: '이름', align: 'left' },
		{ label: '슬러그', align: 'center' },
		{ label: '설명', align: 'left' },
		{ label: '편집 스타일', align: 'center' },
		{ label: '디자인 스타일', align: 'left' },
		{ label: '기능 활성화', align: 'left' },
		{ label: '상태', align: 'center' },
		{ label: '작업', align: 'right' }
	];

	/**
	 * 활성화된 기능 목록 반환
	 * @param {Object} options - 카테고리 옵션
	 * @returns {Array<{icon: string, title: string, bgColor: string, textColor: string}>} 활성화된 기능 목록
	 */
	function getActiveFeatures(options) {
		const baseClass = 'inline-flex items-center px-2 py-0.5 rounded text-xs';
		const features = [
			{
				key: 'enable_comments',
				icon: '💬',
				title: '댓글 활성화',
				bgColor: 'bg-green-100',
				textColor: 'text-green-800',
				isActive: (opts) => opts.enable_comments !== false
			},
			{
				key: 'enable_images',
				icon: '🖼️',
				title: '이미지 업로드 활성화',
				bgColor: 'bg-blue-100',
				textColor: 'text-blue-800',
				isActive: (opts) => opts.enable_images === true
			},
			{
				key: 'enable_files',
				icon: '📎',
				title: '파일 업로드 활성화',
				bgColor: 'bg-yellow-100',
				textColor: 'text-yellow-800',
				isActive: (opts) => opts.enable_files === true
			},
			{
				key: 'enable_reactions',
				icon: '❤️',
				title: '반응(좋아요/싫어요) 활성화',
				bgColor: 'bg-pink-100',
				textColor: 'text-pink-800',
				isActive: (opts) => opts.enable_reactions !== false
			},
			{
				key: 'enable_labels',
				icon: '🏷️',
				title: '라벨 기능 활성화',
				bgColor: 'bg-orange-100',
				textColor: 'text-orange-800',
				isActive: (opts) => opts.enable_labels === true
			}
		];

		return features
			.filter(feature => feature.isActive(options))
			.map(feature => ({
				...feature,
				baseClass
			}));
	}
</script>

<div class="board-category-tab">
	<!-- 필터 및 액션 -->
	<FilterBar
		actions={[
			{
				label: '카테고리 추가',
				onClick: () => { editingCategory = null; showForm = true; },
				variant: 'primary',
				icon: '+'
			}
		]}
	/>

	{#if showForm}
		<div class="mb-6">
			<CategoryForm
				category={editingCategory}
				onSubmit={handleCategoryCreated}
				onUpdate={handleCategoryUpdated}
				onCancel={() => { showForm = false; editingCategory = null; }}
			/>
		</div>
	{/if}

	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<ErrorMessage message={error} onRetry={loadCategories} />
	{:else if categories.length === 0}
		<EmptyState
			title="카테고리가 없습니다."
			message="새 카테고리를 추가해보세요."
		/>
	{:else}
		<DataTable
			headers={tableHeaders.map(h => ({ label: h.label, align: h.align === 'text-right' ? 'right' : h.align === 'text-center' ? 'center' : 'left' }))}
			rowCount={categories.length}
			emptyMessage="카테고리가 없습니다."
		>
			{#each categories as category (category.id)}
				{@const options = category.options || {}}
				{@const editorStyle = options.editor_style || 'text'}
				{@const designStyle = options.design_style || 'list'}
				{@const cardSubtype = options.card_subtype || 'news'}
				<tr>
					<td class="font-medium">{category.name}</td>
					<td class="text-center">{category.slug}</td>
					<td class="max-w-xs truncate">{category.description || '-'}</td>
					<td>
						<span class="badge {editorStyle === 'html' ? 'badge-purple' : 'badge-blue'}">
							{getEditorStyleLabel(editorStyle)}
						</span>
					</td>
					<td>
						<span class="badge badge-indigo">
							{getDesignStyleLabel(designStyle)}
						</span>
						{#if designStyle === 'card'}
							<span class="badge badge-indigo-light">
								{getCardSubtypeLabel(cardSubtype)}
							</span>
						{/if}
					</td>
					<td>
						<div class="feature-badges">
							{#each getActiveFeatures(options) as feature}
								<span class="feature-badge" title={feature.title}>
									{feature.icon}
								</span>
							{/each}
						</div>
					</td>
					<td class="text-center">
						<span class="badge {category.is_active ? 'badge-success' : 'badge-gray'}">
							{category.is_active ? '활성' : '비활성'}
						</span>
					</td>
					<td>
						<div class="action-buttons">
							<button
								onclick={() => handleGoToBoard(category)}
								class="btn-small btn-link"
								title="게시판으로 이동"
							>
								🔗 바로가기
							</button>
							<button
								onclick={() => handleEdit(category)}
								class="btn-small btn-secondary"
							>
								수정
							</button>
							<button
								onclick={() => handleCategoryDeleted(category.id)}
								class="btn-small btn-danger"
							>
								삭제
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</DataTable>
		
		<!-- Pagination -->
		<Pagination
			currentPage={currentPage}
			totalPages={totalPages}
			totalCount={totalCount || 0}
			pageSize={pageSize}
			onPageChange={handlePageChange}
		/>
	{/if}
</div>

<style>
	.board-category-tab {
		padding: 20px 0;
	}
	
	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 6px;
		font-size: 0.75em;
		font-weight: 500;
		margin-right: 4px;
	}
	
	.badge-purple {
		background-color: #e9d5ff;
		color: #6b21a8;
		border: 1px solid #d8b4fe;
	}
	
	.badge-blue {
		background-color: #dbeafe;
		color: #1e40af;
		border: 1px solid #bfdbfe;
	}
	
	.badge-indigo {
		background-color: #e0e7ff;
		color: #3730a3;
		border: 1px solid #c7d2fe;
	}
	
	.badge-indigo-light {
		background-color: #eef2ff;
		color: #4338ca;
		border: 1px solid #c7d2fe;
	}
	
	.badge-success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}
	
	.badge-gray {
		background-color: #e5e7eb;
		color: #374151;
		border: 1px solid #d1d5db;
	}
	
	.feature-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	
	.feature-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.85em;
	}
	
	.action-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 4px;
		flex-wrap: wrap;
	}
	
	.btn-small {
		padding: 4px 8px;
		font-size: 0.8em;
		border-radius: 4px;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
		white-space: nowrap;
	}
	
	.btn-small.btn-link {
		background: transparent;
		color: #28a745;
		text-decoration: none;
	}
	
	.btn-small.btn-link:hover {
		color: #218838;
		text-decoration: underline;
	}
	
	.btn-small.btn-secondary {
		background: #667eea;
		color: white;
	}
	
	.btn-small.btn-secondary:hover {
		background: #5568d3;
	}
	
	.btn-small.btn-danger {
		background: #dc3545;
		color: white;
	}
	
	.btn-small.btn-danger:hover {
		background: #c82333;
	}
</style>

