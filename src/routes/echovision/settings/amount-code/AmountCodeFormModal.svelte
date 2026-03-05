<script>
	/**
	 * 매출/비용 코드 추가·수정 폼 모달
	 * @type {Object} Props
	 * @property {boolean} open - 모달 표시 여부
	 * @property {any} editingEvCode - 수정 대상 (null이면 추가)
	 * @property {string} formCode
	 * @property {string} formCategory
	 * @property {string} formTitle
	 * @property {string[]} formItems
	 * @property {string} formComment
	 * @property {number} formDisplayOrder
	 * @property {string} newItemValue
	 * @property {string} itemSearchQuery
	 * @property {boolean} showItemDropdown
	 * @property {Set<string>} selectedItems - 구성항목 체크박스 선택 집합
	 * @property {Array<{value: string, label: string}>} filteredTopLevelEnvCodes
	 * @property {Array<{value: string, label: string}>} filteredItemOptions - 검색된 구성항목 (검색 결과 없음 메시지용)
	 * @property {Array<{value: string, label: string}>} selectableItemOptions
	 * @property {boolean} isSaving
	 * @property {() => void} onCategoryChange
	 * @property {() => void} onCancel
	 * @property {() => void} onSave
	 * @property {() => void} onAddItem
	 * @property {(index: number) => void} onRemoveItem
	 * @property {(value: string) => void} onSelectItem
	 * @property {(value: string, checked: boolean) => void} onCheckboxChange
	 * @property {(e: MouseEvent) => void} onAddSelectedItems
	 * @property {(selectAll: boolean) => void} onSelectAll
	 * @property {(e: Event) => void} onItemSearchInput
	 */
	let {
		open = false,
		editingEvCode = null,
		formCode = $bindable(''),
		formCategory = $bindable(''),
		formTitle = $bindable(''),
		formItems = $bindable([]),
		formComment = $bindable(''),
		formDisplayOrder = $bindable(0),
		newItemValue = $bindable(''),
		itemSearchQuery = $bindable(''),
		showItemDropdown = $bindable(false),
		selectedItems = new Set(),
		filteredTopLevelEnvCodes = [],
		filteredItemOptions = [],
		selectableItemOptions = [],
		isSaving = false,
		onCategoryChange,
		onCancel,
		onSave,
		onAddItem,
		onRemoveItem,
		onSelectItem,
		onCheckboxChange,
		onAddSelectedItems,
		onSelectAll,
		onItemSearchInput
	} = $props();

	/** 드롭다운 onblur 시 포커스 확인 후 닫기
	 * @returns {void}
	 */
	function handleItemDropdownBlur() {
		setTimeout(() => {
			const activeElement = document.activeElement;
			const dropdown = document.querySelector('.item-dropdown');
			if (!dropdown?.contains(activeElement)) {
				showItemDropdown = false;
			}
		}, 200);
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={onCancel}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="text-xl font-bold">{editingEvCode ? '코드 수정' : '코드 추가'}</h2>
				<button type="button" onclick={onCancel} class="modal-close" aria-label="닫기">×</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label class="form-label" for="formCategory">구분 *</label>
					<select
						id="formCategory"
						bind:value={formCategory}
						onchange={onCategoryChange}
						class="form-input"
						disabled={!!editingEvCode}
					>
						<option value="">구분을 선택하세요</option>
						<option value="sales">매출</option>
						<option value="cost">비용</option>
					</select>
					{#if editingEvCode}
						<p class="text-xs text-gray-500 mt-1">구분은 수정할 수 없습니다.</p>
					{:else if !formCategory}
						<p class="text-xs text-gray-500 mt-1">구분을 먼저 선택해주세요.</p>
					{/if}
				</div>

				{#if formCategory || editingEvCode}
					<div class="form-group">
						<label class="form-label" for="formCode">코드 *</label>
						{#if editingEvCode}
							<input
								type="text"
								id="formCode"
								value={formCode}
								class="form-input"
								readonly
								disabled
							/>
							<p class="text-xs text-gray-500 mt-1">코드는 수정할 수 없습니다.</p>
						{:else}
							<select
								id="formCode"
								bind:value={formCode}
								class="form-input"
								disabled={!formCategory || filteredTopLevelEnvCodes.length === 0}
							>
								<option value="">코드를 선택하세요</option>
								{#each filteredTopLevelEnvCodes as option (option.value)}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
							{#if !formCategory}
								<p class="text-xs text-gray-500 mt-1">구분을 먼저 선택해주세요.</p>
							{:else if filteredTopLevelEnvCodes.length === 0}
								<p class="text-xs text-gray-500 mt-1">선택 가능한 최상위 레벨 코드가 없습니다.</p>
							{:else if formCode}
								<p class="text-xs text-green-600 mt-1">코드가 선택되었습니다.</p>
							{/if}
						{/if}
					</div>

					<div class="form-group">
						<label class="form-label" for="formTitle">제목</label>
						<input
							type="text"
							id="formTitle"
							bind:value={formTitle}
							placeholder="제목을 입력하세요"
							class="form-input"
						/>
					</div>

					<div class="form-group">
						<label class="form-label" for="itemSearchInput">구성항목</label>
						<div class="item-search-container relative">
							<div class="flex gap-2 mb-2">
								<div class="flex-1 relative">
									<input
										id="itemSearchInput"
										type="text"
										bind:value={itemSearchQuery}
										oninput={onItemSearchInput}
										onfocus={() => (showItemDropdown = true)}
										onblur={handleItemDropdownBlur}
										placeholder="코드 또는 제목으로 검색..."
										class="form-input w-full"
									/>
									{#if showItemDropdown && selectableItemOptions.length > 0}
										<div
											class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto item-dropdown"
											onmousedown={(e) => e.preventDefault()}
										>
											<div class="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
												<div class="flex items-center gap-2">
													<input
														type="checkbox"
														checked={selectedItems.size === selectableItemOptions.length && selectableItemOptions.length > 0}
														onchange={(e) => {
															e.stopPropagation();
															onSelectAll(e.target.checked);
														}}
														onmousedown={(e) => e.stopPropagation()}
														class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
													/>
													<span class="text-sm font-medium text-gray-700">
														전체 선택 ({selectedItems.size}/{selectableItemOptions.length})
													</span>
												</div>
												{#if selectedItems.size > 0}
													<button
														type="button"
														onclick={onAddSelectedItems}
														onmousedown={(e) => e.preventDefault()}
														class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
													>
														선택한 {selectedItems.size}개 추가
													</button>
												{/if}
											</div>
											{#each selectableItemOptions as option (option.value)}
												<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
												<label
													class="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
													onmousedown={(e) => e.preventDefault()}
												>
													<input
														type="checkbox"
														checked={selectedItems.has(option.value)}
														onchange={(e) => {
															e.stopPropagation();
															onCheckboxChange(option.value, e.target.checked);
														}}
														onmousedown={(e) => e.stopPropagation()}
														class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
													/>
													<div class="flex-1">
														<div class="font-mono text-sm text-gray-700">{option.value}</div>
														<div class="text-xs text-gray-500">{option.label.replace(`${option.value} - `, '')}</div>
													</div>
													<button
														type="button"
														onmousedown={(e) => {
															e.preventDefault();
															e.stopPropagation();
														}}
														onclick={(e) => {
															e.stopPropagation();
															onSelectItem(option.value);
														}}
														class="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
													>
														추가
													</button>
												</label>
											{/each}
										</div>
									{/if}
									{#if showItemDropdown && itemSearchQuery && filteredItemOptions.length === 0}
										<div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-500">
											검색 결과가 없습니다.
										</div>
									{/if}
								</div>
								<button
									type="button"
									onclick={onAddItem}
									class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
									disabled={!newItemValue || formItems.includes(newItemValue)}
								>
									추가
								</button>
							</div>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each formItems as item, index (item)}
								<span class="px-3 py-1 bg-gray-100 rounded flex items-center gap-2">
									<span class="font-mono text-sm">{item}</span>
									<button
										type="button"
										onclick={() => onRemoveItem(index)}
										class="text-red-500 hover:text-red-700"
										title="삭제"
										aria-label="삭제"
									>
										×
									</button>
								</span>
							{/each}
						</div>
						{#if formItems.length === 0}
							<p class="text-xs text-gray-500 mt-1">항목이 없습니다. 위에서 항목을 검색하여 추가하세요.</p>
						{/if}
					</div>

					<div class="form-group">
						<label class="form-label" for="formComment">설명</label>
						<textarea
							id="formComment"
							bind:value={formComment}
							placeholder="설명을 입력하세요"
							class="form-input"
							rows="3"
						></textarea>
					</div>

					<div class="form-group">
						<label class="form-label" for="formDisplayOrder">출력순서</label>
						<input
							type="number"
							id="formDisplayOrder"
							bind:value={formDisplayOrder}
							placeholder="출력순서를 입력하세요 (작은 값이 먼저 표시됨)"
							class="form-input"
							min="0"
						/>
						<p class="text-xs text-gray-500 mt-1">작은 값이 먼저 표시됩니다. 기본값은 0입니다.</p>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button
					type="button"
					onclick={onCancel}
					class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
					disabled={isSaving}
				>
					취소
				</button>
				{#if formCategory || editingEvCode}
					<button
						type="button"
						onclick={onSave}
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						disabled={isSaving}
					>
						{isSaving ? '저장 중...' : '저장'}
					</button>
				{/if}
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
		border-radius: 8px;
		width: 100%;
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

	.modal-close {
		background: none;
		border: none;
		font-size: 24px;
		color: #6b7280;
		cursor: pointer;
		padding: 0;
		width: 30px;
		height: 30px;
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
		gap: 10px;
		padding: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #374151;
	}

	.form-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.form-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-input:disabled {
		background: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}

	.item-search-container {
		position: relative;
	}

	.flex {
		display: flex;
	}
	.gap-2 {
		gap: 0.5rem;
	}
	.mb-2 {
		margin-bottom: 0.5rem;
	}
	.flex-1 {
		flex: 1 1 0%;
	}
	.relative {
		position: relative;
	}
	.w-full {
		width: 100%;
	}
	.absolute {
		position: absolute;
	}
	.z-10 {
		z-index: 10;
	}
	.mt-1 {
		margin-top: 0.25rem;
	}
	.bg-white {
		background-color: white;
	}
	.border {
		border-width: 1px;
	}
	.border-gray-300 {
		border-color: #d1d5db;
	}
	.rounded-lg {
		border-radius: 0.5rem;
	}
	.shadow-lg {
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}
	.max-h-60 {
		max-height: 15rem;
	}
	.overflow-y-auto {
		overflow-y: auto;
	}
	.sticky {
		position: sticky;
	}
	.top-0 {
		top: 0;
	}
	.bg-gray-50 {
		background-color: #f9fafb;
	}
	.border-b {
		border-bottom-width: 1px;
	}
	.border-gray-200 {
		border-color: #e5e7eb;
	}
	.px-4 {
		padding-left: 1rem;
		padding-right: 1rem;
	}
	.py-2 {
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}
	.items-center {
		align-items: center;
	}
	.justify-between {
		justify-content: space-between;
	}
	.text-sm {
		font-size: 0.875rem;
	}
	.font-medium {
		font-weight: 500;
	}
	.text-gray-700 {
		color: #374151;
	}
	.text-xs {
		font-size: 0.75rem;
	}
	.px-3 {
		padding-left: 0.75rem;
		padding-right: 0.75rem;
	}
	.py-1 {
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
	}
	.bg-blue-500 {
		background-color: #3b82f6;
	}
	.text-white {
		color: white;
	}
	.rounded {
		border-radius: 0.25rem;
	}
	.hover\:bg-blue-600:hover {
		background-color: #2563eb;
	}
	.px-2 {
		padding-left: 0.5rem;
		padding-right: 0.5rem;
	}
	.bg-gray-200 {
		background-color: #e5e7eb;
	}
	.ml-2 {
		margin-left: 0.5rem;
	}
	.hover\:bg-gray-300:hover {
		background-color: #d1d5db;
	}
	.hover\:bg-gray-100:hover {
		background-color: #f3f4f6;
	}
	.cursor-pointer {
		cursor: pointer;
	}
	.border-gray-100 {
		border-color: #f3f4f6;
	}
	.last\:border-b-0:last-child {
		border-bottom-width: 0;
	}
	.mr-3 {
		margin-right: 0.75rem;
	}
	.font-mono {
		font-family: ui-monospace, monospace;
	}
	.text-gray-500 {
		color: #6b7280;
	}
	.flex-wrap {
		flex-wrap: wrap;
	}
	.bg-gray-100 {
		background-color: #f3f4f6;
	}
	.text-red-500 {
		color: #ef4444;
	}
	.hover\:text-red-700:hover {
		color: #b91c1c;
	}
	.p-4 {
		padding: 1rem;
	}
	.disabled\:bg-gray-300:disabled {
		background-color: #d1d5db;
	}
	.disabled\:cursor-not-allowed:disabled {
		cursor: not-allowed;
	}
	.text-xl {
		font-size: 1.25rem;
	}
	.font-bold {
		font-weight: 700;
	}
	.mt-1 {
		margin-top: 0.25rem;
	}
	.text-green-600 {
		color: #16a34a;
	}
</style>
