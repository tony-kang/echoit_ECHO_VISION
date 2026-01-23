<script>
	/**
	 * @typedef {Object} Hashtag
	 * @property {string} [id] - 해시태그 ID
	 * @property {string} name - 해시태그 이름
	 */

	let {
		/** @type {Array<Hashtag>} */
		hashtags = []
	} = $props();
</script>

{#if hashtags.length > 0}
	<div class="mb-6">
		<div class="flex flex-wrap gap-2">
			{#each hashtags as hashtag (hashtag.id || hashtag.name)}
				<button
					type="button"
					class="inline-flex items-center px-4 py-2 bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md"
				>
					<span class="text-blue-500 mr-1">#</span>
					{hashtag.name}
				</button>
			{/each}
		</div>
	</div>
{/if}

