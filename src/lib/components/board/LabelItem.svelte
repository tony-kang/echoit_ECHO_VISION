<script>
	let {
		label,
		isSelected = false,
		onClick = () => {}
	} = $props();
</script>

<button
	onclick={onClick}
	class="w-full text-left px-3 py-2 rounded-lg transition-colors {isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}"
>
	<div class="flex items-center gap-2">
		<span
			class="w-3 h-3 rounded-full"
			style="background-color: {label.color || '#3B82F6'}"
		></span>
		<span class="text-sm font-medium">{label.name}</span>
	</div>
</button>

