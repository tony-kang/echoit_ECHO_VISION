<script>
	import { onMount } from 'svelte';
	import { getActionLogs, getLogStatistics, ACTION_CATEGORIES, ACTION_TYPES } from '$lib/logService';
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DataTable from './DataTable.svelte';
	import Pagination from './Pagination.svelte';

	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {Array} logs - 로그 목록
	 * @property {Object | null} stats - 로그 통계
	 * @property {boolean} loading - 로딩 상태
	 * @property {Object} filters - 필터 객체
	 * @property {number} [currentPage] - 현재 페이지 번호
	 * @property {number | null} [totalCount] - 전체 로그 개수
	 * @property {number} [pageSize] - 페이지당 항목 수
	 * @property {Function} [onPageChange] - 페이지 변경 핸들러
	 * @property {Function} [onApplyFilters] - 필터 적용 핸들러
	 * @property {Function} [onResetFilters] - 필터 초기화 핸들러
	 */
	let { 
		logs, 
		stats, 
		loading, 
		filters, 
		currentPage = 1,
		totalCount = null,
		pageSize = 10,
		onPageChange,
		onApplyFilters, 
		onResetFilters 
	} = $props();

	/**
	 * 필터 필드 정의
	 * @type {Array<{key: string, type: string, label?: string, placeholder?: string, options?: Array<{value: string, label: string}> | Record<string, string>}>}
	 */
	const filterFields = [
		{
			key: 'actionCategory',
			type: 'select',
			label: '전체 카테고리',
			options: [
				{ value: ACTION_CATEGORIES.AUTH, label: '인증' },
				{ value: ACTION_CATEGORIES.POST, label: '게시물' },
				{ value: ACTION_CATEGORIES.COMMENT, label: '댓글' },
				{ value: ACTION_CATEGORIES.USER, label: '사용자' },
				{ value: ACTION_CATEGORIES.ADMIN, label: '관리자' },
				{ value: ACTION_CATEGORIES.SYSTEM, label: '시스템' },
				{ value: ACTION_CATEGORIES.BOARD, label: '게시판' },
				{ value: ACTION_CATEGORIES.SCHEDULE, label: '일정' },
				{ value: ACTION_CATEGORIES.INQUIRY, label: '문의' }
			]
		},
		{
			key: 'result',
			type: 'select',
			label: '전체 결과',
			options: [
				{ value: 'success', label: '성공' },
				{ value: 'error', label: '에러' }
			]
		},
		{
			key: 'startDate',
			type: 'date'
		},
		{
			key: 'endDate',
			type: 'date'
		}
	];

	// 날짜 초기값 설정
	$effect(() => {
		if (!filters.startDate || !filters.endDate) {
			const today = new Date();
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(today.getDate() - 7);
			// ISO 형식으로 변환 (YYYY-MM-DD)
			filters.startDate = sevenDaysAgo.toISOString().split('T')[0];
			filters.endDate = today.toISOString().split('T')[0];
		}
	});

	/**
	 * 액션 타입 라벨 가져오기
	 * @param {string} actionType
	 * @returns {string}
	 */
	function getActionTypeLabel(actionType) {
		const labels = {
			[ACTION_TYPES.LOGIN]: '로그인',
			[ACTION_TYPES.LOGOUT]: '로그아웃',
			[ACTION_TYPES.SIGNUP]: '회원가입',
			[ACTION_TYPES.PASSWORD_RESET]: '패스워드 리셋',
			[ACTION_TYPES.POST_CREATE]: '게시물 작성',
			[ACTION_TYPES.POST_UPDATE]: '게시물 수정',
			[ACTION_TYPES.POST_DELETE]: '게시물 삭제',
			[ACTION_TYPES.POST_VIEW]: '게시물 조회',
			[ACTION_TYPES.COMMENT_CREATE]: '댓글 작성',
			[ACTION_TYPES.COMMENT_UPDATE]: '댓글 수정',
			[ACTION_TYPES.COMMENT_DELETE]: '댓글 삭제',
			[ACTION_TYPES.USER_ROLE_UPDATE]: '사용자 역할 변경',
			[ACTION_TYPES.USER_STATUS_TOGGLE]: '사용자 상태 변경',
			[ACTION_TYPES.USER_PASSWORD_RESET]: '사용자 패스워드 리셋',
			[ACTION_TYPES.ADMIN_ACCESS]: '관리자 접근',
			[ACTION_TYPES.INQUIRY_CREATE]: '문의 등록',
			[ACTION_TYPES.INQUIRY_UPDATE]: '문의 수정',
			[ACTION_TYPES.INQUIRY_DELETE]: '문의 삭제',
			[ACTION_TYPES.SCHEDULE_CREATE]: '일정 등록',
			[ACTION_TYPES.SCHEDULE_UPDATE]: '일정 수정',
			[ACTION_TYPES.SCHEDULE_DELETE]: '일정 삭제',
			[ACTION_TYPES.SCHEDULE_CATEGORY_CREATE]: '일정 카테고리 등록',
			[ACTION_TYPES.SCHEDULE_CATEGORY_UPDATE]: '일정 카테고리 수정',
			[ACTION_TYPES.SCHEDULE_CATEGORY_DELETE]: '일정 카테고리 삭제',
			[ACTION_TYPES.FILE_UPLOAD]: '파일 업로드',
			[ACTION_TYPES.FILE_DELETE]: '파일 삭제'
		};
		return labels[actionType] || actionType;
	}

	/**
	 * 카테고리 라벨 가져오기
	 * @param {string} category
	 * @returns {string}
	 */
	function getCategoryLabel(category) {
		const labels = {
			[ACTION_CATEGORIES.AUTH]: '인증',
			[ACTION_CATEGORIES.POST]: '게시물',
			[ACTION_CATEGORIES.COMMENT]: '댓글',
			[ACTION_CATEGORIES.USER]: '사용자',
			[ACTION_CATEGORIES.ADMIN]: '관리자',
			[ACTION_CATEGORIES.SYSTEM]: '시스템',
			[ACTION_CATEGORIES.BOARD]: '게시판',
			[ACTION_CATEGORIES.SCHEDULE]: '일정',
			[ACTION_CATEGORIES.INQUIRY]: '문의'
		};
		return labels[category] || category;
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
</script>

<div class="log-section">
	<!-- 통계 카드 -->
	{#if stats}
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">📊</div>
				<div class="stat-content">
					<p class="stat-label">전체 로그</p>
					<p class="stat-value">{stats.total || 0}</p>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">✅</div>
				<div class="stat-content">
					<p class="stat-label">성공</p>
					<p class="stat-value">{stats.byResult?.success || 0}</p>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">❌</div>
				<div class="stat-content">
					<p class="stat-label">에러</p>
					<p class="stat-value">{stats.byResult?.error || 0}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- 필터 -->
	<FilterBar
		bind:filters={filters}
		fields={filterFields}
		onApply={onApplyFilters}
		onReset={onResetFilters}
	/>

	<!-- 로그 테이블 -->
	{#if loading}
		<div class="loading-message">로딩 중...</div>
	{:else}
		<DataTable
			headers={[
				{ label: '시간' },
				{ label: '경과' },
				{ label: '이메일' },
				{ label: '이름' },
				{ label: '카테고리' },
				{ label: '액션' },
				{ label: '결과' },
				{ label: '상세 정보' }
			]}
			rowCount={logs?.length || 0}
			emptyMessage="로그가 없습니다."
		>
			{#if logs}
				{#each logs as log}
					<tr class:error-row={log.result === 'error'}>
						<td>{new Date(log.created_at).toLocaleString('ko-KR')}</td>
						<td class="time-relative">{formatDistanceToNow(log.created_at)}</td>
						<td>
							{#if log.user}
								{log.user.email || '-'}
							{:else}
								<span class="anonymous">-</span>
							{/if}
						</td>
						<td>
							{#if log.user}
								{log.user.full_name || '-'}
							{:else}
								<span class="anonymous">비로그인</span>
							{/if}
						</td>
						<td>
							<span class="badge badge-category">{getCategoryLabel(log.action_category)}</span>
						</td>
						<td>{getActionTypeLabel(log.action_type)}</td>
						<td>
							<span class="badge badge-{log.result === 'success' ? 'success' : 'danger'}">
								{log.result === 'success' ? '성공' : '에러'}
							</span>
						</td>
						<td>
							{#if log.error_message}
								<div class="error-details">
									<strong>에러:</strong> {log.error_message}
								</div>
							{/if}
							{#if log.action_details && Object.keys(log.action_details).length > 0}
								<details class="details-cell">
									<summary>상세 보기</summary>
									<pre>{JSON.stringify(log.action_details, null, 2)}</pre>
								</details>
							{/if}
						</td>
					</tr>
				{/each}
			{/if}
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
	.log-section {
		margin-top: 2rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.stat-card {
		background: white;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		display: flex;
		gap: 16px;
		align-items: center;
	}

	.stat-icon {
		font-size: 2.5em;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.9em;
		color: #666;
		margin-bottom: 8px;
		display: block;
	}

	.stat-value {
		font-size: 2em;
		font-weight: 700;
		color: #333;
		margin: 0;
	}


	:global(.data-table tbody tr.error-row) {
		background-color: #fff5f5;
	}

	.time-relative {
		font-size: 0.85em;
		color: #666;
	}

	.anonymous {
		color: #999;
		font-style: italic;
	}

	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 6px;
		font-size: 0.75em;
		font-weight: 500;
	}

	.badge-success {
		background-color: #d4edda;
		color: #155724;
	}

	.badge-danger {
		background-color: #f8d7da;
		color: #721c24;
	}

	.badge-category {
		background-color: #e7f3ff;
		color: #004085;
	}

	.error-details {
		color: #721c24;
		font-size: 0.9em;
		margin-bottom: 8px;
	}

	.details-cell {
		font-size: 0.85em;
	}

	.details-cell pre {
		margin-top: 8px;
		padding: 8px;
		background: #f5f5f5;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.85em;
	}

	.loading-message {
		text-align: center;
		padding: 40px 20px;
		color: #999;
		font-style: italic;
	}
</style>

