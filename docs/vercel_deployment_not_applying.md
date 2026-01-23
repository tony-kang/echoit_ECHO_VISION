# Vercel 배포가 적용되지 않는 문제 해결

GitHub에 최신 커밋은 보이지만 Vercel에 적용이 안 되는 경우의 해결 방법입니다.

## 즉시 해결 방법

### 1. Vercel 대시보드에서 수동 재배포 (가장 빠름)

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard

2. **프로젝트 선택**
   - 해당 프로젝트 클릭

3. **Deployments 탭 확인**
   - 최신 배포 상태 확인
   - 빌드 실패 여부 확인 (빨간색 표시)

4. **수동 재배포**
   - 최신 커밋 선택 → "..." 메뉴 → "Redeploy"
   - 또는 상단 "Redeploy" 버튼 클릭

### 2. Vercel CLI로 강제 배포

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link

# Production 배포
vercel --prod

# 특정 커밋으로 배포
vercel --prod --force
```

---

## 문제 진단

### Step 1: Vercel Dashboard 확인

**확인 사항:**
1. **Deployments 탭**
   - 새로운 배포가 시작되었는지 확인
   - 빌드 상태 확인 (Building, Ready, Error)
   - 최신 배포의 커밋 해시가 GitHub의 최신 커밋과 일치하는지 확인

2. **Functions 탭**
   - API 라우트가 정상적으로 배포되었는지 확인
   - 에러 로그 확인

3. **Settings → Git**
   - Connected Repository 확인
   - Production Branch가 `main`인지 확인
   - Auto-deploy가 활성화되어 있는지 확인

### Step 2: 빌드 로그 확인

**Vercel Dashboard → Deployments → 최신 배포 클릭**

확인 사항:
- 빌드가 성공했는지 (초록색 체크)
- 빌드가 실패했는지 (빨간색 X)
- 빌드 로그에서 에러 메시지 확인

**일반적인 빌드 에러:**
- 환경 변수 누락
- 의존성 설치 실패
- 빌드 스크립트 오류
- 타입 에러

### Step 3: GitHub Webhook 확인

**GitHub 저장소 → Settings → Webhooks**

확인 사항:
- Vercel webhook이 활성화되어 있는지
- 최근 전송 내역 확인
- 실패한 요청이 있는지 (빨간색 표시)

**문제 발견 시:**
- Webhook 재설정 필요
- Vercel Dashboard → Settings → Git → "Reconnect"

---

## 일반적인 원인 및 해결

### 원인 1: 빌드 실패

**증상:**
- Vercel Dashboard에 빌드 실패 표시
- 빌드 로그에 에러 메시지

**해결:**
```bash
# 로컬에서 빌드 테스트
npm run build
# 또는
yarn build

# 에러 수정 후 다시 커밋 & 푸시
git add .
git commit -m "fix: 빌드 에러 수정"
git push origin main
```

### 원인 2: Vercel이 자동 배포를 시작하지 않음

**증상:**
- GitHub에는 최신 커밋이 있음
- Vercel Dashboard에 새로운 배포가 없음

**해결:**
1. **수동 재배포**
   - Vercel Dashboard → Deployments → "Redeploy"

2. **Webhook 재연결**
   - Vercel Dashboard → Settings → Git
   - "Disconnect" → "Connect Git Repository"

3. **GitHub에서 Webhook 재설정**
   - GitHub → Settings → Webhooks
   - Vercel webhook 삭제 후 Vercel에서 재연결

### 원인 3: Production 브랜치 설정 오류

**증상:**
- 다른 브랜치에 푸시했지만 Production에 반영 안 됨

**해결:**
- Vercel Dashboard → Settings → Git
- Production Branch를 `main`으로 설정
- 또는 올바른 브랜치에 푸시

### 원인 4: 환경 변수 문제

**증상:**
- 빌드는 성공했지만 앱이 정상 작동하지 않음
- 런타임 에러 발생

**해결:**
- Vercel Dashboard → Settings → Environment Variables
- 필요한 환경 변수 확인
- Production, Preview, Development 모두 확인

### 원인 5: 캐시 문제

**증상:**
- 배포는 성공했지만 변경사항이 보이지 않음

**해결:**
1. **브라우저 캐시 삭제**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

2. **Vercel 캐시 무효화**
   - Vercel Dashboard → Deployments
   - 최신 배포 → "Redeploy" (캐시 무시)

3. **강제 재배포**
   ```bash
   vercel --prod --force
   ```

### 원인 6: vercel.json 설정 문제

**증상:**
- Cron Jobs 등 설정이 반영되지 않음

**해결:**
- `vercel.json` 파일이 프로젝트 루트에 있는지 확인
- JSON 형식이 올바른지 확인
- 배포 후 Vercel Dashboard → Settings → Cron Jobs에서 확인

---

## 단계별 문제 해결 체크리스트

### ✅ Step 1: 로컬 확인
```bash
# 최신 커밋 확인
git log --oneline -3

# 빌드 테스트
npm run build

# 에러가 있으면 수정 후 커밋 & 푸시
```

### ✅ Step 2: GitHub 확인
- GitHub 저장소에서 최신 커밋 확인
- 커밋이 올바르게 푸시되었는지 확인

### ✅ Step 3: Vercel Dashboard 확인
- Deployments 탭에서 새로운 배포 확인
- 빌드 상태 확인 (성공/실패)
- 빌드 로그 확인

### ✅ Step 4: 수동 재배포
- Vercel Dashboard → Deployments → "Redeploy"
- 또는 Vercel CLI: `vercel --prod`

### ✅ Step 5: Webhook 재연결 (필요시)
- Vercel Dashboard → Settings → Git → "Reconnect"

---

## 빠른 해결 명령어

```bash
# 1. 로컬 빌드 테스트
npm run build

# 2. 커밋 & 푸시 (변경사항이 있다면)
git add .
git commit -m "fix: 배포 문제 수정"
git push origin main

# 3. Vercel CLI로 강제 배포
vercel --prod --force
```

---

## 예방 방법

1. **커밋 전 로컬 빌드 테스트**
   ```bash
   npm run build
   ```

2. **Vercel Dashboard 정기 확인**
   - 배포 상태 모니터링
   - 빌드 실패 즉시 확인

3. **환경 변수 문서화**
   - 필요한 환경 변수 목록 유지
   - Vercel에 모두 설정되어 있는지 확인

4. **GitHub Actions 사용 (선택사항)**
   - CI/CD 파이프라인으로 이중 확인
   - 빌드 실패 시 알림 설정

---

## 문제가 계속되는 경우

1. **Vercel 지원팀 문의**
   - Vercel Dashboard → Help → Contact Support
   - 배포 로그 및 에러 메시지 첨부

2. **프로젝트 재연결**
   - Vercel Dashboard → Settings → Git
   - "Disconnect" → "Connect Git Repository"
   - 저장소 다시 선택

3. **새 프로젝트로 재배포 (최후의 수단)**
   - Vercel Dashboard → Add New Project
   - 같은 저장소 선택
   - 환경 변수 및 설정 복사

---

## 참고

- Vercel은 GitHub에 푸시 후 **몇 초 내**에 배포를 시작합니다
- 빌드 시간은 프로젝트 크기에 따라 다릅니다 (보통 1-5분)
- Preview 배포는 PR 생성 시 자동으로 생성됩니다
- Production 배포는 `main` 브랜치에 푸시 시 자동으로 시작됩니다
