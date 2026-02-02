<script>
	import ___prjConst from '$prj/prjConst';
</script>

<div class="main-content-page">
	<!-- Main Content -->
	<main>
		<!-- 경영지표관리 시스템 소개 섹션 -->
		<section class="py-16 bg-white">
			<div class="max-w-7xl mx-auto px-4">
				<div class="hero-container">
					<!-- 이미지 컨테이너 -->
					<div class="image-container">
						<div class="image-blur"></div>
						<img 
							src="/img/main_no_text_bg.png" 
							alt="경영지표 관리 시스템"
							class="hero-image"
						/>
						
						<!-- 슬로건 텍스트 (이미지 위 오버레이) -->
						<div class="slogan-wrapper">
							<h1 class="slogan-main">경영지표관리</h1>
							<p class="slogan-sub">데이터로 미래를 설계하다</p>
							<p class="slogan-desc">경영지표 데이터 분석으로 더 나은 의사결정을 지원합니다</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	</main>
</div>

<style>
	.hero-container {
		position: relative;
		width: 100%;
		margin: 0 auto;
		overflow: hidden;
	}

	.image-container {
		position: relative;
		width: 100%;
		margin: 0 auto;
	}

	.slogan-wrapper {
		position: absolute;
		top: 2rem;
		left: 2rem;
		text-align: left;
		z-index: 2;
		pointer-events: none;
		padding: 1.5rem;
		max-width: 600px;
	}

	.slogan-main {
		font-size: 4rem;
		font-weight: 800;
		background: linear-gradient(90deg, #10b981 0%, #06b6d4 30%, #3b82f6 60%, #1e40af 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 1rem;
		text-shadow: 0 4px 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(16, 185, 129, 0.4);
		animation: gradientShift 3s ease infinite, fadeInUp 1s ease-out;
		background-size: 200% 200%;
		letter-spacing: -0.02em;
		filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.3));
	}

	.slogan-sub {
		font-size: 1.75rem;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 0.5rem;
		opacity: 0;
		animation: fadeInUp 1s ease-out 0.3s forwards;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(102, 126, 234, 0.4);
	}

	.slogan-desc {
		font-size: 1.125rem;
		color: #f1f5f9;
		font-weight: 400;
		opacity: 0;
		animation: fadeInUp 1s ease-out 0.6s forwards;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 15px rgba(102, 126, 234, 0.3);
	}

	.image-blur {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		background: radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%);
		filter: blur(60px);
		animation: pulse 4s ease-in-out infinite;
		z-index: 0;
	}

	.hero-image {
		position: relative;
		width: 100%;
		height: auto;
		display: block;
		margin: 0 auto;
		animation: float 6s ease-in-out infinite;
		filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1));
		transition: all 0.3s ease;
		z-index: 1;
	}

	.hero-image:hover {
		transform: translateY(-10px) scale(1.02);
		filter: drop-shadow(0 30px 60px rgba(102, 126, 234, 0.2)) blur(1px);
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	@keyframes gradientShift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.5;
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			opacity: 0.8;
			transform: translate(-50%, -50%) scale(1.1);
		}
	}

	/* 반응형 디자인 (아이패드 포함) */
	@media (max-width: 1024px) {
		.slogan-wrapper {
			top: 0.5rem;
			left: 0.5rem;
			padding: 0.5rem;
			max-width: calc(100% - 1rem);
		}

		.slogan-main {
			font-size: 1.25rem;
			margin-bottom: 0.375rem;
			letter-spacing: -0.01em;
		}

		.slogan-sub {
			font-size: 0.875rem;
			margin-bottom: 0.25rem;
		}

		.slogan-desc {
			font-size: 0.75rem;
			line-height: 1.3;
		}
	}

	/* 작은 모바일 디바이스 */
	@media (max-width: 480px) {
		.slogan-wrapper {
			top: 0.375rem;
			left: 0.375rem;
			padding: 0.375rem;
			max-width: calc(100% - 0.75rem);
		}

		.slogan-main {
			font-size: 1rem;
			margin-bottom: 0.25rem;
		}

		.slogan-sub {
			font-size: 0.75rem;
			margin-bottom: 0.125rem;
		}

		.slogan-desc {
			font-size: 0.625rem;
			line-height: 1.25;
		}
	}
</style>
