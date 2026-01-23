<script>
	import ___prjConst from '$prj/prjConst';

	let {
		onCopy = () => {}
	} = $props();
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold text-gray-900 mb-4">Google Cloud Console 설정</h2>
		<p class="text-gray-600 mb-6">OAuth 동의 화면 및 클라이언트 ID 설정</p>
	</div>

	<!-- OAuth 동의 화면 설정 -->
	<div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">🎨</span>
			OAuth 동의 화면 설정
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">1. Google Cloud Console 접속</h4>
				<a 
					href="https://console.cloud.google.com" 
					target="_blank" 
					rel="noopener noreferrer"
					class="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
				>
					https://console.cloud.google.com
					<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
					</svg>
				</a>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">2. API 및 서비스 → OAuth 동의 화면 이동</h4>
				<p class="text-sm text-gray-600">좌측 메뉴에서 <code class="bg-gray-100 px-2 py-1 rounded">API 및 서비스</code> → <code class="bg-gray-100 px-2 py-1 rounded">OAuth 동의 화면</code> 클릭</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">3. 앱 정보 설정</h4>
				<div class="bg-white border border-gray-300 rounded p-4 space-y-3">
					<div>
						<label for="appName" class="block text-sm font-medium text-gray-700 mb-1">앱 이름</label>
						<div class="bg-gray-50 border border-gray-300 rounded p-2 flex items-center justify-between">
							<code class="text-sm">{___prjConst.oAuth.appName}</code>
							<button 
								onclick={() => onCopy(___prjConst.oAuth.appName)}
								class="text-blue-600 hover:text-blue-800 text-sm"
							>
								복사
							</button>
						</div>
						<p class="text-sm text-red-700 bg-red-50 p-2 rounded mt-2">
							⚠️ <strong>중요:</strong> 이 이름은 홈페이지에 표시되는 앱 이름과 정확히 일치해야 합니다. 오타나 불필요한 공백이 없어야 합니다.
						</p>
					</div>
					<div>
						<label for="appDomain" class="block text-sm font-medium text-gray-700 mb-1">앱 도메인</label>
						<div class="bg-gray-50 border border-gray-300 rounded p-2">
							<code class="text-sm">{___prjConst.production.domain.replace('https://', '')}</code>
						</div>
					</div>
					<div>
						<label for="approvedDomain" class="block text-sm font-medium text-gray-700 mb-1">승인된 도메인</label>
						<div class="bg-gray-50 border border-gray-300 rounded p-2">
							<code class="text-sm">{___prjConst.production.domain.replace('https://', '').replace('www.', '')}</code>
						</div>
						<p class="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
							⚠️ 승인된 도메인에는 <strong>localhost를 입력할 수 없습니다</strong>. 공개적으로 접근 가능한 도메인만 허용합니다.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- OAuth 2.0 클라이언트 ID 설정 -->
	<div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">🔑</span>
			OAuth 2.0 클라이언트 ID 설정
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">1. API 및 서비스 → 사용자 인증 정보 이동</h4>
				<p class="text-sm text-gray-600">좌측 메뉴에서 <code class="bg-gray-100 px-2 py-1 rounded">API 및 서비스</code> → <code class="bg-gray-100 px-2 py-1 rounded">사용자 인증 정보</code> 클릭</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">2. OAuth 2.0 클라이언트 ID 생성/편집</h4>
				<p class="text-sm text-gray-600 mb-2">애플리케이션 유형: <code class="bg-gray-100 px-2 py-1 rounded">웹 애플리케이션</code></p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">3. 승인된 리디렉션 URI 추가</h4>
				<div class="bg-white border border-gray-300 rounded p-3 mb-2">
					<code class="text-sm">https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback</code>
				</div>
				<p class="text-sm text-gray-600">
					💡 <code class="bg-gray-100 px-2 py-1 rounded">[YOUR_SUPABASE_PROJECT_ID]</code>는 Supabase 프로젝트의 실제 ID로 교체해야 합니다.
					<br>Supabase Dashboard → Settings → API에서 프로젝트 URL을 확인할 수 있습니다.
				</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">4. 승인된 JavaScript 원본 추가</h4>
				<div class="space-y-2">
					<div class="bg-white border border-gray-300 rounded p-3 flex items-center justify-between">
						<code class="text-sm">{___prjConst.dev.domain}</code>
						<button 
							onclick={() => onCopy(___prjConst.dev.domain)}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
					<div class="bg-white border border-gray-300 rounded p-3 flex items-center justify-between">
						<code class="text-sm">{___prjConst.production.domain}</code>
						<button 
							onclick={() => onCopy(___prjConst.production.domain)}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
				</div>
				<p class="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
					⚠️ localhost는 <strong>승인된 JavaScript 원본</strong>에 추가할 수 있습니다. 개발 환경에서 OAuth가 작동하려면 localhost URL을 여기에 추가해야 합니다.
				</p>
			</div>
		</div>
	</div>
</div>
