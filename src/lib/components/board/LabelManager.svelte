<script>
	import { onMount } from 'svelte';
	import { getUserLabels, createLabel, updateLabel, deleteLabel } from '$lib/labelService';
	import LabelItem from './LabelItem.svelte';
	import LabelForm from './LabelForm.svelte';

	let {
		postId = null,
		onLabelSelect = () => {}
	} = $props();

	/** @type {Array<any>} */
	let labels = $state([]);
	let loading = $state(true);
	let showForm = $state(false);
	/** @type {any} */
	let editingLabel = $state(null);

	onMount(() => {
		loadLabels();
	});

	async function loadLabels() {
		loading = true;
		const { data } = await getUserLabels();
		labels = data || [];
		loading = false;
	}

	async function handleLabelCreated() {
		showForm = false;
		await loadLabels();
	}

	async function handleLabelUpdated() {
		editingLabel = null;
		await loadLabels();
	}

	async function handleLabelDeleted() {
		await loadLabels();
	}

	function handleEdit(label) {
		editingLabel = label;
		showForm = true;
	}
</script>

<div class="label-manager">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold">라벨 관리</h3>
		<button
			onclick={() => { editingLabel = null; showForm = true; }}
			class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
		>
			+ 추가
		</button>
	</div>

	{#if showForm}
		<div class="mb-4">
			<LabelForm
				label={editingLabel}
				onSubmit={handleLabelCreated}
				onUpdate={handleLabelUpdated}
				onCancel={() => { showForm = false; editingLabel = null; }}
			/>
		</div>
	{/if}

	{#if loading}
		<div class="text-center py-4 text-gray-500 text-sm">로딩 중...</div>
	{:else if labels.length === 0}
		<div class="text-center py-4 text-gray-500 text-sm">
			라벨이 없습니다. 새 라벨을 추가해보세요.
		</div>
	{:else}
		<div class="space-y-2">
			{#each labels as label (label.id)}
				<div class="flex items-center gap-2">
					<LabelItem
						{label}
						isSelected={false}
						onClick={() => onLabelSelect(label)}
					/>
					<button
						onclick={() => handleEdit(label)}
						class="px-2 py-1 text-xs text-gray-600 hover:text-blue-600"
					>
						수정
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

