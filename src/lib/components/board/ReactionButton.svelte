<script>
	let {
		type,
		count = 0,
		isActive = false,
		onClick = () => {}
	} = $props();

	const config = {
		like: {
			icon: '👍',
			activeClass: 'bg-green-100 text-green-700',
			inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-green-50'
		},
		dislike: {
			icon: '👎',
			activeClass: 'bg-red-100 text-red-700',
			inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-red-50'
		}
	};

	const style = config[type] || config.like;

	/**
	 * 버튼 클릭 핸들러
	 * @param {MouseEvent} event - 클릭 이벤트
	 * @returns {void}
	 */
	function handleClick(event) {
		event.preventDefault();
		event.stopPropagation();
		onClick();
	}
</script>

<button
	type="button"
	onclick={handleClick}
	class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer {isActive ? style.activeClass : style.inactiveClass}"
>
	<span>{style.icon}</span>
	<span>{count}</span>
</button>

