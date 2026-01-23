<script>
	import { SCHEDULE_COLORS } from '$lib/scheduleService';
	import { getActiveCategories } from '$lib/scheduleCategoryService';
	import { onMount } from 'svelte';

	let {
		schedule = null,
		selectedDate = null,
		categories = [],
		categoryLevel = null,
		onSubmit = () => {},
		onCancel = () => {}
	} = $props();

	/**
	 * @typedef {Object} Category
	 * @property {string} value
	 * @property {string} label
	 * @property {string} [color]
	 */
	
	/** @type {Category[]} */
	let availableCategories = $state([]);
	let isLoadingCategories = $state(false);

	// categories prop 변경 시 availableCategories 업데이트
	$effect(() => {
		const currentCategories = categories;
		if (currentCategories.length > 0) {
			availableCategories = currentCategories;
		}
	});

	onMount(async () => {
		// categories prop이 없으면 DB에서 로드
		if (categories.length === 0) {
			isLoadingCategories = true;
			const { data, error } = await getActiveCategories(categoryLevel);
			if (!error && data) {
				availableCategories = data.map(cat => ({
					value: cat.value,
					label: cat.label,
					color: cat.color
				}));
			}
			isLoadingCategories = false;
		}
	});

	let title = $state('');
	let description = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let category = $state('general');
	let color = $state(SCHEDULE_COLORS.blue);
	let isAllDay = $state(false);
	let location = $state('');
	let isSubmitting = $state(false);

	// schedule prop 변경 시 폼 필드 초기화
	$effect(() => {
		const currentSchedule = schedule;
		const currentSelectedDate = selectedDate;
		const currentAvailableCategories = availableCategories;

		if (currentSchedule) {
			title = currentSchedule.title || '';
			description = currentSchedule.description || '';
			startDate = currentSchedule.start_date 
				? new Date(currentSchedule.start_date).toISOString().slice(0, 16)
				: '';
			endDate = currentSchedule.end_date 
				? new Date(currentSchedule.end_date).toISOString().slice(0, 16)
				: '';
			category = currentSchedule.category || (currentAvailableCategories.length > 0 ? currentAvailableCategories[0].value : 'general');
			color = currentSchedule.color || SCHEDULE_COLORS.blue;
			isAllDay = currentSchedule.is_all_day || false;
			location = currentSchedule.location || '';
		} else if (currentSelectedDate) {
			// 선택된 날짜가 있으면 해당 날짜로 초기화
			const date = new Date(currentSelectedDate);
			date.setHours(9, 0, 0, 0); // 기본 오전 9시
			startDate = date.toISOString().slice(0, 16);
			date.setHours(10, 0, 0, 0); // 기본 오전 10시 (1시간 후)
			endDate = date.toISOString().slice(0, 16);
		} else {
			// 빈 폼
			title = '';
			description = '';
			startDate = '';
			endDate = '';
			category = currentAvailableCategories.length > 0 ? currentAvailableCategories[0].value : 'general';
			color = SCHEDULE_COLORS.blue;
			isAllDay = false;
			location = '';
		}
	});

	function handleSubmit() {
		if (!title.trim()) {
			alert('제목을 입력해주세요.');
			return;
		}

		if (!startDate || !endDate) {
			alert('시작일과 종료일을 입력해주세요.');
			return;
		}

		const start = new Date(startDate);
		const end = new Date(endDate);

		if (end < start) {
			alert('종료일은 시작일 이후여야 합니다.');
			return;
		}

		isSubmitting = true;
		onSubmit({
			title: title.trim(),
			description: description.trim() || null,
			start_date: start.toISOString(),
			end_date: end.toISOString(),
			category,
			color,
			is_all_day: isAllDay,
			location: location.trim() || null
		});
	}

	function handleCancel() {
		onCancel();
	}
</script>

<div class="space-y-4">
	<!-- 제목 -->
	<div>
		<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
			제목 <span class="text-red-500">*</span>
		</label>
		<input
			type="text"
			id="title"
			bind:value={title}
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="일정 제목을 입력하세요"
			required
		/>
	</div>

	<!-- 시작일/종료일 -->
	<div class="space-y-4">
		<div>
			<label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
				시작일 <span class="text-red-500">*</span>
			</label>
			<input
				type="datetime-local"
				id="startDate"
				bind:value={startDate}
				class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			/>
		</div>
		<div>
			<label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
				종료일 <span class="text-red-500">*</span>
			</label>
			<input
				type="datetime-local"
				id="endDate"
				bind:value={endDate}
				class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			/>
		</div>
	</div>

	<!-- 종일 여부 / 카테고리 -->
	<div class="grid grid-cols-12 gap-4">
		<!-- 종일 여부 -->
		<div class="col-span-4 flex items-center">
			<input
				type="checkbox"
				id="isAllDay"
				bind:checked={isAllDay}
				class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
			/>
			<label for="isAllDay" class="ml-2 text-sm text-gray-700">
				종일 일정
			</label>
		</div>

		<!-- 카테고리 -->
		<div class="col-span-8">
			<!-- <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
				카테고리
			</label> -->
			{#if isLoadingCategories}
				<select
					id="category"
					disabled
					class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
				>
					<option>카테고리 로딩 중...</option>
				</select>
			{:else}
				<select
					id="category"
					bind:value={category}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each availableCategories as cat}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</select>
			{/if}
		</div>
	</div>

	<!-- 색상 -->
	<div>
		<label for="schedule-color" class="block text-sm font-medium text-gray-700 mb-2">
			색상
		</label>
		<div id="schedule-color" class="flex gap-2">
			{#each Object.entries(SCHEDULE_COLORS) as [name, hex]}
				<button
					type="button"
					onclick={() => color = hex}
					class="w-8 h-8 rounded-full border-2 {color === hex ? 'border-gray-800' : 'border-gray-300'}"
					style="background-color: {hex}"
					title={name}
				></button>
			{/each}
		</div>
	</div>

	<!-- 장소 -->
	<!-- <div>
		<label for="location" class="block text-sm font-medium text-gray-700 mb-1">
			장소
		</label>
		<input
			type="text"
			id="location"
			bind:value={location}
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="장소를 입력하세요"
		/>
	</div> -->

	<!-- 설명 -->
	<div>
		<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
			설명
		</label>
		<textarea
			id="description"
			bind:value={description}
			rows="2"
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="일정에 대한 설명을 입력하세요"
		></textarea>
	</div>

	<!-- 버튼 -->
	<div class="flex gap-2 pt-4">
		<button
			type="button"
			onclick={handleCancel}
			class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
			disabled={isSubmitting}
		>
			취소
		</button>
		<button
			type="button"
			onclick={handleSubmit}
			class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
			disabled={isSubmitting}
		>
			{isSubmitting ? '저장 중...' : schedule ? '수정' : '생성'}
		</button>
	</div>
</div>
