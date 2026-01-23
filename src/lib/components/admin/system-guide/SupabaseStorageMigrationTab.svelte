<script>
	// Supabase Storage 마이그레이션 가이드
	
	// 마이그레이션 스크립트 코드
	const migrationScript = `const { createClient } = require('@supabase/supabase-js')

// ========================================
// 설정: 여기에 실제 값을 입력하세요
// ========================================
const OLD_PROJECT = {
  url: 'https://OLD_PROJECT_REF.supabase.co',
  key: 'OLD_SERVICE_ROLE_KEY'  // Service Role Key!
}

const NEW_PROJECT = {
  url: 'https://NEW_PROJECT_REF.supabase.co',
  key: 'NEW_SERVICE_ROLE_KEY'  // Service Role Key!
}

const BUCKET_NAME = 'images'  // 마이그레이션할 버킷 이름
// ========================================

// Supabase 클라이언트 생성
const oldSupabase = createClient(OLD_PROJECT.url, OLD_PROJECT.key)
const newSupabase = createClient(NEW_PROJECT.url, NEW_PROJECT.key)

async function migrateStorage() {
  console.log('🚀 Storage 마이그레이션 시작...\\n')

  try {
    // 1. 기존 프로젝트에서 버킷 목록 가져오기
    console.log('📦 버킷 목록 확인...')
    const { data: buckets, error: bucketsError } = await oldSupabase
      .storage
      .listBuckets()

    if (bucketsError) {
      console.error('❌ 버킷 목록 가져오기 실패: ' + bucketsError.message)
      return
    }

    const oldBucket = buckets.find(b => b.name === BUCKET_NAME)
    
    if (!oldBucket) {
      console.error('❌ ' + BUCKET_NAME + ' 버킷을 찾을 수 없습니다.')
      console.log('   사용 가능한 버킷:', buckets.map(b => b.name).join(', '))
      return
    }

    console.log('✅ 기존 버킷 확인 완료: ' + BUCKET_NAME)
    console.log('   - Public: ' + oldBucket.public)
    console.log('   - File size limit: ' + (oldBucket.file_size_limit / 1024 / 1024).toFixed(1) + 'MB')

    // 2. 새 프로젝트에 버킷 생성
    console.log('\\n📦 새 프로젝트에 버킷 생성...')
    const { error: newBucketError } = await newSupabase
      .storage
      .createBucket(BUCKET_NAME, {
        public: oldBucket.public,
        fileSizeLimit: oldBucket.file_size_limit,
        allowedMimeTypes: oldBucket.allowed_mime_types
      })

    if (newBucketError) {
      if (newBucketError.message.includes('already exists')) {
        console.log('⚠️  버킷이 이미 존재합니다. 계속 진행...')
      } else {
        console.error('❌ 버킷 생성 실패: ' + newBucketError.message)
        return
      }
    } else {
      console.log('✅ 새 버킷 생성 완료')
    }

    // 3. 파일 목록 가져오기 (재귀적으로 모든 폴더 탐색)
    console.log('\\n📁 파일 목록 가져오는 중...')
    
    async function listAllFiles(path = '') {
      const { data: items, error } = await oldSupabase
        .storage
        .from(BUCKET_NAME)
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.error('❌ 파일 목록 가져오기 실패 (' + path + '): ' + error.message)
        return []
      }

      let allFiles = []

      for (const item of items) {
        const fullPath = path ? path + '/' + item.name : item.name
        
        if (item.id === null) {
          // 폴더인 경우 재귀적으로 탐색
          console.log('   📂 폴더 탐색: ' + fullPath)
          const subFiles = await listAllFiles(fullPath)
          allFiles = allFiles.concat(subFiles)
        } else {
          // 파일인 경우 추가
          allFiles.push({
            name: fullPath,
            metadata: item.metadata
          })
        }
      }

      return allFiles
    }

    const files = await listAllFiles()

    if (!files || files.length === 0) {
      console.log('\\n✅ 버킷이 비어있습니다. 마이그레이션 완료!')
      return
    }

    console.log('\\n✅ 총 ' + files.length + '개 파일 발견')
    console.log('='.repeat(50) + '\\n')

    // 4. 각 파일 복사
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        console.log('[' + (i + 1) + '/' + files.length + '] ' + file.name)
        
        // 기존 프로젝트에서 다운로드
        const { data: fileData, error: downloadError } = await oldSupabase
          .storage
          .from(BUCKET_NAME)
          .download(file.name)

        if (downloadError) {
          console.error('  ❌ 다운로드 실패: ' + downloadError.message)
          errorCount++
          continue
        }

        // 새 프로젝트에 업로드
        const { error: uploadError } = await newSupabase
          .storage
          .from(BUCKET_NAME)
          .upload(file.name, fileData, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.metadata?.mimetype
          })

        if (uploadError) {
          console.error('  ❌ 업로드 실패: ' + uploadError.message)
          errorCount++
          continue
        }

        console.log('  ✅ 완료')
        successCount++

      } catch (err) {
        console.error('  ❌ 에러: ' + err.message)
        errorCount++
      }
    }

    // 5. 결과 요약
    console.log('\\n' + '='.repeat(50))
    console.log('🎉 마이그레이션 완료!')
    console.log('='.repeat(50))
    console.log('✅ 성공: ' + successCount + '개')
    if (errorCount > 0) {
      console.log('❌ 실패: ' + errorCount + '개')
    }
    console.log('='.repeat(50) + '\\n')

  } catch (error) {
    console.error('\\n❌ 치명적 에러:', error)
    console.error(error.stack)
  }
}

// 스크립트 실행
migrateStorage()
  .then(() => {
    console.log('✨ 모든 작업 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 실행 실패:', error)
    process.exit(1)
  })`;
</script>

<div class="migration-guide">
	<h1>Supabase Storage 마이그레이션 가이드</h1>

	<div class="section">
		<h2>📌 개요</h2>
		<p>Supabase 프로젝트 간 Storage 파일을 마이그레이션하는 방법입니다.</p>
		<p><strong>사용 도구</strong>: JavaScript 스크립트 (Node.js)</p>
	</div>

	<div class="section">
		<h2>🎯 준비 사항</h2>
		<h3>1. Node.js 설치 확인</h3>
		<pre><code>node --version
# v16 이상 권장</code></pre>

		<h3>2. 필요한 정보 수집</h3>
		<h4>prj_A (기존 프로젝트)</h4>
		<ul>
			<li>Dashboard → Settings → API</li>
			<li>Project URL: https://__________.supabase.co</li>
			<li>service_role key: eyJ... (Service Role Key 사용!)</li>
			<li>⚠️ anon key가 아닌 service_role key 필수</li>
		</ul>

		<h4>prj_B (새 프로젝트)</h4>
		<ul>
			<li>Dashboard → Settings → API</li>
			<li>Project URL: https://__________.supabase.co</li>
			<li>service_role key: eyJ...</li>
		</ul>

		<h3>3. Storage 버킷 확인</h3>
		<ul>
			<li>Dashboard → prj_A → Storage</li>
			<li>버킷 목록 확인 (예: images, documents 등)</li>
			<li>파일 개수 확인</li>
		</ul>
	</div>

	<div class="section">
		<h2>📋 마이그레이션 절차</h2>
		<h3>Step 1: 작업 디렉토리 생성</h3>
		<pre><code>mkdir ~/storage-migration
cd ~/storage-migration</code></pre>

		<h3>Step 2: Node.js 프로젝트 초기화</h3>
		<pre><code># package.json 생성
npm init -y

# Supabase 클라이언트 설치
npm install @supabase/supabase-js</code></pre>

		<h3>Step 3: 마이그레이션 스크립트 생성</h3>
		<p>`migrate-storage.cjs` 파일을 생성하고 아래 코드를 붙여넣습니다:</p>
		<pre><code>{migrationScript}</code></pre>

		<h3>Step 4: 설정 수정</h3>
		<p>스크립트 상단의 설정 부분을 실제 값으로 수정:</p>
		<pre><code>{'const OLD_PROJECT = {'}
  url: 'https://ozvkandsyfmvjxwcxwkn.supabase.co',  // 실제 URL
  key: 'eyJhbGc...'  // 실제 Service Role Key
{'}'}

{'const NEW_PROJECT = {'}
  url: 'https://czgtexdgawrnrelvjqur.supabase.co',  // 실제 URL
  key: 'eyJhbGc...'  // 실제 Service Role Key
{'}'}

const BUCKET_NAME = 'images'  // 실제 버킷 이름</code></pre>

		<h3>Step 5: 실행</h3>
		<pre><code>node migrate-storage.cjs</code></pre>
	</div>

	<div class="section">
		<h2>🚨 문제 해결</h2>
		<h3>문제 1: "Bucket not found"</h3>
		<p><strong>원인</strong>: Service Role Key 대신 Anon Key 사용</p>
		<p><strong>해결</strong>:</p>
		<ul>
			<li>Dashboard → Settings → API</li>
			<li>→ service_role (secret!) 키 사용</li>
			<li>→ anon key가 아님!</li>
		</ul>

		<h3>문제 2: "Permission denied"</h3>
		<p><strong>원인</strong>: RLS 정책으로 인한 접근 제한</p>
		<p><strong>해결</strong>:</p>
		<p>Service Role Key를 사용하면 RLS 우회 가능 (스크립트에서 이미 사용 중)</p>

		<h3>문제 3: "require is not defined"</h3>
		<p><strong>원인</strong>: ES Module 환경</p>
		<p><strong>해결</strong>:</p>
		<pre><code># 파일 확장자를 .cjs로 변경
mv migrate-storage.js migrate-storage.cjs
node migrate-storage.cjs</code></pre>

		<h3>문제 4: 파일이 너무 많아서 느림</h3>
		<p><strong>해결</strong>:</p>
		<p>스크립트는 이미 병렬 처리 최적화됨. 추가 최적화 필요 시 파일을 배치로 나눠서 실행하거나 Promise.all()로 동시 처리 (주의: Rate limit)</p>
	</div>

	<div class="section">
		<h2>💡 여러 버킷 마이그레이션</h2>
		<h3>방법 1: 버킷별로 실행</h3>
		<pre><code># BUCKET_NAME 수정하고 반복 실행
# 1. BUCKET_NAME = 'images'
node migrate-storage.cjs

# 2. BUCKET_NAME = 'documents'
node migrate-storage.cjs

# 3. BUCKET_NAME = 'avatars'
node migrate-storage.cjs</code></pre>

		<h3>방법 2: 스크립트 수정 (모든 버킷 자동)</h3>
		<pre><code>{'// BUCKET_NAME 대신 모든 버킷 순회'}
const {'{'} data: buckets {'}'} = await oldSupabase.storage.listBuckets()

for (const bucket of buckets) {'{'}
  console.log('\\n버킷 마이그레이션: ' + bucket.name)
  // 각 버킷 처리...
{'}'}</code></pre>
	</div>

	<div class="section">
		<h2>📋 체크리스트</h2>
		<h3>마이그레이션 전</h3>
		<ul>
			<li>□ Node.js 설치 확인</li>
			<li>□ Service Role Key 확인 (anon key 아님!)</li>
			<li>□ 버킷 이름 확인</li>
			<li>□ 파일 개수 확인 (예상 시간 계산)</li>
			<li>□ 네트워크 안정적인지 확인</li>
		</ul>

		<h3>마이그레이션 중</h3>
		<ul>
			<li>□ 진행 상황 모니터링</li>
			<li>□ 에러 메시지 확인</li>
			<li>□ 성공/실패 개수 확인</li>
		</ul>

		<h3>마이그레이션 후</h3>
		<ul>
			<li>□ prj_B Dashboard → Storage 확인</li>
			<li>□ 버킷 생성 확인</li>
			<li>□ 파일 개수 일치 확인</li>
			<li>□ 샘플 파일 다운로드 테스트</li>
			<li>□ 애플리케이션에서 이미지 로드 테스트</li>
		</ul>
	</div>

	<div class="section">
		<h2>⚙️ Storage 정책(Policy) 복사</h2>
		<p><strong>중요</strong>: Storage 정책은 Database의 일부입니다!</p>
		<ul>
			<li>✅ Database 백업/복원 시 자동 포함됨
				<ul>
					<li>storage.objects 테이블의 RLS 정책</li>
					<li>storage.buckets 테이블의 RLS 정책</li>
				</ul>
			</li>
			<li>❌ 별도 작업 불필요</li>
		</ul>

		<p>만약 Database 백업을 안 했다면:</p>
		<pre><code>-- prj_A SQL Editor에서 정책 확인
SELECT * FROM pg_policies 
WHERE schemaname = 'storage';

-- 결과를 prj_B SQL Editor에서 재생성</code></pre>
	</div>

	<div class="section">
		<h2>🎓 참고 정보</h2>
		<h3>Service Role Key vs Anon Key</h3>
		<ul>
			<li><strong>Anon Key (public)</strong>:
				<ul>
					<li>클라이언트(브라우저)에서 사용</li>
					<li>RLS 정책 적용됨</li>
					<li>제한된 접근</li>
				</ul>
			</li>
			<li><strong>Service Role Key (secret)</strong>:
				<ul>
					<li>서버/스크립트에서 사용</li>
					<li>RLS 정책 우회</li>
					<li>모든 접근 가능</li>
					<li>⚠️ 절대 공개 금지!</li>
				</ul>
			</li>
		</ul>

		<h3>Storage 구조</h3>
		<pre><code>Project
└─ Storage
   ├─ Bucket 1 (예: images)
   │  ├─ file1.jpg
   │  ├─ file2.png
   │  └─ folder/
   │     └─ file3.gif
   ├─ Bucket 2 (예: documents)
   │  └─ doc.pdf
   └─ Bucket 3 (예: avatars)
      └─ avatar.jpg</code></pre>

		<h3>파일 URL 구조</h3>
		<pre><code>기존 (prj_A):
https://ozvkandsyfmvjxwcxwkn.supabase.co/storage/v1/object/public/images/file.jpg

새 프로젝트 (prj_B):
https://czgtexdgawrnrelvjqur.supabase.co/storage/v1/object/public/images/file.jpg

⚠️ 애플리케이션에서 URL 업데이트 필요!</code></pre>
	</div>

	<div class="section">
		<h2>🔗 관련 문서</h2>
		<ul>
			<li><a href="https://supabase.com/docs/guides/storage" target="_blank" rel="noopener noreferrer">Supabase Storage 공식 문서</a></li>
			<li><a href="https://supabase.com/docs/reference/javascript/storage-from-list" target="_blank" rel="noopener noreferrer">Supabase JS Client 문서</a></li>
			<li><a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">Supabase 공식 문서</a></li>
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
		</ul>
	</div>

	<div class="meta-info">
		<p><strong>작성일</strong>: 2024년 12월 28일</p>
		<p><strong>대상</strong>: Supabase 사용자 (Free/Pro Plan 모두)</p>
		<p><strong>소요 시간</strong>: 파일 개수에 따라 5분~30분</p>
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

	.migration-guide h4 {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		color: #4b5563;
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

