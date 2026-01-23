<script>
	// HTML 내용을 Svelte 컴포넌트로 변환
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Source+Code+Pro:wght@400;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<style>
	:global(.github-ssh-guide) {
		margin: 0 auto;
		font-family: 'Noto Sans KR', sans-serif;
		background-color: white;
		color: #333;
		line-height: 1.6;
		text-align: justify;
		box-sizing: border-box;
	}

	:global(.github-ssh-guide h1) {
		font-size: 24pt;
		color: #2c3e50;
		border-bottom: 2px solid #2c3e50;
		padding-bottom: 12px;
		margin-bottom: 32px;
		font-weight: 700;
	}

	:global(.github-ssh-guide h2) {
		font-size: 18pt;
		color: #2c3e50;
		border-bottom: 1px solid #e0e0e0;
		padding-bottom: 8px;
		margin-top: 40px;
		margin-bottom: 20px;
		font-weight: 700;
	}

	:global(.github-ssh-guide h3) {
		font-size: 14pt;
		color: #444;
		margin-top: 24px;
		margin-bottom: 12px;
		font-weight: 700;
	}

	:global(.github-ssh-guide p),
	:global(.github-ssh-guide li) {
		font-size: 11pt;
		margin-bottom: 10px;
	}

	:global(.github-ssh-guide pre) {
		background-color: #f6f8fa;
		border: 1px solid #d0d7de;
		border-radius: 4px;
		padding: 16px;
		margin: 16px 0;
		font-family: 'Source Code Pro', monospace;
		font-size: 10pt;
		white-space: pre-wrap;
		word-wrap: break-word;
		color: #24292f;
	}

	:global(.github-ssh-guide code) {
		font-family: 'Source Code Pro', monospace;
		background-color: #f6f8fa;
		padding: 2px 4px;
		border-radius: 3px;
		color: #d73a49;
		font-size: 0.95em;
	}

	:global(.github-ssh-guide pre code) {
		color: inherit;
		background-color: transparent;
		padding: 0;
	}

	:global(.github-ssh-guide .box) {
		padding: 16px;
		margin: 20px 0;
		border: 1px solid transparent;
		border-radius: 2px;
	}

	:global(.github-ssh-guide .box-info) {
		background-color: #eef7fa;
		border-color: #b8daff;
		color: #004085;
	}

	:global(.github-ssh-guide .box-warning) {
		background-color: #fff3cd;
		border-color: #ffeeba;
		color: #856404;
	}

	:global(.github-ssh-guide .box-error) {
		background-color: #f8d7da;
		border-color: #f5c6cb;
		color: #721c24;
	}

	:global(.github-ssh-guide ul),
	:global(.github-ssh-guide ol) {
		margin-left: 20px;
		margin-bottom: 16px;
	}

	:global(.github-ssh-guide li) {
		margin-bottom: 6px;
	}

	:global(.github-ssh-guide .highlight) {
		font-weight: bold;
		color: #d73a49;
	}
</style>

<div class="github-ssh-guide">
	<h1>GitHub 계정 및 저장소 변경 가이드 (Mac 환경)</h1>

	<p>
		본 문서는 Cursor 프로젝트 환경에서 기존 GitHub 계정(A)의 저장소를 연결 해제하고, 새로운 GitHub 계정(B)의 저장소로
		전환하는 절차를 기술합니다. 특히 Mac 환경에서 SSH 키 인증 설정 시 발생할 수 있는
		<code>PubkeyAcceptedAlgorithms</code> 관련 문제 해결 방법에 중점을 둡니다.
	</p>

	<h2>1. 원격 저장소 URL 변경</h2>
	<p>
		기존 원격 저장소(repoA) 연결을 제거하고 새로운 계정의 저장소(repoB)로 주소를 변경합니다. SSH 방식을 사용하는 것을
		권장합니다.
	</p>

	<div class="box box-info">
		<strong>💡 참고:</strong> HTTPS 방식보다 SSH 방식을 사용하면 매번 비밀번호를 입력할 필요가 없어 편리합니다.
	</div>

	<pre><code># 기존 원격 저장소 URL 확인
git remote -v

# 원격 저장소 URL 변경 (SSH 방식 권장)
# 형식: [email&#160;protected]:사용자명/저장소명.git
git remote set-url origin [email&#160;protected]:coteleafdev/coteleaf_HOME.git</code></pre>

	<h2>2. SSH 키 생성 및 설정</h2>
	<p>GitHub 인증을 위해 Ed25519 알고리즘을 사용한 새로운 SSH 키를 생성합니다.</p>

	<h3>2.1 키 생성</h3>
	<pre><code># SSH 디렉토리 확인
ls -al ~/.ssh

# 새로운 키 생성 (이메일 주소는 GitHub 계정 이메일)
ssh-keygen -t ed25519 -C "[email&#160;protected]"</code></pre>
	<p>키 저장 위치를 물으면 Enter(기본값)를 누르고, 비밀번호(Passphrase)는 선택사항입니다.</p>

	<h2>3. GitHub에 SSH 키 등록</h2>
	<p>생성된 공개 키(Public Key)를 GitHub 계정에 등록해야 인증이 가능합니다.</p>

	<h3>3.1 공개 키 복사</h3>
	<pre><code># 공개 키 내용 출력 및 복사
cat ~/.ssh/id_ed25519.pub</code></pre>

	<h3>3.2 GitHub 웹사이트 등록 절차</h3>
	<ol>
		<li>GitHub에 <strong>새로운 계정(계정 B)</strong>으로 로그인합니다.</li>
		<li>우측 상단 프로필 → <strong>Settings</strong> → <strong>SSH and GPG keys</strong>로 이동합니다.</li>
		<li><strong>New SSH key</strong> 버튼을 클릭합니다.</li>
		<li><strong>Title</strong>: 식별 가능한 이름 (예: Mac Mini)</li>
		<li><strong>Key type</strong>: <span class="highlight">Authentication Key</span> 선택</li>
		<li><strong>Key</strong>: 복사한 공개 키 내용을 붙여넣습니다.</li>
		<li><strong>Add SSH key</strong>를 클릭하여 저장합니다.</li>
	</ol>

	<h2>4. Mac SSH 에이전트 설정</h2>
	<p>Mac 재부팅 후에도 SSH 키가 유지되도록 Keychain에 등록합니다.</p>

	<pre><code># SSH 에이전트 실행
eval "$(ssh-agent -s)"

# 키를 에이전트 및 키체인에 추가
ssh-add --apple-use-keychain ~/.ssh/id_ed25519</code></pre>
	<p>
		<em>(참고: 구형 macOS의 경우 <code>-K</code> 옵션을 사용해야 할 수 있습니다.)</em>
	</p>

	<h2>5. 주요 문제 해결: PubkeyAcceptedAlgorithms 오류 ⚠️</h2>
	<p>SSH 연결 시 다음과 같은 디버그 메시지와 함께 인증이 실패하는 경우가 있습니다.</p>

	<div class="box box-error">
		<strong>🔴 오류 증상 (debug 모드):</strong><br>
		<code>debug1: Skipping ssh-ed25519 key ... - corresponding algorithm not in PubkeyAcceptedAlgorithms</code>
	</div>

	<p>
		<strong>원인:</strong> <code>~/.ssh/config</code> 파일의 전역 설정(<code>Host *</code>)이
		<code>ssh-ed25519</code> 알고리즘을 허용하지 않도록 제한하고 있기 때문입니다.
	</p>

	<h3>✅ 해결 방법: SSH Config 파일 수정</h3>
	<p><code>~/.ssh/config</code> 파일을 열어 설정 순서를 변경하고 알고리즘을 명시해야 합니다.</p>

	<pre><code>nano ~/.ssh/config</code></pre>

	<p>다음 규칙을 따라 파일을 수정합니다:</p>
	<ol>
		<li><strong>GitHub 설정을 파일 최상단</strong>에 배치합니다.</li>
		<li>GitHub 호스트에 <code>ssh-ed25519</code> 알고리즘을 명시적으로 허용합니다.</li>
		<li><code>Host *</code> (전역 설정)은 <strong>파일 맨 아래</strong>로 내립니다.</li>
	</ol>

	<div class="box box-info">
		<strong>📝 올바른 config 파일 예시:</strong>
	</div>

	<pre><code># 1. GitHub 설정을 최상단에 배치 (우선순위 높음)
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
  PubkeyAcceptedAlgorithms ssh-ed25519
  HostkeyAlgorithms ssh-ed25519

# 2. 기타 특정 호스트 설정
Host 14.63.xxx.xxx
    Port 17022
    HostKeyAlgorithms ssh-rsa,ssh-dss
    PubkeyAcceptedKeyTypes ssh-rsa,ssh-dss

# 3. 전역 설정을 최하단에 배치 (가장 낮은 우선순위)
# 주의: ssh-ed25519를 목록에 포함시켜야 함
Host *
    HostKeyAlgorithms ssh-ed25519,ssh-rsa,ssh-dss
    PubkeyAcceptedKeyTypes ssh-ed25519,ssh-rsa,ssh-dss</code></pre>

	<h2>6. 최종 검증 및 Push</h2>
	<p>모든 설정이 완료되었으면 연결을 테스트하고 코드를 업로드합니다.</p>

	<h3>6.1 연결 테스트</h3>
	<pre><code>ssh -T [email&#160;protected]</code></pre>
	<p>성공 시 메시지: <code>Hi [사용자명]! You've successfully authenticated...</code></p>

	<h3>6.2 코드 Push</h3>
	<pre><code># 변경된 원격 저장소로 push
git push -u origin main</code></pre>

	<h2>7. 트러블슈팅 팁</h2>
	<ul>
		<li>
			<strong>Repository not found 에러:</strong> GitHub 웹사이트에서 해당 계정에 저장소가 실제로 생성되었는지
			확인하세요. 비어 있는 저장소라도 존재해야 push가 가능합니다.
		</li>
		<li>
			<strong>Permission denied (publickey):</strong>
			<ul>
				<li>
					GitHub에 등록된 공개 키의 fingerprint와 로컬 키(<code>ssh-keygen -lf ~/.ssh/id_ed25519.pub</code>)가
					일치하는지 확인하세요.
				</li>
				<li>
					<code>ssh -vvv [email&#160;protected]</code> 명령어로 상세 로그를 확인하여 어느 단계에서 실패하는지 진단하세요.
				</li>
			</ul>
		</li>
		<li>
			<strong>HTTPS 사용 대안:</strong> SSH 설정이 너무 복잡하다면, <code>https://</code> URL로 변경하고 GitHub
			Personal Access Token을 비밀번호 대신 사용하여 인증할 수 있습니다.
		</li>
	</ul>
</div>


