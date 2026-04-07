<script>
	import { goto } from '$app/navigation';

	/**
	 * 접근 거부 화면 (화면 정중앙, 강조 스타일)
	 * @property {string} [title] - 제목
	 * @property {string} [message] - 본문 메시지
	 */
	let {
		title = '접근 권한이 없습니다.',
		message = '잘못된 접근입니다.'
	} = $props();

	/** 홈으로 이동 */
	function goHome() {
		goto('/');
	}
</script>

<div class="access-denied-wrap">
	<div class="access-denied-bg" aria-hidden="true"></div>
	<div class="access-denied-card">
		<div class="access-denied-icon" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
				<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
			</svg>
		</div>
		<h1 class="access-denied-title">{title}</h1>
		<p class="access-denied-message">{message}</p>
		<div class="access-denied-actions">
			<button type="button" class="access-denied-btn" onclick={goHome}>홈으로 돌아가기</button>
		</div>
	</div>
</div>

<style>
	.access-denied-wrap {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 100;
	}

	.access-denied-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%);
		opacity: 0.2;
		pointer-events: none;
	}

	.access-denied-bg::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.4), transparent),
			radial-gradient(ellipse 60% 40% at 100% 50%, rgba(139, 92, 246, 0.2), transparent),
			radial-gradient(ellipse 50% 30% at 0% 80%, rgba(99, 102, 241, 0.25), transparent);
		pointer-events: none;
	}

	.access-denied-card {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 420px;
		padding: 2.5rem 2rem;
		text-align: center;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 24px;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.15),
			0 25px 50px -12px rgba(0, 0, 0, 0.4),
			0 0 80px -20px rgba(139, 92, 246, 0.5);
		backdrop-filter: blur(12px);
		animation: access-denied-in 0.5s ease-out;
	}

	@keyframes access-denied-in {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.access-denied-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100px;
		height: 100px;
		margin: 0 auto 1.5rem;
		color: #6366f1;
		background: linear-gradient(145deg, #eef2ff, #e0e7ff);
		border-radius: 50%;
		box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
	}

	.access-denied-icon svg {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
	}

	.access-denied-title {
		margin: 0 0 0.75rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e1b4b;
		letter-spacing: -0.02em;
		line-height: 1.3;
	}

	.access-denied-message {
		margin: 0 0 1.75rem;
		font-size: 1rem;
		color: #64748b;
		line-height: 1.6;
	}

	.access-denied-actions {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.access-denied-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #fff;
		text-decoration: none;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		border: none;
		border-radius: 12px;
		box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
		transition: transform 0.2s, box-shadow 0.2s;
		cursor: pointer;
		font-family: inherit;
	}

	.access-denied-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(99, 102, 241, 0.45);
	}

	.access-denied-btn:active {
		transform: translateY(0);
	}
</style>
