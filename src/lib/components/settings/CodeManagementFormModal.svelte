<script>
	/**
	 * 환경설정 코드 추가/수정 모달
	 * @type {Object} Props
	 * @property {boolean} open - 모달 표시 여부
	 * @property {any} editingSetting - 수정 대상 (null이면 추가 모드)
	 * @property {Array<{ code: string, title: string }>} parentOptions - 상위 코드 옵션
	 * @property {string} formCode - 코드 (수정 시 disabled)
	 * @property {string} formParentCode - 상위 코드
	 * @property {number} formOrder - 표시 순서
	 * @property {number} formValue - 값
	 * @property {string} formTitle - 제목
	 * @property {string} formComment - 설명
	 * @property {string} formCategory - 카테고리
	 * @property {string[]} formParam - 파라미터 배열
	 * @property {string} newParamValue - 새 파라미터 입력값
	 * @property {boolean} isSaving - 저장 중 여부
	 * @property {() => void} [onCategoryChange] - 카테고리 변경 시 콜백 (등록 시 코드 자동 생성용)
	 * @property {() => void} onCancel - 취소 콜백
	 * @property {() => void} onSubmit - 저장 제출 콜백
	 * @property {() => void} onAddParam - 파라미터 추가 콜백
	 * @property {(index: number) => void} onRemoveParam - 파라미터 삭제 콜백
	 */
	let {
		open = false,
		editingSetting = null,
		parentOptions = [],
		formCode = $bindable(''),
		formParentCode = $bindable(''),
		formOrder = $bindable(0),
		formValue = $bindable(1),
		formTitle = $bindable(''),
		formComment = $bindable(''),
		formCategory = $bindable(''),
		formParam = $bindable([]),
		newParamValue = $bindable(''),
		isSaving = false,
		onCategoryChange,
		onCancel,
		onSubmit,
		onAddParam,
		onRemoveParam
	} = $props();

	/**
	 * Enter 키로 파라미터 추가
	 * @param {KeyboardEvent} e
	 */
	function handleParamKeydown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			onAddParam();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={onCancel}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{editingSetting ? '환경설정 코드 수정' : '환경설정 코드 추가'}</h2>
				<button type="button" onclick={onCancel} class="modal-close" aria-label="닫기">×</button>
			</div>
			<div class="modal-body">
				<div class="space-y-4">
					<!-- 코드 -->
					<div>
						<label for="formCode" class="block text-sm font-medium text-gray-700 mb-1">
							코드 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formCode"
							bind:value={formCode}
							maxlength="16"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="최대 16자리 코드 입력"
							required
							disabled={!!editingSetting}
						/>
						{#if editingSetting}
							<p class="text-xs text-gray-500 mt-1">코드는 수정할 수 없습니다.</p>
						{:else}
							<p class="text-xs text-gray-500 mt-1">구분 선택 시 자동 생성되며, 필요 시 수정할 수 있습니다.</p>
						{/if}
					</div>

					<!-- 상위 코드 -->
					<div>
						<label for="formParentCode" class="block text-sm font-medium text-gray-700 mb-1">
							상위 코드
						</label>
						<select
							id="formParentCode"
							bind:value={formParentCode}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">없음 (최상위)</option>
							{#each parentOptions as parent (parent.code)}
								{#if !editingSetting || parent.code !== editingSetting.code}
									<option value={parent.code}>
										{parent.code} - {parent.title}
									</option>
								{/if}
							{/each}
						</select>
						<p class="text-xs text-gray-500 mt-1">부모 코드를 선택하면 계층 구조가 생성됩니다.</p>
					</div>

					<!-- 표시 순서 · 값 · 카테고리 (한 행) -->
					<div class="form-row-three">
						<div class="form-row-cell">
							<label for="formCategory" class="block text-sm font-medium text-gray-700 mb-1">
								카테고리 <span class="text-red-500">*</span>
							</label>
							<select
								id="formCategory"
								bind:value={formCategory}
								onchange={() => onCategoryChange?.()}
								class="input-full"
								required
							>
								<option value="">선택하세요</option>
								<option value="organization">organization (조직)</option>
								<option value="sales">sales (매출)</option>
								<option value="cost">cost (비용)</option>
							</select>
							<p class="text-xs text-gray-500 mt-1">코드의 분류</p>
						</div>
						<div class="form-row-cell">
							<label for="formOrder" class="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
							<input
								type="number"
								id="formOrder"
								bind:value={formOrder}
								min="0"
								class="input-full"
								placeholder="0"
							/>
						</div>
						<div class="form-row-cell">
							<label for="formValue" class="block text-sm font-medium text-gray-700 mb-1">
								값 <span class="text-red-500">*</span>
							</label>
							<input
								type="number"
								id="formValue"
								bind:value={formValue}
								min="1"
								class="input-full"
								placeholder="1 이상"
								required
							/>
							<p class="text-xs text-gray-500 mt-1">1 이상</p>
						</div>
					</div>

					<!-- 제목 -->
					<div>
						<label for="formTitle" class="block text-sm font-medium text-gray-700 mb-1">
							제목 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="formTitle"
							bind:value={formTitle}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="제목을 입력하세요"
							required
						/>
					</div>

					<!-- 파라미터 -->
					<div>
						<label for="formParamInput" class="block text-sm font-medium text-gray-700 mb-1">
							파라미터 (엑셀 컬럼 매칭용)
						</label>
						<div class="space-y-2">
							<div class="flex gap-2">
								<input
									id="formParamInput"
									type="text"
									bind:value={newParamValue}
									onkeydown={handleParamKeydown}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="파라미터 입력 후 Enter 또는 추가 버튼 클릭"
								/>
								<button
									type="button"
									onclick={onAddParam}
									class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
								>
									추가
								</button>
							</div>
							{#if formParam.length > 0}
								<div class="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg min-h-12">
									{#each formParam as paramItem, index (paramItem)}
										<span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
											{paramItem}
											<button
												type="button"
												onclick={() => onRemoveParam(index)}
												class="ml-1 text-blue-600 hover:text-blue-800 font-bold"
												aria-label="삭제"
											>
												×
											</button>
										</span>
									{/each}
								</div>
							{:else}
								<p class="text-xs text-gray-500">파라미터가 없습니다. 엑셀 컬럼 매칭을 위해 파라미터를 추가하세요.</p>
							{/if}
						</div>
						<p class="text-xs text-gray-500 mt-1">엑셀 파일의 컬럼명과 매칭하기 위한 파라미터 목록입니다.</p>
					</div>

					<!-- 설명 -->
					<div>
						<label for="formComment" class="block text-sm font-medium text-gray-700 mb-1">
							설명
						</label>
						<textarea
							id="formComment"
							bind:value={formComment}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="설명을 입력하세요 (선택사항)"
						></textarea>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" onclick={onCancel} class="btn-secondary" disabled={isSaving}>취소</button>
				<button type="button" onclick={onSubmit} class="btn-primary" disabled={isSaving}>
					{isSaving ? '저장 중...' : '저장'}
				</button>
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
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
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
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
	}

	.modal-close:hover {
		background-color: #f3f4f6;
		color: #111827;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.form-row-three {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-row-cell {
		flex: 1;
		min-width: 0;
	}

	.input-full {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}

	.input-full:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background-color: #6b7280;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-secondary:hover {
		background-color: #4b5563;
	}
</style>
