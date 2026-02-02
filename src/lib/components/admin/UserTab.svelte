<script>
	// @ts-nocheck
	import {
		USER_ROLE_LABELS,
		USER_ROLES
	} from '$lib/userService';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DataTable from './DataTable.svelte';
	import Pagination from './Pagination.svelte';
	
	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {Array} users - 사용자 목록
	 * @property {Object | null} userStats - 사용자 통계
	 * @property {Object} userFilters - 사용자 필터
	 * @property {string | null} currentUserId - 현재 사용자 ID
	 * @property {number} [currentPage] - 현재 페이지 번호
	 * @property {number | null} [totalCount] - 전체 사용자 개수
	 * @property {number} [pageSize] - 페이지당 항목 수
	 * @property {Function} onApplyFilters - 필터 적용 핸들러
	 * @property {Function} onResetFilters - 필터 초기화 핸들러
	 * @property {Function} onRoleChange - 역할 변경 핸들러
	 * @property {Function} onToggleStatus - 상태 변경 핸들러
	 * @property {Function} onResetPassword - 패스워드 리셋 핸들러
	 * @property {Function} [onPageChange] - 페이지 변경 핸들러
	 */
	let { 
		users,
		userStats,
		userFilters,
		currentUserId,
		currentPage = 1,
		totalCount = null,
		pageSize = 20,
		onApplyFilters,
		onResetFilters,
		onRoleChange,
		onToggleStatus,
		onResetPassword,
		onPageChange
	} = $props();
	
	/**
	 * 역할 변경 함수
	 * @param {string} userId
	 * @param {string} newRole
	 */
	function changeRole(userId, newRole) {
		onRoleChange(userId, newRole);
	}

	/**
	 * 필터 필드 정의
	 * @type {Array<{key: string, type: string, label?: string, placeholder?: string, options?: Array<{value: string, label: string}> | Record<string, string>}>}
	 */
	const filterFields = [
		{
			key: 'role',
			type: 'select',
			label: '전체 역할',
			options: Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({ value, label }))
		},
		{
			key: 'status',
			type: 'select',
			label: '전체 상태',
			options: [
				{ value: 'active', label: '활성' },
				{ value: 'banned', label: '비활성' }
			]
		},
		{
			key: 'search',
			type: 'input',
			placeholder: '이메일, 이름 검색...'
		}
	];
	
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

<div class="user-section">
	<!-- 사용자 통계 -->
	{#if userStats}
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">👥</div>
				<div class="stat-content">
					<p class="stat-label">전체 사용자</p>
					<p class="stat-value">{userStats.total}</p>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">🔐</div>
				<div class="stat-content">
					<p class="stat-label">관리자</p>
					<p class="stat-value">{userStats.admins}</p>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">✅</div>
				<div class="stat-content">
					<p class="stat-label">활성 사용자</p>
					<p class="stat-value">{userStats.activeUsers}</p>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">⛔</div>
				<div class="stat-content">
					<p class="stat-label">비활성 사용자</p>
					<p class="stat-value">{userStats.bannedUsers}</p>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- 필터 -->
	<FilterBar
		bind:filters={userFilters}
		fields={filterFields}
		onApply={onApplyFilters}
		onReset={onResetFilters}
	/>
	
	<!-- 사용자 테이블 -->
	<DataTable
		headers={[
			{ label: '이메일' },
			{ label: '이름' },
			{ label: '역할' },
			{ label: '가입일' },
			{ label: '마지막 로그인' },
			{ label: '상태' },
			{ label: '관리' },
			{ label: '패스워드' }
		]}
		rowCount={users.length}
		emptyMessage="사용자가 없습니다."
	>
		{#each users as usr}
			<tr class:banned={usr.banned}>
				<td>{usr.email || '-'}</td>
				<td>{usr.full_name || '-'}</td>
				<td>
					<select 
						class="role-select"
						value={usr.role || USER_ROLES.USER}
						onchange={(e) => {
							const target = e.target;
							if (target) {
								changeRole(usr.id, target.value);
							}
						}}
						disabled={usr.id === currentUserId || usr.role === USER_ROLES.MASTER}
					>
						{#each Object.entries(USER_ROLE_LABELS) as [value, label]}
							{#if value !== USER_ROLES.MASTER}
								<option value={value}>{label}</option>
							{:else if usr.role === USER_ROLES.MASTER}
								<option value={value} disabled>{label}</option>
							{/if}
						{/each}
					</select>
				</td>
				<td>{usr.created_at ? new Date(usr.created_at).toLocaleDateString('ko-KR') : '-'}</td>
				<td>{usr.last_sign_in_at ? new Date(usr.last_sign_in_at).toLocaleDateString('ko-KR') : '-'}</td>
				<td>
					<span class="badge badge-{usr.banned ? 'danger' : 'success'}">
						{usr.banned ? '비활성' : '활성'}
					</span>
				</td>
				<td>
					<button 
						onclick={() => onToggleStatus(usr.id, usr.banned)}
						class="btn-small {usr.banned ? 'btn-success' : 'btn-danger'}"
						disabled={usr.id === currentUserId}
					>
						{usr.banned ? '활성화' : '비활성화'}
					</button>
				</td>
				<td>
					<button 
						onclick={() => onResetPassword(usr.id)}
						class="btn-small btn-warning"
						disabled={usr.id === currentUserId}
					>
						비밀번호 리셋
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

<style>
	.user-section {
		margin-top: 2rem;
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
	
	:global(tr.banned) {
		background-color: #fff5f5;
		opacity: 0.7;
	}
	
	:global(.role-select) {
		padding: 4px 8px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.85em;
		background: white;
		color: #333;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 100px;
	}
	
	:global(.role-select:hover:not(:disabled)) {
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
	
	:global(.role-select:focus:not(:disabled)) {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
	}
	
	:global(.role-select:disabled) {
		opacity: 0.6;
		cursor: not-allowed;
		background-color: #f5f5f5;
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
		border: 1px solid #c3e6cb;
	}
	
	.badge-danger {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
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
	
	.btn-small.btn-danger {
		background: #dc3545;
		color: white;
	}
	
	.btn-small.btn-danger:hover:not(:disabled) {
		background: #c82333;
	}
	
	.btn-small.btn-success {
		background: #28a745;
		color: white;
	}
	
	.btn-small.btn-success:hover:not(:disabled) {
		background: #218838;
	}
	
	.btn-small.btn-warning {
		background: #ffc107;
		color: #212529;
	}
	
	.btn-small.btn-warning:hover:not(:disabled) {
		background: #e0a800;
	}
	
	.btn-small:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	@media (max-width: 1024px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
		
		:global(.role-select) {
			min-width: 80px;
			font-size: 0.8em;
			padding: 3px 6px;
		}
	}
</style>
