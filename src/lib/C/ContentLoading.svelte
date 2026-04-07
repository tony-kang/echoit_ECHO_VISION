<script>
    import LoadingSpinner from '$lib/components/board/LoadingSpinner.svelte';
    import ErrorMessage from '$lib/components/board/ErrorMessage.svelte';
    import EmptyState from '$lib/components/board/EmptyState.svelte';
    import AccessDenied from '$lib/C/AccessDenied.svelte';

    /**
     * @typedef {Object} ContentLoadingProps
     * @property {boolean} [loading=false]
     * @property {string|null} [errorMessage=null]
     * @property {boolean} [isAllowed=true] - 권한 여부 (기본값 true)
     * @property {string} [deniedTitle='접근 권한이 없습니다.']
     * @property {string} [deniedMessage='이 페이지를 볼 수 있는 권한이 없습니다.']
     * @property {boolean} [empty=false]
     * @property {string} [emptyTitle='데이터가 없습니다.']
     * @property {string} [emptyMessage='']
     * @property {() => void} [onRetry]
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {ContentLoadingProps} */
    let {
        loading = false,
        errorMessage = null,
        isAllowed = true, // 권한 체크 추가
        deniedTitle = '접근 권한이 없습니다.',
        deniedMessage = '이 페이지를 볼 수 있는 권한이 없습니다.',
        empty = false,
        emptyTitle = '데이터가 없습니다.',
        emptyMessage = '',
        onRetry,
        children
    } = $props();
</script>

{#if loading}
    <LoadingSpinner message="데이터를 불러오는 중..." />
{:else if !isAllowed}
    <AccessDenied title={deniedTitle} message={deniedMessage} />
{:else if errorMessage}
    <ErrorMessage message={errorMessage} onRetry={onRetry} />
{:else if empty}
    <EmptyState title={emptyTitle} message={emptyMessage} />
{:else}
    {@render children?.()}
{/if}