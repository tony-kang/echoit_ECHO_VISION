<script>
	/**
	 * 부서 소속 조직·담당자 수정 모달 Props
	 * @type {{ open: boolean, department: { id: string, code: string, title: string } | null, organizationList: Array<{ code: string, title: string }>, selectedOrgCodes: Set<string>, onToggle: (code: string, checked: boolean) => void, departmentUsers: Array<{ id?: string, user_id: string, can_edit_business_plan: boolean, can_edit_expected_sales: boolean, can_edit_plan_cost: boolean, can_edit_expected_cost: boolean, email?: string | null, full_name?: string | null }>, userList: Array<{ id: string, email?: string, full_name?: string }>, onAddUser: (userId: string) => void, onRemoveUser: (entry: { user_id: string }) => void, onUpdateUserPermission: (entry: { user_id: string }, payload: { can_edit_business_plan?: boolean, can_edit_expected_sales?: boolean, can_edit_plan_cost?: boolean, can_edit_expected_cost?: boolean }) => void, onClose: () => void, onSave: () => void, isSaving: boolean }}
	 */
	let {
		open = false,
		department = null,
		organizationList = [],
		selectedOrgCodes = new Set(),
		onToggle,
		departmentUsers = [],
		userList = [],
		onAddUser,
		onRemoveUser,
		onUpdateUserPermission,
		onClose,
		onSave,
		isSaving = false
	} = $props();

	/** @type {string} organization 목록 검색어 */
	let searchQuery = $state('');
	/** @type {string} 담당자 추가 선택 값 (user_id) */
	let addUserSelect = $state('');

	/** 선택된 항목 목록 (코드 기준 organizationList에서 추출) */
	const selectedOrgs = $derived.by(() =>
		organizationList.filter((org) => selectedOrgCodes.has(org.code))
	);

	/** 검색어에 맞는 organization 목록 */
	const filteredOrganizationList = $derived.by(() => {
		const q = (searchQuery || '').trim().toLowerCase();
		if (!q) return organizationList;
		return organizationList.filter(
			(org) =>
				(org.code && org.code.toLowerCase().includes(q)) ||
				(org.title && org.title.toLowerCase().includes(q))
		);
	});

	/** 담당자로 추가 가능한 사용자 (이미 담당자인 user_id 제외) */
	const addableUsers = $derived.by(() => {
		const ids = new Set(departmentUsers.map((d) => d.user_id));
		return userList.filter((u) => !ids.has(u.id));
	});

	/** 모달이 열릴 때 검색어·담당자 추가 선택 초기화 */
	$effect(() => {
		if (open && department) {
			searchQuery = '';
			addUserSelect = '';
		}
	});

	/**
	 * 담당자 추가 버튼 클릭 시 선택된 사용자 추가
	 */
	function handleAddUser() {
		const uid = (addUserSelect || '').trim();
		if (!uid) return;
		onAddUser?.(uid);
		addUserSelect = '';
	}

	/**
	 * 담당자 표시명 (이름 또는 이메일)
	 * @param {{ full_name?: string | null, email?: string | null }} u
	 * @returns {string}
	 */
	function userDisplayName(u) {
		const name = (u.full_name || '').trim();
		const email = (u.email || '').trim();
		return name || email || '-';
	}
</script>

{#if open && department}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="department-edit-modal-overlay"
		onclick={() => !isSaving && onClose?.()}
		role="presentation"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="department-edit-modal-content"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-label="부서 소속 조직 수정"
			tabindex="-1"
		>
			<div class="department-edit-modal-header">
				<h2 class="text-lg font-bold text-gray-800">
					소속 조직 수정: {department.title} ({department.code})
				</h2>
				<button
					type="button"
					onclick={onClose}
					class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
					aria-label="닫기"
				>
					×
				</button>
			</div>
			<div class="department-edit-modal-body">
				<p class="text-sm text-gray-500 mb-3">아래는 회계상의 부서 목록입니다.</p>

				<!-- 선택된 항목 (검색창 위) -->
				<div class="mb-3">
					<p class="text-xs font-medium text-gray-500 mb-1.5">선택된 항목 ({selectedOrgs.length}개)</p>
					<div class="selected-orgs-chips">
						{#if selectedOrgs.length === 0}
							<span class="text-sm text-gray-400">선택된 항목이 없습니다.</span>
						{:else}
							{#each selectedOrgs as org}
								<button
									type="button"
									onclick={() => onToggle?.(org.code, false)}
									class="selected-chip"
									title="클릭 시 선택 해제"
								>
									<span class="font-mono text-xs">{org.code}</span>
									<span class="text-gray-700 truncate max-w-[120px]">{org.title}</span>
									<span class="selected-chip-x" aria-hidden="true">×</span>
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<!-- 검색 -->
				<div class="mb-3">
					<label for="dept-edit-org-search" class="sr-only">조직 검색</label>
					<input
						id="dept-edit-org-search"
						type="search"
						bind:value={searchQuery}
						placeholder="코드 또는 부서명으로 검색..."
						class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
					/>
				</div>

				<!-- 2열 그리드 목록 -->
				<div class="org-list-label text-xs font-medium text-gray-500 mb-1.5">회계상 부서 선택</div>
				<div class="org-list-grid">
					{#each filteredOrganizationList as org}
						<label class="org-list-item">
							<input
								type="checkbox"
								checked={selectedOrgCodes.has(org.code)}
								onchange={(e) => onToggle?.(org.code, e.currentTarget.checked)}
								class="rounded border-gray-300"
							/>
							<!-- <span class="text-sm font-mono">{org.code}</span> -->
							<span class="text-sm text-gray-700 truncate" title={org.title}>{org.title}</span>
						</label>
					{/each}
				</div>
				{#if organizationList.length === 0}
					<p class="text-sm text-gray-500">등록된 organization 항목이 없습니다.</p>
				{:else if filteredOrganizationList.length === 0}
					<p class="text-sm text-gray-500">검색 결과가 없습니다.</p>
				{/if}

				<!-- 담당자 (2명 이상 연결, 권한 설정) -->
				<div class="department-users-section">
					<p class="text-sm font-medium text-gray-700 mb-2">담당자 (부서 정보 관리 가능 사용자)</p>
					<div class="department-users-list">
						{#each departmentUsers as du (du.user_id)}
							<div class="department-user-row">
								<span class="department-user-name" title={du.email || ''}>{userDisplayName(du)}</span>
								<label class="department-user-perm">
									<input
										type="checkbox"
										checked={du.can_edit_business_plan}
										onchange={(e) => onUpdateUserPermission?.(du, { can_edit_business_plan: e.currentTarget.checked })}
									/>
									<span>경영 계획 수정권한</span>
								</label>
								<label class="department-user-perm">
									<input
										type="checkbox"
										checked={du.can_edit_expected_sales}
										onchange={(e) => onUpdateUserPermission?.(du, { can_edit_expected_sales: e.currentTarget.checked })}
									/>
									<span>예상 매출 수정권한</span>
								</label>
								<label class="department-user-perm">
									<input
										type="checkbox"
										checked={du.can_edit_plan_cost}
										onchange={(e) => onUpdateUserPermission?.(du, { can_edit_plan_cost: e.currentTarget.checked })}
									/>
									<span>계획 비용 수정권한</span>
								</label>
								<label class="department-user-perm">
									<input
										type="checkbox"
										checked={du.can_edit_expected_cost}
										onchange={(e) => onUpdateUserPermission?.(du, { can_edit_expected_cost: e.currentTarget.checked })}
									/>
									<span>예상 비용 수정권한</span>
								</label>
								<button
									type="button"
									onclick={() => onRemoveUser?.(du)}
									class="department-user-remove"
									title="연결 해제"
								>
									삭제
								</button>
							</div>
						{/each}
					</div>
					<div class="department-user-add">
						<label for="dept-add-user" class="sr-only">담당자 추가 선택</label>
						<select
							id="dept-add-user"
							bind:value={addUserSelect}
							class="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[200px]"
						>
							<option value="">사용자 선택</option>
							{#each addableUsers as u}
								<option value={u.id}>{userDisplayName(u)} ({u.email || u.id})</option>
							{/each}
						</select>
						<button
							type="button"
							onclick={handleAddUser}
							disabled={!addUserSelect || isSaving}
							class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
						>
							담당자 추가
						</button>
					</div>
				</div>
			</div>
			<div class="department-edit-modal-footer">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
				>
					취소
				</button>
				<button
					type="button"
					onclick={onSave}
					disabled={isSaving}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
				>
					{isSaving ? '저장 중...' : '저장'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.department-edit-modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgb(0 0 0 / 0.5);
	}
	.department-edit-modal-content {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
		width: 100%;
		max-width: 56rem;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}
	.department-edit-modal-header {
		padding: 1rem;
		border-bottom: 1px solid rgb(229 231 235);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.department-edit-modal-body {
		padding: 1rem;
		overflow-y: auto;
		flex: 1;
	}
	.department-edit-modal-footer {
		padding: 1rem;
		border-top: 1px solid rgb(229 231 235);
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.selected-orgs-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		min-height: 2rem;
		padding: 0.5rem;
		background: rgb(243 244 246);
		border-radius: 0.5rem;
		border: 1px solid rgb(229 231 235);
	}
	.selected-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: rgb(219 234 254);
		border: 1px solid rgb(147 197 253);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}
	.selected-chip:hover {
		background: rgb(191 219 254);
		border-color: rgb(96 165 250);
	}
	.selected-chip-x {
		margin-left: 0.125rem;
		color: rgb(59 130 246);
		font-weight: 700;
	}
	.org-list-label {
		margin-bottom: 0.375rem;
	}
	.org-list-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.375rem 1rem;
	}
	.org-list-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0 0.5rem;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}
	.org-list-item:hover {
		background: rgb(249 250 251);
	}

	.department-users-section {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid rgb(229 231 235);
	}
	.department-users-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.department-user-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		background: rgb(249 250 251);
		border-radius: 0.5rem;
		border: 1px solid rgb(229 231 235);
	}
	.department-user-name {
		min-width: 10rem;
		font-size: 0.875rem;
		color: rgb(55 65 81);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.department-user-perm {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: rgb(75 85 99);
		cursor: pointer;
	}
	.department-user-remove {
		margin-left: auto;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: rgb(185 28 28);
		background: rgb(254 226 226);
		border: 1px solid rgb(252 165 165);
		border-radius: 0.375rem;
		cursor: pointer;
	}
	.department-user-remove:hover {
		background: rgb(254 202 202);
	}
	.department-user-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
