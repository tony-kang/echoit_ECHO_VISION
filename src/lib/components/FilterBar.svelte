<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	/**
	 * @typedef {Object} FilterField
	 * @property {string} key - 필터 키
	 * @property {'select' | 'input' | 'date'} type - 필터 타입
	 * @property {string} [label] - 라벨
	 * @property {string} [placeholder] - placeholder (input 타입용)
	 * @property {Array<{value: string, label: string}> | Record<string, string>} [options] - 옵션 (select 타입용)
	 */

	/**
	 * @typedef {Object} ActionButton
	 * @property {string} label - 버튼 라벨
	 * @property {Function} onClick - 클릭 핸들러
	 * @property {'primary' | 'secondary'} [variant] - 버튼 스타일 (기본값: 'primary')
	 * @property {string} [icon] - 아이콘 (이모지 또는 텍스트)
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
</script>

<div class="filter-bar">
	{#if fields && fields.length > 0}
		<div class="filter-grid">
			{#each fields as field}
				{#if field.type === 'select'}
					<select bind:value={filters[field.key]} class="filter-input">
						<option value="">{field.label || '전체'}</option>
						{#each normalizeOptions(field.options) as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
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
				class="action-btn action-btn-{action.variant || 'primary'}"
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

	@media (max-width: 768px) {
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

