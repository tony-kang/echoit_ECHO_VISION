<script>
	/**
	 * 컴포넌트 Props
	 * @type {{ isOpen: boolean }}
	 */
	let { isOpen = $bindable() } = $props();
</script>

<!-- 모바일 햄버거 버튼 -->
<button
	onclick={() => (isOpen = true)}
	class="mobile-only p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
	aria-label="메뉴 열기"
>
	<svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M4 6h16M4 12h16M4 18h16"
		/>
	</svg>
</button>

<style>
	/* 실제 터치 기기에서만 표시 (hover: none은 터치 기기, pointer: coarse는 터치스크린) */
	.mobile-only {
		display: none;
	}

	@media (hover: none), (pointer: coarse) {
		.mobile-only {
			display: block;
		}
	}

	/* 데스크톱에서는 숨김 (hover 가능하고 정밀한 포인터) */
	@media (hover: hover) and (pointer: fine) {
		.mobile-only {
			display: none;
		}
	}
</style>
