<script>
	/**
	 * @typedef {Object} User
	 * @property {string} [id] - 사용자 ID
	 * @property {string} [full_name] - 사용자 이름
	 * @property {string} [avatar_url] - 아바타 URL
	 */

	let {
		/** @type {User | null} */
		user,
		showName = false,
		/** @type {'sm' | 'md' | 'lg'} */
		size = 'sm'
	} = $props();

	/** @type {{ sm: string; md: string; lg: string }} */
	const sizeClasses = {
		sm: 'w-6 h-6 text-xs',
		md: 'w-8 h-8 text-sm',
		lg: 'w-12 h-12 text-base'
	};

	/**
	 * 이름의 첫 글자를 반환하는 함수
	 * @param {string | null | undefined} name - 사용자 이름
	 * @returns {string} 첫 글자 또는 '?'
	 */
	function getInitials(name) {
		if (!name) return '?';
		return name.charAt(0).toUpperCase();
	}

	/** @type {string} 현재 크기에 맞는 클래스 */
	const currentSizeClass = $derived.by(() => {
		const currentSize = size;
		if (currentSize === 'sm' || currentSize === 'md' || currentSize === 'lg') {
			return sizeClasses[currentSize];
		}
		return sizeClasses.sm;
	});
</script>

<div class="flex items-center gap-2">
	{#if user?.avatar_url}
		<img
			src={user.avatar_url}
			alt={user.full_name || 'User'}
			class="rounded-full {currentSizeClass}"
		/>
	{:else}
		<div class="rounded-full bg-blue-500 text-white flex items-center justify-center {currentSizeClass}">
			{getInitials(user?.full_name)}
		</div>
	{/if}
	{#if showName}
		<span class="font-medium">{user?.full_name || '익명'}</span>
	{/if}
</div>

