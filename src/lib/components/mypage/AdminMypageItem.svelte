<script>
	/**
	 * 관리자 전용 항목 컴포넌트
	 * @type {Object} 컴포넌트 Props
	 * @property {string} activeMenu - 활성 메뉴 ID
	 */
	let { activeMenu } = $props();
</script>

{#if activeMenu === 'admin-dashboard'}
	<!-- 관리자 대시보드 메뉴는 외부 링크로 처리되므로 여기서는 표시하지 않음 -->
{/if}

