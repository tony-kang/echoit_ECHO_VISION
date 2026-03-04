<script>
	import { authStore } from '$lib/stores/authStore.svelte.js';

	/**
	 * 현재 사용자 프로필 (user_profiles). 미전달 시 authStore.profile 사용
	 * @type {{ can_dashboard?: boolean, can_performance?: boolean, can_profit_loss?: boolean } | null | undefined}
	 */
	let { profile: profileProp = undefined } = $props();

	/** @type {{ can_dashboard?: boolean, can_performance?: boolean, can_profit_loss?: boolean } | null} */
	let profile = $derived(profileProp ?? authStore.profile);

	/** @type {{ key: string, label: string, value: boolean }[]} 표시할 권한 목록 */
	let permissions = $derived([
		{ key: 'can_dashboard', label: '대시보드', value: profile?.can_dashboard === true },
		{ key: 'can_performance', label: '실적현황', value: profile?.can_performance === true },
		{ key: 'can_profit_loss', label: '손익현황', value: profile?.can_profit_loss === true }
	]);
</script>

<div class="permission-bar">
	<span class="permission-label">권한</span>
	{#each permissions as { key, label, value }}
		<span class="permission-item" data-key={key} class:allowed={value} class:denied={!value}>
			{label}
			<strong>{value ? 'O' : 'X'}</strong>
		</span>
	{/each}
</div>

<style>
	.permission-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}
	.permission-label {
		font-weight: 600;
		color: #475569;
		margin-right: 0.5rem;
	}
	.permission-item {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;
		color: #64748b;
	}
	.permission-item strong {
		font-weight: 700;
		min-width: 1.2em;
	}
	.permission-item.allowed strong {
		color: #15803d;
	}
	.permission-item.denied strong {
		color: #b91c1c;
	}
</style>
