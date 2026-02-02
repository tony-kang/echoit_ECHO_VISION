<script>
	import PostListItem from './PostListItem.svelte';

	let {
		posts = [],
		onPostClick = () => {}
	} = $props();
</script>

<!-- 목록형: 전통적인 테이블 형태 -->
<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
	<!-- 모바일: 카드 형태 -->
	<div class="mobile-only space-y-2 p-2">
		{#each posts as post (post.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
				onclick={() => onPostClick(post)}
			>
				<div class="flex items-start justify-between gap-2 mb-2">
					<h3 class="font-semibold text-gray-900 text-sm flex-1 line-clamp-2">
						{#if post.is_pinned}
							<span class="text-blue-600 mr-1">📌</span>
						{/if}
						{post.title}
					</h3>
				</div>
				<div class="flex items-center justify-end gap-2 text-xs text-gray-500">
					<span>{post.author?.full_name || '익명'}</span>
					<span>{new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
					<span>👁️ {post.view_count || 0}</span>
				</div>
			</div>
		{/each}
	</div>

	<!-- 데스크톱: 테이블 형태 -->
	<table class="desktop-only table w-full">
		<thead class="bg-gray-50 border-b border-gray-200">
			<tr>
				<th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12" title="고정">📌</th>
				<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">제목</th>
				<th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">작성자</th>
				<th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">날짜</th>
				<th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">조회수</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200">
			{#each posts as post (post.id)}
				<PostListItem
					{post}
					onClick={() => onPostClick(post)}
				/>
			{/each}
		</tbody>
	</table>
</div>

