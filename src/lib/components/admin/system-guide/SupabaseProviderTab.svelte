<script>
	import ___prjConst from '$prj/prjConst';
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold text-gray-900 mb-4">Supabase에서 Google OAuth Provider 설정</h2>
		<p class="text-gray-600 mb-6">Google Provider 활성화 및 인증 정보 입력</p>
	</div>

	<div class="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">1. Supabase Dashboard → Authentication → Providers 이동</h4>
				<p class="text-sm text-gray-600">좌측 메뉴에서 <code class="bg-gray-100 px-2 py-1 rounded">Authentication</code> → <code class="bg-gray-100 px-2 py-1 rounded">Providers</code> 클릭</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">2. Google Provider 활성화</h4>
				<p class="text-sm text-gray-600">Google 토글을 <code class="bg-gray-100 px-2 py-1 rounded">Enabled</code>로 설정</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">3. Client ID 및 Client Secret 입력</h4>
				<div class="bg-white border border-gray-300 rounded p-4 space-y-3">
					<div>
						<label for="client-id-info" class="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
						<p id="client-id-info" class="text-sm text-gray-600">Google Cloud Console에서 생성한 OAuth 2.0 클라이언트의 Client ID를 입력합니다. (필수)</p>
					</div>
					<div>
						<label for="client-secret-info" class="block text-sm font-medium text-gray-700 mb-1">Client Secret (for OAuth)</label>
						<p id="client-secret-info" class="text-sm text-gray-600">Google Cloud Console에서 생성한 OAuth 2.0 클라이언트의 Client Secret을 입력합니다. (필수)</p>
						<p class="text-sm text-red-700 bg-red-50 p-2 rounded mt-2">
							⚠️ <strong>중요:</strong> 웹 애플리케이션의 경우 Client Secret이 필수입니다. Client Secret 없이는 Google OAuth가 정상적으로 작동하지 않을 수 있습니다.
						</p>
					</div>
				</div>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">4. 저장</h4>
				<p class="text-sm text-gray-600">모든 정보를 입력한 후 저장 버튼을 클릭합니다.</p>
			</div>

			<div class="bg-yellow-50 border border-yellow-200 rounded p-4">
				<p class="text-sm text-yellow-800">
					🔒 <strong>보안 주의:</strong> Client Secret은 보안상 중요한 정보이므로 절대 공개 저장소에 커밋하지 마세요.
				</p>
			</div>
		</div>
	</div>
</div>
