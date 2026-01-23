<script>
	// Supabase 프로젝트 Region 변경을 위한 마이그레이션 가이드
</script>

<div class="migration-guide">
	<h1>Supabase 프로젝트 Region 변경을 위한 마이그레이션 가이드</h1>

	<div class="section">
		<h2>📌 상황 요약</h2>
		<ul>
			<li><strong>문제</strong>: 프로젝트 생성 시 잘못된 Region 선택 (변경 불가능)</li>
			<li><strong>제약</strong>: Free Plan은 Database Backup 기능 없음</li>
			<li><strong>목표</strong>: 올바른 Region의 새 프로젝트로 데이터 이전</li>
		</ul>
	</div>

	<div class="section">
		<h2>🎯 전체 프로세스</h2>
		<ol>
			<li>1단계: 새 프로젝트 생성</li>
			<li>2단계: PostgreSQL 17 설치</li>
			<li>3단계: 기존 프로젝트 백업</li>
			<li>4단계: 새 프로젝트로 복원</li>
			<li>5단계: 검증</li>
		</ol>
	</div>

	<div class="section">
		<h2>1단계: 새 프로젝트 생성</h2>
		<h3>Dashboard에서 작업</h3>
		<ol>
			<li>Supabase Dashboard → New Project</li>
			<li>프로젝트 정보 입력:
				<ul>
					<li>Name: 원하는 이름 (예: prj_B)</li>
					<li>Database Password: 강력한 비밀번호 생성 및 저장 ⚠️</li>
					<li>Region: 올바른 지역 선택 (예: Northeast Asia - Seoul)</li>
					<li>Pricing Plan: Free</li>
				</ul>
			</li>
			<li>"Create new project" 클릭</li>
			<li>프로젝트 생성 완료 대기 (2-5분)</li>
		</ol>
	</div>

	<div class="section">
		<h2>2단계: PostgreSQL 17 설치</h2>
		<h3>버전 일치 필요</h3>
		<p>Supabase는 PostgreSQL 17을 사용하므로 로컬에도 동일 버전 필요</p>

		<h3>macOS (Homebrew)</h3>
		<pre><code># PostgreSQL 17 설치
brew install postgresql@17

# PATH 설정
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 버전 확인
pg_dump --version
# 출력: pg_dump (PostgreSQL) 17.x</code></pre>

		<p><strong>Intel Mac의 경우:</strong></p>
		<pre><code>echo 'export PATH="/usr/local/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc</code></pre>
	</div>

	<div class="section">
		<h2>3단계: 기존 프로젝트(prj_A) 백업</h2>
		<h3>3-1. Connection 정보 확인</h3>
		<ol>
			<li>Dashboard → prj_A 선택 → Settings → Database</li>
			<li>Connection String 섹션:
				<ul>
					<li>Method를 "Transaction pooler" 선택 ⚠️ (중요!)</li>
					<li>Connection string 확인:
						<pre><code>postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-X-ap-northeast-X.pooler.supabase.com:6543/postgres</code></pre>
						여기서:
						<ul>
							<li>Host: aws-X-ap-northeast-X.pooler.supabase.com</li>
							<li>Port: 6543</li>
							<li>User: postgres.PROJECT_REF</li>
							<li>Password: Database 비밀번호</li>
						</ul>
					</li>
				</ul>
			</li>
		</ol>

		<h3>3-2. 작업 디렉토리 생성</h3>
		<pre><code>mkdir ~/supabase-migration
cd ~/supabase-migration</code></pre>

		<h3>3-3. 백업 실행</h3>
		<pre><code># 비밀번호 환경변수 설정
export PGPASSWORD='prj_A의_DB_비밀번호'

# 백업 실행 (Host, User는 자신의 정보로 교체)
pg_dump \
  -h aws-1-ap-south-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.ozvkandsyfmvjxwcxwkn \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -F c \
  -f prj_a_backup.dump

# 비밀번호 환경변수 삭제
unset PGPASSWORD</code></pre>

		<div class="warning-box">
			<strong>주의사항:</strong>
			<ul>
				<li>Host와 User는 자신의 프로젝트 정보로 교체</li>
				<li>Password는 Settings → Database에서 확인/재설정</li>
			</ul>
		</div>

		<h3>3-4. 백업 파일 확인</h3>
		<pre><code>ls -lh prj_a_backup.dump

# 출력 예시:
# -rw-r--r--  1 user  staff   277K Dec 28 02:05 prj_a_backup.dump</code></pre>
		<p>파일 크기가 0보다 크면 성공 ✅</p>
	</div>

	<div class="section">
		<h2>4단계: 새 프로젝트(prj_B)로 복원</h2>
		<h3>4-1. Connection 정보 확인</h3>
		<ol>
			<li>Dashboard → prj_B 선택 → Settings → Database</li>
			<li>Connection String 섹션:
				<ul>
					<li>Method를 "Transaction pooler" 선택</li>
					<li>User 확인: postgres.PRJ_B_REF</li>
				</ul>
			</li>
		</ol>

		<h3>4-2. 복원 실행</h3>
		<pre><code># 비밀번호 환경변수 설정
export PGPASSWORD='prj_B의_DB_비밀번호'

# 복원 실행 (Host, User는 자신의 정보로 교체)
pg_restore \
  -h aws-1-ap-northeast-2.pooler.supabase.com \
  -p 6543 \
  -U postgres.czgtexdgawrnrelvjqur \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -v \
  prj_a_backup.dump

# 비밀번호 환경변수 삭제
unset PGPASSWORD</code></pre>

		<div class="info-box">
			<strong>에러 메시지 무시:</strong>
			<ul>
				<li><code>ERROR: must be owner of table...</code> 에러들은 무시 가능</li>
				<li>Supabase 시스템 테이블 권한 관련 에러</li>
				<li>public 스키마의 실제 데이터는 정상 복원됨</li>
			</ul>
		</div>
	</div>

	<div class="section">
		<h2>5단계: 검증</h2>
		<h3>Dashboard에서 확인</h3>
		<ol>
			<li>Dashboard → prj_B → Table Editor</li>
			<li>테이블 목록 확인:
				<ul>
					<li>✅ 모든 테이블이 보이는지</li>
					<li>✅ 데이터가 있는지</li>
				</ul>
			</li>
			<li>각 테이블 클릭하여 데이터 확인</li>
			<li>Authentication → Users 확인 (있는 경우)</li>
		</ol>

		<h3>SQL로 검증 (선택사항)</h3>
		<pre><code>-- Table Editor 또는 SQL Editor에서 실행

-- 테이블 목록
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- RLS 정책 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 데이터 개수 확인
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;</code></pre>
	</div>

	<div class="section">
		<h2>📊 포함되는 것 / 포함되지 않는 것</h2>
		<h3>✅ 자동으로 복원되는 것</h3>
		<ul>
			<li>모든 테이블 구조 (스키마)</li>
			<li>모든 데이터</li>
			<li>RLS (Row Level Security) 정책</li>
			<li>Functions</li>
			<li>Triggers</li>
			<li>Views</li>
			<li>Indexes</li>
			<li>Constraints</li>
			<li>Foreign Keys</li>
		</ul>

		<h3>⚠️ 별도 작업 필요</h3>
		<ul>
			<li><strong>Storage 파일</strong>: 수동 복사 또는 스크립트 필요</li>
			<li><strong>Edge Functions</strong>: 코드 복사 및 재배포</li>
			<li><strong>Auth 설정</strong>: Providers, URLs, Templates 수동 설정</li>
			<li><strong>Custom Domain</strong>: 재설정 필요</li>
		</ul>
	</div>

	<div class="section">
		<h2>🚨 문제 해결</h2>
		<h3>문제 1: "could not translate host name"</h3>
		<p><strong>원인</strong>: Direct connection 사용 또는 프로젝트 Paused 상태</p>
		<p><strong>해결</strong>:</p>
		<ol>
			<li>Settings → Database</li>
			<li>Method를 "Transaction pooler" 선택</li>
			<li>Connection string 다시 확인</li>
		</ol>

		<h3>문제 2: "server version mismatch"</h3>
		<p><strong>원인</strong>: 로컬 PostgreSQL 버전이 다름</p>
		<p><strong>해결</strong>:</p>
		<pre><code>brew install postgresql@17
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc</code></pre>

		<h3>문제 3: "password authentication failed"</h3>
		<p><strong>원인</strong>: 비밀번호 오류</p>
		<p><strong>해결</strong>:</p>
		<ol>
			<li>Dashboard → Settings → Database</li>
			<li>→ "Reset database password"</li>
			<li>→ 새 비밀번호 생성 및 저장</li>
		</ol>

		<h3>문제 4: Connection Pooler Host가 다름</h3>
		<p><strong>Region별 Host:</strong></p>
		<ul>
			<li>Seoul (한국): <code>aws-1-ap-northeast-2.pooler.supabase.com</code></li>
			<li>Tokyo (일본): <code>aws-1-ap-northeast-1.pooler.supabase.com</code></li>
			<li>Singapore: <code>aws-1-ap-southeast-1.pooler.supabase.com</code></li>
			<li>Oregon (미국): <code>aws-1-us-west-1.pooler.supabase.com</code></li>
			<li>Ireland (유럽): <code>aws-1-eu-west-1.pooler.supabase.com</code></li>
		</ul>
	</div>

	<div class="section">
		<h2>📋 체크리스트</h2>
		<h3>사전 준비</h3>
		<ul>
			<li>□ 새 프로젝트 생성 (올바른 Region)</li>
			<li>□ 두 프로젝트의 DB 비밀번호 확인/저장</li>
			<li>□ PostgreSQL 17 설치 완료</li>
			<li>□ 작업 디렉토리 생성</li>
		</ul>

		<h3>백업</h3>
		<ul>
			<li>□ Connection String Method를 "Transaction pooler" 선택</li>
			<li>□ Host, Port, User 정보 정확히 복사</li>
			<li>□ pg_dump 실행 성공</li>
			<li>□ 백업 파일 크기 확인 (0보다 큼)</li>
		</ul>

		<h3>복원</h3>
		<ul>
			<li>□ prj_B Connection 정보 확인</li>
			<li>□ pg_restore 실행</li>
			<li>□ 에러 무시 (auth/storage 관련)</li>
			<li>□ Dashboard에서 테이블 확인</li>
			<li>□ 데이터 확인</li>
		</ul>

		<h3>후속 작업</h3>
		<ul>
			<li>□ Storage 파일 마이그레이션 (필요시)</li>
			<li>□ Edge Functions 재배포 (필요시)</li>
			<li>□ Auth 설정 복사 (필요시)</li>
			<li>□ 애플리케이션 연결 정보 업데이트</li>
			<li>□ 기존 프로젝트 삭제 (확인 후)</li>
		</ul>
	</div>

	<div class="section">
		<h2>💡 핵심 포인트</h2>
		<h3>1. Transaction Pooler 필수</h3>
		<p>Direct connection이 아닌 Transaction pooler를 반드시 사용!</p>
		<p>Settings → Database → Method 선택</p>

		<h3>2. 버전 일치</h3>
		<p>Supabase: PostgreSQL 17</p>
		<p>로컬: PostgreSQL 17 설치 필요</p>

		<h3>3. User 이름 주의</h3>
		<p>Transaction pooler 사용 시:</p>
		<p>User: <code>postgres.PROJECT_REF</code> (점(.) 포함!)</p>

		<h3>4. 에러 메시지</h3>
		<p>auth/storage 테이블 권한 에러는 정상!</p>
		<p>public 스키마는 정상 복원됨</p>
	</div>

	<div class="section">
		<h2>🎓 추가 정보</h2>
		<h3>Supabase Transfer vs 수동 마이그레이션</h3>
		<p><strong>Transfer 기능:</strong></p>
		<ul>
			<li>Organization 간 프로젝트 이동만 가능</li>
			<li>Region 변경 불가</li>
			<li>청구 주체 변경</li>
		</ul>

		<p><strong>수동 마이그레이션 (이 가이드):</strong></p>
		<ul>
			<li>Region 변경 가능 ✅</li>
			<li>새 프로젝트로 데이터 복사</li>
			<li>연결 정보 변경됨 (API URL, Keys)</li>
		</ul>

		<h3>Region 선택 가이드</h3>
		<ul>
			<li>한국 서비스: ✅ Northeast Asia (Seoul) - 최저 지연시간</li>
			<li>일본/동아시아: ✅ Northeast Asia (Tokyo)</li>
			<li>동남아시아: ✅ Southeast Asia (Singapore)</li>
			<li>글로벌: ✅ West US (Oregon), ✅ Europe West (Ireland)</li>
		</ul>

		<h3>Free Plan 제약사항</h3>
		<ul>
			<li>Organization당 최대 2개 프로젝트</li>
			<li>7일 비활성 시 자동 Pause</li>
			<li>Database Backup 기능 없음 → pg_dump로 수동 백업 필요</li>
		</ul>
	</div>

	<div class="section">
		<h2>📞 도움이 필요한 경우</h2>
		<ul>
			<li>Supabase 공식:
				<ul>
					<li>Docs: <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">https://supabase.com/docs</a></li>
					<li>Community: <a href="https://github.com/orgs/supabase/discussions" target="_blank" rel="noopener noreferrer">https://github.com/orgs/supabase/discussions</a></li>
					<li>Support: support@supabase.com</li>
				</ul>
			</li>
			<li>PostgreSQL:
				<ul>
					<li>pg_dump 매뉴얼: <a href="https://www.postgresql.org/docs/17/app-pgdump.html" target="_blank" rel="noopener noreferrer">https://www.postgresql.org/docs/17/app-pgdump.html</a></li>
				</ul>
			</li>
		</ul>
	</div>

	<div class="section">
		<h2>🎉 마이그레이션 완료!</h2>
		<p>이제 올바른 Region에서 프로젝트가 실행되고 있습니다.</p>
		<p><strong>다음 단계:</strong></p>
		<ol>
			<li>애플리케이션 연결 정보 업데이트</li>
			<li>테스트 수행</li>
			<li>기존 프로젝트 삭제 (확인 후)</li>
		</ol>
	</div>

	<div class="meta-info">
		<p><strong>작성일</strong>: 2024년 12월 28일</p>
		<p><strong>Supabase Version</strong>: PostgreSQL 17.6</p>
		<p><strong>대상</strong>: Free Plan 사용자</p>
	</div>
</div>

<style>
	.migration-guide {
		max-width: 100%;
		color: #333;
		line-height: 1.8;
	}

	.migration-guide h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.migration-guide h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: #1f2937;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	.migration-guide h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #374151;
	}

	.migration-guide .section {
		margin-bottom: 2rem;
	}

	.migration-guide ul,
	.migration-guide ol {
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}

	.migration-guide li {
		margin-bottom: 0.5rem;
	}

	.migration-guide pre {
		background-color: #f5f5f5;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-x: auto;
		margin: 1rem 0;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.migration-guide code {
		font-family: 'Courier New', Courier, monospace;
		background-color: #f0f0f0;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
		color: #dc2626;
	}

	.migration-guide pre code {
		background-color: transparent;
		padding: 0;
		color: #333;
	}

	.migration-guide .warning-box {
		background-color: #fef2f2;
		border-left: 4px solid #ef4444;
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 0.25rem;
	}

	.migration-guide .info-box {
		background-color: #eff6ff;
		border-left: 4px solid #3b82f6;
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 0.25rem;
	}

	.migration-guide .meta-info {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.migration-guide a {
		color: #3b82f6;
		text-decoration: underline;
	}

	.migration-guide a:hover {
		color: #2563eb;
	}
</style>

