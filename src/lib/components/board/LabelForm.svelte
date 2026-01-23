<script>
	import { createLabel, updateLabel } from '$lib/labelService';

	let {
		label = null,
		onSubmit = () => {},
		onUpdate = () => {},
		onCancel = () => {}
	} = $props();

	let name = $state('');
	let color = $state('#3B82F6');
	let isSubmitting = $state(false);
	
	/** @type {string | null} */
	let error = $state(null);

	const presetColors = [
		'#3B82F6', '#10B981', '#F59E0B', '#EF4444',
		'#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
	];

	$effect(() => {
		const currentLabel = label;
		if (currentLabel) {
			name = currentLabel.name || '';
			color = currentLabel.color || '#3B82F6';
		}
	});

	async function handleSubmit() {
		if (!name.trim()) {
			error = '라벨 이름을 입력해주세요.';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			if (label) {
				const { error: err } = await updateLabel(label.id, { name, color });
				if (err) throw err;
				onUpdate();
			} else {
				const { data, error: err } = await createLabel({ name, color });
				if (err) throw err;
				onSubmit(data);
			}
		} catch (err) {
			error = err.message || '라벨 저장에 실패했습니다.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
	<h4 class="text-sm font-semibold mb-3">{label ? '라벨 수정' : '새 라벨'}</h4>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-red-700 text-sm">
			{error}
		</div>
	{/if}

	<div class="space-y-3">
		<div>
			<label for="label-name" class="block text-xs font-medium text-gray-700 mb-1">이름</label>
			<input
				id="label-name"
				type="text"
				bind:value={name}
				placeholder="라벨 이름"
				class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="label-color" class="block text-xs font-medium text-gray-700 mb-1">색상</label>
			<div class="flex items-center gap-2">
				<input
					id="label-color"
					type="color"
					bind:value={color}
					class="w-12 h-8 rounded border border-gray-300"
				/>
				<div class="flex gap-1">
					{#each presetColors as presetColor}
						<button
							onclick={() => { color = presetColor; }}
							class="w-6 h-6 rounded {color === presetColor ? 'ring-2 ring-blue-500' : ''}"
							style="background-color: {presetColor}"
							aria-label="색상 선택: {presetColor}"
						></button>
					{/each}
				</div>
			</div>
		</div>

		<div class="flex gap-2">
			<button
				onclick={handleSubmit}
				disabled={isSubmitting}
				class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
			>
				{isSubmitting ? '저장 중...' : '저장'}
			</button>
			<button
				onclick={(e) => { onCancel(e); }}
				class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
			>
				취소
			</button>
		</div>
	</div>
</div>

