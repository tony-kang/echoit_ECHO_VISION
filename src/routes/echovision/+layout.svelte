<script>
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore.svelte.js';

	/** @type {{ children: import('svelte').Snippet }} */
	let { children } = $props();

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	/** @type {boolean} */
	let authLoading = $derived(authStore.loading);

	$effect(() => {
		if (!authLoading && !user) goto('/login');
	});
</script>

{#if authLoading}
	<div class="flex items-center justify-center min-h-[200px] py-12">
		<div class="text-gray-500">로딩 중...</div>
	</div>
{:else if !user}
	<div class="flex items-center justify-center min-h-[200px] py-12">
		<div class="text-gray-500">로그인이 필요합니다.</div>
	</div>
{:else}
	{@render children()}
{/if}
