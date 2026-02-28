<script>
	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {Array<{label: string, align?: string}>} headers - 테이블 헤더 정보
	 * @property {number} rowCount - 행 개수 (empty 메시지 표시용)
	 * @property {string} emptyMessage - 데이터가 없을 때 표시할 메시지
	 * @property {import('svelte').Snippet} children - 자식 콘텐츠
	 */
	let { 
		headers = [],
		rowCount = 0,
		emptyMessage = '데이터가 없습니다.',
		children
	} = $props();
</script>

<div class="table-container">
	<table class="data-table-1">
		<thead>
			<tr>
				{#each headers as header}
					<th class:align-right={header.align === 'right'} class:align-center={header.align === 'center'} title="{header.description}">
						{header.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if rowCount === 0}
				<tr>
					<td colspan={headers.length} class="empty-message">{emptyMessage}</td>
				</tr>
			{:else}
				{@render children()}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		overflow-x: auto;
		margin-top: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		-webkit-overflow-scrolling: touch;
	}
	
	@media (max-width: 1024px) {
		.table-container {
			width: 100%;
			max-width: 100vw;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}
	}
</style>

