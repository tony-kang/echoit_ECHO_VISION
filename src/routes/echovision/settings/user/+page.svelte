<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import EchoVisionSidebar from '$src/lib/components/EchoVisionSidebar.svelte';
	import { authStore } from '$lib/stores/authStore';
	import {
		getAllUsers,
		updateUserRole,
		toggleUserStatus,
		updateUserTopLevelCodes,
		getUserStatistics,
		USER_ROLE_LABELS,
		USER_ROLES,
		isAdmin
	} from '$lib/userService';
	import { searchSettingsByTitle } from '$lib/settingsService'; 

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {Object | null} */
	let userProfile = $state(null);
	let userProfileLoading = $state(true);
	let profileChecked = $state(false);

	/** @type {Array<any>} 사용자 목록 */
	let users = $state([]);
	/** @type {{ total: number; admins: number; activeUsers: number; bannedUsers: number; } | null} */
	let userStats = $state(null);
	let isLoading = $state(false);
	let error = $state('');

	/** @type {{ role: string; status: string; search: string }} 사용자 필터 */
	let userFilters = $state({
		role: '',
		status: '',
		search: ''
	});

	/** @type {Array<any>} 최상위 코드 목록 (검색 결과) */
	let topLevelCodeOptions = $state([]);
	/** @type {string|null} 최상위 코드 설정 모달을 위한 사용자 ID */
	let editingTopLevelCodesUserId = $state(null);
	/** @type {string[]} 편집 중인 최상위 코드 목록 */
	let editingTopLevelCodes = $state([]);
	let showTopLevelCodesModal = $state(false);
	/** @type {string} 최상위 코드 검색어 */
	let topLevelCodeSearch = $state('');
	/** @type {number|null} 검색 debounce 타이머 */
	let searchDebounceTimer = null;
	/** @type {boolean} 검색 로딩 상태 */
	let isLoadingSearch = $state(false);

	/**
	 * 관리자 권한 확인
	 * @type {boolean}
	 */
	const isAdminUser = $derived.by(() => {
		const profile = userProfile;
		if (!profile?.role) return false;
		return isAdmin(profile.role);
	});

	/**
	 * 필터링된 사용자 목록
	 * @type {Array<any>}
	 */
	const filteredUsers = $derived.by(() => {
		let filtered = users;

		if (userFilters.role) {
			filtered = filtered.filter((u) => u.role === userFilters.role);
		}

		if (userFilters.status === 'active') {
			filtered = filtered.filter((u) => !u.banned);
		} else if (userFilters.status === 'banned') {
			filtered = filtered.filter((u) => u.banned);
		}

		if (userFilters.search) {
			const searchLower = userFilters.search.toLowerCase();
			filtered = filtered.filter(
				(/** @type {any} */ u) =>
					(u.email && u.email.toLowerCase().includes(searchLower)) ||
					(u.full_name && u.full_name.toLowerCase().includes(searchLower))
			);
		}

		return filtered;
	});

	/**
	 * 필터링된 사용자 통계
	 * @type {{ total: number; admins: number; activeUsers: number; bannedUsers: number }}
	 */
	const filteredUserStats = $derived.by(() => {
		const filtered = filteredUsers;
		if (!filtered || filtered.length === 0) {
			return {
				total: 0,
				admins: 0,
				activeUsers: 0,
				bannedUsers: 0
			};
		}

		const stats = {
			total: filtered.length,
			admins: 0,
			activeUsers: 0,
			bannedUsers: 0
		};

		filtered.forEach((/** @type {any} */ usr) => {
			const role = usr.role || USER_ROLES.USER;

			// 관리자 카운트 (admin 또는 master 역할)
			if (isAdmin(role)) {
				stats.admins++;
			}

			// 활성/비활성 카운트
			if (usr.banned) {
				stats.bannedUsers++;
			} else {
				stats.activeUsers++;
			}
		});

		return stats;
	});

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			userProfile = state.userProfile;
			userProfileLoading = state.profileLoading;

			if (!state.loading && !state.user) {
				goto('/login');
			}
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * 사용자 프로필 로드 후 데이터 로드 및 권한 체크
	 */
	$effect(() => {
		if (user && !authLoading && !userProfileLoading && userProfile && !profileChecked) {
			profileChecked = true;

			// 관리자 권한 체크
			const profile = userProfile;
			if (!profile?.role || !isAdmin(profile.role)) {
				alert('관리자 권한이 필요합니다.');
				goto('/echovision');
				return;
			}

			loadData();
		}
	});

	/**
	 * 사용자 데이터 로드
	 * @returns {Promise<void>}
	 */
	async function loadData() {
		if (isLoading) return;

		isLoading = true;
		error = '';

		try {
			console.log('사용자 데이터 로드 시작...');
			const result = await getAllUsers();
			console.log('getAllUsers 결과:', result);
			
			if (result.error) {
				error = `사용자 데이터를 불러올 수 없습니다: ${result.error.message || result.error}`;
				console.error('사용자 조회 에러:', result.error);
				users = [];
			} else if (result.data) {
				users = result.data;
				console.log(`로드된 사용자 수: ${result.data.length}`);
				const statsResult = await getUserStatistics(result.data);
				userStats = statsResult;
			} else {
				error = '사용자 데이터를 불러올 수 없습니다.';
				users = [];
			}
		} catch (err) {
			error = `데이터를 불러오는 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`;
			console.error('loadData 예외:', err);
			users = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 역할 표시 헬퍼 함수
	 * @param {string|null|undefined} role - 역할 문자열
	 * @returns {string}
	 */
	function formatRole(role) {
		if (!role) return '일반 사용자';
		return USER_ROLE_LABELS[role] || role || '일반 사용자';
	}

	/**
	 * 역할 변경 함수
	 * @param {string} userId - 사용자 ID
	 * @param {string} newRole - 새로운 역할
	 * @returns {Promise<void>}
	 */
	async function changeRole(userId, newRole) {
		const roleLabel = USER_ROLE_LABELS[newRole] || newRole;

		if (!confirm(`정말로 이 사용자의 권한을 "${roleLabel}"로 변경하시겠습니까?`)) {
			return;
		}

		const { error: updateError } = await updateUserRole(userId, newRole);
		if (updateError) {
			alert('역할 변경에 실패했습니다.');
		} else {
			alert('역할이 변경되었습니다.');
			await loadData();
		}
	}

	/**
	 * 사용자 상태 변경 함수
	 * @param {string} userId - 사용자 ID
	 * @param {boolean} currentBanned - 현재 비활성화 상태
	 * @returns {Promise<void>}
	 */
	async function toggleStatus(userId, currentBanned) {
		const action = currentBanned ? '활성화' : '비활성화';
		if (!confirm(`정말로 이 사용자를 ${action}하시겠습니까?`)) {
			return;
		}

		const { error: toggleError } = await toggleUserStatus(userId, !currentBanned);
		if (toggleError) {
			alert(`${action}에 실패했습니다.`);
		} else {
			alert(`사용자가 ${action}되었습니다.`);
			await loadData();
		}
	}

	/**
	 * 필터 적용 핸들러
	 * @returns {void}
	 */
	function handleApplyFilters() {
		// 필터링은 derived로 자동 처리되므로 통계만 업데이트
		// 실제로는 filteredUsers와 filteredUserStats가 자동으로 업데이트됨
	}

	/**
	 * 필터 초기화 핸들러
	 * @returns {void}
	 */
	function handleResetFilters() {
		userFilters = { role: '', status: '', search: '' };
	}

	/**
	 * 최상위 코드 설정 모달 열기
	 * @param {any} usr - 사용자 객체
	 * @returns {Promise<void>}
	 */
	async function openTopLevelCodesModal(usr) {
		editingTopLevelCodesUserId = usr.id;
		/** @type {any} */
		const user = usr;
		editingTopLevelCodes = Array.isArray(user.top_level_codes) ? [...user.top_level_codes] : [];
		topLevelCodeSearch = '';
		showTopLevelCodesModal = true;
		
		// 초기 데이터 로드 (검색어 없이 전체 조회)
		await searchTopLevelCodes('');
	}

	/**
	 * 최상위 코드 설정 모달 닫기
	 * @returns {void}
	 */
	function closeTopLevelCodesModal() {
		showTopLevelCodesModal = false;
		editingTopLevelCodesUserId = null;
		editingTopLevelCodes = [];
		topLevelCodeSearch = '';
		topLevelCodeOptions = [];
		isLoadingSearch = false;
		
		// 타이머 정리
		if (searchDebounceTimer !== null) {
			clearTimeout(searchDebounceTimer);
			searchDebounceTimer = null;
		}
	}
	
	/**
	 * 검색어 입력 핸들러 (debounce 적용)
	 * @param {Event} event - 입력 이벤트
	 * @returns {void}
	 */
	function handleSearchInput(event) {
		const value = event.currentTarget.value;
		topLevelCodeSearch = value;
		
		// 기존 타이머 취소
		if (searchDebounceTimer !== null) {
			clearTimeout(searchDebounceTimer);
			searchDebounceTimer = null;
		}
		
		const searchTrimmed = value?.trim() || '';
		
		// debounce: 300ms 후 검색 실행
		searchDebounceTimer = setTimeout(() => {
			searchTopLevelCodes(searchTrimmed);
			searchDebounceTimer = null;
		}, 300);
	}

	/**
	 * 서버에서 모든 코드를 title로 검색
	 * @param {string} searchTerm - 검색어
	 * @returns {Promise<void>}
	 */
	async function searchTopLevelCodes(searchTerm) {
		isLoadingSearch = true;
		
		try {
			const { data, error } = await searchSettingsByTitle({ search: searchTerm });
			
			if (error) {
				console.error('코드 검색 실패:', error);
				topLevelCodeOptions = [];
			} else {
				topLevelCodeOptions = data || [];
			}
		} catch (err) {
			console.error('검색 예외:', err);
			topLevelCodeOptions = [];
		} finally {
			isLoadingSearch = false;
		}
	}

	/**
	 * 최상위 코드 설정 저장
	 * @returns {Promise<void>}
	 */
	async function saveTopLevelCodes() {
		if (!editingTopLevelCodesUserId) return;

		const { error: updateError } = await updateUserTopLevelCodes(
			editingTopLevelCodesUserId,
			editingTopLevelCodes
		);
		if (updateError) {
			alert('최상위 코드 설정에 실패했습니다.');
		} else {
			alert('최상위 코드가 설정되었습니다.');
			closeTopLevelCodesModal();
			await loadData();
		}
	}

	/**
	 * 최상위 코드 토글
	 * @param {string} code - 코드
	 * @returns {void}
	 */
	function toggleTopLevelCode(code) {
		const index = editingTopLevelCodes.indexOf(code);
		if (index >= 0) {
			editingTopLevelCodes = editingTopLevelCodes.filter((c) => c !== code);
		} else {
			editingTopLevelCodes = [...editingTopLevelCodes, code];
		}
	}

	/**
	 * 사용자의 최상위 코드 표시 (최대 3개)
	 * @param {any} usr - 사용자 객체
	 * @returns {string}
	 */
	function getTopLevelCodesDisplay(usr) {
		/** @type {any} */
		const user = usr;
		const codes = Array.isArray(user.top_level_codes) ? user.top_level_codes : [];
		if (codes.length === 0) return '-';
		if (codes.length <= 3) return codes.join(', ');
		return codes.slice(0, 3).join(', ') + ` 외 ${codes.length - 3}개`;
	}
</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<EchoVisionSidebar />

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto bg-gray-50">
			<div class="p-3">
				{#if authLoading || userProfileLoading}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로딩 중...</div>
					</div>
				{:else if !user}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로그인이 필요합니다.</div>
					</div>
				{:else if !isAdminUser}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">관리자 권한이 필요합니다.</div>
					</div>
				{:else}
					<div class="admin-content-page">
						<!-- 헤더 -->
						<div class="mb-6">
							<h1 class="text-3xl font-bold text-gray-800">사용자 관리</h1>
							<p class="text-gray-600">사용자 역할 변경, 상태 관리 등 사용자 관리 기능을 제공합니다</p>
						</div>

						{#if error}
							<div class="error-message">{error}</div>
						{/if}

						<div class="user-section">
							<!-- 사용자 통계 -->
							{#if filteredUserStats}
								<div class="stats-grid">
									<div class="stat-card">
										<div class="stat-icon">👥</div>
										<div class="stat-content">
											<p class="stat-label">전체 사용자</p>
											<p class="stat-value">{filteredUserStats.total}</p>
										</div>
									</div>
									<div class="stat-card">
										<div class="stat-icon">🔐</div>
										<div class="stat-content">
											<p class="stat-label">관리자</p>
											<p class="stat-value">{filteredUserStats.admins}</p>
										</div>
									</div>
									<div class="stat-card">
										<div class="stat-icon">✅</div>
										<div class="stat-content">
											<p class="stat-label">활성 사용자</p>
											<p class="stat-value">{filteredUserStats.activeUsers}</p>
										</div>
									</div>
									<div class="stat-card">
										<div class="stat-icon">⛔</div>
										<div class="stat-content">
											<p class="stat-label">비활성 사용자</p>
											<p class="stat-value">{filteredUserStats.bannedUsers}</p>
										</div>
									</div>
								</div>
							{/if}

							<!-- 필터 -->
							<div class="filter-section">
								<div class="filter-layout">
									<!-- 검색 필드 (왼쪽) -->
									<div class="filter-search">
										<input
											type="text"
											bind:value={userFilters.search}
											placeholder="이메일, 이름 검색..."
											class="filter-input search-input"
										/>
									</div>

									<!-- 필터 옵션 및 버튼 (오른쪽) -->
									<div class="filter-controls">
										<select bind:value={userFilters.role} class="filter-input">
											<option value="">전체 역할</option>
											{#each Object.entries(USER_ROLE_LABELS) as [value, label]}
												<option {value}>{label}</option>
											{/each}
										</select>

										<select bind:value={userFilters.status} class="filter-input">
											<option value="">전체 상태</option>
											<option value="active">활성</option>
											<option value="banned">비활성</option>
										</select>

										<button onclick={handleApplyFilters} class="btn-icon btn-icon-primary" title="필터 적용">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
											</svg>
										</button>
										<button onclick={handleResetFilters} class="btn-icon btn-icon-secondary" title="초기화">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
											</svg>
										</button>
									</div>
								</div>
							</div>

							<!-- 사용자 테이블 -->
							{#if isLoading}
								<div class="loading-data">
									<div class="spinner-small"></div>
									<p>데이터 로딩 중...</p>
								</div>
							{:else}
								<div class="table-container">
									<table class="data-table">
										<thead>
											<tr>
												<th>이메일</th>
												<th>이름</th>
												<th>역할</th>
												<th>최상위 코드</th>
												<th>가입일</th>
												<th>마지막 로그인</th>
												<th>상태</th>
												<th>관리</th>
											</tr>
										</thead>
										<tbody>
											{#if filteredUsers.length === 0}
												<tr>
													<td colspan="8" class="empty-message">사용자가 없습니다.</td>
												</tr>
											{:else}
												{#each filteredUsers as usr}
													<tr class:banned={usr.banned}>
														<td>{usr.email}</td>
														<td>{usr.full_name || '-'}</td>
														<td>
															<select
																class="role-select"
																value={usr.role || USER_ROLES.USER}
																onchange={(e) => changeRole(usr.id, e.target.value)}
																disabled={usr.id === user?.id || usr.role === USER_ROLES.MASTER}
															>
																{#each Object.entries(USER_ROLE_LABELS) as [value, label]}
																	{#if value !== USER_ROLES.MASTER}
																		<!-- master가 아닌 역할만 선택 가능 -->
																		<option value={value}>{label}</option>
																	{:else if usr.role === USER_ROLES.MASTER}
																		<!-- 현재 역할이 master인 경우에만 master 옵션 표시 (읽기 전용) -->
																		<option value={value} disabled>{label}</option>
																	{/if}
																{/each}
															</select>
														</td>
														<td>
															<div class="flex items-center gap-2">
																<span class="text-sm">{getTopLevelCodesDisplay(usr)}</span>
																{#if isAdminUser && usr.role !== USER_ROLES.MASTER}
																	{@const hasTopLevelCodes = Array.isArray(usr.top_level_codes) && usr.top_level_codes.length > 0}
																	<button
																		onclick={() => openTopLevelCodesModal(usr)}
																		class="btn-icon-small"
																		title={hasTopLevelCodes ? "최상위 코드 설정" : "최상위 코드 추가"}
																	>
																		{#if hasTopLevelCodes}
																			<!-- 편집 아이콘 -->
																			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
																			</svg>
																		{:else}
																			<!-- 추가 아이콘 (최상위 코드가 없을 때) -->
																			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
																			</svg>
																		{/if}
																	</button>
																{/if}
															</div>
														</td>
														<td>
															{usr.created_at
																? new Date(usr.created_at).toLocaleDateString('ko-KR')
																: '-'}
														</td>
														<td>
															{usr.last_sign_in_at
																? new Date(usr.last_sign_in_at).toLocaleDateString('ko-KR')
																: '-'}
														</td>
														<td>
															<span class="badge badge-{usr.banned ? 'danger' : 'success'}">
																{usr.banned ? '비활성' : '활성'}
															</span>
														</td>
														<td>
															<button
																onclick={() => toggleStatus(usr.id, usr.banned)}
																class="btn-small {usr.banned ? 'btn-success' : 'btn-danger'}"
																disabled={usr.id === user?.id}
															>
																{usr.banned ? '활성화' : '비활성화'}
															</button>
														</td>
													</tr>
												{/each}
											{/if}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<!-- 최상위 코드 설정 모달 -->
{#if showTopLevelCodesModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={closeTopLevelCodesModal}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>최상위 코드 설정</h2>
				<button onclick={closeTopLevelCodesModal} class="modal-close">×</button>
			</div>
			<div class="modal-body">
				<p class="text-sm text-gray-600 mb-4">
					사용자가 접근 가능한 최상위 환경설정 코드를 선택하세요. 선택한 코드와 그 하위 코드만 접근할 수 있습니다.
				</p>
				
				<!-- 검색 입력 -->
				<div class="mb-4">
					<input
						type="text"
						value={topLevelCodeSearch}
						oninput={handleSearchInput}
						placeholder="제목으로 검색..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<div class="mt-2 text-xs text-gray-500">
						{#if isLoadingSearch}
							<p>검색 중...</p>
						{:else if topLevelCodeSearch}
							<p>검색 결과: {topLevelCodeOptions.length}개</p>
						{:else}
							<p>전체 {topLevelCodeOptions.length}개 코드</p>
						{/if}
					</div>
				</div>

				<!-- 선택된 코드 표시 -->
				{#if editingTopLevelCodes.length > 0}
					<div class="mb-4 p-3 bg-blue-50 rounded-lg">
						<p class="text-sm font-medium text-blue-900 mb-2">선택된 코드 ({editingTopLevelCodes.length}개):</p>
						<div class="flex flex-wrap gap-2">
							{#each editingTopLevelCodes as code}
								{@const option = topLevelCodeOptions.find((/** @type {any} */ opt) => opt.code === code)}
								<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
									{option?.code || code}
									{#if option?.title}
										<span class="text-blue-600">- {option.title}</span>
									{/if}
									<button
										onclick={() => toggleTopLevelCode(code)}
										class="ml-1 text-blue-600 hover:text-blue-800"
										title="제거"
									>
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- 코드 목록 -->
				<div class="max-h-48 overflow-y-auto">
					{#if isLoadingSearch}
						<div class="text-center py-8 text-gray-500">
							검색 중...
						</div>
					{:else if topLevelCodeOptions.length === 0}
						<div class="text-center py-8 text-gray-500">
							{#if topLevelCodeSearch}
								검색 결과가 없습니다.
							{:else}
								코드를 불러오는 중...
							{/if}
						</div>
					{:else}
						{#each topLevelCodeOptions as option}
							<label class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
								<input
									type="checkbox"
									checked={editingTopLevelCodes.includes(option.code)}
									onchange={() => toggleTopLevelCode(option.code)}
									class="checkbox-input"
								/>
								<span class="flex-1">
									<span class="font-mono text-sm font-medium">{option.code}</span>
									<span class="text-sm text-gray-600 ml-2">- {option.title}</span>
								</span>
							</label>
						{/each}
					{/if}
				</div>
			</div>
			<div class="modal-footer">
				<button onclick={closeTopLevelCodesModal} class="btn-secondary">취소</button>
				<button onclick={saveTopLevelCodes} class="btn-primary">저장</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-content-page {
		width: 100%;
	}

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

	.filter-section {
		background: #f8f9ff;
		padding: 20px;
		border-radius: 12px;
		margin-bottom: 24px;
	}

	.filter-layout {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.filter-search {
		flex: 1;
		min-width: 250px;
	}

	.filter-controls {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.filter-input {
		padding: 10px 14px;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 0.95em;
		background: white;
		transition: border-color 0.2s;
	}

	.filter-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.search-input {
		width: 100%;
	}

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		width: 40px;
		height: 40px;
	}

	.btn-icon-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.btn-icon-primary:hover {
		background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
		transform: translateY(-2px);
	}

	.btn-icon-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-icon-secondary:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}


	.table-container {
		overflow-x: auto;
		margin-top: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

	.data-table th:first-child {
		padding-left: 16px;
	}

	.data-table th:last-child {
		padding-right: 16px;
	}

	.data-table tbody tr {
		border-bottom: 1px solid #e0e0e0;
		transition: background-color 0.2s;
	}

	.data-table tbody tr:hover {
		background-color: #f8f9ff;
	}

	.data-table tbody tr:last-child {
		border-bottom: none;
	}

	.data-table td {
		padding: 10px 10px;
		font-size: 0.9em;
		color: #333;
		vertical-align: middle;
	}

	.data-table td:first-child {
		padding-left: 16px;
	}

	.data-table td:last-child {
		padding-right: 16px;
	}

	.data-table .empty-message {
		text-align: center;
		padding: 40px 20px;
		color: #999;
		font-style: italic;
	}

	tr.banned {
		background-color: #fff5f5;
		opacity: 0.7;
	}

	.role-select {
		padding: 6px 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.9em;
		background: white;
		color: #333;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 120px;
	}

	.role-select:hover:not(:disabled) {
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.role-select:focus:not(:disabled) {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
	}

	.role-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background-color: #f5f5f5;
	}

	.badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 0.85em;
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
		padding: 6px 12px;
		font-size: 0.85em;
		border-radius: 4px;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
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

	.btn-small:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		background: #fed7d7;
		color: #c53030;
		padding: 16px;
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.loading-data {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
	}

	.spinner-small {
		width: 30px;
		height: 30px;
		border: 3px solid #e2e8f0;
		border-top: 3px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.loading-data p {
		margin-top: 20px;
		color: #718096;
	}

	.btn-icon-small {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 4px;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-icon-small:hover {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

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
		border-radius: 8px;
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #6b7280;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.modal-close:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.modal-body {
		padding: 20px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.checkbox-input {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
		padding: 8px 16px;
		border-radius: 6px;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		padding: 8px 16px;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	@media (max-width: 1024px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.filter-layout {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-search {
			min-width: auto;
		}

		.filter-controls {
			flex-wrap: wrap;
		}

		.filter-input {
			width: 100%;
		}

		.data-table {
			font-size: 0.8em;
		}

		.data-table th {
			padding: 10px 8px;
		}

		.data-table th:first-child {
			padding-left: 12px;
		}

		.data-table th:last-child {
			padding-right: 12px;
		}

		.data-table td {
			padding: 8px 6px;
		}

		.data-table td:first-child {
			padding-left: 12px;
		}

		.data-table td:last-child {
			padding-right: 12px;
		}

		.role-select {
			min-width: 100px;
			font-size: 0.85em;
			padding: 5px 8px;
		}
	}
</style>
