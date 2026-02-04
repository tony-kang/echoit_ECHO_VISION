<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	/**
	 * @typedef {Object} FilterField
	 * @property {string} key - 필터 키
	 * @property {'select' | 'select-multiple' | 'input' | 'date' | 'checkbox'} type - 필터 타입
	 * @property {string} [label] - 라벨
	 * @property {string} [placeholder] - placeholder (input 타입용)
	 * @property {Array<{value: string, label: string, hasChildren?: boolean}> | Record<string, string>} [options] - 옵션 (select 타입용)
	 */
	
	/** @type {Record<string, boolean>} 각 필드별 드롭다운 열림 상태 */
	let dropdownOpen = $state({});

	/**
	 * @typedef {Object} ActionButton
	 * @property {string} label - 버튼 라벨
	 * @property {Function} onClick - 클릭 핸들러
	 * @property {'primary' | 'secondary'} [variant] - 버튼 스타일 (기본값: 'primary')
	 * @property {string} [icon] - 아이콘 (이모지 또는 텍스트)
	 * @property {boolean} [disabled] - 버튼 비활성화 여부
	 */

	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {Record<string, any>} [filters] - 필터 객체 (bind:value로 바인딩, 필터가 있는 경우)
	 * @property {FilterField[]} [fields] - 필터 필드 정의 배열 (필터가 있는 경우)
	 * @property {Function} [onApply] - 필터 적용 핸들러 (필터가 있는 경우)
	 * @property {Function} [onReset] - 필터 초기화 핸들러 (필터가 있는 경우)
	 * @property {ActionButton[]} [actions] - 액션 버튼 배열 (버튼이 있는 경우)
	 */
	let { filters = $bindable(), fields = [], onApply, onReset, actions = [] } = $props();

	/**
	 * 필터 적용 핸들러
	 */
	function handleApply() {
		if (onApply) {
			onApply();
		}
	}

	/**
	 * 필터 초기화 핸들러
	 */
	function handleReset() {
		// URL 쿼리 파라미터 제거
		const currentPath = page.url.pathname;
		goto(currentPath, { replaceState: true, noScroll: true });

		// 필터 초기화 콜백 호출
		if (onReset) {
			onReset();
		}
	}

	/**
	 * 엔터키 입력 핸들러
	 * @param {KeyboardEvent} event - 키보드 이벤트
	 */
	function handleKeyDown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleApply();
		}
	}

	/**
	 * 옵션 배열 변환 (Record<string, string> 형태를 배열로 변환)
	 * @param {Array<{value: string, label: string}> | Record<string, string> | undefined} options
	 * @returns {Array<{value: string, label: string}>}
	 */
	function normalizeOptions(options) {
		if (!options) return [];
		if (Array.isArray(options)) return options;
		return Object.entries(options).map(([value, label]) => ({ value, label }));
	}

	/**
	 * 드롭다운 토글
	 * @param {string} fieldKey - 필드 키
	 */
	function toggleDropdown(fieldKey) {
		dropdownOpen[fieldKey] = !dropdownOpen[fieldKey];
		dropdownOpen = { ...dropdownOpen };
	}

	/**
	 * 드롭다운 닫기
	 * @param {string} fieldKey - 필드 키
	 */
	function closeDropdown(fieldKey) {
		dropdownOpen[fieldKey] = false;
		dropdownOpen = { ...dropdownOpen };
	}

	/**
	 * 체크박스 변경 핸들러
	 * @param {string} fieldKey - 필드 키
	 * @param {string} value - 옵션 값
	 * @param {boolean} checked - 체크 상태
	 */
	function handleCheckboxChange(fieldKey, value, checked) {
		const currentValues = Array.isArray(filters[fieldKey]) ? filters[fieldKey] : [];
		if (checked) {
			if (!currentValues.includes(value)) {
				filters[fieldKey] = [...currentValues, value];
			}
		} else {
			filters[fieldKey] = currentValues.filter(v => v !== value);
		}
		filters = { ...filters };
	}

	/**
	 * 하위코드 확장 아이콘 클릭 핸들러 (체크하고 dropdown 닫기)
	 * @param {string} fieldKey - 필드 키
	 * @param {string} value - 옵션 값
	 * @param {MouseEvent} event - 마우스 이벤트
	 */
	function handleExpandClick(fieldKey, value, event) {
		event.preventDefault();
		event.stopPropagation();
		
		// 체크박스를 체크 상태로 변경
		const currentValues = Array.isArray(filters[fieldKey]) ? filters[fieldKey] : [];
		if (!currentValues.includes(value)) {
			handleCheckboxChange(fieldKey, value, true);
		}
		
		// dropdown 닫기
		closeDropdown(fieldKey);
	}

	/**
	 * 전체 선택/해제 핸들러
	 * @param {string} fieldKey - 필드 키
	 * @param {Array<{value: string, label: string}>} options - 옵션 목록
	 * @param {boolean} selectAll - 전체 선택 여부
	 */
	function handleSelectAll(fieldKey, options, selectAll) {
		if (selectAll) {
			filters[fieldKey] = options.map(opt => opt.value);
		} else {
			filters[fieldKey] = [];
		}
		filters = { ...filters };
	}

	/**
	 * 외부 클릭 감지 핸들러
	 * @param {MouseEvent} event - 마우스 이벤트
	 */
	function handleClickOutside(event) {
		const target = event.target;
		if (!target || !(target instanceof Element)) return;

		// 모든 열린 드롭다운 확인
		for (const fieldKey in dropdownOpen) {
			if (dropdownOpen[fieldKey]) {
				// 클릭된 요소가 해당 드롭다운 내부에 있는지 확인
				const wrapper = target.closest(`[data-dropdown="${fieldKey}"]`);
				if (!wrapper) {
					closeDropdown(fieldKey);
				}
			}
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="filter-bar">
	{#if fields && fields.length > 0}
		<div class="filter-grid">
			{#each fields as field}
				{#if field.type === 'select'}
					<select 
						bind:value={filters[field.key]} 
						class="filter-input"
						onchange={handleApply}
					>
						<option value="">{field.label || '전체'}</option>
						{#each normalizeOptions(field.options) as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				{:else if field.type === 'select-multiple'}
					<div class="filter-dropdown-wrapper" data-dropdown={field.key}>
						<button
							type="button"
							onclick={() => toggleDropdown(field.key)}
							class="filter-input filter-dropdown-button"
						>
							<span class="filter-dropdown-text">
								{#if filters[field.key] && Array.isArray(filters[field.key]) && filters[field.key].length > 0}
									{filters[field.key].length}개 선택됨
								{:else}
									{field.label || '선택하세요'}
								{/if}
							</span>
							<svg
								class="filter-dropdown-icon {dropdownOpen[field.key] ? 'rotate-180' : ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{#if dropdownOpen[field.key]}
							{@const options = normalizeOptions(field.options)}
							{@const selectedValues = Array.isArray(filters[field.key]) ? filters[field.key] : []}
							{@const allSelected = options.length > 0 && selectedValues.length === options.length}
							<div class="filter-dropdown-menu">
								<div class="filter-dropdown-header">
									<label class="filter-dropdown-checkbox-label">
										<input
											type="checkbox"
											checked={allSelected}
											onchange={(e) => handleSelectAll(field.key, options, e.target.checked)}
											class="filter-dropdown-checkbox"
										/>
										<span class="filter-dropdown-checkbox-text">
											전체 선택 ({selectedValues.length}/{options.length})
										</span>
									</label>
								</div>
								<div class="filter-dropdown-list">
									{#each options as option}
										{@const isChecked = selectedValues.includes(option.value)}
										{@const hasChildren = option.hasChildren || false}
										<label class="filter-dropdown-item">
											<input
												type="checkbox"
												checked={isChecked}
												onchange={(e) => handleCheckboxChange(field.key, option.value, e.target.checked)}
												onclick={(e) => e.stopPropagation()}
												class="filter-dropdown-checkbox"
											/>
											<span class="filter-dropdown-item-text">{option.label}</span>
											{#if hasChildren}
												<button
													type="button"
													onclick={(e) => handleExpandClick(field.key, option.value, e)}
													class="filter-dropdown-expand-btn"
													title="하위코드 선택"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
													</svg>
												</button>
											{/if}
										</label>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else if field.type === 'input'}
					<input
						type="text"
						bind:value={filters[field.key]}
						placeholder={field.placeholder || ''}
						class="filter-input"
						onkeydown={handleKeyDown}
					/>
				{:else if field.type === 'date'}
					<input
						type="date"
						bind:value={filters[field.key]}
						class="filter-input"
					/>
				{:else if field.type === 'checkbox'}
					<label class="filter-checkbox">
						<input
							type="checkbox"
							bind:checked={filters[field.key]}
							onchange={handleApply}
							class="filter-checkbox-input"
						/>
						<span class="filter-checkbox-label">{field.label || ''}</span>
					</label>
				{/if}
			{/each}
		</div>
	{/if}
	
	<div class="filter-actions">
		{#if fields && fields.length > 0}
			<button
				onclick={handleApply}
				class="filter-btn filter-btn-apply"
				title="필터 적용"
				aria-label="필터 적용"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
				</svg>
			</button>
			<button
				onclick={handleReset}
				class="filter-btn filter-btn-reset"
				title="필터 초기화"
				aria-label="필터 초기화"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
		
		{#each actions as action}
			<button
				onclick={action.onClick}
				disabled={action.disabled || false}
				class="action-btn action-btn-{action.variant || 'primary'} {action.disabled ? 'action-btn-disabled' : ''}"
				title={action.label}
				aria-label={action.label}
			>
				{#if action.icon}
					<span class="action-icon">{action.icon}</span>
				{/if}
				<span class="action-label">{action.label}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.filter-bar {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 16px;
		margin-bottom: 20px;
	}

	.filter-grid {
		display: flex;
		gap: 12px;
		flex: 1;
		align-items: center;
		flex-wrap: wrap;
		margin-right: auto;
	}
	
	.filter-grid:empty {
		display: none;
	}

	.filter-input {
		height: 36px;
		padding: 0 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		background: white;
		color: #374151;
		transition: all 0.2s;
		min-width: 150px;
		box-sizing: border-box;
	}

	.filter-dropdown-wrapper {
		position: relative;
		min-width: 150px;
	}

	.filter-dropdown-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		cursor: pointer;
		text-align: left;
	}

	.filter-dropdown-text {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.filter-dropdown-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		transition: transform 0.2s;
		color: #6b7280;
	}

	.filter-dropdown-icon.rotate-180 {
		transform: rotate(180deg);
	}

	.filter-dropdown-menu {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		z-index: 1000;
		max-height: 300px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: max-content;
	}

	.filter-dropdown-header {
		padding: 8px 12px;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.filter-dropdown-checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.filter-dropdown-checkbox {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #667eea;
	}

	.filter-dropdown-checkbox-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-dropdown-list {
		overflow-y: auto;
		max-height: 250px;
	}

	.filter-dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		cursor: pointer;
		transition: background-color 0.15s;
		border-bottom: 1px solid #f3f4f6;
		min-width: 0;
	}

	.filter-dropdown-item:hover {
		background-color: #f9fafb;
	}

	.filter-dropdown-item:last-child {
		border-bottom: none;
	}

	.filter-dropdown-item-text {
		font-size: 0.9rem;
		color: #374151;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.filter-dropdown-expand-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.filter-dropdown-expand-btn:hover {
		background-color: #e5e7eb;
		color: #374151;
	}

	.filter-dropdown-expand-btn:active {
		background-color: #d1d5db;
	}

	.filter-checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		user-select: none;
		padding: 8px 12px;
		border-radius: 6px;
		transition: background 0.2s;
	}

	.filter-checkbox:hover {
		background: #f9fafb;
	}

	.filter-checkbox-input {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: #667eea;
	}

	.filter-checkbox-label {
		font-size: 0.9rem;
		color: #374151;
		font-weight: 500;
	}

	.filter-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.filter-input::placeholder {
		color: #9ca3af;
	}

	.filter-actions {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-shrink: 0;
	}

	.filter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.filter-btn:hover {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #374151;
	}

	.filter-btn-apply:hover {
		background: #eff6ff;
		border-color: #667eea;
		color: #667eea;
	}

	.filter-btn-reset:hover {
		background: #fef2f2;
		border-color: #ef4444;
		color: #ef4444;
	}

	.filter-btn:active {
		transform: scale(0.95);
	}

	.filter-btn svg {
		width: 16px;
		height: 16px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 36px;
		padding: 0 16px;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
		white-space: nowrap;
		box-sizing: border-box;
	}

	.action-btn-primary {
		background: #2563eb;
		color: white;
	}

	.action-btn-primary:hover {
		background: #1d4ed8;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
	}

	.action-btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.action-btn-secondary:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.action-btn-disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.action-btn-disabled:hover {
		transform: none;
		box-shadow: none;
	}

	.action-btn:active {
		transform: scale(0.98);
	}

	.action-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.action-label {
		line-height: 1;
	}

	@media (max-width: 1024px) {
		.filter-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-grid {
			width: 100%;
		}

		.filter-input {
			flex: 1;
			min-width: 0;
		}

		.filter-actions {
			justify-content: flex-end;
			width: 100%;
		}
		
		.action-btn {
			height: 40px;
			padding: 0 14px;
			font-size: 0.85rem;
		}
		
		.filter-input {
			height: 40px;
		}
		
		.filter-btn {
			width: 40px;
			height: 40px;
		}
	}
</style>
