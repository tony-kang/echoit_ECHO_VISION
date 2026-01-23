<script>
	import ___prjConst from '$prj/prjConst';

	let {
		onCopy = () => {}
	} = $props();
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold text-gray-900 mb-4">Supabase Dashboard 설정</h2>
		<p class="text-gray-600 mb-6">localhost와 production 모두에서 Google OAuth가 작동하도록 설정합니다.</p>
	</div>

	<!-- Redirect URLs 설정 -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">📍</span>
			Redirect URLs 설정
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">1. Supabase Dashboard 접속</h4>
				<a 
					href="https://supabase.com/dashboard" 
					target="_blank" 
					rel="noopener noreferrer"
					class="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
				>
					https://supabase.com/dashboard
					<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
					</svg>
				</a>
				<p class="text-sm text-gray-600 mt-1">프로젝트: <strong>{___prjConst.company.website.replace('https://', '')}</strong> 선택</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">2. Authentication → URL Configuration 이동</h4>
				<p class="text-sm text-gray-600">좌측 메뉴에서 <code class="bg-gray-100 px-2 py-1 rounded">Authentication</code> 클릭 → <code class="bg-gray-100 px-2 py-1 rounded">URL Configuration</code> 탭 선택</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">3. Site URL 설정</h4>
				<div class="bg-white border border-gray-300 rounded p-3 mb-2">
					<code class="text-sm">{___prjConst.production.domain}</code>
				</div>
				<p class="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
					⚠️ <strong>중요:</strong> 개발 URL이 아닌 프로덕션 URL만 설정합니다.
				</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">4. Additional Redirect URLs 추가</h4>
				<div class="space-y-2">
					<div class="bg-white border border-gray-300 rounded p-3 flex items-center justify-between">
						<code class="text-sm">{___prjConst.dev.domain}/auth/callback</code>
						<button 
							onclick={() => onCopy(`${___prjConst.dev.domain}/auth/callback`)}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
					<div class="bg-white border border-gray-300 rounded p-3 flex items-center justify-between">
						<code class="text-sm">{___prjConst.production.domain}/auth/callback</code>
						<button 
							onclick={() => onCopy(`${___prjConst.production.domain}/auth/callback`)}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
				</div>
				<p class="text-sm text-gray-600 mt-2">
					💡 포트 번호는 개발 서버 설정에 따라 다를 수 있습니다. 사용 중인 포트를 확인하여 추가하세요.
				</p>
			</div>
		</div>
	</div>
</div>
