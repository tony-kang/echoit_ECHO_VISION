<script>
	/**
	 * 표시순서만 빠르게 수정하는 모달
	 * @type {{ open: boolean, setting: { code: string, title: string, order?: number, category?: string } | null, order: number, isSaving: boolean, onClose: () => void, onSave: () => void }}
	 */
	let {
		open = false,
		setting = null,
		order = $bindable(0),
		isSaving = false,
		onClose,
		onSave
	} = $props();
</script>

{#if open && setting}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="order-modal-overlay" onclick={() => !isSaving && onClose?.()}>
		<div class="order-modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="order-modal-header">
				<h2 class="order-modal-title">표시순서 변경</h2>
				<button
					type="button"
					onclick={onClose}
					class="order-modal-close"
					aria-label="닫기"
					disabled={isSaving}
				>
					×
				</button>
			</div>
			<div class="order-modal-body">
				<p class="order-modal-label">
					<strong>{setting.title}</strong>
					{#if setting.code}
						<span class="order-modal-code">({setting.code})</span>
					{/if}
				</p>
				<div class="order-modal-field">
					<label for="order-edit-input" class="order-modal-field-label">표시순서</label>
					<input
						id="order-edit-input"
						type="number"
						min="0"
						step="1"
						bind:value={order}
						class="order-modal-input"
						disabled={isSaving}
					/>
				</div>
			</div>
			<div class="order-modal-footer">
				<button
					type="button"
					onclick={onClose}
					class="order-modal-btn order-modal-btn-cancel"
					disabled={isSaving}
				>
					취소
				</button>
				<button
					type="button"
					onclick={onSave}
					disabled={isSaving}
					class="order-modal-btn order-modal-btn-save"
				>
					{isSaving ? '저장 중...' : '저장'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.order-modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.order-modal-content {
		background: white;
		border-radius: 8px;
		width: 90%;
		max-width: 400px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}

	.order-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.order-modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.order-modal-close {
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

	.order-modal-close:hover:not(:disabled) {
		background-color: #f3f4f6;
		color: #111827;
	}

	.order-modal-close:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.order-modal-body {
		padding: 1.25rem;
	}

	.order-modal-label {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.order-modal-code {
		color: #6b7280;
		font-weight: normal;
	}

	.order-modal-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.order-modal-field-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.order-modal-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.order-modal-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.order-modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid #e5e7eb;
	}

	.order-modal-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.order-modal-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.order-modal-btn-cancel {
		background: white;
		border: 1px solid #d1d5db;
		color: #374151;
	}

	.order-modal-btn-cancel:hover:not(:disabled) {
		background: #f9fafb;
	}

	.order-modal-btn-save {
		background: #2563eb;
		border: none;
		color: white;
	}

	.order-modal-btn-save:hover:not(:disabled) {
		background: #1d4ed8;
	}
</style>
