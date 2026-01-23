/**
 * Production 프로젝트에서 백업한 데이터를 Development 프로젝트로 복원하는 스크립트
 * node db_storage_restore.cjs
 */
const { createClient } = require('@supabase/supabase-js')

// 프로젝트 설정 (Service Role Key 사용)
const PRODUCTION_PRJ = {
  url: 'https://czgtexdgawrnrelvjqur.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Z3RleGRnYXdybnJlbHZqcXVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg0NzI4MCwiZXhwIjoyMDgyNDIzMjgwfQ.1pjokHGQndfQjE6h2kw5904a_F8eRKkr9Ke3ftTFLaU'
}

const DEV_PRJ = {
  url: 'https://ozvkandsyfmvjxwcxwkn.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmthbmRzeWZtdmp4d2N4d2tuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg4OTkxNCwiZXhwIjoyMDgxNDY1OTE0fQ.Duug2YZpUKzQqj6cmeoUkjQeZALfdqJEaWbhYhMW3d8'
}

const BUCKET_NAME = 'images'

// Supabase 클라이언트 생성
const oldSupabase = createClient(PRODUCTION_PRJ.url, PRODUCTION_PRJ.key)
const newSupabase = createClient(DEV_PRJ.url, DEV_PRJ.key)

async function migrateStorage() {
  console.log('🚀 Storage 복사 시작...\n')

  try {
    // 1. 기존 프로젝트에서 버킷 목록 가져오기
    console.log(`📦 버킷 목록 확인...`)
    const { data: buckets, error: bucketsError } = await oldSupabase
      .storage
      .listBuckets()

    if (bucketsError) {
      console.error(`❌ 버킷 목록 가져오기 실패: ${bucketsError.message}`)
      return
    }

    const oldBucket = buckets.find(b => b.name === BUCKET_NAME)
    
    if (!oldBucket) {
      console.error(`❌ '${BUCKET_NAME}' 버킷을 찾을 수 없습니다.`)
      console.log('   사용 가능한 버킷:', buckets.map(b => b.name).join(', '))
      return
    }

    console.log(`✅ 기존 버킷 확인 완료: ${BUCKET_NAME}`)
    console.log(`   - Public: ${oldBucket.public}`)
    console.log(`   - File size limit: ${(oldBucket.file_size_limit / 1024 / 1024).toFixed(1)}MB`)

    // 2. 새 프로젝트에 버킷 생성
    console.log(`\n📦 새 프로젝트에 버킷 생성...`)
    const { error: newBucketError } = await newSupabase
      .storage
      .createBucket(BUCKET_NAME, {
        public: oldBucket.public,
        fileSizeLimit: oldBucket.file_size_limit,
        allowedMimeTypes: oldBucket.allowed_mime_types
      })

    if (newBucketError) {
      if (newBucketError.message.includes('already exists')) {
        console.log(`⚠️  버킷이 이미 존재합니다. 계속 진행...`)
      } else {
        console.error(`❌ 버킷 생성 실패: ${newBucketError.message}`)
        return
      }
    } else {
      console.log(`✅ 새 버킷 생성 완료`)
    }

    // 3. 파일 목록 가져오기 (재귀적으로 모든 폴더 탐색)
    console.log(`\n📁 파일 목록 가져오는 중...`)
    
    // eslint-disable-next-line svelte/no-inner-declarations
    async function listAllFiles(path = '') {
      const { data: items, error } = await oldSupabase
        .storage
        .from(BUCKET_NAME)
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.error(`❌ 파일 목록 가져오기 실패 (${path}): ${error.message}`)
        return []
      }

      let allFiles = []

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name
        
        if (item.id === null) {
          // 폴더인 경우 재귀적으로 탐색
          console.log(`   📂 폴더 탐색: ${fullPath}`)
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
      console.log(`\n✅ 버킷이 비어있습니다. 완료!`)
      return
    }

    console.log(`\n✅ 총 ${files.length}개 파일 발견`)
    console.log(`${'='.repeat(50)}\n`)

    // 4. 각 파일 복사
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        console.log(`[${i + 1}/${files.length}] ${file.name}`)
        
        // 기존 프로젝트에서 다운로드
        const { data: fileData, error: downloadError } = await oldSupabase
          .storage
          .from(BUCKET_NAME)
          .download(file.name)

        if (downloadError) {
          console.error(`  ❌ 다운로드 실패: ${downloadError.message}`)
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
          console.error(`  ❌ 업로드 실패: ${uploadError.message}`)
          errorCount++
          continue
        }

        console.log(`  ✅ 완료`)
        successCount++

      } catch (err) {
        console.error(`  ❌ 에러: ${err.message}`)
        errorCount++
      }
    }

    // 5. 결과 요약
    console.log(`\n${'='.repeat(50)}`)
    console.log(`🎉 복사 완료!`)
    console.log(`${'='.repeat(50)}`)
    console.log(`✅ 성공: ${successCount}개`)
    if (errorCount > 0) {
      console.log(`❌ 실패: ${errorCount}개`)
    }
    console.log(`${'='.repeat(50)}\n`)

  } catch (error) {
    console.error(`\n❌ 치명적 에러:`, error)
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
  })