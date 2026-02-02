<script>
	// @ts-nocheck
	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {Array<{label: string, align?: string}>} headers - 테이블 헤더 정보
	 * @property {number} rowCount - 행 개수 (empty 메시지 표시용)
	 * @property {string} emptyMessage - 데이터가 없을 때 표시할 메시지
	 */
	let { 
		headers = [],
		rowCount = 0,
		emptyMessage = '데이터가 없습니다.'
	} = $props();
</script>

<div class="table-container">
	<table class="data-table">
		<thead>
			<tr>
				{#each headers as header}
					<th class:align-right={header.align === 'right'} class:align-center={header.align === 'center'}>
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
				<slot />
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
	
	.data-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		min-width: fit-content;
	}
	
	.data-table thead {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}
	
	.data-table th {
		padding: 12px 10px;
		text-align: left;
		font-weight: 600;
		font-size: 0.85em;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: white;
		border-bottom: 2px solid rgba(255, 255, 255, 0.2);
	}
	
	.data-table th.align-right {
		text-align: right;
	}
	
	.data-table th.align-center {
		text-align: center;
	}
	
	.data-table th:first-child {
		padding-left: 16px;
	}
	
	.data-table th:last-child {
		padding-right: 16px;
	}
	
	:global(.data-table tbody tr) {
		border-bottom: 1px solid #e0e0e0;
		transition: background-color 0.2s;
	}
	
	:global(.data-table tbody tr:hover) {
		background-color: #f8f9ff;
	}
	
	:global(.data-table tbody tr:last-child) {
		border-bottom: none;
	}
	
	:global(.data-table td) {
		padding: 10px 10px;
		font-size: 0.9em;
		color: #333;
		vertical-align: middle;
	}
	
	:global(.data-table td:first-child) {
		padding-left: 16px;
	}
	
	:global(.data-table td:last-child) {
		padding-right: 16px;
	}
	
	.data-table .empty-message {
		text-align: center;
		padding: 40px 20px;
		color: #999;
		font-style: italic;
	}
	
	@media (max-width: 1024px) {
		.table-container {
			width: 100%;
			max-width: 100vw;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}
		
		.data-table {
			font-size: 0.8em;
			/* min-width: 600px;
			width: max-content; */
		}
		
		.data-table th {
			padding: 10px 8px;
			white-space: nowrap;
		}
		
		.data-table th:first-child {
			padding-left: 12px;
		}
		
		.data-table th:last-child {
			padding-right: 12px;
		}
		
		:global(.data-table td) {
			padding: 8px 6px;
			white-space: nowrap;
		}
		
		:global(.data-table td:first-child) {
			padding-left: 12px;
		}
		
		:global(.data-table td:last-child) {
			padding-right: 12px;
		}
	}
</style>

