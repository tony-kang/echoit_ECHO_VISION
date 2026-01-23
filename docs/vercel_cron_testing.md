# Vercel에서 Cron Job 테스트하기

Vercel에 배포된 프로젝트에서 1분 cron job을 테스트하는 방법을 안내합니다.

## 사전 준비

1. **프로젝트 배포 확인**
   - Vercel에 프로젝트가 배포되어 있어야 합니다.
   - `vercel.json`에 cron job 설정이 포함되어 있어야 합니다.

2. **환경 변수 설정 (선택사항)**
   - Vercel 대시보드 → Settings → Environment Variables
   - `CRON_SECRET` 설정 (외부 호출 시 필요)

## 방법 1: 자동 실행 대기 (가장 간단)

1. **Vercel 대시보드에서 확인**
   - Vercel 대시보드 → 프로젝트 선택 → Settings → Cron Jobs
   - `test-minute` cron job이 등록되어 있는지 확인
   - 다음 실행 시간 확인

2. **로그 확인**
   - Vercel 대시보드 → 프로젝트 선택 → Functions
   - `/api/cron/test-minute` 함수 선택
   - 실행 로그 확인

3. **1분 대기**
   - 배포 후 최대 1분 내에 자동 실행됩니다.
   - 로그에서 실행 내역 확인

## 방법 2: 수동 API 호출 (즉시 테스트)

Vercel에 배포된 프로젝트의 API 엔드포인트를 직접 호출할 수 있습니다.

### curl 사용

```bash
# 프로덕션 URL
curl https://your-project.vercel.app/api/cron/test-minute \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 또는 Vercel이 자동으로 추가하는 헤더가 있으므로 CRON_SECRET 없이도 가능
# (단, 외부에서 호출할 때는 CRON_SECRET 필요)
```

### 브라우저에서 테스트

브라우저 개발자 도구 Console에서 실행:

```javascript
fetch('https://your-project.vercel.app/api/cron/test-minute', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_CRON_SECRET'
  }
})
.then(res => res.json())
.then(data => console.log('응답:', data))
.catch(err => console.error('오류:', err));
```

### 성공 응답 예시

```json
{
  "success": true,
  "message": "테스트 Cron Job이 성공적으로 실행되었습니다.",
  "timestamp": "2024-01-18T12:00:00.000Z",
  "koreaTime": "2024-01-18T21:00:00.000Z",
  "executionCount": 1,
  "note": "이 Cron Job은 1분마다 실행됩니다. 테스트 완료 후 vercel.json에서 제거하거나 스케줄을 변경하세요."
}
```

## 방법 3: Vercel CLI 사용

Vercel CLI를 사용하여 로컬에서 배포된 함수를 테스트할 수 있습니다.

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link

# 함수 로그 확인
vercel logs --follow

# 특정 함수만 확인
vercel logs /api/cron/test-minute --follow
```

## 방법 4: Vercel 대시보드에서 확인

1. **Cron Jobs 상태 확인**
   - Vercel 대시보드 → 프로젝트 → Settings → Cron Jobs
   - 등록된 cron job 목록 확인
   - 마지막 실행 시간 및 상태 확인

2. **Functions 로그 확인**
   - Vercel 대시보드 → 프로젝트 → Functions
   - `/api/cron/test-minute` 선택
   - 실행 내역 및 로그 확인
   - 에러 발생 시 상세 내용 확인

3. **실시간 모니터링**
   - Vercel 대시보드 → 프로젝트 → Logs
   - 실시간 로그 스트림 확인
   - 필터: `test-minute` 또는 `cron`

## 테스트 체크리스트

- [ ] `vercel.json`에 cron job 설정 확인
- [ ] Vercel에 프로젝트 배포 완료
- [ ] Vercel 대시보드에서 Cron Jobs 등록 확인
- [ ] API 엔드포인트 수동 호출 테스트
- [ ] 로그에서 실행 내역 확인
- [ ] 1분 후 자동 실행 확인
- [ ] 에러 발생 시 로그 확인

## 문제 해결

### Cron Job이 실행되지 않는 경우

1. **배포 확인**
   ```bash
   vercel --version
   vercel ls  # 배포 목록 확인
   ```

2. **vercel.json 확인**
   - 파일이 프로젝트 루트에 있는지 확인
   - JSON 형식이 올바른지 확인
   - cron 경로가 올바른지 확인

3. **환경 변수 확인**
   - Vercel 대시보드에서 환경 변수 설정 확인
   - `CRON_SECRET`이 필요한 경우 설정 확인

4. **로그 확인**
   - Vercel 대시보드 → Logs에서 에러 메시지 확인
   - Functions 로그에서 상세 에러 확인

### 401 Unauthorized 오류

- `CRON_SECRET`이 설정되어 있는지 확인
- Authorization 헤더 형식 확인: `Bearer {CRON_SECRET}`
- Vercel에서 자동 호출하는 경우 `x-vercel-cron` 헤더 확인

### 타임아웃 오류

- Cron Job 실행 시간이 10초를 초과하지 않는지 확인
- 장시간 실행되는 작업은 별도 워커로 분리 고려

## 참고

- Vercel Cron Jobs는 **프로덕션 환경에서만** 작동합니다.
- Preview 배포에서는 cron job이 실행되지 않습니다.
- Cron Job 실행 시간은 최대 10초입니다.
- 무료 플랜에서는 제한이 있을 수 있습니다.

## 다음 단계

테스트가 완료되면:

1. 실제 작업 로직 추가
2. 에러 처리 및 로깅 강화
3. 모니터링 설정
4. 필요시 스케줄 조정 (`vercel.json` 수정)
