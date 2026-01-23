<script>
	import ___prjConst from '$prj/prjConst';
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold text-gray-900 mb-4">문제 해결</h2>
		<p class="text-gray-600 mb-6">자주 발생하는 문제와 해결 방법</p>
	</div>

	<!-- 앱 이름 불일치 오류 -->
	<div class="bg-red-50 border border-red-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">❌</span>
			OAuth 인증 심사: "앱 이름 불일치" 오류
		</h3>
		
		<p class="text-gray-700 mb-4">
			구글 Cloud Console의 OAuth 인증 심사에서 발생하는 "앱 이름 불일치" 오류는 구글에 등록된 이름과 실제 사용자가 접속하는 웹사이트(홈페이지)상에 표시된 이름이 시각적으로 다를 때 발생합니다.
		</p>

		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">1. Google Cloud Console에서 앱 이름 확인</h4>
				<p class="text-sm text-gray-600 mb-2">수정 위치: Google Cloud Console → API 및 서비스 → OAuth 동의 화면</p>
				<div class="bg-white border border-gray-300 rounded p-3">
					<p class="text-sm">'앱 이름' 필드에 <strong>"{___prjConst.oAuth.appName}"</strong>이 정확히 입력되어 있는지 확인합니다.</p>
					<p class="text-sm text-red-600 mt-2">오타나 불필요한 공백이 없는지 다시 한번 체크하세요.</p>
				</div>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">2. 홈페이지의 앱 이름 확인 (중요)</h4>
				<p class="text-sm text-gray-600 mb-2">구글 심사팀은 제공하신 홈페이지 URL에 접속하여 화면에 보이는 서비스 명칭을 대조합니다.</p>
				<div class="bg-white border border-gray-300 rounded p-3 space-y-2">
					<p class="text-sm font-medium">확인 위치:</p>
					<ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
						<li>브라우저 타이틀(<code class="bg-gray-100 px-1 rounded">&lt;title&gt;</code> 태그)</li>
						<li>페이지 하단(Footer)의 저작권 표시 부분</li>
						<li>Open Graph 메타 태그 (<code class="bg-gray-100 px-1 rounded">og:site_name</code>)</li>
					</ul>
					<p class="text-sm text-red-600 mt-2">
						⚠️ 홈페이지 하단에 "Telepasi"라고만 적혀 있다면 구글은 이를 다른 앱으로 간주합니다. 이를 <strong>"{___prjConst.oAuth.appName}"</strong>으로 변경해야 합니다.
					</p>
				</div>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">3. 개인정보 처리방침 및 서비스 약관 확인</h4>
				<p class="text-sm text-gray-600 mb-2">구글에 제출한 개인정보 처리방침(Privacy Policy) 문서 내에서도 앱 이름이 일치해야 합니다.</p>
				<div class="bg-white border border-gray-300 rounded p-3">
					<p class="text-sm">문서 내에서 해당 서비스를 지칭할 때 <strong>"{___prjConst.oAuth.appName}"</strong>이라는 명칭을 일관되게 사용하고 있는지 확인하세요.</p>
				</div>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">4. 도메인 소유권 확인</h4>
				<p class="text-sm text-gray-600">사용 중인 홈페이지 도메인이 구글 콘솔의 '승인된 도메인' 리스트에 포함되어 있는지 확인하세요.</p>
			</div>
		</div>
	</div>

	<!-- 기타 문제들 -->
	<div class="space-y-4">
		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">"redirect_uri_mismatch" 에러</h3>
			<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
				<li>Google Cloud Console의 승인된 리디렉션 URI에 Supabase 콜백 URL이 정확히 추가되었는지 확인</li>
				<li>Supabase 프로젝트 ID가 정확한지 확인</li>
			</ul>
		</div>

		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">"access_denied" 에러</h3>
			<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
				<li>Supabase Dashboard의 Redirect URLs에 모든 URL이 추가되었는지 확인</li>
				<li>Google Cloud Console의 승인된 리디렉션 URI 확인</li>
			</ul>
		</div>

		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">Google 로그인 화면에 "supabase.co(으)로 이동" 표시되는 문제</h3>
			<p class="text-sm text-gray-600 mb-2">OAuth 동의 화면에서 앱 이름이 설정되지 않았거나, Supabase 프로젝트 이름이 표시되고 있습니다.</p>
			<p class="text-sm text-gray-600">해결 방법: Google Cloud Console → API 및 서비스 → OAuth 동의 화면에서 "앱 이름" 필드에 <strong>"{___prjConst.oAuth.appName}"</strong>을 입력하세요.</p>
		</div>
	</div>
</div>
