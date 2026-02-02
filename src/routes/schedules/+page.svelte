<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ScheduleForm from '$lib/components/ScheduleForm.svelte';
	import ScheduleSidebar from '$lib/components/ScheduleSidebar.svelte';
	import MobileMenuButton from '$lib/components/MobileMenuButton.svelte';
	import { authStore } from '$lib/stores/authStore';
	import {
		getAllSchedules,
		getSchedulesByDate,
		createSchedule,
		updateSchedule,
		deleteSchedule
	} from '$lib/scheduleService';
	import { getActiveCategories } from '$lib/scheduleCategoryService'; 

	// URL 쿼리 파라미터에서 categoryLevel 읽기
	// 예: /schedules?categoryLevel=contract (단일 레벨)
	// 예: /schedules?categoryLevel=default,contract (여러 레벨, 쉼표로 구분)
	const categoryLevelParam = $derived(page.url.searchParams.get('categoryLevel'));
	const categoryLevel = $derived.by(() => {
		const param = categoryLevelParam;
		if (!param) return 'default';
		// 쉼표로 구분된 경우 배열로 변환
		if (param.includes(',')) {
			return param.split(',').map(level => level.trim()).filter(level => level);
		}
		return param;
	});
	
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);
	/** @type {Array<any>} */
	let schedules = $state([]);
	/** @type {Array<any>} */
	let filteredSchedules = $state([]);
	/** @type {Array<any>} */
	let categories = $state([]);
	let isLoading = $state(false);
	let isLoadingCategories = $state(false);
	let viewMode = $state('month'); // 'month', 'week', 'list'
	let currentDate = $state(new Date());
	let showFormModal = $state(false);
	/** @type {any} */
	let editingSchedule = $state(null);
	/** @type {Date | null} */
	let selectedDate = $state(null);
	let schedulesLoaded = $state(false); // 중복 로드 방지 플래그
	/** @type {Array<any>} */
	let selectedCategories = $state([]);
	let searchQuery = $state('');

	onMount(() => {
		// 레이아웃에서 이미 초기화되므로 여기서는 구독만 함
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;

			if (!state.loading && !state.user) {
				goto('/login');
			}
		});

		return () => {
			unsubscribe();
		};
	});

	$effect(() => {
		// 사용자가 있고 로딩이 완료되었으며, 아직 일정을 로드하지 않았을 때만 로드
		if (user && !authLoading && !schedulesLoaded && !isLoading) {
			schedulesLoaded = true;
			loadSchedules();
			loadCategories();
		}
	});

	async function loadCategories() {
		if (isLoadingCategories) return;
		isLoadingCategories = true;
		// categoryLevel은 이미 배열 또는 문자열 또는 null로 처리됨
		const { data, error } = await getActiveCategories(categoryLevel);
		if (error) {
			console.error('카테고리 로드 실패:', error);
		} else {
			categories = (data || []).map(cat => ({
				value: cat.value,
				label: cat.label,
				color: cat.color,
				count: 0 // 초기값, 나중에 업데이트됨
			}));
			// 카테고리 로드 후 일정 개수 업데이트
			if (schedules.length > 0) {
				updateCategoryCounts();
			}
		}
		isLoadingCategories = false;
	}

	// 카테고리별 일정 개수 업데이트
	function updateCategoryCounts() {
		console.log('[updateCategoryCounts] 시작');
		console.log('[updateCategoryCounts] categories:', categories);
		console.log('[updateCategoryCounts] schedules:', schedules);
		
		if (categories.length === 0) {
			console.log('[updateCategoryCounts] 카테고리가 없음');
			return;
		}
		
		if (schedules.length === 0) {
			console.log('[updateCategoryCounts] 일정이 없음 - 모든 카테고리 개수를 0으로 설정');
			categories = categories.map(cat => ({
				...cat,
				count: 0
			}));
			return;
		}
		
		console.log('[updateCategoryCounts] 카테고리별 일정 개수 계산 시작');
		categories = categories.map(cat => {
			const matchingSchedules = schedules.filter(schedule => schedule.category === cat.value);
			const count = matchingSchedules.length;
			console.log(`[updateCategoryCounts] ${cat.label} (${cat.value}): ${count}개`, matchingSchedules);
			return {
				...cat,
				count
			};
		});
		console.log('[updateCategoryCounts] 완료:', categories);
	}

	async function loadSchedules() {
		if (!user || isLoading) return; // 이미 로딩 중이면 중복 호출 방지

		isLoading = true;
		const { data, error } = await getAllSchedules();
		if (error) {
			console.error('일정 로드 실패:', error);
			alert('일정을 불러오는데 실패했습니다.');
		} else {
			schedules = data || [];
			applyFilters();
			// 일정 로드 후 카테고리 개수 업데이트
			if (categories.length > 0) {
				updateCategoryCounts();
			}
		}
		isLoading = false;
	}

	function applyFilters() {
		let filtered = [...schedules];

		// 카테고리 필터링
		if (selectedCategories.length > 0) {
			filtered = filtered.filter(schedule => 
				selectedCategories.includes(schedule.category)
			);
		}

		// 검색어 필터링
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(schedule =>
				schedule.title.toLowerCase().includes(query) ||
				(schedule.description && schedule.description.toLowerCase().includes(query)) ||
				(schedule.location && schedule.location.toLowerCase().includes(query))
			);
		}

		filteredSchedules = filtered;
	}

	/**
	 * @param {Array<any>} categories
	 */
	function handleCategoryToggle(categories) {
		selectedCategories = categories;
		applyFilters();
	}

	$effect(() => {
		applyFilters();
	});

	/**
	 * @param {Date | null} [date]
	 */
	function handleCreateSchedule(date = null) {
		editingSchedule = null;
		selectedDate = date;
		showFormModal = true;
	}

	/**
	 * @param {any} schedule
	 */
	function handleEditSchedule(schedule) {
		editingSchedule = schedule;
		showFormModal = true;
	}

	/**
	 * @param {any} scheduleData
	 */
	async function handleSubmitSchedule(scheduleData) {
		try {
			let result;
			/** @type {any} */
			const editing = editingSchedule;
			if (editing) {
				result = await updateSchedule(editing.id, scheduleData);
			} else {
				result = await createSchedule(scheduleData);
			}

			if (result.error) {
				throw result.error;
			}

		showFormModal = false;
		editingSchedule = null;
		await loadSchedules();
		} catch (error) {
			console.error('일정 저장 실패:', error);
			const errMsg = error instanceof Error ? error.message : String(error);
			alert('일정 저장에 실패했습니다: ' + (errMsg || '알 수 없는 오류'));
		}
	}

	function handleCancelForm() {
		showFormModal = false;
		editingSchedule = null;
		selectedDate = null;
	}

	/**
	 * @param {any} schedule
	 */
	async function handleDeleteSchedule(schedule) {
		if (!confirm(`"${schedule.title}" 일정을 삭제하시겠습니까?`)) {
			return;
		}

		const { error } = await deleteSchedule(schedule.id);
		if (error) {
			console.error('일정 삭제 실패:', error);
			alert('일정 삭제에 실패했습니다.');
		} else {
			await loadSchedules();
		}
	}

	/**
	 * @param {string} dateString
	 */
	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'short'
		});
	}

	/**
	 * @param {string} dateString
	 */
	function formatTime(dateString) {
		const date = new Date(dateString);
		return date.toLocaleTimeString('ko-KR', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	$effect(() => {
		// schedules가 변경될 때만 카테고리 개수 업데이트 (categories 변경 시 무한 루프 방지)
		const _schedules = schedules;
		
		if (categories.length > 0 && _schedules.length >= 0) {
			// categories 배열 자체가 변경되지 않도록 주의하여 개수만 업데이트
			const currentCategories = categories;
			if (currentCategories.length > 0) {
				const updatedCategories = currentCategories.map(cat => {
					const count = _schedules.filter(schedule => schedule.category === cat.value).length;
					return { ...cat, count };
				});
				// count가 실제로 변경된 경우에만 업데이트
				const hasChanged = updatedCategories.some((cat, idx) => 
					currentCategories[idx]?.count !== cat.count
				);
				if (hasChanged) {
					categories = updatedCategories;
				}
			}
		}
		
		applyFilters();
	});

	/**
	 * @param {Date} date
	 */
	function getSchedulesForDate(date) {
		const targetDate = new Date(date);
		targetDate.setHours(0, 0, 0, 0);
		const nextDate = new Date(targetDate);
		nextDate.setDate(nextDate.getDate() + 1);

		// 해당 날짜가 주의 첫 번째 날(월요일)인지 확인 (구글 달력 기준)
		const isWeekStart = targetDate.getDay() === 1;

		const daySchedules = filteredSchedules
			.filter((schedule) => {
				const startDate = new Date(schedule.start_date);
				const endDate = new Date(schedule.end_date);
				startDate.setHours(0, 0, 0, 0);
				endDate.setHours(0, 0, 0, 0);
				return startDate <= targetDate && endDate >= targetDate;
			})
			.map((schedule) => {
				const startDate = new Date(schedule.start_date);
				const endDate = new Date(schedule.end_date);
				startDate.setHours(0, 0, 0, 0);
				endDate.setHours(0, 0, 0, 0);

				const isStart = startDate.getTime() === targetDate.getTime();
				const isEnd = endDate.getTime() === targetDate.getTime();
				const isMiddle = !isStart && !isEnd;
				const spanDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
				
				// 구글 캘린더처럼: 각 주의 첫 번째 날(월요일)에 제목 표시
				let showTitleOnWeekStart = false;
				if (isWeekStart && !isStart && !isEnd) {
					// 시작일의 주 월요일 계산
					const startDayOfWeek = startDate.getDay();
					// 일요일(0) → -1, 월요일(1) → 0, 화요일(2) → 1, ...
					const daysFromMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
					const startMonday = new Date(startDate);
					startMonday.setDate(startDate.getDate() - daysFromMonday);
					startMonday.setHours(0, 0, 0, 0);
					
					// 현재 날짜의 주 월요일 (현재가 월요일이므로 그대로)
					const currentMonday = new Date(targetDate);
					currentMonday.setHours(0, 0, 0, 0);
					
					// 시작일의 주와 현재 날짜의 주가 다르면 제목 표시
					// (시작일이 속한 주의 월요일과 현재 날짜의 월요일이 다르면)
					if (startMonday.getTime() !== currentMonday.getTime()) {
						showTitleOnWeekStart = true;
					}
				}

				return {
					...schedule,
					isStart,
					isEnd,
					isMiddle,
					spanDays,
					showTitleOnWeekStart
				};
			});

		// 일정이 1개만 있으면 항상 상단(트랙 0)에 배치
		if (daySchedules.length === 1) {
			return daySchedules.map(s => ({ ...s, track: 0 }));
		}

		// 일정이 2개 이상이면 색상 순서대로 트랙 배치
		const colorOrder = {
			'#3b82f6': 0, // blue
			'#10b981': 1, // green
			'#f59e0b': 2, // yellow
			'#ef4444': 3, // red
			'#8b5cf6': 4, // purple
			'#ec4899': 5, // pink
			'#6b7280': 6  // gray
		};

		return daySchedules
			.sort((a, b) => {
				/** @type {any} */
				const aColor = a.color;
				const bColor = b.color;
				const aOrder = colorOrder[aColor] ?? 999;
				const bOrder = colorOrder[bColor] ?? 999;
				return aOrder - bOrder;
			})
			.map((schedule, index) => ({
				...schedule,
				track: index // 0: 상단, 1: 하단, ...
			}));
	}

	/**
	 * @param {number} delta
	 */
	function changeMonth(delta) {
		const newDate = new Date(currentDate);
		newDate.setMonth(newDate.getMonth() + delta);
		currentDate = newDate;
	}

	function getDaysInMonth() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		// JavaScript의 getDay()는 일요일=0, 월요일=1, ...
		// 구글 달력처럼 월요일부터 시작하려면: 일요일(0) → 6, 월요일(1) → 0, 화요일(2) → 1, ...
		const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

		const days = [];
		// 이전 달의 마지막 날들
		const prevMonth = new Date(year, month, 0);
		const prevMonthDays = prevMonth.getDate();
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			days.push({
				date: new Date(year, month - 1, prevMonthDays - i),
				isCurrentMonth: false
			});
		}
		// 현재 달의 날들
		for (let day = 1; day <= daysInMonth; day++) {
			days.push({
				date: new Date(year, month, day),
				isCurrentMonth: true
			});
		}
		// 다음 달의 첫 날들 (캘린더를 채우기 위해)
		const remainingDays = 42 - days.length;
		for (let day = 1; day <= remainingDays; day++) {
			days.push({
				date: new Date(year, month + 1, day),
				isCurrentMonth: false
			});
		}

		return days;
	}

	const monthDays = $derived(getDaysInMonth());
	// 구글 달력처럼 월요일부터 시작, 일요일은 마지막
	const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
</script>

<svelte:head>
	<title>일정 관리 - 에코비전</title>
</svelte:head>

<div class="main-content-page">
	<main class="h-[calc(100vh-5rem)] flex">
		<!-- 왼쪽 사이드바 -->
		<ScheduleSidebar
			{categories}
			bind:selectedCategories
			bind:searchQuery
			onCategoryToggle={handleCategoryToggle}
			bind:isOpen={isSidebarOpen}
		/>

		<!-- 메인 콘텐츠 영역 -->
		<div class="flex-1 flex flex-col w-full px-4 py-4 overflow-hidden">
			<!-- 헤더 -->
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 shrink-0">
				<div class="flex items-center gap-3 mb-4 md:mb-0">
					<MobileMenuButton bind:isOpen={isSidebarOpen} />
					<h1 class="text-3xl font-bold text-gray-900">주요일정</h1>
				</div>
				<div class="flex gap-2">
					<button
						onclick={() => viewMode = 'month'}
						class="px-4 py-2 rounded-lg {viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}"
					>
						월간
					</button>
					<button
						onclick={() => viewMode = 'list'}
						class="px-4 py-2 rounded-lg {viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}"
					>
						목록
					</button>
					<button
						onclick={() => handleCreateSchedule()}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
					>
						+ 일정 추가
					</button>
				</div>
			</div>

			{#if isLoading}
				<div class="text-center py-12 flex-1 flex items-center justify-center">
					<p class="text-gray-500">일정을 불러오는 중...</p>
				</div>
			{:else if filteredSchedules.length === 0 && (selectedCategories.length > 0 || searchQuery.trim())}
				<div class="text-center py-12 flex-1 flex items-center justify-center flex-col">
					<p class="text-gray-500 mb-4">필터 조건에 맞는 일정이 없습니다.</p>
					<button
						onclick={() => { selectedCategories = []; searchQuery = ''; }}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
					>
						필터 초기화
					</button>
				</div>
			{:else if viewMode === 'month'}
				<!-- 월간 캘린더 뷰 -->
				<div class="bg-white flex-1 flex flex-col overflow-hidden">
					<!-- 캘린더 헤더 -->
					<div class="flex justify-between items-center mb-4 shrink-0">
						<button
							onclick={() => changeMonth(-1)}
							class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
						>
							← 이전 달
						</button>
						<h2 class="text-2xl font-semibold">
							{currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
						</h2>
						<button
							onclick={() => changeMonth(1)}
							class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
						>
							다음 달 →
						</button>
					</div>

					<!-- 요일 헤더 -->
					<div class="grid grid-cols-7 gap-1 mb-2 shrink-0">
						{#each weekDays as day}
							<div class="text-center font-semibold text-gray-700 py-2">
								{day}
							</div>
						{/each}
					</div>

					<!-- 캘린더 그리드 -->
					<div class="grid grid-cols-7 gap-0 flex-1 overflow-auto pb-2">
						{#each monthDays as dayInfo}
							{@const daySchedules = getSchedulesForDate(dayInfo.date)}
							{@const isToday = new Date().toDateString() === dayInfo.date.toDateString()}
							<div
								role="button"
								tabindex="0"
								class="border border-gray-200 {dayInfo.isCurrentMonth ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-gray-50 transition flex flex-col"
								onclick={(e) => {
									// 일정 항목을 클릭한 경우가 아니면 일정 추가
									const target = e.target;
									if (target && target.closest && target.closest('.schedule-item') === null) {
										handleCreateSchedule(dayInfo.date);
									}
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										const target = e.target;
										if (target && target.closest && target.closest('.schedule-item') === null) {
											handleCreateSchedule(dayInfo.date);
										}
									}
								}}
							>
								<div class="flex justify-center mb-1 shrink-0">
									<div class="text-sm font-medium w-6 h-6 rounded-full flex items-center justify-center {isToday ? 'bg-blue-600 text-white' : dayInfo.isCurrentMonth ? 'bg-white text-gray-900' : 'bg-white text-gray-400'}">
										{dayInfo.date.getDate()}
									</div>
								</div>
								<div class="flex flex-col gap-0.5 flex-1 overflow-y-auto">
									{#each daySchedules.slice(0, 3) as schedule}
										{@const scheduleClass = schedule.isStart 
											? 'rounded-l' 
											: schedule.isEnd 
												? 'rounded-r' 
												: schedule.isMiddle 
													? 'rounded-none' 
													: 'rounded'}
										{@const isSingleSchedule = daySchedules.length === 1}
										{@const hasTitle = schedule.isStart || schedule.showTitleOnWeekStart || (schedule.isEnd && schedule.spanDays === 1)}
										<div
											role="button"
											tabindex="0"
											class="text-xs px-1 py-0.5 {scheduleClass} truncate cursor-pointer hover:opacity-80 schedule-item"
											style="background-color: {schedule.color}; color: white; {schedule.isMiddle ? 'margin-left: -1px; margin-right: -1px;' : ''};"
											onclick={(e) => {
												e.stopPropagation();
												handleEditSchedule(schedule);
											}}
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													e.stopPropagation();
													handleEditSchedule(schedule);
												}
											}}
											title={schedule.title}
										>
											{#if hasTitle}
												{schedule.is_all_day ? schedule.title : `${formatTime(schedule.start_date)} ${schedule.title}`}
											{:else}
												&nbsp;
											{/if}
										</div>
									{/each}
									{#if daySchedules.length > 3}
										<div class="text-xs text-gray-500 px-1">
											+{daySchedules.length - 3}개 더
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if viewMode === 'list'}
				<!-- 목록 뷰 -->
				<div class="bg-white flex-1 flex flex-col overflow-hidden">
					{#if filteredSchedules.length === 0}
						<div class="text-center py-12 flex-1 flex items-center justify-center flex-col">
							<p class="text-gray-500 mb-4">등록된 일정이 없습니다.</p>
							<button
								onclick={() => handleCreateSchedule()}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
							>
								일정 추가하기
							</button>
						</div>
					{:else}
						<div class="divide-y divide-gray-200 flex-1 overflow-y-auto">
							{#each filteredSchedules as schedule}
								<div class="p-4 hover:bg-gray-50 transition">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center gap-2 mb-2">
												<div
													class="w-4 h-4 rounded"
													style="background-color: {schedule.color}"
												></div>
												<h3 class="text-lg font-semibold text-gray-900">{schedule.title}</h3>
												<span class="text-sm text-gray-500">
													({categories.find(c => c.value === schedule.category)?.label || schedule.category})
												</span>
											</div>
											<p class="text-sm text-gray-600 mb-2">
												{schedule.is_all_day
													? formatDate(schedule.start_date)
													: `${formatDate(schedule.start_date)} ${formatTime(schedule.start_date)} - ${formatTime(schedule.end_date)}`}
											</p>
											{#if schedule.location}
												<p class="text-sm text-gray-500 mb-1">📍 {schedule.location}</p>
											{/if}
											{#if schedule.description}
												<p class="text-sm text-gray-600">{schedule.description}</p>
											{/if}
										</div>
										<div class="flex gap-2 ml-4">
											<button
												onclick={() => handleEditSchedule(schedule)}
												class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
											>
												수정
											</button>
											<button
												onclick={() => handleDeleteSchedule(schedule)}
												class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
											>
												삭제
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- 일정 생성/수정 모달 -->
{#if showFormModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleCancelForm}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{editingSchedule ? '일정 수정' : '일정 추가'}</h2>
				<button onclick={handleCancelForm} class="modal-close">×</button>
			</div>
			<div class="modal-body">
				<ScheduleForm
					schedule={editingSchedule}
					selectedDate={selectedDate}
					categories={categories}
					categoryLevel={categoryLevel}
					onSubmit={handleSubmitSchedule}
					onCancel={handleCancelForm}
				/>
			</div>
		</div>
	</div>
{/if}

<style>
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
		padding: 20px;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 1024px) {
		.modal-overlay {
			padding: 10px;
		}

		.modal-content {
			width: calc(100% - 20px);
			max-width: calc(100% - 20px);
		}

		.modal-body {
			padding: 1rem 1rem 1rem 1rem;
		}
	}

	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		background: white;
		z-index: 10;
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
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		color: #333;
	}

	.modal-body {
		padding: 1rem;
	}
</style>
