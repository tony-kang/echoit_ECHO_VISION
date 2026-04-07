<script>
	// @ts-nocheck
	import {
		INQUIRY_TYPE_LABELS,
		INQUIRY_STATUS_LABELS,
		PRIORITY_LABELS
	} from '$lib/inquiryService';
	import ContentFilter from '$lib/C/ContentFilter.svelte';
	import DataTable from './DataTable.svelte';
	import Pagination from './Pagination.svelte';
	import Modal from '$lib/C/Modal.svelte';
	
	/**
	 * @typedef {Object} Inquiry
	 * @property {string} id
	 * @property {keyof typeof INQUIRY_TYPE_LABELS} inquiry_type
	 * @property {string} name
	 * @property {string} email
	 * @property {string} [phone]
	 * @property {string} [company]
	 * @property {string} subject
	 * @property {string} message
	 * @property {string} status
	 * @property {string} priority
	 * @property {string} created_at
	 * @property {string} [admin_response]
	 */
	
	/**
	 * @param {string} inquiryType
	 * @returns {string}
	 */
	function getInquiryTypeLabel(inquiryType) {
		const type = inquiryType;
		return INQUIRY_TYPE_LABELS[type] || inquiryType;
	}
	
	/**
	 * @param {Object} props
	 * @param {Inquiry[]} props.inquiries
	 * @param {any} props.inquiryFilters
	 * @param {Inquiry | null} props.selectedInquiry
	 * @param {string} props.adminResponse
	 * @param {number} [props.currentPage] - 현재 페이지 번호
	 * @param {number | null} [props.totalCount] - 전체 문의 개수
	 * @param {number} [props.pageSize] - 페이지당 항목 수
	 * @param {Function} [props.onLoad] - 필터 적용/초기화 시 목록 재조회
	 * @param {Function} props.onStatusChange
	 * @param {Function} props.onPriorityChange
	 * @param {Function} props.onOpenModal
	 * @param {Function} props.onCloseModal
	 * @param {Function} props.onSaveResponse
	 * @param {Function} [props.onPageChange] - 페이지 변경 핸들러
	 * @param {{ total: number; byStatus: Record<string, number>; byType: Record<string, number>; byPriority: Record<string, number> } | null} [props.inquiryStats]
	 */
	let { 
		inquiries,
		inquiryFilters,
		selectedInquiry,
		adminResponse,
		currentPage = 1,
		totalCount = null,
		pageSize = 20,
		inquiryStats = null,
		onLoad,
		onStatusChange,
		onPriorityChange,
		onOpenModal,
		onCloseModal,
		onSaveResponse,
		onPageChange
	} = $props();
	
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
	function handlePageChange(page) {
		if (page < 1 || page > totalPages) return;
		if (onPageChange) {
			onPageChange(page);
		}
	}

	/**
	 * 필터 필드 정의
	 * @type {Array<{key: string, type: string, label?: string, placeholder?: string, options?: Array<{value: string, label: string}> | Record<string, string>}>}
	 */
	const filterFields = [
		{
			key: 'status',
			type: 'select',
			label: '전체 상태',
			options: Object.entries(INQUIRY_STATUS_LABELS).map(([value, label]) => ({ value, label }))
		},
		{
			key: 'inquiry_type',
			type: 'select',
			label: '전체 유형',
			options: Object.entries(INQUIRY_TYPE_LABELS).map(([value, label]) => ({ value, label }))
		},
		{
			key: 'priority',
			type: 'select',
			label: '전체 우선순위',
			options: Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))
		},
		{
			key: 'search',
			type: 'input',
			placeholder: '이름, 이메일, 회사명, 제목 검색...'
		}
	];
</script>

<div class="inquiry-section">
	<!-- 필터 -->
	<ContentFilter
		bind:filters={inquiryFilters}
		fields={filterFields}
		onLoad={onLoad}
	/>

	{#if inquiryStats}
		<div class="inquiry-stats-panel" aria-label="문의 통계">
			<p class="inquiry-stats-total">
				전체 <strong>{inquiryStats.total}</strong>건
			</p>
			<div class="inquiry-stats-groups" role="presentation">
				<div class="inquiry-stats-group">
					<span class="inquiry-stats-group-title">상태</span>
					<div class="inquiry-stats-chips">
						{#each Object.entries(inquiryStats.byStatus) as [key, count] (key)}
							<span class="inquiry-stats-chip">{INQUIRY_STATUS_LABELS[key] ?? key} <b>{count}</b></span>
						{/each}
					</div>
				</div>
				<div class="inquiry-stats-group">
					<span class="inquiry-stats-group-title">유형</span>
					<div class="inquiry-stats-chips">
						{#each Object.entries(inquiryStats.byType) as [key, count] (key)}
							<span class="inquiry-stats-chip">{INQUIRY_TYPE_LABELS[key] ?? key} <b>{count}</b></span>
						{/each}
					</div>
				</div>
				<div class="inquiry-stats-group">
					<span class="inquiry-stats-group-title">우선순위</span>
					<div class="inquiry-stats-chips">
						{#each Object.entries(inquiryStats.byPriority) as [key, count] (key)}
							<span class="inquiry-stats-chip">{PRIORITY_LABELS[key] ?? key} <b>{count}</b></span>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- 문의 테이블 -->
	<DataTable
		headers={[
			{ label: '문의일시' },
			{ label: '이름' },
			{ label: '이메일' },
			{ label: '회사' },
			{ label: '유형' },
			{ label: '제목' },
			{ label: '상태' },
			{ label: '우선순위' },
			{ label: '관리' }
		]}
		rowCount={inquiries.length}
		emptyMessage="문의가 없습니다."
	>
		{#each inquiries as inquiry, i (i)}
			<tr>
				<td>{new Date(inquiry.created_at).toLocaleString('ko-KR')}</td>
				<td>{inquiry.name}</td>
				<td>{inquiry.email}</td>
				<td>{inquiry.company || '-'}</td>
				<td>
					<span class="badge badge-type">{getInquiryTypeLabel(inquiry.inquiry_type)}</span>
				</td>
				<td class="subject-cell">{inquiry.subject}</td>
				<td>
					<select 
						value={inquiry.status}
						onchange={(e) => {
							const target = e.target;
							if (target) {
								onStatusChange(inquiry.id, target.value);
							}
						}}
						class="status-select status-{inquiry.status}"
					>
						{#each Object.entries(INQUIRY_STATUS_LABELS) as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</td>
				<td>
					<select 
						value={inquiry.priority}
						onchange={(e) => {
							const target = e.target;
							if (target) {
								onPriorityChange(inquiry.id, target.value);
							}
						}}
						class="priority-select priority-{inquiry.priority}"
					>
						{#each Object.entries(PRIORITY_LABELS) as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</td>
				<td>
					<button 
						onclick={() => onOpenModal(inquiry)}
						class="btn-small btn-primary"
					>
						{inquiry.admin_response ? '응답 보기' : '응답 하기'}
					</button>
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
</div>

<!-- 응답 모달 -->
<Modal
	show={!!selectedInquiry}
	title="💬 문의 응답"
	size="xlarge"
	onClose={onCloseModal}
	showFooter={true}
>
	<div class="inquiry-detail">
		<h3>문의 정보</h3>
		<div class="detail-grid">
			<div class="detail-item">
				<strong>이름:</strong> {selectedInquiry.name}
			</div>
			<div class="detail-item">
				<strong>이메일:</strong> {selectedInquiry.email}
			</div>
			<div class="detail-item">
				<strong>전화번호:</strong> {selectedInquiry.phone || '-'}
			</div>
			<div class="detail-item">
				<strong>회사명:</strong> {selectedInquiry.company || '-'}
			</div>
			<div class="detail-item">
				<strong>문의 유형:</strong> {getInquiryTypeLabel(selectedInquiry.inquiry_type)}
			</div>
			<div class="detail-item">
				<strong>문의일시:</strong> {new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}
			</div>
		</div>
		
		<div class="detail-section">
			<strong>제목:</strong>
			<p>{selectedInquiry.subject}</p>
		</div>
		
		<div class="detail-section">
			<strong>문의 내용:</strong>
			<p class="inquiry-message">{selectedInquiry.message}</p>
		</div>
	</div>
	
	<div class="response-section">
		<label for="admin-response">
			<strong>관리자 응답:</strong>
		</label>
		<textarea 
			id="admin-response"
			bind:value={adminResponse}
			placeholder="응답 내용을 입력하세요..."
			rows="6"
			class="response-textarea"
		></textarea>
	</div>

	{#snippet footer()}
		<button type="button" onclick={onCloseModal} class="btn-cancel btn-md">취소</button>
		<button
			type="button"
			onclick={() => selectedInquiry && onSaveResponse(selectedInquiry.id)}
			class="btn-save btn-md"
		>
			응답 저장
		</button>
	{/snippet}
</Modal>

<style>
	.inquiry-section {
		margin-top: 20px;
	}

	.inquiry-stats-panel {
		margin: 1rem 0 1.25rem;
		padding: 0.85rem 1.25rem;
		background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
		border: 1px solid #e0e7ff;
		border-radius: 12px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.5rem;
	}

	.inquiry-stats-total {
		margin: 0;
		flex: 0 0 auto;
		font-size: 1rem;
		color: #334155;
		padding-right: 1rem;
		border-right: 1px solid #c7d2fe;
		white-space: nowrap;
	}

	.inquiry-stats-total strong {
		font-size: 1.15em;
		color: #4338ca;
	}

	.inquiry-stats-groups {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		flex: 1;
		min-width: 0;
		gap: 0.5rem 0;
	}

	.inquiry-stats-group {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem 0.6rem;
		padding: 0 1rem;
		border-left: 1px solid #e2e8f0;
		min-width: 0;
	}

	.inquiry-stats-group:first-of-type {
		border-left: none;
		padding-left: 0;
	}

	.inquiry-stats-group-title {
		flex: 0 0 auto;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.inquiry-stats-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
		min-width: 0;
	}

	.inquiry-stats-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.6rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 999px;
		font-size: 0.8rem;
		color: #475569;
	}

	.inquiry-stats-chip b {
		color: #1e293b;
		font-weight: 700;
	}

	@media (max-width: 768px) {
		.inquiry-stats-panel {
			flex-direction: column;
			align-items: stretch;
		}

		.inquiry-stats-total {
			border-right: none;
			border-bottom: 1px solid #c7d2fe;
			padding-right: 0;
			padding-bottom: 0.65rem;
		}

		.inquiry-stats-groups {
			flex-direction: column;
			align-items: stretch;
			gap: 0.65rem 0;
		}

		.inquiry-stats-group {
			border-left: none;
			border-bottom: 1px solid #e2e8f0;
			padding-left: 0;
			padding-right: 0;
			padding-bottom: 0.65rem;
		}

		.inquiry-stats-group:last-of-type {
			border-bottom: none;
			padding-bottom: 0;
		}
	}
	
	
	:global(.subject-cell) {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 6px;
		font-size: 0.75em;
		font-weight: 500;
	}
	
	.badge-type {
		background: #e3f2fd;
		color: #1976d2;
	}
	
	.status-select,
	.priority-select {
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px solid #ddd;
		font-size: 0.9em;
		cursor: pointer;
		background: white;
		transition: all 0.2s;
		min-width: 120px;
	}
	
	.status-select:focus,
	.priority-select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
	
	.status-select.status-pending {
		background: #fff3e0;
		color: #e65100;
	}
	
	.status-select.status-in_progress {
		background: #e3f2fd;
		color: #1976d2;
	}
	
	.status-select.status-completed {
		background: #e8f5e9;
		color: #2e7d32;
	}
	
	.status-select.status-cancelled {
		background: #ffebee;
		color: #c62828;
	}
	
	.priority-select.priority-low {
		background: #f5f5f5;
		color: #666;
	}
	
	.priority-select.priority-normal {
		background: #e3f2fd;
		color: #1976d2;
	}
	
	.priority-select.priority-high {
		background: #fff3e0;
		color: #e65100;
	}
	
	.priority-select.priority-urgent {
		background: #ffebee;
		color: #c62828;
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
	
	.btn-small.btn-primary {
		background: #667eea;
		color: white;
	}
	
	.btn-small.btn-primary:hover {
		background: #5568d3;
	}
	.inquiry-detail {
		margin-bottom: 24px;
		padding-bottom: 24px;
		border-bottom: 1px solid #e0e0e0;
	}
	
	.inquiry-detail h3 {
		margin-top: 0;
		margin-bottom: 16px;
		color: #667eea;
	}
	
	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 12px;
		margin-bottom: 16px;
	}
	
	.detail-item {
		font-size: 0.95em;
	}
	
	.detail-item strong {
		color: #666;
		margin-right: 8px;
	}
	
	.detail-section {
		margin-top: 16px;
	}
	
	.detail-section strong {
		display: block;
		margin-bottom: 8px;
		color: #666;
	}
	
	.detail-section p {
		margin: 0;
		padding: 12px;
		background: #f5f7fa;
		border-radius: 6px;
	}
	
	.inquiry-message {
		white-space: pre-wrap;
		line-height: 1.6;
	}
	
	.response-section {
		margin-top: 20px;
	}
	
	.response-section label {
		display: block;
		margin-bottom: 8px;
		color: #333;
	}
	
	.response-textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.95em;
		font-family: inherit;
		resize: vertical;
	}
	
	.response-textarea:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
	
	@media (max-width: 768px) {
		
		.data-table {
			font-size: 0.85em;
		}
		
		.status-select,
		.priority-select {
			min-width: 100px;
			font-size: 0.85em;
			padding: 4px 8px;
		}
	}
</style>
