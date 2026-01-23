<script>
	/**
	 * 마스터 전용 항목 컴포넌트
	 * @type {Object} 컴포넌트 Props
	 * @property {string} activeMenu - 활성 메뉴 ID
	 */
	let { activeMenu } = $props();
</script>

{#if activeMenu === 'system'}
	<h1 class="text-3xl font-bold text-gray-900 mb-6">M-시스템 관리</h1>
	
	<div class="space-y-6">
		<div class="border-b pb-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">M-시스템 관리</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="p-4 border border-gray-200 rounded-lg">
					<h3 class="font-semibold text-gray-900 mb-2">M-시스템 설정</h3>
					<p class="text-sm text-gray-600">전체 시스템 설정을 관리할 수 있습니다.</p>
				</div>
			</div>
		</div>
	</div>
{:else if activeMenu === 'system-guide' || activeMenu === 'features'}
	<!-- 시스템 구성 가이드와 기능 개발은 외부 링크로 처리되므로 여기서는 표시하지 않음 -->
{/if}

