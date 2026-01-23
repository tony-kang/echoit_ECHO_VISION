<script>
	import { goto } from '$app/navigation';

	/**
	 * 대시보드 통계 데이터 타입
	 * @typedef {Object} DashboardStat
	 * @property {string} label - 라벨
	 * @property {number} value - 값
	 * @property {string} icon - 아이콘 SVG 경로
	 * @property {string} path - 이동 경로
	 * @property {string} color - 색상 클래스
	 */

	/** @type {Array<DashboardStat>} 통계 데이터 */
	let { stats = $bindable([]) } = $props();

	/**
	 * 통계 카드 클릭 핸들러
	 * @param {string} path - 이동 경로
	 * @returns {void}
	 */
	function handleStatClick(path) {
		goto(path);
	}
</script>

<!-- 통계 카드 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
	{#each stats as stat}
		<button
			onclick={() => handleStatClick(stat.path)}
			class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
			aria-label={stat.label}
		>
			<div class="flex items-center justify-between mb-4">
				<div class="{stat.color} p-3 rounded-lg">
					<svg
						class="w-6 h-6 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={stat.icon}
						></path>
					</svg>
				</div>
				<svg
					class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5l7 7-7 7"
					></path>
				</svg>
			</div>
			<div class="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
			<div class="text-sm text-gray-600">{stat.label}</div>
		</button>
	{/each}
</div>
