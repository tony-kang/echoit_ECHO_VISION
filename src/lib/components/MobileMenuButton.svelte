<script>
	import { sidebarStore } from '$lib/stores/sidebarStore';
	
	/**
	 * 사이드바 열기
	 */
	function openSidebar() {
		console.log('🍔 햄버거 버튼 클릭됨');
		sidebarStore.open();
		console.log('🍔 sidebarStore.open() 호출 완료');
	}
</script>

<!-- 햄버거 버튼 (모든 기기에서 표시) -->
<button
	onclick={openSidebar}
	class="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
	aria-label="메뉴 열기"
	type="button"
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
