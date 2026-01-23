<script>
	import { authStore } from '$lib/stores/authStore';
	import ___prjConst from '$prj/prjConst';
	
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	
	import { onMount } from 'svelte';
	
	onMount(() => {
		// 레이아웃에서 이미 초기화되므로 여기서는 구독만 함
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
		});

		return () => {
			unsubscribe();
		};
	});
</script>

<svelte:head>
	<title>회사 미션 - {___prjConst.oAuth.appName}</title>
	<meta name="description" content="{___prjConst.company.name}의 미션과 비전을 소개합니다." />
</svelte:head>

<div class="main-content-page">
	<main>
		<!-- Hero Section -->
		<section class="bg-linear-to-r from-purple-600 to-pink-600 text-white py-20">
			<div class="max-w-7xl mx-auto px-4">
				<div class="text-center">
					<h1 class="text-4xl md:text-5xl font-bold mb-4">회사 미션</h1>
					<p class="text-xl md:text-2xl text-purple-100">기술로 세상을 더 나은 곳으로 만듭니다</p>
				</div>
			</div>
		</section>

		<!-- 미션 -->
		<section class="py-16 bg-white">
			<div class="max-w-4xl mx-auto px-4">
				<div class="text-center mb-12">
					<div class="text-6xl mb-6">🎯</div>
					<h2 class="text-3xl font-bold text-gray-900 mb-4">우리의 미션</h2>
					<p class="text-xl text-gray-700 leading-relaxed">
						고객의 비즈니스 성공을 위한 최고의 기술 솔루션을 제공하고, 
						혁신적인 아이디어를 현실로 만들어 고객과 함께 성장합니다.
					</p>
				</div>
			</div>
		</section>

		<!-- 비전 -->
		<section class="py-16 bg-gray-50">
			<div class="max-w-4xl mx-auto px-4">
				<div class="text-center mb-12">
					<div class="text-6xl mb-6">🌟</div>
					<h2 class="text-3xl font-bold text-gray-900 mb-4">우리의 비전</h2>
					<p class="text-xl text-gray-700 leading-relaxed mb-6">
						기술 혁신의 선두주자로서, 고객의 성공을 최우선으로 생각하며 
						지속 가능한 성장과 발전을 추구합니다.
					</p>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
						<div class="bg-white rounded-lg shadow-md p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-2">혁신</h3>
							<p class="text-gray-600">최신 기술 트렌드를 선도하며 혁신적인 솔루션을 제공합니다.</p>
						</div>
						<div class="bg-white rounded-lg shadow-md p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-2">신뢰</h3>
							<p class="text-gray-600">고객과의 신뢰를 바탕으로 장기적인 파트너십을 구축합니다.</p>
						</div>
						<div class="bg-white rounded-lg shadow-md p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-2">성장</h3>
							<p class="text-gray-600">고객과 함께 성장하며 상호 발전을 추구합니다.</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- 핵심 가치 -->
		<section class="py-16 bg-white">
			<div class="max-w-7xl mx-auto px-4">
				<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">핵심 가치</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div class="flex gap-4">
						<div class="shrink-0">
							<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
								💎
							</div>
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-2">품질 우선</h3>
							<p class="text-gray-600">
								최고 품질의 코드와 시스템을 제공하여 고객의 비즈니스에 실질적인 가치를 창출합니다.
							</p>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="shrink-0">
							<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">
								🚀
							</div>
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-2">빠른 실행</h3>
							<p class="text-gray-600">
								빠른 프로토타이핑과 반복적인 개선을 통해 고객의 요구사항을 신속하게 반영합니다.
							</p>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="shrink-0">
							<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
								🎨
							</div>
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-2">사용자 중심</h3>
							<p class="text-gray-600">
								사용자 경험을 최우선으로 생각하며 직관적이고 효율적인 인터페이스를 설계합니다.
							</p>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="shrink-0">
							<div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
								🔒
							</div>
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-2">보안과 안정성</h3>
							<p class="text-gray-600">
								보안과 안정성을 최우선으로 하여 고객의 데이터와 시스템을 안전하게 보호합니다.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- 약속 -->
		<section class="py-16 bg-linear-to-br from-blue-50 to-indigo-50">
			<div class="max-w-4xl mx-auto px-4">
				<div class="bg-white rounded-lg shadow-lg p-8 md:p-12">
					<div class="text-center mb-8">
						<div class="text-5xl mb-4">🤝</div>
						<h2 class="text-3xl font-bold text-gray-900 mb-4">우리의 약속</h2>
					</div>
					<div class="space-y-6 text-gray-700">
						<div class="flex items-start gap-4">
							<div class="text-2xl">✓</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-1">고객 중심의 솔루션</h3>
								<p>고객의 비즈니스 목표를 정확히 이해하고, 이를 달성하기 위한 최적의 솔루션을 제공합니다.</p>
							</div>
						</div>
						<div class="flex items-start gap-4">
							<div class="text-2xl">✓</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-1">투명한 커뮤니케이션</h3>
								<p>프로젝트 진행 과정을 투명하게 공유하며, 고객과의 원활한 소통을 통해 최상의 결과를 만들어냅니다.</p>
							</div>
						</div>
						<div class="flex items-start gap-4">
							<div class="text-2xl">✓</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-1">지속적인 지원</h3>
								<p>프로젝트 완료 후에도 지속적인 유지보수와 지원을 통해 고객의 성공을 보장합니다.</p>
							</div>
						</div>
						<div class="flex items-start gap-4">
							<div class="text-2xl">✓</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-1">기술 혁신</h3>
								<p>최신 기술과 트렌드를 지속적으로 학습하고 적용하여 고객에게 최고의 기술을 제공합니다.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA Section -->
		<section class="py-16 bg-linear-to-r from-purple-600 to-pink-600 text-white">
			<div class="max-w-7xl mx-auto px-4 text-center">
				<h2 class="text-3xl font-bold mb-4">함께 성장해 나가요</h2>
				<p class="text-xl text-purple-100 mb-8">에코비전와 함께 혁신적인 솔루션을 만들어보세요</p>
				<a 
					href="/" 
					class="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
				>
					문의하기
				</a>
			</div>
		</section>
	</main>
</div>
