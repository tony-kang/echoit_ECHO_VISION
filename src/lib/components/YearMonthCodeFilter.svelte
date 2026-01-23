<script>
	/**
	 * 연도/월/코드 필터 컴포넌트
	 * @typedef {Object} Props
	 * @property {number|null} selectedYear - 선택된 연도
	 * @property {number|null} selectedMonth - 선택된 월 (null이면 전체)
	 * @property {string|null} selectedCode - 선택된 코드
	 * @property {Array<any>} codeOptions - 코드 옵션 목록
	 * @property {string} codeLabel - 코드 필터 라벨 (기본값: "매출 구분")
	 * @property {function} onFilterChange - 필터 변경 시 호출할 함수
	 */
	
	/** @type {{ selectedYear: number|null, selectedMonth: number|null, selectedCode: string|null, codeOptions: Array<any>, codeLabel?: string, onFilterChange: function }} */
	let { 
		selectedYear = $bindable(null),
		selectedMonth = $bindable(null),
		selectedCode = $bindable(null),
		codeOptions = $bindable([]),
		codeLabel = '매출 구분',
		onFilterChange = () => {}
	} = $props();
	
	/** @type {string} 고유 ID */
	const componentId = `filter-${Math.random().toString(36).substring(2, 9)}`;

	/**
	 * 최근 5년 목록 생성
	 * @type {number[]}
	 */
	const recentYears = $derived.by(() => {
		const currentYear = new Date().getFullYear();
		const years = [];
		for (let i = 0; i < 5; i++) {
			years.push(currentYear - i);
		}
		return years;
	});

	/**
	 * 월 목록 (1~12)
	 * @type {number[]}
	 */
	const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	/**
	 * 연도 변경 핸들러
	 * @param {Event} event - 이벤트 객체
	 * @returns {void}
	 */
	function handleYearChange(event) {
		selectedYear = parseInt(event.target.value) || null;
		onFilterChange();
	}

	/**
	 * 월 변경 핸들러
	 * @param {Event} event - 이벤트 객체
	 * @returns {void}
	 */
	function handleMonthChange(event) {
		const value = event.target.value;
		selectedMonth = value === '' || value === 'null' ? null : parseInt(value) || null;
		onFilterChange();
	}

	/**
	 * 코드 변경 핸들러
	 * @param {Event} event - 이벤트 객체
	 * @returns {void}
	 */
	function handleCodeChange(event) {
		selectedCode = event.target.value || null;
		onFilterChange();
	}

	// 기본 연도 설정
	$effect(() => {
		if (!selectedYear && recentYears.length > 0) {
			selectedYear = recentYears[0];
		}
	});
</script>

<div class="bg-white rounded-lg shadow-md p-4 mb-6">
	<div class="flex items-center gap-4 flex-wrap">
		<label for="year-select-{componentId}" class="text-sm font-medium text-gray-700 whitespace-nowrap">
			연도:
		</label>
		<select
			id="year-select-{componentId}"
			bind:value={selectedYear}
			onchange={handleYearChange}
			class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			{#each recentYears as year}
				<option value={year}>{year}년</option>
			{/each}
		</select>
		
		<label for="month-select-{componentId}" class="text-sm font-medium text-gray-700 whitespace-nowrap">
			월:
		</label>
		<select
			id="month-select-{componentId}"
			value={selectedMonth ?? ''}
			onchange={handleMonthChange}
			class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value="">전체</option>
			{#each months as month}
				<option value={month}>{month}월</option>
			{/each}
		</select>
		
		<label for="code-select-{componentId}" class="text-sm font-medium text-gray-700 whitespace-nowrap">
			{codeLabel}:
		</label>
		<select
			id="code-select-{componentId}"
			bind:value={selectedCode}
			onchange={handleCodeChange}
			class="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			{#if codeOptions.length === 0}
				<option value="">접근 가능한 코드가 없습니다</option>
			{:else}
				{#each codeOptions as option}
					<option value={option.code}>
						{option.code} - {option.title}
					</option>
				{/each}
			{/if}
		</select>
	</div>
</div>
