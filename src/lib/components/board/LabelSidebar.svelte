<script>
	import { onMount } from 'svelte';
	import { getUserLabels, getPostsByLabel } from '$lib/labelService';
	import LabelItem from './LabelItem.svelte';
	import LabelPostList from './LabelPostList.svelte';

	let {
		categoryId
	} = $props();

	/** @type {Array<any>} */
	let labels = $state([]);
	let loading = $state(true);
	let selectedLabel = $state(null);
	/** @type {Array<any>} */
	let labelPosts = $state([]);

	onMount(() => {
		loadLabels();
	});

	async function loadLabels() {
		loading = true;
		const { data } = await getUserLabels();
		labels = data || [];
		loading = false;
	}

	async function handleLabelClick(label) {
		if (selectedLabel?.id === label.id) {
			selectedLabel = null;
			labelPosts = [];
		} else {
			selectedLabel = label;
			const { data } = await getPostsByLabel(label.id);
			labelPosts = (data || []).map(item => item.post).filter(Boolean);
		}
	}
</script>

<div class="label-sidebar bg-white rounded-lg border border-gray-200 p-4">
	<h3 class="text-lg font-semibold mb-4">내 라벨</h3>

	{#if loading}
		<div class="text-center py-4 text-gray-500 text-sm">로딩 중...</div>
	{:else if labels.length === 0}
		<div class="text-center py-4 text-gray-500 text-sm">
			라벨이 없습니다.
		</div>
	{:else}
		<div class="space-y-2">
			{#each labels as label (label.id)}
				<LabelItem
					{label}
					isSelected={selectedLabel?.id === label.id}
					onClick={() => handleLabelClick(label)}
				/>
			{/each}
		</div>

		{#if selectedLabel}
			<LabelPostList
				label={selectedLabel}
				posts={labelPosts}
			/>
		{/if}
	{/if}
</div>
