<script>
	/**
	 * 컴포넌트 Props
	 * @type {{
	 *   type: 'sales' | 'cost' | 'profit',
	 *   planned: number,
	 *   expected: number,
	 *   actual: number,
	 *   month: number,
	 *   onUpdate?: (month: number, planned: number, expected: number) => void
	 * }}
	 */
	let { type, planned, expected, actual, month, onUpdate } = $props();

	/** @type {boolean} 수정 모드 */
	let isEditing = $state(false);
	/** @type {string} 수정 중인 계획 값 (천단위 콤마 포함) */
	let editingPlannedDisplay = $state('');
	/** @type {string} 수정 중인 예상 값 (천단위 콤마 포함) */
	let editingExpectedDisplay = $state('');

	// props 변경 시 editing 값 업데이트 (원 단위를 천원 단위로 변환하여 표시)
	$effect(() => {
		if (!isEditing) {
			editingPlannedDisplay = formatNumberWithComma(planned / 1000); // 원 -> 천원 변환
			editingExpectedDisplay = formatNumberWithComma(expected / 1000); // 원 -> 천원 변환
		}
	});

	/**
	 * 숫자 문자열을 천단위 콤마가 포함된 문자열로 변환
	 * @param {string | number} value - 숫자 값
	 * @returns {string}
	 */
	function formatNumberWithComma(value) {
		if (value === null || value === undefined || value === '') return '';
		const numStr = String(value).replace(/,/g, '');
		const num = parseFloat(numStr);
		if (isNaN(num)) return '';
		return new Intl.NumberFormat('ko-KR').format(num);
	}

	/**
	 * 천단위 콤마가 포함된 문자열을 숫자로 변환
	 * @param {string} value - 콤마가 포함된 문자열
	 * @returns {number}
	 */
	function parseNumberFromComma(value) {
		if (!value) return 0;
		const numStr = String(value).replace(/,/g, '');
		const num = parseFloat(numStr);
		return isNaN(num) ? 0 : num;
	}

	/**
	 * 금액 포맷팅 (천원 단위)
	 * @param {number} value - 금액 (원 단위)
	 * @returns {string}
	 */
	function formatCurrency(value) {
		const thousandValue = value / 1000; // 천원 단위로 변환
		return new Intl.NumberFormat('ko-KR').format(Math.round(thousandValue));
	}

	/**
	 * 수정 모드 시작
	 */
	function startEdit() {
		if (type === 'profit') return; // 이익은 수정 불가
		isEditing = true;
		editingPlannedDisplay = formatNumberWithComma(planned / 1000); // 원 -> 천원 변환
		editingExpectedDisplay = formatNumberWithComma(expected / 1000); // 원 -> 천원 변환
	}

	/**
	 * 수정 취소
	 */
	function cancelEdit() {
		isEditing = false;
		editingPlannedDisplay = formatNumberWithComma(planned / 1000); // 원 -> 천원 변환
		editingExpectedDisplay = formatNumberWithComma(expected / 1000); // 원 -> 천원 변환
	}

	/**
	 * 수정 저장
	 */
	function saveEdit() {
		if (onUpdate) {
			// 입력된 값은 천원 단위이므로 그대로 전달 (부모에서 원 단위로 변환하여 저장)
			const plannedNum = parseNumberFromComma(editingPlannedDisplay);
			const expectedNum = parseNumberFromComma(editingExpectedDisplay);
			onUpdate(month, plannedNum, expectedNum);
		}
		isEditing = false;
	}

	/**
	 * 이익인 경우 색상 클래스 반환
	 * @returns {string}
	 */
	const profitColorClass = $derived(type === 'profit' && actual >= 0 ? 'text-green-600' : type === 'profit' && actual < 0 ? 'text-red-600' : '');
	
	/**
	 * 수정 가능 여부
	 */
	const canEdit = $derived(type !== 'profit');
</script>

<td class="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
	{#if isEditing && canEdit}
		<div class="space-y-2">
			<div class="flex justify-between items-center gap-2">
				<span class="text-gray-500 text-xs opacity-70">계획:</span>
				<input
					type="text"
					bind:value={editingPlannedDisplay}
					oninput={(e) => {
						const num = parseNumberFromComma(e.target.value);
						editingPlannedDisplay = formatNumberWithComma(num);
					}}
					class="w-28 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
					placeholder="계획"
				/>
			</div>
			<div class="flex justify-between items-center gap-2">
				<span class="text-blue-600 text-xs opacity-70">예상:</span>
				<input
					type="text"
					bind:value={editingExpectedDisplay}
					oninput={(e) => {
						const num = parseNumberFromComma(e.target.value);
						editingExpectedDisplay = formatNumberWithComma(num);
					}}
					class="w-28 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
					placeholder="예상"
				/>
			</div>
			<div class="flex justify-end gap-1 mt-2">
				<button
					onclick={saveEdit}
					class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
					type="button"
				>
					저장
				</button>
				<button
					onclick={cancelEdit}
					class="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
					type="button"
				>
					취소
				</button>
			</div>
		</div>
	{:else}
		<div class="space-y-1">
			<div class="flex justify-between items-center group">
				<span class="text-gray-500 text-xs opacity-70">계획</span>
				<span class="text-gray-700 text-xs font-medium">{formatCurrency(planned)}</span>
			</div>
			<div class="flex justify-between items-center group">
				<span class="text-blue-600 text-xs opacity-70">예상</span>
				<span class="text-blue-700 text-xs font-medium">{formatCurrency(expected)}</span>
			</div>
			<div class="flex justify-between items-center">
				<span class="{profitColorClass} text-xs opacity-70">실제</span>
				<span class="text-xs {profitColorClass} font-medium">{formatCurrency(actual)}</span>
			</div>
			{#if canEdit}
				<button
					onclick={startEdit}
					class="w-full mt-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
					type="button"
				>
					수정
				</button>
			{/if}
		</div>
	{/if}
</td>
