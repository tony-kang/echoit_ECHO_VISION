<div class="space-y-4">
	<div>
		<h4 class="font-medium text-gray-800 mb-2">추가 도메인 연결 방법</h4>
		<p class="text-sm text-gray-600 mb-2">
			이미 <code class="bg-gray-100 px-2 py-1 rounded">vision.echoit.co.kr</code>이 연결되어 있는 경우, 
			<code class="bg-gray-100 px-2 py-1 rounded">www.telepasi.co.kr</code> 같은 추가 도메인을 연결하는 방법입니다.
		</p>
		<div class="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
			<p class="text-sm text-yellow-800">
				⚠️ <strong>중요:</strong> 각 도메인은 <strong>독립적으로</strong> 하나씩 추가해야 합니다. 
				여러 도메인을 한 번에 지정하는 것이 아니라, 각 도메인마다 "Add Domain" 버튼을 클릭하여 개별적으로 추가합니다.
			</p>
		</div>
	</div>

	<div class="bg-white border border-gray-300 rounded-lg p-4 space-y-4">
		<div>
			<h4 class="font-medium text-gray-800 mb-2">Step 1: Vercel Dashboard에서 도메인 추가</h4>
			<ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
				<li>Vercel Dashboard 접속: <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">https://vercel.com/dashboard</a></li>
				<li>프로젝트 선택 (vision.echoit.co.kr이 연결된 프로젝트)</li>
				<li><strong>Settings</strong> 탭 클릭</li>
				<li>좌측 메뉴에서 <strong>"Domains"</strong> 클릭</li>
				<li><strong>"Add Domain"</strong> 또는 <strong>"Add"</strong> 버튼 클릭</li>
				<li>새 도메인 입력: <code class="bg-gray-100 px-2 py-1 rounded">www.telepasi.co.kr</code> (한 번에 하나씩만 입력)</li>
				<li><strong>"Add"</strong> 또는 <strong>"Continue"</strong> 클릭</li>
				<li>추가 도메인이 있으면 위 과정을 반복하여 각 도메인을 개별적으로 추가</li>
			</ol>
			<p class="text-sm text-gray-600 mt-3 bg-blue-50 p-2 rounded">
				💡 <strong>예시:</strong> <code class="bg-gray-100 px-2 py-1 rounded">www.telepasi.co.kr</code>을 추가한 후, 
				다른 도메인(예: <code class="bg-gray-100 px-2 py-1 rounded">telepasi.co.kr</code>)을 추가하려면 
				다시 "Add Domain" 버튼을 클릭하여 별도로 추가해야 합니다.
			</p>
		</div>

		<div>
			<h4 class="font-medium text-gray-800 mb-2">Step 2: DNS 설정</h4>
			<p class="text-sm text-gray-600 mb-2">Vercel이 도메인 추가 후 DNS 설정 방법을 안내합니다. 도메인 등록 업체(예: 가비아, 후이즈)에서 설정합니다.</p>
			
			<div class="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
				<div>
					<p class="text-sm font-medium text-gray-700 mb-1">방법 1: CNAME 레코드 (권장 - 서브도메인)</p>
					<div class="bg-white border border-gray-300 rounded p-2 mt-1">
						<table class="text-xs w-full">
							<thead class="bg-gray-100">
								<tr>
									<th class="px-2 py-1 text-left">타입</th>
									<th class="px-2 py-1 text-left">이름</th>
									<th class="px-2 py-1 text-left">값</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="px-2 py-1">CNAME</td>
									<td class="px-2 py-1">www</td>
									<td class="px-2 py-1">cname.vercel-dns.com</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="text-xs text-gray-600 mt-1">
						💡 Vercel Dashboard에서 정확한 CNAME 값을 확인하세요. 프로젝트마다 다를 수 있습니다.
					</p>
				</div>

				<div>
					<p class="text-sm font-medium text-gray-700 mb-1">방법 2: A 레코드 (루트 도메인)</p>
					<p class="text-xs text-gray-600">
						루트 도메인(telepasi.co.kr)을 연결하려면 A 레코드를 사용합니다. 
						Vercel Dashboard에서 제공하는 IP 주소를 사용하세요.
					</p>
				</div>
			</div>
		</div>

		<div>
			<h4 class="font-medium text-gray-800 mb-2">Step 3: SSL 인증서 자동 발급</h4>
			<p class="text-sm text-gray-600">
				DNS 설정이 완료되면 Vercel이 자동으로 SSL 인증서를 발급합니다. 
				보통 몇 분에서 몇 시간이 소요될 수 있습니다.
			</p>
			<p class="text-sm text-gray-600 mt-2">
				✅ DNS 설정 확인 후 Vercel Dashboard에서 도메인 상태를 확인하세요. 
				"Valid Configuration"으로 표시되면 정상적으로 연결된 것입니다.
			</p>
		</div>

		<div>
			<h4 class="font-medium text-gray-800 mb-2">Step 4: 두 번째 도메인부터 대표 도메인으로 포워딩 설정 (2개 이상 도메인 사용 시)</h4>
			<p class="text-sm text-gray-600 mb-2">
				2개 이상의 도메인을 사용하는 경우, 두 번째 도메인부터는 첫 번째 대표 도메인으로 자동 리다이렉트되도록 설정할 수 있습니다.
			</p>
			
			<div class="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
				<p class="text-sm text-blue-800 mb-2">
					💡 <strong>예시:</strong> 
					<code class="bg-gray-100 px-2 py-1 rounded">vision.echoit.co.kr</code>이 대표 도메인이고, 
					<code class="bg-gray-100 px-2 py-1 rounded">www.telepasi.co.kr</code>을 추가 도메인으로 사용하는 경우,
					<code class="bg-gray-100 px-2 py-1 rounded">www.telepasi.co.kr</code>로 접속하면 
					<code class="bg-gray-100 px-2 py-1 rounded">vision.echoit.co.kr</code>으로 자동 리다이렉트됩니다.
				</p>
			</div>

			<div class="space-y-3">
				<div>
					<h5 class="text-sm font-semibold text-gray-700 mb-2">방법 1: vercel.json 파일 사용</h5>
					<ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
						<li>프로젝트 루트 디렉토리에 <code class="bg-gray-100 px-2 py-1 rounded">vercel.json</code> 파일 생성 (없는 경우)</li>
						<li>다음 내용을 추가하거나 기존 <code class="bg-gray-100 px-2 py-1 rounded">redirects</code> 섹션에 추가:</li>
					</ol>
					<div class="bg-white border border-gray-300 rounded p-4 mt-2">
						<pre class="text-xs overflow-x-auto"><code>{'{'}
  "redirects": [
    {'{'}
      "source": "/(.*)",
      "destination": "https://vision.echoit.co.kr/$1",
      "permanent": true,
      "has": [
        {'{'}
          "type": "host",
          "value": "www.telepasi.co.kr"
        {'}'}
      ]
    {'}'}
  ]
{'}'}</code></pre>
					</div>
					<p class="text-xs text-gray-600 mt-2 mb-2">
						💡 <strong>여러 추가 도메인이 있는 경우:</strong> 각 도메인마다 별도의 redirects 항목을 추가합니다.
					</p>
					<div class="bg-gray-50 border border-gray-200 rounded p-3 mt-2">
						<p class="text-xs font-medium text-gray-700 mb-1">예시: 3개 도메인 (대표 도메인 1개 + 추가 도메인 2개)</p>
						<pre class="text-xs overflow-x-auto"><code>{'{'}
  "redirects": [
    {'{'}
      "source": "/(.*)",
      "destination": "https://vision.echoit.co.kr/$1",
      "permanent": true,
      "has": [
        {'{'}
          "type": "host",
          "value": "www.telepasi.co.kr"
        {'}'}
      ]
    {'}'},
    {'{'}
      "source": "/(.*)",
      "destination": "https://vision.echoit.co.kr/$1",
      "permanent": true,
      "has": [
        {'{'}
          "type": "host",
          "value": "telepasi.co.kr"
        {'}'}
      ]
    {'}'}
  ]
{'}'}</code></pre>
					</div>
				</div>

				<div>
					<h5 class="text-sm font-semibold text-gray-700 mb-2">방법 2: Vercel Dashboard에서 설정 (권장: 쉬움)</h5>
					<ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
						<li>Vercel Dashboard 접속</li>
						<li>프로젝트 선택</li>
						<li><strong>Settings</strong> 탭 클릭</li>
						<li>좌측 메뉴에서 <strong>"Redirects"</strong> 또는 <strong>"Rewrites"</strong> 클릭</li>
						<li><strong>"Add Redirect"</strong> 버튼 클릭</li>
						<li>다음 설정 입력:
							<ul class="ml-4 mt-1 space-y-1 list-disc">
								<li><strong>Source:</strong> <code class="bg-gray-100 px-1 py-0.5 rounded">/(.*)</code></li>
								<li><strong>Destination:</strong> <code class="bg-gray-100 px-1 py-0.5 rounded">https://vision.echoit.co.kr/$1</code></li>
								<li><strong>Permanent:</strong> 체크 (301 리다이렉트)</li>
								<li><strong>Has:</strong> Host = <code class="bg-gray-100 px-1 py-0.5 rounded">www.telepasi.co.kr</code></li>
							</ul>
						</li>
						<li><strong>"Save"</strong> 클릭</li>
					</ol>
				</div>

				<div class="bg-green-50 border border-green-200 rounded p-3">
					<p class="text-sm text-green-800 mb-1">
						✅ <strong>설정 완료 후 확인:</strong>
					</p>
					<ul class="text-sm text-green-800 space-y-1 list-disc list-inside">
						<li>추가 도메인(예: www.telepasi.co.kr)으로 접속 시 대표 도메인(vision.echoit.co.kr)으로 자동 리다이렉트되는지 확인</li>
						<li>브라우저 주소창에 대표 도메인 주소가 표시되는지 확인</li>
						<li>리다이렉트가 301 (Permanent)로 설정되어 SEO에 유리함</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="bg-yellow-50 border border-yellow-200 rounded p-3">
			<p class="text-sm text-yellow-800">
				⚠️ <strong>주의사항:</strong>
			</p>
			<ul class="text-sm text-yellow-800 mt-1 space-y-1 list-disc list-inside">
				<li>DNS 전파에는 최대 48시간이 걸릴 수 있지만, 보통 몇 분~몇 시간 내에 완료됩니다</li>
				<li>도메인 등록 업체에 따라 DNS 설정 방법이 다를 수 있습니다</li>
				<li>여러 도메인을 연결해도 동일한 프로젝트로 라우팅됩니다</li>
				<li>각 도메인에 대해 별도의 SSL 인증서가 자동으로 발급됩니다</li>
				<li><strong>리다이렉트 설정은 선택사항입니다.</strong> 모든 도메인이 동일한 콘텐츠를 표시하도록 하려면 리다이렉트 없이 사용할 수도 있습니다</li>
				<li>리다이렉트를 설정하면 SEO 측면에서 대표 도메인으로 통일되어 유리합니다</li>
			</ul>
		</div>
	</div>

	<!-- Vercel 성능 최적화 섹션 -->
	<div class="mt-8">
		<div>
			<h3 class="text-xl font-semibold text-gray-900 mb-2">Vercel 성능 최적화 가이드</h3>
			<p class="text-sm text-gray-600 mb-4">
				Vercel과 Supabase를 함께 사용할 때 성능을 최적화하는 방법입니다. 
				특히 1번(지역 일치)과 4번(Connection Pooling)만 제대로 설정해도 체감 속도가 2배 이상 빨라집니다.
			</p>
		</div>

		<div class="bg-white border border-gray-300 rounded-lg p-6 space-y-6">
			<!-- 1. Vercel Deployment Region 최적화 -->
			<div>
				<div class="flex items-start mb-3">
					<span class="text-2xl mr-3">1️⃣</span>
					<div class="flex-1">
						<h4 class="font-semibold text-gray-900 mb-2 text-lg">Vercel Deployment Region 최적화 (가장 중요)</h4>
						<p class="text-sm text-gray-600 mb-3">
							Vercel 서버와 Supabase 서버의 물리적 거리가 멀면 데이터 로딩이 느려집니다.
						</p>
					</div>
				</div>

				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-2">설정 방법:</p>
						<p class="text-sm text-gray-700 mb-2">
							Supabase 데이터베이스가 위치한 지역(예: Seoul - ap-northeast-2)과 Vercel의 Function Region을 동일하게 맞추세요.
						</p>
						<ol class="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-4">
							<li>Vercel Dashboard 접속</li>
							<li>프로젝트 선택</li>
							<li><strong>Settings</strong> 탭 클릭</li>
							<li>좌측 메뉴에서 <strong>"Functions"</strong> 클릭</li>
							<li><strong>"Function Region"</strong>에서 <strong>"Incheon, South Korea (icn1)"</strong>로 설정되어 있는지 확인</li>
						</ol>
					</div>
					<div class="bg-white border border-blue-300 rounded p-3">
						<p class="text-xs text-gray-600">
							💡 <strong>효과:</strong> Vercel Region을 Supabase DB 위치와 일치시키는 것만으로도 API 응답 속도가 수백 ms 단축됩니다. 
							<a href="https://vercel.com/docs/concepts/edge-network/regions" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Vercel Region 가이드</a>를 참고하세요.
						</p>
					</div>
				</div>
			</div>

			<!-- 2. Edge Functions 사용 -->
			<div>
				<div class="flex items-start mb-3">
					<span class="text-2xl mr-3">2️⃣</span>
					<div class="flex-1">
						<h4 class="font-semibold text-gray-900 mb-2 text-lg">Edge Functions 사용 (SvelteKit/Next.js)</h4>
						<p class="text-sm text-gray-600 mb-3">
							기본 서버리스 함수(Serverless Functions)는 'Cold Start(오랜만에 접속 시 느려짐)' 문제가 있습니다. 
							Edge Runtime으로 설정하면 전 세계 엣지 노드에서 실행되어 초기 접속 속도가 빨라집니다.
						</p>
					</div>
				</div>

				<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-2">SvelteKit 설정:</p>
						<p class="text-sm text-gray-700 mb-2">
							<code class="bg-gray-100 px-2 py-1 rounded">src/routes/+page.server.js</code> 등에 아래 코드를 추가하세요.
						</p>
						<div class="bg-white border border-gray-300 rounded p-3 mt-2">
							<pre class="text-xs overflow-x-auto"><code>export const config = {'{'}
  runtime: 'edge'
{'}'};</code></pre>
						</div>
					</div>
					<div class="bg-yellow-50 border border-yellow-200 rounded p-3">
						<p class="text-xs text-yellow-800">
							⚠️ <strong>참고:</strong> Edge Runtime은 가볍지만 일부 Node.js 라이브러리 사용이 제한될 수 있으므로 테스트가 필요합니다.
						</p>
					</div>
				</div>
			</div>

			<!-- 3. 데이터 로딩 성능: 캐싱 전략 -->
			<div>
				<div class="flex items-start mb-3">
					<span class="text-2xl mr-3">3️⃣</span>
					<div class="flex-1">
						<h4 class="font-semibold text-gray-900 mb-2 text-lg">데이터 로딩 성능: 캐싱 전략 활용</h4>
						<p class="text-sm text-gray-600 mb-3">
							데이터가 자주 변하지 않는다면 매번 Supabase에서 가져오는 대신 Vercel의 캐시를 활용하세요.
						</p>
					</div>
				</div>

				<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-2">SvelteKit (Incremental Static Regeneration):</p>
						<div class="bg-white border border-gray-300 rounded p-3 mt-2">
							<pre class="text-xs overflow-x-auto"><code>export const config = {'{'}
  isr: {'{'}
    expiration: 60 // 60초 동안 결과 캐싱
  {'}'}
{'}'};</code></pre>
						</div>
						<p class="text-xs text-gray-600 mt-2">
							💡 사용자가 접속할 때마다 DB를 찌르는 것이 아니라, 60초에 한 번만 DB에서 가져오고 나머지는 캐시된 데이터를 뿌려주어 속도가 향상됩니다.
						</p>
					</div>
				</div>
			</div>

			<!-- 4. Supabase 연결 최적화 -->
			<div>
				<div class="flex items-start mb-3">
					<span class="text-2xl mr-3">4️⃣</span>
					<div class="flex-1">
						<h4 class="font-semibold text-gray-900 mb-2 text-lg">Supabase 연결 최적화 (Connection Pooling)</h4>
						<p class="text-sm text-gray-600 mb-3">
							무료 플랜에서는 연결 가능한 DB 세션 수가 제한적입니다. 서버리스 함수가 실행될 때마다 새 연결을 맺으면 속도가 느려집니다.
						</p>
					</div>
				</div>

				<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-2">설정 방법:</p>
						<p class="text-sm text-gray-700 mb-2">
							Supabase에서 제공하는 <strong>IPv4 Connection Pool (Transaction Mode, 포트 6543)</strong> 주소를 환경 변수에 사용하세요.
						</p>
						<ol class="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-4">
							<li>Supabase Dashboard 접속</li>
							<li>프로젝트 선택</li>
							<li><strong>Settings</strong> → <strong>"Database"</strong> 클릭</li>
							<li><strong>"Connection Pooling"</strong> 섹션에서 <strong>"Transaction"</strong> 모드의 연결 문자열 복사</li>
							<li>Vercel 환경 변수에 <code class="bg-gray-100 px-1 py-0.5 rounded">DATABASE_URL</code>로 설정 (포트 6543 사용)</li>
						</ol>
					</div>
					<div class="bg-white border border-gray-300 rounded p-3">
						<p class="text-xs text-gray-600">
							💡 <strong>효과:</strong> Connection Pooling을 사용하면 동시 접속자가 늘어나도 안정적이고 빠른 데이터 로딩이 가능합니다. 
							<a href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">Supabase Connection Pooling 문서</a>를 참고하세요.
						</p>
					</div>
				</div>
			</div>

			<!-- 5. 정적 자산 및 이미지 최적화 -->
			<div>
				<div class="flex items-start mb-3">
					<span class="text-2xl mr-3">5️⃣</span>
					<div class="flex-1">
						<h4 class="font-semibold text-gray-900 mb-2 text-lg">정적 자산 및 이미지 최적화</h4>
					</div>
				</div>

				<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-2">Vercel Image Optimization:</p>
						<p class="text-sm text-gray-700">
							이미지를 많이 사용한다면 Vercel이 자동으로 WebP 포맷으로 변환하고 크기를 조절해줍니다. 
							Svelte에서는 이미지를 직접 최적화하거나 Vercel 기능을 활용하세요.
						</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-2">Font 최적화:</p>
						<p class="text-sm text-gray-700">
							폰트를 외부 URL(Google Fonts)에서 가져오지 말고 프로젝트 내에 포함시켜 자산으로 배포하세요. 
							이렇게 하면 폰트 로딩 속도가 빨라지고 레이아웃 시프트(CLS)가 줄어듭니다.
						</p>
					</div>
				</div>
			</div>

			<!-- 요약 체크리스트 -->
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<h4 class="font-semibold text-gray-900 mb-3 flex items-center">
					<span class="mr-2">💡</span>
					요약 체크리스트
				</h4>
				<ul class="text-sm text-gray-700 space-y-2">
					<li class="flex items-start">
						<span class="mr-2">☐</span>
						<span>Vercel Region을 Supabase DB 위치(Incheon/Seoul)와 일치시켰는가?</span>
					</li>
					<li class="flex items-start">
						<span class="mr-2">☐</span>
						<span>Edge Runtime을 적용하여 Cold Start를 줄였는가?</span>
					</li>
					<li class="flex items-start">
						<span class="mr-2">☐</span>
						<span>Connection Pooler(포트 6543)를 사용해 DB 연결 속도를 높였는가?</span>
					</li>
					<li class="flex items-start">
						<span class="mr-2">☐</span>
						<span>변동이 적은 데이터에 ISR(캐싱) 설정을 추가했는가?</span>
					</li>
				</ul>
				<div class="mt-3 pt-3 border-t border-green-300">
					<p class="text-sm text-gray-700">
						✅ <strong>참고:</strong> 이 설정들은 무료 플랜에서도 모두 가능하며, 특히 1번(지역 일치)과 4번(풀링)만 제대로 설정해도 체감 속도가 2배 이상 빨라집니다.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
