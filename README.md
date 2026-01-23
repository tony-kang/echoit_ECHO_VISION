# vision.echoit.co.kr

Telepasi 웹사이트 프로젝트 - SvelteKit 기반

## 시작하기

### 1. 의존성 설치

```sh
npm install
# 또는
yarn install
```

### 2. 환경 변수 설정

프로젝트는 Supabase를 사용하므로 환경 변수 설정이 필요합니다.

#### .env 파일 생성

```sh
# .env.example 파일을 복사하여 .env 파일 생성
cp .env.example .env
```

#### Supabase 프로젝트 정보 입력

`.env` 파일을 열고 실제 Supabase 프로젝트 정보로 교체하세요:

```env
# 필수: 클라이언트 사이드에서 사용
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 선택: 서버 사이드 작업이 필요한 경우에만 설정
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Supabase 프로젝트 정보 확인 방법:**
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택 → **Settings** → **API**
3. Project URL, anon public key 확인
4. 서비스 롤 키는 필요시에만 확인 (서버 사이드 작업용)

**참고:**
- `PUBLIC_SUPABASE_URL`과 `PUBLIC_SUPABASE_ANON_KEY`는 필수입니다
- `SUPABASE_SERVICE_ROLE_KEY`는 선택사항입니다 (서버 사이드에서 RLS 우회가 필요한 경우에만)
- 서비스 롤 키는 절대 클라이언트에 노출되면 안 됩니다

자세한 내용은 [환경 변수 설정 가이드](./docs/env_setup.md)를 참고하세요.

### 3. 개발 서버 실행

```sh
npm run dev

# 또는 브라우저에서 자동으로 열기
npm run dev -- --open
```

## 빌드

프로덕션 빌드를 생성하려면:

```sh
npm run build
```

프로덕션 빌드를 미리보려면:

```sh
npm run preview
```

## 배포

이 프로젝트는 Vercel에 배포됩니다. 환경 변수는 Vercel Dashboard에서 설정해야 합니다.

자세한 내용은 [환경 변수 설정 가이드](./docs/env_setup.md)를 참고하세요.

## 문서

- [환경 변수 설정 가이드](./docs/env_setup.md)
- [게시판 시스템 설정 가이드](./docs/supabase/board_setup.md)
- [프로젝트 관리 가이드](./docs/prj_management.md)
