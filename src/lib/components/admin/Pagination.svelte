<script>
	// @ts-nocheck
	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {number} currentPage - 현재 페이지 번호
	 * @property {number} totalPages - 전체 페이지 수
	 * @property {number} totalCount - 전체 항목 개수
	 * @property {number} pageSize - 페이지당 항목 수
	 * @property {Function} onPageChange - 페이지 변경 핸들러
	 */
	let { 
		currentPage = 1,
		totalPages = 0,
		totalCount = 0,
		pageSize = 20,
		onPageChange
	} = $props();
	
	/**
	 * 표시할 페이지 번호 목록 생성
	 * @type {number[]}
	 */
	const pageNumbers = $derived.by(() => {
		const pages = [];
		const maxVisible = 5; // 최대 표시할 페이지 번호 개수
		
		if (totalPages <= maxVisible) {
			// 전체 페이지가 maxVisible 이하이면 모두 표시
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// 현재 페이지를 중심으로 페이지 번호 생성
			let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
			let end = Math.min(totalPages, start + maxVisible - 1);
			
			// 끝에서 시작하는 경우 조정
			if (end - start < maxVisible - 1) {
				start = Math.max(1, end - maxVisible + 1);
			}
			
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
		}
		
		return pages;
	});
	
	/**
	 * 페이지 변경 핸들러
	 * @param {number} page - 변경할 페이지 번호
	 */
	function handlePageChange(page) {
		if (page < 1 || page > totalPages) return;
		if (onPageChange) {
			onPageChange(page);
		}
	}
</script>

{#if totalCount > 0 && totalPages > 1}
	<div class="pagination-container">
		<div class="pagination-info">
			전체 {totalCount}개 중 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)}개 표시
		</div>
		<div class="pagination">
			<button 
				class="pagination-btn"
				class:disabled={currentPage === 1}
				onclick={() => handlePageChange(1)}
				disabled={currentPage === 1}
				aria-label="첫 페이지"
			>
				««
			</button>
			<button 
				class="pagination-btn"
				class:disabled={currentPage === 1}
				onclick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 1}
				aria-label="이전 페이지"
			>
				‹
			</button>
			
			{#each pageNumbers as pageNum}
				<button 
					class="pagination-btn"
					class:active={currentPage === pageNum}
					onclick={() => handlePageChange(pageNum)}
					aria-label="페이지 {pageNum}"
				>
					{pageNum}
				</button>
			{/each}
			
			<button 
				class="pagination-btn"
				class:disabled={currentPage === totalPages}
				onclick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				aria-label="다음 페이지"
			>
				›
			</button>
			<button 
				class="pagination-btn"
				class:disabled={currentPage === totalPages}
				onclick={() => handlePageChange(totalPages)}
				disabled={currentPage === totalPages}
				aria-label="마지막 페이지"
			>
				»»
			</button>
		</div>
	</div>
{/if}

<style>
	.pagination-container {
		margin-top: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 16px;
	}
	
	.pagination-info {
		font-size: 0.9em;
		color: #666;
	}
	
	.pagination {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	
	.pagination-btn {
		min-width: 32px;
		height: 28px;
		padding: 5px 10px;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: white;
		color: #333;
		font-size: 0.95em;
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

