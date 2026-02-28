<script>
	import PrjSidebar from '$lib/components/PrjSidebar.svelte';

    let { 
		headerHeight = '100px',
        showSidebar = true,
        useContainerOnly = false,
        children
	} = $props();
</script>

<div class="main-content-page" style="margin-top: {headerHeight};">
	<div class="flex">
        {#if showSidebar}
            <PrjSidebar />
        {/if}
        {#if useContainerOnly}
            {@render children()}
        {:else}
            <main class="flex-1 overflow-y-auto bg-gray-50">
                <div class="p-3">
                    {@render children()}
                </div>
            </main>
        {/if}
    </div>
</div>

<style>
.main-content-page {
    min-height: 100vh;
    padding-top: 0;
    background-color: #f8f9fa;
}
</style>