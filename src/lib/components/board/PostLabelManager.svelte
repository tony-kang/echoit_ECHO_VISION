<script>
	import { onMount } from 'svelte';
	import { getUserLabels, getPostLabels, addLabelToPost, removeLabelFromPost } from '$lib/labelService';
	import LabelItem from './LabelItem.svelte';
	import LabelForm from './LabelForm.svelte';

	let {
		postId
	} = $props();

	/** @type {Array<any>} */
	let allLabels = $state([]);
	/** @type {Array<any>} */
	let postLabels = $state([]);
	let loading = $state(true);
	let showForm = $state(false);

	onMount(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		const [labelsResult, postLabelsResult] = await Promise.all([
			getUserLabels(),
			getPostLabels(postId)
		]);
		allLabels = labelsResult.data || [];
		postLabels = (postLabelsResult.data || []).map(item => item.label).filter(Boolean);
		loading = false;
	}

	async function handleLabelToggle(label) {
		const isAttached = postLabels.some(l => l.id === label.id);
		
		if (isAttached) {
			await removeLabelFromPost(postId, label.id);
		} else {
			await addLabelToPost(postId, label.id);
		}
		
		await loadData();
	}

	async function handleLabelCreated() {
		showForm = false;
		await loadData();
	}
</script>

<div class="post-label-manager">
	<div class="flex items-center justify-between mb-3">
		<h4 class="text-sm font-semibold">라벨</h4>
		<button
			onclick={() => { showForm = true; }}
			class="text-xs text-blue-600 hover:text-blue-800"
		>
			+ 새 라벨
		</button>
	</div>

	{#if showForm}
		<div class="mb-3">
			<LabelForm
				onSubmit={handleLabelCreated}
				onCancel={() => { showForm = false; }}
			/>
		</div>
	{/if}

	{#if loading}
		<div class="text-xs text-gray-500">로딩 중...</div>
	{:else if allLabels.length === 0}
		<div class="text-xs text-gray-500">라벨이 없습니다.</div>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each allLabels as label (label.id)}
				<button
					onclick={() => handleLabelToggle(label)}
					class="px-2 py-1 text-xs rounded-full border transition-colors {postLabels.some(l => l.id === label.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}"
				>
					<span
						class="inline-block w-2 h-2 rounded-full mr-1"
						style="background-color: {label.color || '#3B82F6'}"
					></span>
					{label.name}
				</button>
			{/each}
		</div>
	{/if}
</div>

