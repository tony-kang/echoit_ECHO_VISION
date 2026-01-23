<script>
	let {
		title = '새 글을 작성해보세요.',
		message = '게시판에 대해 궁금한 게 있거나 유용한 팁이 있다면 공유해주세요.',
		actionLabel = null,
		onAction = null
	} = $props();
</script>

<div class="empty-state">
	<div class="empty-state-icon">
		<!-- 왼쪽 말풍선 -->
		<svg class="speech-bubble-left" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M20 10C20 4.47715 24.4772 0 30 0H80C85.5228 0 90 4.47715 90 10V60C90 65.5228 85.5228 70 80 70H50L20 90V10Z" fill="#E5E7EB"/>
			<!-- 점 3개 -->
			<circle cx="40" cy="30" r="4" fill="#9CA3AF"/>
			<circle cx="55" cy="30" r="4" fill="#9CA3AF"/>
			<circle cx="70" cy="30" r="4" fill="#9CA3AF"/>
		</svg>
		<!-- 오른쪽 말풍선 -->
		<svg class="speech-bubble-right" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M10 5C10 2.23858 12.2386 0 15 0H55C57.7614 0 60 2.23858 60 5V40C60 42.7614 57.7614 45 55 45H35L10 60V5Z" fill="#D1D5DB"/>
		</svg>
	</div>
	<h3 class="empty-state-title">{title}</h3>
	{#if message}
		<p class="empty-state-message">{message}</p>
	{/if}
	{#if actionLabel && onAction}
		<button
			onclick={onAction}
			class="empty-state-button"
		>
			{actionLabel}
		</button>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-state-icon {
		position: relative;
		width: 120px;
		height: 100px;
		margin-bottom: 2rem;
	}

	.speech-bubble-left {
		position: absolute;
		top: 0;
		left: 0;
		width: 120px;
		height: 100px;
		z-index: 1;
	}

	.speech-bubble-right {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 80px;
		height: 70px;
		z-index: 0;
	}

	.empty-state-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}

	.empty-state-message {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.6;
		max-width: 400px;
	}

	.empty-state-button {
		margin-top: 1.5rem;
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: #ffffff;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.empty-state-button:hover {
		background-color: #2563eb;
	}

	/* 반응형 */
	@media (max-width: 768px) {
		.empty-state {
			padding: 3rem 1.5rem;
		}

		.empty-state-icon {
			width: 100px;
			height: 85px;
			margin-bottom: 1.5rem;
		}

		.speech-bubble-left {
			width: 100px;
			height: 85px;
		}

		.speech-bubble-right {
			width: 70px;
			height: 60px;
		}

		.empty-state-title {
			font-size: 1.125rem;
		}

		.empty-state-message {
			font-size: 0.8125rem;
		}
	}
</style>

