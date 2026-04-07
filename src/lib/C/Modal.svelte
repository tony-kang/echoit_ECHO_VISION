<script>
	/**
	 * 본문(modal-body) 내 폼은 전역 form.css(.form-stack, .form-label, .form-input 등)를 사용한다.
	 */
	/** @typedef {{ show: boolean, title?: string, size?: 'small'|'medium'|'large'|'xlarge'|'full', onClose?: () => void, confirmText?: string, onConfirm?: () => void | Promise<void>, children: any, footer?: any, showFooter?: boolean, saving?: boolean, savingText?: string }} Props */
	let {
		show = false,
		title = '',
		size = 'medium',
		onClose,
		confirmText = '확인',
		onConfirm,
		children,
		footer,
		cancelText = '취소',
		showFooter = true,
		saving = $bindable(false),
		savingText = ''
	} = $props();

	/** @type {string} 저장 중 메시지 */
	let displaySavingText = $state('저장중입니다...');

	/**
	 * saving이 켜질 때 표시할 저장 중 문구를 설정한다.
	 */
	$effect(() => {
		if (saving) {
			displaySavingText = savingText || '저장중입니다...';
		}
	});

	const sizes = {
		small: 'max-w-md',
		medium: 'max-w-xl',
		large: 'max-w-4xl',
		xlarge: 'max-w-6xl w-full',
		full: 'max-w-[95vw] w-full max-h-[95vh] h-[95vh]',
	};
	
	const close = () => onClose?.();
	
	/**
	 * 확인 버튼 클릭 핸들러 (저장 중 상태 자동 관리)
	 * - saving prop이 bindable이면 외부에서 관리, 아니면 내부에서 자동 관리
	 * @returns {Promise<void>}
	 */
	async function handleConfirm() {
		if (!onConfirm) return;
		
		// saving이 외부에서 관리되지 않는 경우에만 내부에서 관리
		const manageSavingInternally = saving === false;
		
		if (manageSavingInternally) {
			saving = true;
		}
		
		try {
			await onConfirm();
		} finally {
			if (manageSavingInternally) {
				saving = false;
			}
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 p-4" onclick={close}>
		<div class="flex flex-col w-full bg-white rounded-lg shadow-xl max-h-[90vh] {sizes[size]} relative" onclick={(e) => e.stopPropagation()}>
			<!-- 저장 중 오버레이 -->
			{#if saving}
				<div class="absolute inset-0 z-10 flex items-center justify-center rounded-lg pointer-events-none">
					<div class="flex flex-col items-center gap-4 p-8 bg-white rounded-xl shadow-2xl border-2 border-blue-100 pointer-events-auto">
						<div class="relative w-16 h-16">
							<div class="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
							<div class="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
						</div>
						<p class="text-lg font-semibold text-slate-700">{displaySavingText}</p>
					</div>
				</div>
			{/if}

			<div class="flex items-center justify-between p-5 bg-slate-300 border-b border-slate-200 rounded-t-lg">
				<h2 class="text-xl font-semibold text-slate-800">{title}</h2>
				<button onclick={close} class="text-3xl text-slate-500 hover:bg-slate-200/60 rounded transition-colors" aria-label="닫기" disabled={saving}>×</button>
			</div>

			<div
				class="modal-body flex-1 p-4 overflow-y-auto bg-white {showFooter ? '' : 'rounded-b-lg'}"
			>
				{@render children()}
			</div>

			{#if showFooter}
				<div class="flex justify-end gap-3 p-5 bg-slate-300 border-t border-slate-200 rounded-b-lg">
					{#if footer}
						{@render footer()}
					{:else}
						<button onclick={close} class="btn-cancel btn-md" type="button" disabled={saving}>{cancelText}</button>
						<button onclick={handleConfirm} class="btn-primary btn-md" type="button" disabled={saving}>{confirmText}</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

