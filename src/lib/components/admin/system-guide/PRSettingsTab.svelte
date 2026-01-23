<script>
	let {
		onCopy = () => {}
	} = $props();
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold text-gray-900 mb-4">GitHub PR 설정</h2>
		<p class="text-gray-600 mb-6">GitHub 저장소에서 Pull Request를 효율적으로 사용하기 위한 설정 방법</p>
	</div>

	<!-- Step 1: 저장소 접속 및 설정 -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">📍</span>
			Step 1: GitHub 저장소 접속 및 설정 메뉴 이동
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">1. GitHub 저장소 페이지 접속</h4>
				<p class="text-sm text-gray-600 mb-2">GitHub에서 저장소를 검색하거나 직접 URL로 접속합니다.</p>
				<p class="text-sm text-gray-600">저장소에 대한 관리 권한이 있어야 설정이 가능합니다.</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">2. Settings 메뉴로 이동</h4>
				<p class="text-sm text-gray-600">저장소 페이지 상단의 <code class="bg-gray-100 px-2 py-1 rounded">Settings</code> 탭을 클릭합니다.</p>
			</div>
		</div>
	</div>

	<!-- Step 2: PR 템플릿 생성 -->
	<div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">📝</span>
			Step 2: PR 템플릿 생성 (선택사항, 권장)
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">로컬에서 템플릿 파일 생성</h4>
				<div class="bg-white border border-gray-300 rounded p-3 mb-2">
					<code class="text-sm">mkdir -p .github</code>
				</div>
				<p class="text-sm text-gray-600">프로젝트 루트에서 실행합니다.</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">템플릿 파일 내용</h4>
				<div class="bg-white border border-gray-300 rounded p-4">
					<pre class="text-xs overflow-x-auto"><code>## 변경사항
- 

## 확인사항
- [ ] 로컬 테스트 완료 (`yarn dev`)
- [ ] 빌드 성공 (`yarn build`)
- [ ] Vercel Preview 확인
- [ ] 환경 변수 정상 작동

## 테스트 방법
1. 
2. 
3. 

## 스크린샷 (선택사항)
<!-- 필요시 스크린샷 첨부 --></code></pre>
				</div>
				<p class="text-sm text-gray-600 mt-2">`.github/PULL_REQUEST_TEMPLATE.md` 파일로 저장합니다.</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">GitHub에 커밋 및 푸시</h4>
				<div class="bg-white border border-gray-300 rounded p-3 space-y-2">
					<div class="flex items-center justify-between">
						<code class="text-sm">git add .github/PULL_REQUEST_TEMPLATE.md</code>
						<button 
							onclick={() => onCopy('git add .github/PULL_REQUEST_TEMPLATE.md')}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
					<div class="flex items-center justify-between">
						<code class="text-sm">git commit -m "docs: PR 템플릿 추가"</code>
						<button 
							onclick={() => onCopy('git commit -m "docs: PR 템플릿 추가"')}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
					<div class="flex items-center justify-between">
						<code class="text-sm">git push origin main</code>
						<button 
							onclick={() => onCopy('git push origin main')}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
				</div>
				<p class="text-sm text-gray-600 mt-2">이제 PR 생성 시 자동으로 템플릿이 표시됩니다.</p>
			</div>
		</div>
	</div>

	<!-- Step 3: PR 머지 옵션 설정 -->
	<div class="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">🔀</span>
			Step 3: PR 머지 옵션 설정
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">경로</h4>
				<p class="text-sm text-gray-600">GitHub 저장소 → <code class="bg-gray-100 px-2 py-1 rounded">Settings</code> → <code class="bg-gray-100 px-2 py-1 rounded">General</code> → <code class="bg-gray-100 px-2 py-1 rounded">Pull Requests</code> 섹션</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">권장 설정</h4>
				<div class="bg-white border border-gray-300 rounded p-4 space-y-2">
					<div class="flex items-center">
						<input type="checkbox" checked disabled class="mr-2">
						<span class="text-sm"><strong>Allow squash merging</strong> (커밋 히스토리 정리) - 권장</span>
					</div>
					<div class="flex items-center">
						<input type="checkbox" checked disabled class="mr-2">
						<span class="text-sm">Allow merge commits (선택사항)</span>
					</div>
					<div class="flex items-center">
						<input type="checkbox" disabled class="mr-2">
						<span class="text-sm">Allow rebase merging (선택사항)</span>
					</div>
				</div>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">설정 방법</h4>
				<ol class="text-sm text-gray-600 space-y-1 list-decimal list-inside">
					<li>Settings → General 페이지로 이동</li>
					<li>"Pull Requests" 섹션까지 스크롤</li>
					<li>원하는 머지 옵션 체크박스 선택</li>
					<li>페이지 하단의 <strong>"Save changes"</strong> 버튼 클릭</li>
				</ol>
			</div>

			<div class="bg-yellow-50 border border-yellow-200 rounded p-3">
				<p class="text-sm text-yellow-800">
					💡 <strong>Squash and merge</strong>를 기본으로 사용하면 여러 커밋을 하나로 합쳐 깔끔한 히스토리를 유지할 수 있습니다.
				</p>
			</div>
		</div>
	</div>

	<!-- Step 4: 브랜치 보호 규칙 -->
	<div class="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">🛡️</span>
			Step 4: 브랜치 보호 규칙 설정 (선택사항)
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">경로</h4>
				<p class="text-sm text-gray-600">GitHub 저장소 → <code class="bg-gray-100 px-2 py-1 rounded">Settings</code> → <code class="bg-gray-100 px-2 py-1 rounded">Branches</code> → <code class="bg-gray-100 px-2 py-1 rounded">Add rule</code></p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">설정 단계</h4>
				<ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
					<li><strong>Settings → Branches</strong> 메뉴로 이동</li>
					<li><strong>"Add rule"</strong> 또는 <strong>"Add branch protection rule"</strong> 버튼 클릭</li>
					<li><strong>Branch name pattern</strong> 입력: <code class="bg-gray-100 px-2 py-1 rounded">main</code></li>
					<li>아래 옵션들 설정</li>
				</ol>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">권장 설정 (소규모 팀)</h4>
				<div class="bg-white border border-gray-300 rounded p-4 space-y-2">
					<div class="flex items-start">
						<input type="checkbox" checked disabled class="mr-2 mt-1">
						<div>
							<span class="text-sm font-medium">Require a pull request before merging</span>
							<ul class="text-xs text-gray-600 ml-4 mt-1 space-y-1 list-disc">
								<li>Require approvals: 0 (혼자 작업 시) 또는 1 (팀 작업 시)</li>
								<li>Dismiss stale pull request approvals when new commits are pushed</li>
							</ul>
						</div>
					</div>
					<div class="flex items-start">
						<input type="checkbox" checked disabled class="mr-2 mt-1">
						<div>
							<span class="text-sm font-medium">Require status checks to pass before merging</span>
							<ul class="text-xs text-gray-600 ml-4 mt-1 space-y-1 list-disc">
								<li>Require branches to be up to date before merging</li>
								<li>(선택) Vercel 빌드 체크 추가</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-yellow-50 border border-yellow-200 rounded p-3">
				<p class="text-sm text-yellow-800">
					⚠️ <strong>주의사항:</strong>
				</p>
				<ul class="text-sm text-yellow-800 mt-1 space-y-1 list-disc list-inside">
					<li>혼자 작업하는 경우 브랜치 보호 규칙은 필수가 아닙니다</li>
					<li>팀 작업 시 코드 리뷰를 강제하려면 "Require approvals: 1" 이상 설정</li>
					<li>Vercel과 연동된 경우 빌드 체크를 추가하면 빌드 실패 시 머지 방지</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Step 5: Vercel 연동 확인 -->
	<div class="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">🚀</span>
			Step 5: Vercel 연동 확인 (Vercel 사용 시)
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">확인 방법</h4>
				<ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
					<li>
						<strong>GitHub 저장소 → Settings → Integrations</strong>
						<ul class="ml-4 mt-1 space-y-1 list-disc">
							<li>Vercel이 설치되어 있는지 확인</li>
							<li>설치되어 있지 않으면 Vercel Dashboard에서 GitHub 연동 필요</li>
						</ul>
					</li>
					<li>
						<strong>PR 생성 후 확인</strong>
						<ul class="ml-4 mt-1 space-y-1 list-disc">
							<li>PR 생성 시 Vercel 봇이 자동으로 댓글 추가</li>
							<li>Preview URL이 자동으로 생성되는지 확인</li>
						</ul>
					</li>
				</ol>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">Vercel 연동 방법 (처음 설정 시)</h4>
				<ol class="text-sm text-gray-600 space-y-2 list-decimal list-inside">
					<li>Vercel Dashboard 접속: <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">https://vercel.com/dashboard</a></li>
					<li><strong>Add New Project</strong> 클릭</li>
					<li>GitHub 저장소 선택 및 Import</li>
					<li>환경 변수 설정 후 Deploy</li>
					<li>자동으로 GitHub에 Vercel 봇 설치됨</li>
				</ol>
			</div>
		</div>
	</div>

	<!-- Step 6: 설정 완료 확인 -->
	<div class="bg-green-50 border border-green-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">✅</span>
			설정 완료 확인
		</h3>
		
		<div class="space-y-4">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">테스트 PR 생성</h4>
				<div class="bg-white border border-gray-300 rounded p-3 space-y-2">
					<div class="flex items-center justify-between">
						<code class="text-sm">git checkout -b test/pr-settings</code>
						<button 
							onclick={() => onCopy('git checkout -b test/pr-settings')}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
					<div class="flex items-center justify-between">
						<code class="text-sm">git commit --allow-empty -m "test: PR 설정 확인"</code>
						<button 
							onclick={() => onCopy('git commit --allow-empty -m "test: PR 설정 확인"')}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
					<div class="flex items-center justify-between">
						<code class="text-sm">git push origin test/pr-settings</code>
						<button 
							onclick={() => onCopy('git push origin test/pr-settings')}
							class="text-blue-600 hover:text-blue-800 text-sm"
						>
							복사
						</button>
					</div>
				</div>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">확인 사항</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>PR 템플릿이 자동으로 표시되는지 확인</li>
					<li>Vercel Preview URL이 자동으로 추가되는지 확인</li>
					<li>"Merge pull request" 버튼 클릭 시 Squash and merge 옵션이 표시되는지 확인</li>
					<li>머지 후 커밋 히스토리 확인</li>
				</ul>
			</div>
		</div>
	</div>
</div>
