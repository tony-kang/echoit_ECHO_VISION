# 프로젝트 초기 설정 가이드

XXXX 프로젝트를 처음부터 설정하는 전체 순서입니다.

---

## 목차

1. [구글 개발자 계정 - 프로젝트 생성 및 OAuth 설정](#1-구글-개발자-계정---프로젝트-생성-및-oauth-설정)
2. [Supabase 계정 - 프로젝트 생성](#2-supabase-계정---프로젝트-생성)
3. [Supabase OpenAuth 설정 (Google OAuth)](#3-supabase-openauth-설정-google-oauth)
4. [프론트 프로젝트 생성 (Svelte 프로젝트)](#4-프론트-프로젝트-생성-svelte-프로젝트)
5. [프론트 로그인/회원가입/비번찾기 개발](#5-프론트-로그인회원가입비번찾기-개발)
6. [Vercel 배포 설정](#6-vercel-배포-설정)
   - [커스텀 도메인 설정](#66-커스텀-도메인-설정-vercel)
   - [Gabia DNS 설정](#67-gabia-dns-설정-cname-레코드)
   - [DNS 전파 확인](#68-dns-전파-확인)

---

## 1. 구글 개발자 계정 - 프로젝트 생성 및 OAuth 설정

### 1.1 Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 1.2 새 프로젝트 생성

1. 상단 프로젝트 선택 드롭다운 클릭
2. **"새 프로젝트"** 클릭
3. 프로젝트 정보 입력:
   - **프로젝트 이름**: `www.example.com`
   - **조직**: 선택사항
   - **위치**: 선택사항
4. **"만들기"** 클릭
5. 프로젝트 생성 완료까지 대기 (약 1-2분)

### 1.3 OAuth 동의 화면 구성

1. 좌측 메뉴에서 **"API 및 서비스"** → **"OAuth 동의 화면"** 클릭
2. 사용자 유형 선택:
   - **외부** 선택 (일반 사용자용)
   - **만들기** 클릭
3. 앱 정보 입력:
   - **앱 이름**: `XXXX`
   - **사용자 지원 이메일**: 본인 이메일 선택
   - **앱 로고**: 선택사항 (로고 업로드)
   - **앱 도메인**: 나중에 입력 가능
   - **개발자 연락처 정보**: 본인 이메일
4. **"저장 후 계속"** 클릭
5. 범위(Scopes) 설정:
   - **"범위 추가 또는 삭제"** 클릭
   - 기본 범위 유지:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - **"업데이트"** → **"저장 후 계속"** 클릭
6. 테스트 사용자 추가 (선택사항):
   - 개발 단계에서는 테스트 사용자만 사용 가능
   - **"테스트 사용자"** 탭에서 이메일 추가
   - **"저장 후 계속"** 클릭
7. 요약 확인 후 **"대시보드로 돌아가기"** 클릭

### 1.4 OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴에서 **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
2. 상단 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"OAuth 클라이언트 ID"** 선택
4. 애플리케이션 유형: **"웹 애플리케이션"** 선택
5. 이름: `XXXX Web Client`
6. 승인된 자바스크립트 원본:
   ```
   http://localhost:5173
   http://localhost:5174
   ```
   (로컬 개발용, 나중에 프로덕션 도메인 추가)
7. 승인된 리디렉션 URI:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5174/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```
   (Supabase 콜백 URL 포함)
8. **"만들기"** 클릭
9. **중요**: 클라이언트 ID와 클라이언트 보안 비밀번호를 복사하여 안전한 곳에 보관
   - 나중에 Supabase 설정에 필요합니다

### 1.5 OAuth 2.0 클라이언트 ID 확인

- **클라이언트 ID**: `xxxxx.apps.googleusercontent.com` 형식
- **클라이언트 보안 비밀번호**: `GOCSPX-xxxxx` 형식

이 정보는 다음 단계에서 Supabase 설정에 사용됩니다.

---

## 2. Supabase 계정 - 프로젝트 생성

### 2.1 Supabase 계정 생성

1. [Supabase](https://supabase.com/) 접속
2. **"Start your project"** 또는 **"Sign In"** 클릭
3. GitHub 계정으로 로그인 (권장) 또는 이메일로 가입

### 2.2 새 프로젝트 생성

1. 대시보드에서 **"New Project"** 클릭
2. 프로젝트 정보 입력:
   - **Name**: 'example-web'
   - **Database Password**: 강력한 비밀번호 생성 및 저장 (복구 불가능)
   - **Region**: 가장 가까운 리전 선택 (예: `Northeast Asia (Seoul)`)
   - **Pricing Plan**: Free tier 선택 (또는 Pro)
3. **"Create new project"** 클릭
4. 프로젝트 생성 완료까지 대기 (약 2-3분)

### 2.3 프로젝트 설정 확인

1. 프로젝트 대시보드에서 **Settings** (좌측 하단 톱니바퀴 아이콘) 클릭
2. **API** 메뉴 클릭
3. 다음 정보 확인 및 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: (관리자용, 보안 주의)

### 2.4 데이터베이스 테이블 생성

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. 다음 SQL 파일을 순서대로 실행:
   - `docs/supabase/tbl_profiles.sql`
   - `docs/supabase/tbl_user_profiles.sql`
3. 각 SQL 파일의 내용을 복사하여 실행
4. 실행 완료 확인

---

## 3. Supabase OpenAuth 설정 (Google OAuth)

### 3.1 Authentication 설정 접속

1. Supabase 대시보드에서 **Authentication** (좌측 메뉴) 클릭
2. **Providers** 탭 클릭

### 3.2 Google Provider 활성화

1. **Google** 카드 찾기
2. **Enable Google** 토글을 **ON**으로 변경
3. 다음 정보 입력:
   - **Client ID (for OAuth)**: Google Cloud Console에서 복사한 클라이언트 ID
     - 예: `xxxxx.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: Google Cloud Console에서 복사한 클라이언트 보안 비밀번호
     - 예: `GOCSPX-xxxxx`
4. **"Save"** 클릭

### 3.3 Redirect URL 확인

1. **URL Configuration** 섹션 확인
2. **Redirect URLs**에 다음이 자동으로 추가되어 있는지 확인:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
3. Google Cloud Console의 **승인된 리디렉션 URI**에 위 URL이 포함되어 있는지 확인

### 3.4 테스트

1. **Authentication** → **Users** 탭에서 사용자 목록 확인
2. 로그인 페이지에서 Google 로그인 버튼 클릭하여 테스트
3. Google 계정 선택 후 로그인 성공 확인

---

## 4. 프론트 프로젝트 생성 (Svelte 프로젝트)

### 4.1 SvelteKit 프로젝트 생성

```bash
# 프로젝트 디렉토리로 이동
cd /Users/kangbyungwoo/Documents/kbwProject/svelte5

# SvelteKit 프로젝트 생성
npm create svelte@latest mc_COACHING

# 프로젝트 타입 선택
# - Skeleton project 선택
# - TypeScript: No (또는 Yes)
# - Add ESLint: Yes
# - Add Prettier: Yes
# - Add Playwright: 선택사항
# - Add Vitest: 선택사항
```

### 4.2 프로젝트 디렉토리로 이동 및 의존성 설치

```bash
cd mc_COACHING
npm install
```

### 4.3 Supabase 클라이언트 설치

```bash
npm install @supabase/supabase-js
```

### 4.4 환경 변수 설정

1. 프로젝트 루트에 `.env` 파일 생성:

```bash
touch .env
```

2. `.env` 파일에 다음 내용 추가:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. 실제 Supabase 프로젝트의 URL과 anon key로 교체

### 4.5 기본 파일 구조 확인

프로젝트 구조:
```
mc_COACHING/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── Logo.svelte
│   │   ├── stores/
│   │   │   └── authStore.js
│   │   └── supabaseClient.js
│   ├── routes/
│   │   ├── login/
│   │   │   └── +page.svelte
│   │   ├── signup/
│   │   │   └── +page.svelte
│   │   ├── reset-password/
│   │   │   └── +page.svelte
│   │   ├── update-password/
│   │   │   └── +page.svelte
│   │   └── auth/
│   │       └── callback/
│   │           └── +page.svelte
│   └── prj/
│       └── prjConst.js
├── static/
│   └── logo/
│       └── logo_w.png
└── .env
```

### 4.6 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 확인

---

## 5. 프론트 로그인/회원가입/비번찾기 개발

### 5.1 Supabase 클라이언트 설정

파일: `src/lib/supabaseClient.js`

이미 생성되어 있으므로 확인만 하면 됩니다.

### 5.2 인증 Store 생성

파일: `src/lib/stores/authStore.js`

이미 생성되어 있으므로 확인만 하면 됩니다.

### 5.3 Logo 컴포넌트 생성

파일: `src/lib/components/Logo.svelte`

이미 생성되어 있으므로 확인만 하면 됩니다.

### 5.4 로그인 페이지

파일: `src/routes/login/+page.svelte`

**기능:**
- 이메일/비밀번호 로그인
- Google OAuth 로그인
- 에러 메시지 표시
- 회원가입/비밀번호 찾기 링크

**확인 사항:**
- `authStore.signIn()` 함수 호출 확인
- `authStore.signInWithProvider('google')` 함수 호출 확인
- 로그인 성공 시 리디렉션 경로 확인

### 5.5 회원가입 페이지

파일: `src/routes/signup/+page.svelte`

**기능:**
- 이름, 이메일, 비밀번호 입력
- 비밀번호 확인
- 유효성 검사 (비밀번호 길이, 일치 여부)
- 에러/성공 메시지 표시
- 이메일 인증 안내

**확인 사항:**
- `authStore.signUp()` 함수 호출 확인
- `full_name` 메타데이터 전달 확인

### 5.6 비밀번호 재설정 페이지

파일: `src/routes/reset-password/+page.svelte`

**기능:**
- 이메일 입력
- 비밀번호 재설정 링크 이메일 발송
- 성공 메시지 표시

**확인 사항:**
- `authStore.resetPassword()` 함수 호출 확인
- 이메일 형식 유효성 검사 확인

### 5.7 비밀번호 변경 페이지

파일: `src/routes/update-password/+page.svelte`

**기능:**
- 새 비밀번호 입력
- 비밀번호 확인
- URL에서 recovery 토큰 확인
- 비밀번호 변경 처리

**확인 사항:**
- `onMount`에서 recovery 토큰 확인 로직 확인
- `authStore.updatePassword()` 함수 호출 확인

### 5.8 인증 콜백 페이지

파일: `src/routes/auth/callback/+page.svelte`

**기능:**
- OAuth 로그인 후 콜백 처리
- 세션 확인
- 로그인 성공 시 홈으로 리디렉션

**확인 사항:**
- `supabase.auth.getSession()` 호출 확인
- 리디렉션 경로 확인

### 5.9 프로젝트 상수 설정

파일: `src/prj/prjConst.js`

```javascript
const ___prjConst = {
    NAME: '프론트 웹',
    VERSION: '1.0.0',
    login: {
        description: '프론트 웹',
    }
};

export default ___prjConst;
```

### 5.10 테스트

1. **회원가입 테스트:**
   ```bash
   npm run dev
   ```
   - `http://localhost:5173/signup` 접속
   - 회원가입 폼 작성 및 제출
   - 이메일 인증 메일 확인

2. **로그인 테스트:**
   - `http://localhost:5173/login` 접속
   - 이메일/비밀번호로 로그인
   - Google 로그인 버튼 클릭하여 OAuth 테스트

3. **비밀번호 재설정 테스트:**
   - `http://localhost:5173/reset-password` 접속
   - 이메일 입력 및 제출
   - 이메일에서 재설정 링크 확인
   - 링크 클릭하여 비밀번호 변경

---

## 6. Vercel 배포 설정

### 6.1 GitHub 저장소 생성 및 푸시

1. GitHub에서 새 저장소 생성:
   - Repository name: `www.example.com`
   - Public 또는 Private 선택
   - README, .gitignore, license는 선택사항

2. 로컬 프로젝트를 GitHub에 푸시:

```bash
# Git 초기화 (이미 되어 있다면 생략)
git init

# .gitignore 확인 (node_modules, .env 등 제외)
# .env 파일은 절대 커밋하지 않기!

# 원격 저장소 추가
git remote add origin 저장서URL

# 파일 추가 및 커밋
git add .
git commit -m "Initial commit: Project Start"

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

### 6.2 Vercel 계정 생성 및 프로젝트 연결

1. [Vercel](https://vercel.com/) 접속
2. GitHub 계정으로 로그인
3. **"Add New Project"** 클릭
4. GitHub 저장소 선택:
   - `my-domain` 저장소 선택
   - **"Import"** 클릭

### 6.3 프로젝트 설정

1. **Framework Preset**: SvelteKit 자동 감지
2. **Root Directory**: `./` (기본값)
3. **Build Command**: `npm run build` (자동)
4. **Output Directory**: `.svelte-kit` (자동)
5. **Install Command**: `npm install` (자동)

### 6.4 환경 변수 설정

1. **Environment Variables** 섹션에서 다음 변수 추가:

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. 각 환경(Production, Preview, Development)에 모두 추가
3. **"Deploy"** 클릭

### 6.5 배포 완료 및 도메인 확인

1. 배포 완료까지 대기 (약 2-3분)
2. 배포 완료 후 제공되는 URL 확인:
   - 예: `https://example.vercel.app`
3. 브라우저에서 접속하여 테스트

### 6.6 커스텀 도메인 설정 (Vercel)

1. Vercel 대시보드에서 프로젝트 선택
2. **Settings** 탭 클릭
3. **Domains** 메뉴 클릭
4. **Add Domain** 클릭
5. 도메인 입력:
   - `www.example.com` 입력
   - **"Add"** 클릭
6. Vercel에서 도메인 설정 안내 확인:
   - **CNAME 레코드** 추가 필요 안내
   - **Value**: `cname.vercel-dns.com` (또는 Vercel이 제공하는 값)
   - 이 정보를 복사하여 저장 (다음 단계에서 사용)

### 6.7 Gabia DNS 설정 (CNAME 레코드)

1. [Gabia](https://www.gabia.com/) 접속 및 로그인
2. **도메인 관리** 메뉴 클릭
3. `mind-coding.com` 도메인 선택
4. **DNS 관리** 또는 **네임서버 설정** 메뉴 클릭
5. **레코드 추가** 또는 **수정** 클릭
6. CNAME 레코드 추가:
   - **호스트/서브도메인**: `mc`
   - **타입**: `CNAME`
   - **값/레코드**: `cname.vercel-dns.com` (Vercel에서 제공한 값)
   - **TTL**: `3600` (또는 기본값)
7. **저장** 또는 **적용** 클릭
8. DNS 변경사항 저장 확인

### 6.8 DNS 전파 확인

1. DNS 변경사항이 전파되는데 보통 **5분~24시간** 소요됩니다.
2. DNS 전파 확인 방법:

**방법 1: 온라인 도구 사용**
- [whatsmydns.net](https://www.whatsmydns.net/) 접속
- `www.example.com` 입력
- CNAME 레코드 확인
- 전 세계 여러 위치에서 `cname.vercel-dns.com`로 확인되면 완료

**방법 2: 터미널에서 확인**
```bash
# macOS/Linux
dig www.example.com CNAME

# Windows (PowerShell)
nslookup -type=CNAME www.example.com
```

**방법 3: Vercel 대시보드 확인**
- Vercel 대시보드의 **Domains** 탭에서 도메인 상태 확인
- **Valid Configuration** 또는 **Configured** 상태가 되면 완료

### 6.9 SSL 인증서 자동 발급 확인

1. DNS 설정이 완료되면 Vercel이 자동으로 SSL 인증서를 발급합니다
2. Vercel 대시보드의 **Domains** 탭에서 확인:
   - 도메인 옆에 **SSL 인증서 발급 중** 표시
   - 완료되면 **Valid** 또는 **Active** 상태로 변경
3. SSL 인증서 발급까지 약 **5-10분** 소요

### 6.10 커스텀 도메인 테스트

1. 브라우저에서 `https://www.example.com` 접속
2. SSL 인증서 확인 (자물쇠 아이콘)
3. 사이트 정상 작동 확인
4. 로그인/회원가입 기능 테스트

### 6.11 Google OAuth 리디렉션 URI 업데이트

1. Google Cloud Console 접속
2. **API 및 서비스** → **사용자 인증 정보** 클릭
3. 생성한 OAuth 2.0 클라이언트 ID 클릭
4. **승인된 리디렉션 URI**에 다음을 모두 추가:
   ```
   https://example.vercel.app/auth/callback
   https://www.example.com/auth/callback
   ```
5. **저장** 클릭

### 6.12 Supabase 리디렉션 URL 업데이트

1. Supabase 대시보드 접속
2. **Authentication** → **URL Configuration** 클릭
3. **Redirect URLs**에 추가:
   ```
   https://example.vercel.app/auth/callback
   https://www.example.com/auth/callback
   ```
4. **Save** 클릭

### 6.13 프로덕션 테스트

1. 배포된 URL에서 로그인/회원가입 테스트
2. Google OAuth 로그인 테스트
3. 비밀번호 재설정 테스트

---

## 체크리스트

### 구글 개발자 계정
- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth 동의 화면 구성
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] 클라이언트 ID 및 보안 비밀번호 저장

### Supabase
- [ ] Supabase 계정 생성
- [ ] 프로젝트 생성
- [ ] API 키 확인 및 저장
- [ ] 데이터베이스 테이블 생성 (profiles, user_profiles)
- [ ] Google OAuth Provider 활성화
- [ ] 클라이언트 ID 및 보안 비밀번호 입력

### 프론트엔드
- [ ] SvelteKit 프로젝트 생성
- [ ] Supabase 클라이언트 설치
- [ ] 환경 변수 설정 (.env)
- [ ] 인증 Store 생성
- [ ] 로그인 페이지 구현
- [ ] 회원가입 페이지 구현
- [ ] 비밀번호 재설정 페이지 구현
- [ ] 비밀번호 변경 페이지 구현
- [ ] 인증 콜백 페이지 구현
- [ ] 로컬 테스트 완료

### Vercel 배포
- [ ] GitHub 저장소 생성 및 푸시
- [ ] Vercel 프로젝트 연결
- [ ] 환경 변수 설정
- [ ] 배포 완료 확인
- [ ] 커스텀 도메인 추가 (www.example.com)
- [ ] Gabia DNS CNAME 레코드 설정
- [ ] DNS 전파 확인
- [ ] SSL 인증서 발급 확인
- [ ] 커스텀 도메인 테스트
- [ ] Google OAuth 리디렉션 URI 업데이트 (커스텀 도메인 포함)
- [ ] Supabase 리디렉션 URL 업데이트 (커스텀 도메인 포함)
- [ ] 프로덕션 테스트 완료

---

## 문제 해결

### Google OAuth 오류

**문제**: "redirect_uri_mismatch" 오류
- **해결**: Google Cloud Console의 승인된 리디렉션 URI에 Supabase 콜백 URL 추가

**문제**: "access_denied" 오류
- **해결**: OAuth 동의 화면에서 테스트 사용자 추가 또는 앱 게시

### Supabase 연결 오류

**문제**: "Invalid API key" 오류
- **해결**: `.env` 파일의 `PUBLIC_SUPABASE_ANON_KEY` 확인

**문제**: RLS 정책 오류
- **해결**: Supabase 대시보드에서 RLS 정책 확인 및 수정

### Vercel 배포 오류

**문제**: 빌드 실패
- **해결**: 로컬에서 `npm run build` 실행하여 오류 확인

**문제**: 환경 변수 미적용
- **해결**: Vercel 대시보드에서 환경 변수 재설정 및 재배포

### 도메인 설정 오류

**문제**: DNS 전파가 안 됨
- **해결**: 
  - Gabia에서 CNAME 레코드가 올바르게 설정되었는지 확인
  - TTL 값 확인 (너무 높으면 변경사항 반영이 느림)
  - 24시간 후에도 안 되면 Gabia 고객지원 문의

**문제**: SSL 인증서 발급 실패
- **해결**:
  - DNS 전파가 완료되었는지 확인
  - Vercel 대시보드에서 도메인 설정 재확인
  - Vercel에서 도메인을 삭제 후 다시 추가

**문제**: 도메인 접속 시 "Not Found" 오류
- **해결**:
  - Vercel 대시보드에서 도메인이 프로젝트에 연결되었는지 확인
  - DNS CNAME 레코드 값이 정확한지 확인
  - 브라우저 캐시 삭제 후 재시도

---

## 참고 자료

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase 문서](https://supabase.com/docs)
- [SvelteKit 문서](https://kit.svelte.dev/)
- [Vercel 문서](https://vercel.com/docs)
- [Vercel 도메인 설정 가이드](https://vercel.com/docs/concepts/projects/domains)
- [Gabia 도메인 관리](https://www.gabia.com/)

---

**마지막 업데이트**: 2024-12-18
