<script>
	// HTML 내용을 Svelte 컴포넌트로 변환
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<style>
	:global(.supabase-transfer-guide) {
		margin: 0 auto;
		position: relative;
		box-sizing: border-box;
		background-color: white;
		color: #000;
		font-family: 'Noto Sans KR', Arial, sans-serif;
		line-height: 1.6;
	}

	:global(.supabase-transfer-guide h1) {
		font-size: 24pt;
		text-align: center;
		margin-bottom: 2rem;
		color: #000;
		font-weight: 700;
		border-bottom: 2px solid #000;
		padding-bottom: 1rem;
	}

	:global(.supabase-transfer-guide h2) {
		font-size: 16pt;
		color: #2c3e50;
		margin-top: 2rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid #ddd;
		padding-bottom: 0.5rem;
		font-weight: 700;
	}

	:global(.supabase-transfer-guide h3) {
		font-size: 13pt;
		color: #444;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	:global(.supabase-transfer-guide p) {
		margin-bottom: 1rem;
		text-align: justify;
		font-size: 11pt;
	}

	:global(.supabase-transfer-guide ul),
	:global(.supabase-transfer-guide ol) {
		margin-bottom: 1rem;
		padding-left: 2rem;
	}

	:global(.supabase-transfer-guide li) {
		margin-bottom: 0.5rem;
		font-size: 11pt;
	}

	:global(.supabase-transfer-guide .box) {
		border: 1px solid #ccc;
		padding: 1rem;
		margin: 1.5rem 0;
		background-color: #f9f9f9;
	}

	:global(.supabase-transfer-guide .box.warning) {
		border-left: 4px solid #d32f2f;
		background-color: #fff5f5;
	}

	:global(.supabase-transfer-guide .box.tip) {
		border-left: 4px solid #1976d2;
		background-color: #f0f7ff;
	}

	:global(.supabase-transfer-guide .box-title) {
		font-weight: bold;
		display: block;
		margin-bottom: 0.5rem;
		font-size: 11pt;
	}

	:global(.supabase-transfer-guide code) {
		font-family: 'Courier New', Courier, monospace;
		background-color: #f0f0f0;
		padding: 2px 4px;
		border-radius: 3px;
		font-size: 0.9em;
		color: #d32f2f;
	}

	:global(.supabase-transfer-guide pre) {
		background-color: #f5f5f5;
		border: 1px solid #ddd;
		padding: 1rem;
		overflow-x: hidden;
		white-space: pre-wrap;
		font-size: 10pt;
		font-family: 'Courier New', Courier, monospace;
	}

	:global(.supabase-transfer-guide table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.5rem;
		font-size: 11pt;
	}

	:global(.supabase-transfer-guide th),
	:global(.supabase-transfer-guide td) {
		border: 1px solid #000;
		padding: 8px 12px;
		text-align: left;
	}

	:global(.supabase-transfer-guide th) {
		background-color: #f0f0f0;
		font-weight: bold;
	}

	:global(.supabase-transfer-guide .meta-info) {
		text-align: right;
		font-size: 10pt;
		color: #666;
		margin-bottom: 2rem;
		font-style: italic;
	}
</style>

<div class="supabase-transfer-guide">
	<div class="meta-info">
		최종 업데이트: 2025년 5월<br>
		문서 버전: 1.0
	</div>

	<h1>Supabase 계정 간 프로젝트 이전 가이드</h1>

	<p>
		본 문서는 Supabase 무료(Free) 계정 간에 프로젝트를 안전하게 이전(Transfer)하는 절차와 발생 가능한 문제 해결 방법을
		기술합니다. 특히 다중 계정 사용 시 발생하는 인증 오류 해결 방안을 중점적으로 다룹니다.
	</p>

	<h2>1. 개요</h2>
	<p>
		Supabase의 프로젝트 이전 기능은 데이터베이스 복제나 덤프(dump) 없이, 소유권 자체를 한 조직(Organization)에서 다른
		조직으로 변경하는 기능입니다. 이를 통해 <strong>Source(출발지)</strong> 계정의 프로젝트를
		<strong>Target(목적지)</strong> 계정으로 손쉽게 이관할 수 있습니다.
	</p>

	<h2>2. 필수 전제 조건 (Prerequisites)</h2>
	<p>프로젝트 이전을 시작하기 전에 다음 조건이 반드시 충족되어야 합니다.</p>

	<div class="box tip">
		<span class="box-title">💡 핵심 요구 사항</span>
		<ul>
			<li>
				<strong>A 계정 (Source/출발지):</strong> 프로젝트 이전을 실행하는 사용자가 해당 조직의
				<strong>Owner(소유자)</strong>여야 합니다.
			</li>
			<li>
				<strong>B 계정 (Target/목적지):</strong> 프로젝트 이전을 실행하는 사용자가 해당 조직의
				<strong>Member(멤버)</strong> 이상으로 등록되어 있어야 합니다.
			</li>
		</ul>
	</div>

	<p>
		즉, 이전을 실행하는 주체(사용자)는 <strong>양쪽 조직(Organization) 모두에 팀원으로 소속</strong>되어 있어야 하며,
		적절한 권한을 보유해야 합니다.
	</p>

	<h2>3. 제한 사항 (무료 계정 기준)</h2>
	<p>무료 플랜(Free Plan) 사용자 간 이전 시 다음과 같은 제한 사항이 적용됩니다.</p>

	<ul>
		<li>
			<strong>프로젝트 수 제한:</strong> Supabase 무료 계정은 <strong>최대 2개의 활성 프로젝트</strong>만 보유할 수
			있습니다. Target 조직에 이미 2개의 프로젝트가 있다면 이전을 받을 수 없습니다. (먼저 기존 프로젝트를 삭제하거나
			일시 중지해야 함)
		</li>
		<li>
			<strong>다운타임:</strong> 유료 플랜에서 무료 플랜으로 이전하는 경우 약 1~2분의 서비스 중단이 발생할 수
			있습니다. (무료 간 이전은 일반적으로 즉시 처리되나, 안전을 위해 트래픽이 적은 시간에 수행 권장)
		</li>
		<li>
			<strong>기능 제한:</strong> Target 조직의 플랜에 따라 일부 기능(예: 커스텀 도메인, 로그 보존 기간 등)이
			비활성화될 수 있습니다.
		</li>
	</ul>

	<h2>4. 단계별 이전 절차</h2>

	<h3>4.1. 상호 팀 멤버 등록 (가장 중요)</h3>
	<p>대부분의 사용자가 이 단계에서 실패합니다. A 계정과 B 계정을 서로의 조직에 초대해야 합니다.</p>

	<ol>
		<li>
			<strong>A 계정 로그인:</strong> Dashboard &gt; Organization Settings &gt; Team &gt; Invite Member 로
			이동합니다.
		</li>
		<li><strong>B 계정 초대:</strong> B 계정의 이메일을 입력하고 초대장을 발송합니다.</li>
		<li><strong>B 계정 로그인 및 수락:</strong> 이메일 초대장을 수락하여 A 조직의 멤버가 됩니다.</li>
		<li><strong>반대 과정 수행:</strong> B 계정에서 A 계정을 자신의 조직에 초대하고, A가 이를 수락합니다.</li>
	</ol>

	<div class="box warning">
		<span class="box-title">⚠️ 주의: 세션 충돌 방지</span>
		한 브라우저에서 A, B 계정을 번갈아 로그인하며 초대를 수락할 때 <strong>"Email mismatch"</strong> 오류가 발생할 수
		있습니다. 이를 방지하기 위해 <strong>시크릿 모드(Incognito)</strong>를 사용하거나, A는 Chrome, B는 Edge와 같이
		<strong>서로 다른 브라우저</strong>를 사용하십시오.
	</div>

	<h3>4.2. 프로젝트 이전 실행</h3>
	<ol>
		<li><strong>A 계정(Source)</strong>으로 로그인합니다.</li>
		<li>이전하려는 프로젝트의 대시보드로 진입합니다.</li>
		<li>좌측 메뉴 하단의 <strong>Project Settings &gt; General</strong>로 이동합니다.</li>
		<li>페이지 하단 <strong>Transfer Project</strong> 섹션을 찾습니다.</li>
		<li><strong>Transfer Project</strong> 버튼을 클릭합니다.</li>
		<li>Target Organization(B 계정의 조직)을 선택합니다.</li>
		<li>프로젝트 이름을 입력하여 확인 절차를 거친 후 <strong>Transfer</strong>를 클릭합니다.</li>
	</ol>

	<h2>5. 일반적인 오류 및 문제 해결</h2>

	<h3>5.1. "Email address does not match..." 오류</h3>
	<p>초대 메일의 "Join Organization" 링크를 클릭했을 때 아래와 같은 메시지가 나타나는 경우입니다.</p>

	<pre>Error: Your email address [email] does not match the email address this invitation was sent to.</pre>

	<p>
		<strong>원인:</strong> 브라우저에 이미 다른 Supabase 계정(또는 GitHub/Google 세션)이 로그인되어 있어, 초대받은
		이메일과 현재 로그인된 세션의 이메일이 불일치하기 때문입니다.
	</p>

	<p><strong>해결 방법:</strong></p>
	<ul>
		<li>
			<strong>방법 1 (권장):</strong> 현재 브라우저에서 완전히 <strong>로그아웃(Sign out)</strong>한 후, 초대받은
			이메일 계정으로 다시 로그인하고 링크를 클릭합니다.
		</li>
		<li><strong>방법 2:</strong> 초대 링크를 복사하여 <strong>시크릿 창(Private Window)</strong>에서 엽니다.</li>
		<li>
			<strong>방법 3:</strong> 이메일 대소문자가 정확히 일치하는지 확인합니다. (GitHub 소셜 로그인 사용 시, GitHub의
			Primary Email과 초대 이메일이 정확히 같아야 함)
		</li>
	</ul>

	<h3>5.2. Target 조직이 보이지 않음</h3>
	<p>Transfer 화면에서 목적지 조직이 목록에 뜨지 않는 경우입니다.</p>
	<p>
		<strong>해결 방법:</strong> A 계정이 B 조직의 멤버로 정상적으로 등록되지 않은 상태입니다. B 계정의 Team
		Settings에서 A 계정이 'Pending' 상태가 아닌지 확인하고, 초대를 다시 수락하세요.
	</p>

	<h2>6. 다중 계정 관리 모범 사례</h2>
	<p>Supabase 무료 계정을 여러 개 관리할 때 혼란을 줄이기 위해 다음 방법을 권장합니다.</p>

	<table>
		<thead>
			<tr>
				<th>방법</th>
				<th>설명</th>
				<th>장점</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><strong>브라우저 프로필 분리</strong></td>
				<td>Chrome/Edge의 '사용자 추가' 기능을 사용하여 계정별로 브라우저 프로필을 생성</td>
				<td>로그아웃 없이 동시에 여러 계정 접속 가능</td>
			</tr>
			<tr>
				<td><strong>다른 브라우저 사용</strong></td>
				<td>A계정은 Chrome, B계정은 Firefox 사용</td>
				<td>세션이 물리적으로 분리되어 충돌 원천 차단</td>
			</tr>
			<tr>
				<td><strong>소셜 로그인 통일</strong></td>
				<td>가능하다면 GitHub 하나로 계정을 관리하되, Organization만 분리</td>
				<td>계정 전환 불필요 (단, 무료 프로젝트 한도는 계정 단위임에 주의)</td>
			</tr>
		</tbody>
	</table>

	<h2>7. 참고 자료</h2>
	<ul>
		<li>
			<a href="https://supabase.com/docs/guides/platform/project-transfer" target="_blank" rel="noopener noreferrer"
				>Supabase 공식 문서: Project Transfers</a
			>
		</li>
		<li>
			<a
				href="https://supabase.com/docs/guides/platform/access-control"
				target="_blank"
				rel="noopener noreferrer"
			>Supabase 공식 문서: Access Control &amp; Teams</a>
		</li>
	</ul>
</div>


