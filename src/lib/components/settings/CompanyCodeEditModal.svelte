<script>
	/**
	 * 부서별 회사(company_code) 체크박스 선택 모달
	 * @type {{ open: boolean, department: { code: string, title: string } | null, companyOptions: Array<{ code: string, title: string }>, selectedCompanyCodes: Set<string>, onToggle: (code: string, checked: boolean) => void, onClose: () => void, onSave: () => void, isSaving: boolean }}
	 */
	let {
		open = false,
		department = null,
		companyOptions = [],
		selectedCompanyCodes = new Set(),
		onToggle,
		onClose,
		onSave,
		isSaving = false
	} = $props();
</script>

{#if open && department}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="company-modal-overlay" onclick={() => !isSaving && onClose?.()}>
		<div class="company-modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="company-modal-header">
				<h2 class="company-modal-title">회사 선택</h2>
				<button
					type="button"
					onclick={onClose}
					class="company-modal-close"
					aria-label="닫기"
					disabled={isSaving}
				>
					×
				</button>
			</div>
			<div class="company-modal-body">
				<p class="company-modal-label">
					<strong>{department.title}</strong>
					{#if department.code}
						<span class="company-modal-code">({department.code})</span>
					{/if}
				</p>
				<p class="company-modal-hint">연결할 회사를 체크하세요. (env_code excel_company)</p>
				<div class="company-modal-list">
					{#if companyOptions.length === 0}
						<p class="company-modal-empty">등록된 회사가 없습니다.</p>
					{:else}
						{#each companyOptions as opt (opt.code)}
							<label class="company-modal-item">
								<input
									type="checkbox"
									checked={selectedCompanyCodes.has(opt.code)}
									onchange={(e) => onToggle?.(opt.code, e.currentTarget.checked)}
									disabled={isSaving}
									class="company-modal-checkbox"
								/>
								<span class="company-modal-item-title">{opt.title || opt.code}</span>
								<span class="company-modal-item-code">{opt.code}</span>
							</label>
						{/each}
					{/if}
				</div>
			</div>
			<div class="company-modal-footer">
				<button
					type="button"
					onclick={onClose}
					class="company-modal-btn company-modal-btn-cancel"
					disabled={isSaving}
				>
					취소
				</button>
				<button
					type="button"
					onclick={onSave}
					disabled={isSaving}
					class="company-modal-btn company-modal-btn-save"
				>
					{isSaving ? '저장 중...' : '저장'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.company-modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.company-modal-content {
		background: white;
		border-radius: 8px;
		width: 90%;
		max-width: 420px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}

	.company-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.company-modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.company-modal-close {
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

	.company-modal-close:hover:not(:disabled) {
		background-color: #f3f4f6;
		color: #111827;
	}

	.company-modal-body {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	.company-modal-label {
		margin: 0 0 0.25rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.company-modal-code {
		color: #6b7280;
		font-weight: normal;
	}

	.company-modal-hint {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.company-modal-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.company-modal-empty {
		font-size: 0.875rem;
		color: #9ca3af;
		margin: 0;
	}

	.company-modal-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background 0.15s;
	}

	.company-modal-item:hover {
		background: #f9fafb;
	}

	.company-modal-checkbox {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.company-modal-item-title {
		flex: 1;
		color: #111827;
	}

	.company-modal-item-code {
		font-size: 0.75rem;
		color: #9ca3af;
		font-family: ui-monospace, monospace;
	}

	.company-modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid #e5e7eb;
	}

	.company-modal-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.company-modal-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.company-modal-btn-cancel {
		background: white;
		border: 1px solid #d1d5db;
		color: #374151;
	}

	.company-modal-btn-cancel:hover:not(:disabled) {
		background: #f9fafb;
	}

	.company-modal-btn-save {
		background: #2563eb;
		border: none;
		color: white;
	}

	.company-modal-btn-save:hover:not(:disabled) {
		background: #1d4ed8;
	}
</style>
