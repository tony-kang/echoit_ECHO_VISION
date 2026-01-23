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
	<title>회사 소개 - {___prjConst.oAuth.appName}</title>
	<meta name="description" content="{___prjConst.company.name}의 회사 소개 페이지입니다." />
</svelte:head>

<div class="main-content-page">
	<main>
		<!-- Hero Section -->
		<section class="bg-linear-to-r from-blue-600 to-indigo-700 text-white py-20">
			<div class="max-w-7xl mx-auto px-4">
				<div class="text-center">
					<h1 class="text-4xl md:text-5xl font-bold mb-4">회사 소개</h1>
					<p class="text-xl md:text-2xl text-blue-100">혁신적인 기술 솔루션으로 미래를 만들어갑니다</p>
				</div>
			</div>
		</section>

		<!-- 회사 개요 -->
		<section class="py-16 bg-white">
			<div class="max-w-7xl mx-auto px-4">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					<div>
						<h2 class="text-3xl font-bold text-gray-900 mb-6">에코비전</h2>
						<p class="text-lg text-gray-700 mb-4 leading-relaxed">
							에코비전는 혁신적인 기술 솔루션을 제공하는 전문 개발 회사입니다. 
							고객의 비즈니스 성장을 위한 맞춤형 시스템 개발과 컨설팅 서비스를 제공합니다.
						</p>
						<p class="text-lg text-gray-700 mb-4 leading-relaxed">
							Admin Portal, Factory Portal, Frontend/Backend 개발부터 Embedded 시스템까지 
							다양한 분야의 전문성을 바탕으로 고객의 요구사항을 정확히 이해하고 
							최적의 솔루션을 제공합니다.
						</p>
					</div>
					<div class="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-8">
						<div class="space-y-4">
							<div>
								<h3 class="font-semibold text-gray-900 mb-2">회사명</h3>
								<p class="text-gray-700">{___prjConst.company.name}</p>
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-2">대표이사</h3>
								<p class="text-gray-700">{___prjConst.company.ceo}</p>
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-2">기술이사</h3>
								<p class="text-gray-700">{___prjConst.company.cto}</p>
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-2">주소</h3>
								<p class="text-gray-700">{___prjConst.company.address}</p>
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-2">연락처</h3>
								<p class="text-gray-700">{___prjConst.company.phone}</p>
								<p class="text-gray-700">{___prjConst.company.email}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- 핵심 가치 -->
		<section class="py-16 bg-gray-50">
			<div class="max-w-7xl mx-auto px-4">
				<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">핵심 가치</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div class="bg-white rounded-lg shadow-md p-6 text-center">
						<div class="text-5xl mb-4">🎯</div>
						<h3 class="text-xl font-semibold text-gray-900 mb-3">정확성</h3>
						<p class="text-gray-600">고객의 요구사항을 정확히 이해하고 분석하여 최적의 솔루션을 제공합니다.</p>
					</div>
					<div class="bg-white rounded-lg shadow-md p-6 text-center">
						<div class="text-5xl mb-4">⚡</div>
						<h3 class="text-xl font-semibold text-gray-900 mb-3">혁신</h3>
						<p class="text-gray-600">최신 기술과 트렌드를 반영한 혁신적인 솔루션으로 경쟁력을 확보합니다.</p>
					</div>
					<div class="bg-white rounded-lg shadow-md p-6 text-center">
						<div class="text-5xl mb-4">🤝</div>
						<h3 class="text-xl font-semibold text-gray-900 mb-3">협력</h3>
						<p class="text-gray-600">고객과의 긴밀한 협력을 통해 성공적인 프로젝트를 완성합니다.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- 전문 분야 -->
		<section class="py-16 bg-white">
			<div class="max-w-7xl mx-auto px-4">
				<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">전문 분야</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
						<div class="text-3xl mb-3">📊</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Admin Portal / Factory Portal</h3>
						<p class="text-gray-600">효율적인 관리자 포털과 공장 관리 시스템 개발</p>
					</div>
					<div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
						<div class="text-3xl mb-3">💻</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Frontend / Backend</h3>
						<p class="text-gray-600">SvelteKit 기반 프론트엔드 및 Node.js 기반 백엔드 개발</p>
					</div>
					<div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
						<div class="text-3xl mb-3">🔧</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Embedded (STM32)</h3>
						<p class="text-gray-600">STM32 기반 임베디드 시스템 개발</p>
					</div>
					<div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
						<div class="text-3xl mb-3">🏗️</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">System Architecture Design</h3>
						<p class="text-gray-600">시스템 아키텍처 설계 및 컨설팅</p>
					</div>
					<div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
						<div class="text-3xl mb-3">💡</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Development Consulting</h3>
						<p class="text-gray-600">개발 컨설팅 및 기술 지원</p>
					</div>
					<div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
						<div class="text-3xl mb-3">🔧</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">System Maintenance</h3>
						<p class="text-gray-600">시스템 유지보수 및 운영 지원</p>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA Section -->
		<section class="py-16 bg-linear-to-r from-blue-600 to-indigo-700 text-white">
			<div class="max-w-7xl mx-auto px-4 text-center">
				<h2 class="text-3xl font-bold mb-4">함께 성장해 나가요</h2>
				<p class="text-xl text-blue-100 mb-8">에코비전와 함께 혁신적인 솔루션을 만들어보세요</p>
				<a 
					href="/" 
					class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
				>
					문의하기
				</a>
			</div>
		</section>
	</main>
</div>
