# 환경 변수 설정 가이드

## 개요

이 프로젝트는 Supabase를 사용하므로 환경 변수 설정이 필요합니다.

## 로컬 개발 환경 설정

### 1. .env 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성하세요:

```bash
# .env.example 파일을 복사하여 .env 파일 생성
cp .env.example .env
```

또는 직접 생성:

```bash
touch .env
```

### 2. Supabase 프로젝트 정보 확인

1. [Supabase Dashboard](https://app.supabase.com)에 접속
2. 프로젝트 선택
3. **Settings** → **API** 메뉴로 이동
4. 다음 정보를 확인:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. .env 파일에 값 입력

`.env` 파일을 열고 실제 값으로 교체하세요:

#### 방법 1: 환경 선택 방식 (권장)

```env
# 환경 선택: production 또는 dev
ENV_MODE=dev

# ============================================
# Development 환경 설정
# ============================================
PUBLIC_SUPABASE_URL_DEV=https://your-dev-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY_DEV=your-dev-anon-key-here
# SUPABASE_SERVICE_ROLE_KEY_DEV=your-dev-service-role-key-here

# ============================================
# Production 환경 설정
# ============================================
PUBLIC_SUPABASE_URL_PROD=https://your-prod-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY_PROD=your-prod-anon-key-here
# SUPABASE_SERVICE_ROLE_KEY_PROD=your-prod-service-role-key-here
```

**환경 선택 방법:**
- `ENV_MODE=dev`로 설정하면 Development 환경 변수 사용
- `ENV_MODE=production`으로 설정하면 Production 환경 변수 사용
- 환경을 변경한 후 개발 서버를 재시작해야 합니다

#### 방법 2: 기존 방식 (하위 호환성)

```env
# 필수: 클라이언트 사이드에서 사용
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# 선택: 서버 사이드 작업이 필요한 경우에만 설정
# 서버 사이드에서 RLS를 우회하여 관리자 작업 등에 사용됩니다
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**중요**: 
- `your-project-id`를 실제 프로젝트 ID로 교체
- `your-actual-anon-key-here`를 실제 anon key로 교체
- `SUPABASE_SERVICE_ROLE_KEY`는 선택사항입니다 (서버 사이드 작업이 필요한 경우에만)
- 따옴표(`"` 또는 `'`)는 사용하지 마세요

### 4. 개발 서버 재시작

환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 중지 (Ctrl+C)
# 개발 서버 재시작
npm run dev
```

## 환경 변수 설명

### PUBLIC_SUPABASE_URL
- **타입**: 문자열
- **설명**: Supabase 프로젝트의 URL
- **예시**: `https://abcdefghijklmnop.supabase.co`
- **필수**: 예

### PUBLIC_SUPABASE_ANON_KEY
- **타입**: 문자열
- **설명**: Supabase의 공개(anon) 키. 클라이언트 사이드에서 사용됩니다.
- **예시**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **필수**: 예
- **주의**: 이 키는 공개되어도 안전하지만, RLS(Row Level Security) 정책을 통해 보안을 유지합니다.

### SUPABASE_SERVICE_ROLE_KEY (선택사항)
- **타입**: 문자열
- **설명**: Supabase의 서비스 롤 키. 서버 사이드에서만 사용되며, RLS를 우회할 수 있습니다.
- **예시**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **필수**: 아니오 (서버 사이드 작업이 필요한 경우에만)
- **주의**: 
  - **절대 클라이언트 사이드에서 사용하지 마세요!**
  - RLS를 우회할 수 있는 강력한 권한을 가집니다
  - 서버 사이드 코드(`+server.js`, `+page.server.js` 등)에서만 사용
  - 실수로 공개되면 즉시 키를 재생성하세요
- **사용 예시**: 관리자 작업, 백그라운드 작업, RLS 우회가 필요한 특수한 경우

## 프로덕션 환경 설정 (Vercel)

### Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 클릭
5. 다음 변수들을 추가:

| 변수 이름 | 값 | 환경 | 필수 |
|---------|-----|------|------|
| `PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development | 예 |
| `PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key-here` | Production, Preview, Development | 예 |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key-here` | Production, Preview, Development | 아니오* |

\* 서버 사이드 작업이 필요한 경우에만 설정

6. 각 환경(Production, Preview, Development)에 모두 추가
7. **Save** 클릭

### 환경별 설정

- **Production**: 프로덕션 환경용
- **Preview**: PR 생성 시 미리보기 환경용
- **Development**: 개발 환경용

모든 환경에 동일한 값을 설정하거나, 환경별로 다른 Supabase 프로젝트를 사용할 수 있습니다.

## 환경 변수 확인

### 로컬에서 확인

개발 서버 실행 후 브라우저 콘솔에서 확인:

```javascript
// 브라우저 개발자 도구 콘솔에서
console.log(import.meta.env.PUBLIC_SUPABASE_URL);
```

### 코드에서 사용

#### 클라이언트 사이드 (공개 변수)

환경 변수는 `$env/static/public`에서 가져옵니다:

```javascript
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
```

#### 서버 사이드 (비공개 변수)

서비스 롤 키는 `$env/static/private`에서 가져옵니다:

```javascript
// 서버 사이드 파일에서만 사용 (+server.js, +page.server.js 등)
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { getServerClient } from '$lib/supabaseServerClient';

// 서버 사이드 클라이언트 사용
const supabase = getServerClient();
```

**주의**: 서비스 롤 키는 서버 사이드에서만 사용할 수 있습니다.

## 문제 해결

### 환경 변수가 적용되지 않는 경우

1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 변수 이름이 정확한지 확인 (`PUBLIC_` 접두사 포함)
3. 개발 서버를 재시작했는지 확인
4. `.env` 파일에 공백이나 따옴표가 없는지 확인

### Supabase 연결 오류

1. `PUBLIC_SUPABASE_URL`이 올바른지 확인
2. `PUBLIC_SUPABASE_ANON_KEY`가 올바른지 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인
4. 네트워크 연결 상태 확인

## 보안 주의사항

1. **절대 `.env` 파일을 Git에 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있습니다
   - 실수로 커밋한 경우 즉시 키를 재생성하세요

2. **anon key는 공개되어도 안전합니다**
   - RLS 정책으로 보안이 유지됩니다
   - 하지만 서비스 롤 키(service_role key)는 절대 공개하지 마세요
   - 서비스 롤 키는 서버 사이드에서만 사용하고, 클라이언트에 노출되면 안 됩니다

3. **서비스 롤 키 사용 시 주의사항**
   - RLS를 우회할 수 있으므로 신중하게 사용하세요
   - 관리자 작업이나 백그라운드 작업에만 사용하세요
   - 일반 사용자 작업에는 anon key를 사용하세요

3. **프로덕션 환경에서는 환경 변수를 별도로 설정**
   - Vercel 등의 플랫폼에서 환경 변수를 설정하세요
   - `.env` 파일을 서버에 직접 배포하지 마세요

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [SvelteKit 환경 변수 문서](https://kit.svelte.dev/docs/modules#$env-static-public)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)

