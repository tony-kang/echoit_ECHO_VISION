<script>
	import { goto } from '$app/navigation';

	/**
	 * 빠른 액세스 메뉴 항목 타입
	 * @typedef {Object} QuickAccessItem
	 * @property {string} label - 라벨
	 * @property {string} path - 이동 경로
	 * @property {string} icon - 아이콘 SVG 경로
	 * @property {string} description - 설명
	 */

	/** @type {Array<QuickAccessItem>} 빠른 액세스 항목 목록 */
	let { items = $bindable([]) } = $props();

	/**
	 * 빠른 액세스 클릭 핸들러
	 * @param {string} path - 이동 경로
	 * @returns {void}
	 */
	function handleQuickAccess(path) {
		goto(path);
	}
</script>

<!-- 빠른 액세스 -->
<div class="bg-white rounded-lg shadow-sm p-6 mb-8">
	<h2 class="text-xl font-semibold text-gray-800 mb-4">빠른 액세스</h2>
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each items as item}
			<button
				onclick={() => handleQuickAccess(item.path)}
				class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
				aria-label={item.label}
			>
				<div class="flex items-center mb-2">
					<svg
						class="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={item.icon}
						></path>
					</svg>
					<span class="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
						{item.label}
					</span>
				</div>
				<p class="text-sm text-gray-500">{item.description}</p>
			</button>
		{/each}
	</div>
</div>
