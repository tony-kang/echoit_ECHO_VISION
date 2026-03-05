<script>
	/**
	 * 엑셀용 회사 등록/수정 통합 모달
	 * - 등록: item=null, 코드는 EXCEL-COMP_001 형식 자동 생성 후 비활성 표시
	 * - 수정: item 설정, 코드는 비활성(disabled) 표시, 이름만 수정 가능
	 * @type {Object} Props
	 * @property {boolean} open - 모달 표시 여부
	 * @property {{ code: string, title: string } | null} item - 수정 대상 (null이면 등록 모드)
	 * @property {string[]} existingCodes - 기존 코드 목록 (등록 시 다음 코드 자동 생성용)
	 * @property {boolean} isSaving - 저장 중 여부
	 * @property {() => void} onClose - 닫기 콜백
	 * @property {(code: string, title: string) => void} onSave - 저장 콜백 (등록/수정 공통)
	 */
	let { open = false, item = null, existingCodes = [], isSaving = false, onClose, onSave } = $props();

	/** @type {string} 엑셀용 회사 이름 (편집 필드) */
	let title = $state('');

	$effect(() => {
		if (open && item) {
			title = item.title || '';
		} else if (open && !item) {
			title = '';
		}
	});

	/** EXCEL-COMP_001 형식의 다음 코드 반환
	 * @param {string[]} codes - 기존 코드 목록
	 * @returns {string}
	 */
	function getNextCode(codes) {
		const re = /^EXCEL-COMP_(\d+)$/;
		let max = 0;
		for (const c of codes) {
			const m = c.match(re);
			if (m) max = Math.max(max, parseInt(m[1], 10));
		}
		return 'EXCEL-COMP_' + String(max + 1).padStart(3, '0');
	}

	/** 표시할 코드: 수정 시 item.code, 등록 시 자동 생성 (항목 수정 불가이므로 disabled) */
	let displayCode = $derived(item ? item.code : open ? getNextCode(existingCodes) : '');

	/** 등록 모드 여부 */
	let isAddMode = $derived(open && !item);

	/**
	 * 저장 제출
	 */
	function handleSubmit() {
		const t = (title || '').trim();
		if (!t) {
			alert('엑셀용 회사 이름을 입력하세요.');
			return;
		}
		onSave(displayCode, t);
	}
</script>

{#if open}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="form-modal-title"
	>
		<div class="modal-box">
			<h2 id="form-modal-title" class="modal-title">
				{isAddMode ? '엑셀용 회사 등록' : '엑셀용 회사 수정'}
			</h2>
			<div class="space-y-4">
				<div>
					<label for="form-code" class="label">코드</label>
					<input
						id="form-code"
						type="text"
						value={displayCode}
						disabled
						class="input input-disabled"
						aria-readonly="true"
					/>
				</div>
				<div>
					<label for="form-title" class="label">엑셀용 회사 이름</label>
					<input
						id="form-title"
						type="text"
						bind:value={title}
						class="input"
						placeholder="회사 표시 이름"
					/>
				</div>
			</div>
			<div class="modal-actions">
				<button type="button" class="btn-cancel" onclick={onClose} disabled={isSaving}>
					취소
				</button>
				<button type="button" class="btn-primary" onclick={handleSubmit} disabled={isSaving}>
					{isSaving ? '저장 중...' : (isAddMode ? '등록' : '저장')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
	.modal-box {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		max-width: 28rem;
		width: 100%;
		padding: 1.5rem;
	}
	.modal-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 1rem;
	}
	.label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.25rem;
	}
	.input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
	}
	.input:focus {
		outline: none;
		box-shadow: 0 0 0 2px #3b82f6;
	}
	.input-disabled {
		background: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}
	.space-y-4 > * + * {
		margin-top: 1rem;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}
	.btn-cancel {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		background: white;
	}
	.btn-cancel:hover:not(:disabled) {
		background: #f3f4f6;
	}
	.btn-primary {
		padding: 0.5rem 1rem;
		background: #2563eb;
		color: white;
		border-radius: 0.5rem;
		border: none;
	}
	.btn-primary:hover:not(:disabled) {
		background: #1d4ed8;
	}
	button:disabled {
		opacity: 0.5;
	}
</style>
