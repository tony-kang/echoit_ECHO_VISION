<script>
	// @ts-nocheck
	import {
		INQUIRY_TYPE_LABELS,
		INQUIRY_STATUS_LABELS,
		PRIORITY_LABELS
	} from '$lib/inquiryService';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DataTable from './DataTable.svelte';
	import Pagination from './Pagination.svelte';
	
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
	 * @param {Function} props.onApplyFilters
	 * @param {Function} props.onResetFilters
	 * @param {Function} props.onStatusChange
	 * @param {Function} props.onPriorityChange
	 * @param {Function} props.onOpenModal
	 * @param {Function} props.onCloseModal
	 * @param {Function} props.onSaveResponse
	 * @param {Function} [props.onPageChange] - 페이지 변경 핸들러
	 */
	let { 
		inquiries,
		inquiryFilters,
		selectedInquiry,
		adminResponse,
		currentPage = 1,
		totalCount = null,
		pageSize = 20,
		onApplyFilters,
		onResetFilters,
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
	<FilterBar
		bind:filters={inquiryFilters}
		fields={filterFields}
		onApply={onApplyFilters}
		onReset={onResetFilters}
	/>
	
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
		{#each inquiries as inquiry}
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
						{#each Object.entries(INQUIRY_STATUS_LABELS) as [value, label]}
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
						{#each Object.entries(PRIORITY_LABELS) as [value, label]}
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
{#if selectedInquiry}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={onCloseModal}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>💬 문의 응답</h2>
				<button onclick={onCloseModal} class="modal-close">×</button>
			</div>
			
			<div class="modal-body">
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
			</div>
			
			<div class="modal-footer">
				<button onclick={onCloseModal} class="btn btn-secondary">취소</button>
				<button onclick={() => onSaveResponse(selectedInquiry.id)} class="btn btn-primary">
					응답 저장
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.inquiry-section {
		margin-top: 20px;
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
	
	
	/* 모달 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 800px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}
	
	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.modal-header h2 {
		margin: 0;
		font-size: 1.5em;
		color: #333;
	}
	
	.modal-close {
		background: none;
		border: none;
		font-size: 2em;
		cursor: pointer;
		color: #999;
		line-height: 1;
		padding: 0;
		width: 32px;
		height: 32px;
	}
	
	.modal-close:hover {
		color: #333;
	}
	
	.modal-body {
		padding: 1rem;
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
	
	.modal-footer {
		padding: 16px 24px;
		border-top: 1px solid #e0e0e0;
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
	
	@media (max-width: 1024px) {
		
		.data-table {
			font-size: 0.85em;
		}
		
		.data-table th,
		.data-table td {
			padding: 10px 8px;
		}
		
		.status-select,
		.priority-select {
			min-width: 100px;
			font-size: 0.85em;
			padding: 4px 8px;
		}
	}
</style>
