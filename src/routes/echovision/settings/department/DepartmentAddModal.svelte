<script>
	/**
	 * 부서 추가 모달 Props
	 * @type {{ open: boolean, title?: string, onClose: () => void, onSave: (title: string) => void, isSaving?: boolean }}
	 */
	let {
		open = false,
		title = $bindable(''),
		onClose,
		onSave,
		isSaving = false
	} = $props();

	/**
	 * 저장 클릭 시 부서명 전달하여 저장
	 */
	function handleSubmit() {
		const t = (title || '').trim();
		if (!t) {
			alert('부서명을 입력하세요.');
			return;
		}
		onSave?.(t);
	}
</script>

{#if open}
	<div
		class="department-add-modal-overlay"
		onclick={() => !isSaving && onClose?.()}
		role="presentation"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="department-add-modal-content"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-label="부서 추가"
			tabindex="-1"
		>
			<h2 class="text-xl font-bold text-gray-800 mb-4">부서 추가</h2>
			<p class="text-sm text-gray-500 mb-2">코드는 DEPARTMENT_001 형식으로 자동 생성됩니다.</p>
			<div class="mb-4">
				<label for="new-dept-title" class="block text-sm font-medium text-gray-700 mb-1">부서명 *</label>
				<input
					id="new-dept-title"
					type="text"
					bind:value={title}
					placeholder="예: 영업1팀"
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
				/>
			</div>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					onclick={() => !isSaving && onClose?.()}
					class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
				>
					취소
				</button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={isSaving}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
				>
					{isSaving ? '저장 중...' : '추가'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.department-add-modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgb(0 0 0 / 0.5);
	}
	.department-add-modal-content {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
		width: 100%;
		max-width: 28rem;
		padding: 1.5rem;
	}
</style>
