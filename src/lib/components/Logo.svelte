<script>
	/**
	 * Logo Component
	 * 에코비전 로지틱스 로고
	 * 
	 * @param {Object} props
	 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - 크기
	 */
	
	let { 
		size = 'md'
	} = $props();
	
	// 사이즈별 높이
	const sizeClasses = {
		sm: 'h-8',
		md: 'h-12',
		lg: 'h-16'
	};
	
	/**
	 * @param {'sm' | 'md' | 'lg'} sizeValue
	 * @returns {string}
	 */
	function getSizeClass(sizeValue) {
		return sizeClasses[sizeValue] || sizeClasses.md;
	}
	
	const currentSize = $derived(getSizeClass(size));
</script>

<div class="logo-container">
	<img 
		src="/logo/logo_w.png" 
		alt="에코비전 로지틱스" 
		class="logo-image {currentSize}" 
	/>
</div>

<style>
	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.logo-image {
		height: 60px;
	}

	/* 모바일 및 태블릿에서 로고 크기 축소 (아이패드 포함) */
	@media (max-width: 1024px) {
		.logo-image {
			height: 40px;
		}
	}

	@media (max-width: 480px) {
		.logo-image {
			height: 32px;
		}
	}
</style>
