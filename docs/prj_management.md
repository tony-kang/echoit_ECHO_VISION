# 프로젝트 관리 가이드 (심플 버전)

소규모 팀을 위한 실용적인 GitHub + Vercel + Supabase 관리 방법입니다.

---

## 빠른 시작

### 기본 워크플로우
```bash
# 1. 새 기능 시작
git checkout main && git pull && git checkout -b f/기능명

# 2. 작업 후 커밋
git add . && git commit -m "feat: 설명" && git push

# 3. GitHub에서 PR 생성 → Vercel Preview 확인 → 머지
# 4. 자동으로 Production 배포됨
```

---

## 1. 초기 설정 (한 번만)

### GitHub 저장소 연결
```bash
git remote add origin 저장소URL
git push -u origin main
```

### GitHub PR 설정

GitHub 저장소에서 Pull Request를 효율적으로 사용하기 위한 설정 방법입니다.

#### Step 1: GitHub 저장소 접속 및 설정 메뉴 이동

1. **GitHub 저장소 페이지 접속**
   - https://github.com/your-username/your-repo 접속
   - 또는 GitHub에서 저장소 검색 후 선택

2. **Settings 메뉴로 이동**
   - 저장소 페이지 상단의 **"Settings"** 탭 클릭
   - 저장소에 대한 관리 권한이 있어야 설정 가능

#### Step 2: PR 템플릿 생성 (선택사항, 권장)

PR 생성 시 자동으로 표시되는 템플릿을 만들어 일관된 PR 관리를 할 수 있습니다.

**로컬에서 템플릿 파일 생성:**

```bash
# 프로젝트 루트에서 실행
mkdir -p .github
```

`.github/PULL_REQUEST_TEMPLATE.md` 파일 생성 및 내용 작성:

```markdown
## 변경사항
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
<!-- 필요시 스크린샷 첨부 -->
```

**GitHub에 커밋 및 푸시:**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: PR 템플릿 추가"
git push origin main
```

이제 PR 생성 시 자동으로 템플릿이 표시됩니다.

#### Step 3: PR 머지 옵션 설정

**경로:** GitHub 저장소 → **Settings** → **General** → **Pull Requests** 섹션

**권장 설정:**
- ✅ **Allow squash merging** (커밋 히스토리 정리) - **권장**
- ✅ **Allow merge commits** (선택사항)
- ❌ **Allow rebase merging** (선택사항)

**설정 방법:**
1. Settings → General 페이지로 이동
2. "Pull Requests" 섹션까지 스크롤
3. 원하는 머지 옵션 체크박스 선택
4. 페이지 하단의 **"Save changes"** 버튼 클릭

**Squash and merge**를 기본으로 사용하면:
- 여러 커밋을 하나로 합쳐 깔끔한 히스토리 유지
- 기능별로 명확한 커밋 메시지 작성 가능

#### Step 4: 브랜치 보호 규칙 설정 (선택사항)

**경로:** GitHub 저장소 → **Settings** → **Branches** → **Add rule**

브랜치 보호 규칙은 `main` 브랜치에 직접 푸시를 방지하고 PR을 통한 머지만 허용합니다.

**설정 단계:**

1. **Settings → Branches** 메뉴로 이동
2. **"Add rule"** 또는 **"Add branch protection rule"** 버튼 클릭
3. **Branch name pattern** 입력: `main`
4. 아래 옵션들 설정:

**권장 설정 (소규모 팀):**

```
✅ Require a pull request before merging
  ✅ Require approvals: 0 (혼자 작업 시) 또는 1 (팀 작업 시)
  ✅ Dismiss stale pull request approvals when new commits are pushed
  
✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  (선택) Vercel 빌드 체크 추가
  
✅ (선택) Do not allow bypassing the above settings
```

5. **"Create"** 또는 **"Save changes"** 버튼 클릭

**주의사항:**
- 혼자 작업하는 경우 브랜치 보호 규칙은 필수가 아닙니다
- 팀 작업 시 코드 리뷰를 강제하려면 "Require approvals: 1" 이상 설정
- Vercel과 연동된 경우 빌드 체크를 추가하면 빌드 실패 시 머지 방지

#### Step 5: Vercel 연동 확인 (Vercel 사용 시)

Vercel을 GitHub에 연결하면 자동으로 봇이 설치되고 PR에 Preview URL이 추가됩니다.

**확인 방법:**

1. **GitHub 저장소 → Settings → Integrations**
   - Vercel이 설치되어 있는지 확인
   - 설치되어 있지 않으면 Vercel Dashboard에서 GitHub 연동 필요

2. **PR 생성 후 확인**
   - PR 생성 시 Vercel 봇이 자동으로 댓글 추가
   - Preview URL이 자동으로 생성되는지 확인

**Vercel 연동 방법 (처음 설정 시):**

1. Vercel Dashboard 접속: https://vercel.com/dashboard
2. **Add New Project** 클릭
3. GitHub 저장소 선택 및 Import
4. 환경 변수 설정 후 Deploy
5. 자동으로 GitHub에 Vercel 봇 설치됨

#### Step 6: PR 자동화 설정 (선택사항)

**경로:** GitHub 저장소 → **Settings** → **General** → **Features**

**권장 설정:**
- ✅ **Issues** (이슈 트래킹 사용 시)
- ✅ **Projects** (프로젝트 관리 사용 시)
- ✅ **Wiki** (문서 관리 사용 시)

#### 설정 완료 확인

모든 설정이 완료되면:

1. **테스트 PR 생성**
   ```bash
   git checkout -b test/pr-settings
   git commit --allow-empty -m "test: PR 설정 확인"
   git push origin test/pr-settings
   ```

2. **GitHub에서 PR 생성**
   - "Compare & pull request" 버튼 클릭
   - PR 템플릿이 자동으로 표시되는지 확인
   - Vercel Preview URL이 자동으로 추가되는지 확인

3. **PR 머지 테스트**
   - "Merge pull request" 버튼 클릭
   - Squash and merge 옵션이 표시되는지 확인
   - 머지 후 커밋 히스토리 확인

#### 문제 해결

**PR 템플릿이 표시되지 않는 경우:**
- `.github/PULL_REQUEST_TEMPLATE.md` 파일이 `main` 브랜치에 있는지 확인
- 파일명과 경로가 정확한지 확인
- 브랜치를 새로고침하거나 PR을 다시 생성

**Vercel Preview가 생성되지 않는 경우:**
- GitHub 저장소 → Settings → Integrations에서 Vercel 확인
- Vercel Dashboard에서 프로젝트가 GitHub와 연동되어 있는지 확인
- Vercel 프로젝트 설정에서 GitHub 저장소 연결 확인

**브랜치 보호 규칙이 작동하지 않는 경우:**
- 저장소 관리자 권한이 있는지 확인
- Branch name pattern이 정확한지 확인 (`main`, `master` 등)
- 설정 저장 후 페이지 새로고침

### Vercel 배포 설정
1. Vercel Dashboard → Add New Project → GitHub 저장소 선택
2. Framework: SvelteKit (자동 감지)
3. 환경 변수 추가:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

### 로컬 환경 변수
프로젝트 루트에 `.env` 파일 생성:
```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 2. 일상적인 개발 프로세스

### 작업 시작
```bash
git checkout main
git pull origin main
git checkout -b f/기능명
```

### 작업 중
```bash
# 변경사항 커밋
git add .
git commit -m "feat: 기능 설명"
git push origin f/기능명
```

### 작업 완료 후
1. 변경사항 커밋 및 푸시
2. GitHub에서 PR 생성 (자세한 내용은 "4. Pull Request" 섹션 참고)
3. Vercel Preview URL 확인
4. 체크리스트 확인 후 문제 없으면 머지
5. 자동으로 Production 배포됨

### PR 머지 후 정리
```bash
git checkout main
git pull origin main
git branch -d f/기능명  # 로컬 브랜치 삭제
```

---

## 3. 브랜치 전략 (심플)

### 브랜치 구조
- `main`: 프로덕션 (항상 배포 가능한 상태)
- `f/*`: 기능 개발

### 브랜치 명명
- `f/기능명`: 새 기능 (예: `f/login`)
- `fix/버그명`: 버그 수정 (예: `fix/header-layout`)

---

## 4. Pull Request 생성 및 관리

### PR을 사용하는 이유
- Vercel Preview로 배포 전 확인
- 변경사항 기록 및 추적
- 문제 발생 시 쉽게 롤백

### PR 생성 단계

#### Step 1: 브랜치 푸시 후 GitHub 이동
```bash
# 작업 완료 후 푸시
git add .
git commit -m "feat: 로그인 기능 추가"
git push origin f/login
```

#### Step 2: GitHub에서 PR 생성
1. GitHub 저장소 페이지로 이동
2. "Compare & pull request" 버튼 클릭 (또는 Pull requests 탭 → New pull request)
3. Base: `main` ← Compare: `f/login` 확인
4. PR 제목 및 설명 작성

#### Step 3: PR 설명 작성 (템플릿)
```markdown
## 변경사항
- 로그인 페이지 UI 추가
- 인증 Store 구현
- Supabase 인증 연동

## 확인사항
- [ ] 로컬 테스트 완료 (`yarn dev`)
- [ ] 빌드 성공 (`yarn build`)
- [ ] Vercel Preview 확인
- [ ] 환경 변수 정상 작동

## 테스트 방법
1. 로그인 페이지 접속
2. 이메일/비밀번호 입력
3. 로그인 성공 확인
```

#### Step 4: PR 체크리스트 확인
PR 생성 후 자동으로:
- Vercel 봇이 Preview URL을 댓글로 추가
- Preview 배포가 시작됨

**확인할 사항:**
- [ ] Vercel Preview 배포 성공 확인
- [ ] Preview URL에서 기능 테스트
- [ ] 빌드 로그에 에러 없는지 확인

#### Step 5: PR 머지
모든 확인 완료 후:
1. "Merge pull request" 버튼 클릭
2. "Squash and merge" 선택 (커밋 히스토리 정리)
3. "Confirm merge" 클릭
4. 자동으로 Production 배포 시작

### PR 머지 후 정리
```bash
# main 브랜치로 전환
git checkout main
git pull origin main

# 완료된 브랜치 삭제 (선택사항)
git branch -d f/login
```

### PR 체크리스트 (필수)
- [ ] 로컬에서 `yarn build` 성공
- [ ] Vercel Preview에서 동작 확인
- [ ] 환경 변수 정상 작동
- [ ] 주요 기능 테스트 완료

---

## 5. 배포 프로세스

### 자동 배포
- **Production**: `main` 브랜치에 머지 시 자동 배포
- **Preview**: PR 생성 시 자동으로 Preview URL 생성

### 배포 확인
1. Vercel Dashboard에서 배포 상태 확인
2. Preview URL에서 기능 테스트
3. 문제 없으면 PR 머지

---

## 6. 환경 변수 관리

### 로컬 개발
`.env` 파일에 설정 (Git에 커밋하지 않음)

### Vercel 배포
Vercel Dashboard → Settings → Environment Variables
- Production, Preview 환경에 동일하게 설정

### Supabase 정보 확인
Supabase Dashboard → Settings → API
- Project URL → `PUBLIC_SUPABASE_URL`
- anon public key → `PUBLIC_SUPABASE_ANON_KEY`

---

## 7. 문제 해결

### 배포 실패
1. Vercel Dashboard에서 로그 확인
2. 로컬에서 `yarn build` 실행하여 재현
3. 문제 수정 후 다시 푸시

### 환경 변수 문제
- Vercel Dashboard에서 환경 변수 확인
- `PUBLIC_` 접두사 확인
- Supabase 프로젝트 활성화 확인

### Git 충돌
```bash
git checkout main
git pull origin main
git checkout f/your-branch
git merge main
# 충돌 해결 후
git add . && git commit -m "fix: 충돌 해결" && git push
```

---

## 8. 유용한 명령어

### 상태 확인
```bash
git status              # 현재 상태
git log --oneline -10   # 최근 커밋 10개
```

### 변경사항 되돌리기
```bash
git reset --soft HEAD~1        # 마지막 커밋 취소 (변경사항 유지)
git checkout -- filename       # 파일 되돌리기
git reset --hard origin/main   # 원격 main으로 되돌리기
```

### 커밋 메시지 (간단하게)
- `feat: 기능 추가`
- `fix: 버그 수정`
- `docs: 문서 수정`
- `refactor: 코드 정리`

---

## 9. 체크리스트 (배포 전)

### 필수 확인
- [ ] `yarn build` 성공
- [ ] `yarn lint` 통과 (선택사항)
- [ ] 로컬에서 정상 작동
- [ ] Vercel Preview 확인
- [ ] 환경 변수 설정 확인

---

## 10. 주요 URL

- **GitHub**: https://github.com/your-username/www.example.com
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://supabase.com/dashboard
- **프로덕션**: https://www.example.com

---

## 핵심 원칙

1. **main 브랜치는 항상 배포 가능한 상태 유지**
2. **작은 단위로 자주 커밋**
3. **PR로 배포 전 확인**
4. **문제 발생 시 쉽게 롤백 가능하도록**

---

이 가이드대로 하면 심플하게 프로젝트를 관리할 수 있습니다.
