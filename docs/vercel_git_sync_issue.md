# Vercel Git 동기화 문제 해결 가이드

Vercel에서 Connected Git Repository의 최신 커밋이 반영되지 않는 문제를 해결하는 방법입니다.

## 일반적인 원인 및 해결 방법

### 1. 커밋은 했지만 Push를 안 한 경우

**확인 방법:**
```bash
# 로컬에만 있는 커밋 확인
git log origin/main..HEAD --oneline

# 원격 저장소와 동기화
git push origin main
```

**해결:**
- 커밋 후 반드시 `git push` 실행
- Vercel은 GitHub/GitLab의 원격 저장소를 감지하므로 로컬 커밋만으로는 반영되지 않음

---

### 2. Vercel이 감지하지 못하는 경우

**확인 사항:**

1. **Vercel 대시보드 확인**
   - Vercel Dashboard → 프로젝트 → Settings → Git
   - Connected Repository가 올바르게 연결되어 있는지 확인
   - Production Branch가 `main` (또는 `master`)인지 확인

2. **GitHub Webhook 확인**
   - GitHub 저장소 → Settings → Webhooks
   - Vercel webhook이 활성화되어 있는지 확인
   - 최근 전송 내역 확인 (실패한 경우 빨간색 표시)

3. **수동 재배포**
   - Vercel Dashboard → 프로젝트 → Deployments
   - "Redeploy" 버튼 클릭
   - 또는 "..." 메뉴 → "Redeploy"

---

### 3. 빌드 실패로 인한 문제

**확인 방법:**
- Vercel Dashboard → Deployments
- 최근 배포 내역 확인
- 실패한 배포가 있는지 확인 (빨간색 표시)

**해결:**
```bash
# 로컬에서 빌드 테스트
npm run build
# 또는
yarn build

# 빌드 실패 시 에러 메시지 확인 후 수정
```

---

### 4. 브랜치 설정 문제

**확인 사항:**
- Vercel Dashboard → Settings → Git
- Production Branch가 올바른지 확인
- Preview Branches 설정 확인

**해결:**
- Production Branch를 `main`으로 설정
- 다른 브랜치에 푸시한 경우 해당 브랜치도 Preview로 배포됨

---

### 5. Vercel Webhook 문제

**증상:**
- GitHub에 푸시했지만 Vercel이 감지하지 못함
- Vercel Dashboard에 새로운 배포가 나타나지 않음

**해결 방법:**

1. **Webhook 재설정**
   - Vercel Dashboard → 프로젝트 → Settings → Git
   - "Disconnect" 클릭 후 다시 연결
   - 또는 "Reconnect" 버튼 클릭

2. **GitHub에서 Webhook 재설정**
   - GitHub 저장소 → Settings → Webhooks
   - Vercel webhook 삭제 후 Vercel에서 다시 연결

---

### 6. 환경 변수 문제

**확인 사항:**
- Vercel Dashboard → Settings → Environment Variables
- 필요한 환경 변수가 모두 설정되어 있는지 확인
- Production, Preview, Development 환경 모두 확인

---

### 7. Vercel 프로젝트 연결 문제

**확인 방법:**
```bash
# Vercel CLI로 확인
vercel ls

# 프로젝트 정보 확인
vercel inspect
```

**해결:**
- Vercel Dashboard에서 프로젝트 삭제 후 재연결
- 또는 Vercel CLI로 재연결: `vercel link`

---

## 단계별 문제 해결 체크리스트

### Step 1: 로컬 상태 확인
```bash
# 현재 상태 확인
git status

# 최근 커밋 확인
git log --oneline -5

# 원격 저장소와 비교
git fetch origin
git log origin/main..HEAD --oneline
```

### Step 2: Push 확인
```bash
# Push 실행
git push origin main

# Push 성공 확인
git log origin/main..HEAD --oneline  # 비어있어야 함
```

### Step 3: GitHub 확인
- GitHub 저장소 페이지에서 최신 커밋 확인
- 커밋이 반영되어 있는지 확인

### Step 4: Vercel 대시보드 확인
- Vercel Dashboard → Deployments
- 새로운 배포가 시작되었는지 확인
- 빌드 로그 확인

### Step 5: 수동 재배포 (필요시)
- Vercel Dashboard → Deployments
- "Redeploy" 클릭
- 또는 특정 커밋 선택 → "Redeploy"

---

## 빠른 해결 방법

### 방법 1: 수동 재배포
1. Vercel Dashboard → 프로젝트 → Deployments
2. 최신 배포 선택
3. "Redeploy" 클릭

### 방법 2: Vercel CLI 사용
```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link

# 배포
vercel --prod
```

### 방법 3: Git 재연결
1. Vercel Dashboard → Settings → Git
2. "Disconnect" 클릭
3. "Connect Git Repository" 클릭
4. 저장소 다시 선택

---

## 예방 방법

1. **커밋 후 항상 Push**
   ```bash
   git add .
   git commit -m "커밋 메시지"
   git push origin main  # 반드시 실행
   ```

2. **배포 전 로컬 빌드 테스트**
   ```bash
   npm run build
   ```

3. **Vercel Dashboard 정기 확인**
   - Deployments 탭에서 배포 상태 확인
   - 실패한 배포가 있으면 즉시 확인

4. **GitHub Actions 사용 (선택사항)**
   - GitHub Actions로 자동 배포 설정
   - Vercel과 병행하여 이중 확인

---

## 문제가 계속되는 경우

1. **Vercel 지원팀 문의**
   - Vercel Dashboard → Help → Contact Support
   - 문제 상세 설명 및 로그 첨부

2. **GitHub 저장소 확인**
   - 저장소가 Private인 경우 Vercel 권한 확인
   - 저장소가 Archived된 경우 해제

3. **Vercel 계정 확인**
   - Vercel 계정 상태 확인
   - 무료 플랜 제한 확인

---

## 참고

- Vercel은 GitHub/GitLab의 **원격 저장소**를 감지합니다
- 로컬 커밋만으로는 배포되지 않습니다
- Push 후 보통 몇 초 내에 배포가 시작됩니다
- 빌드 시간은 프로젝트 크기에 따라 다릅니다
