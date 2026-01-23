# Telepasi 프로젝트
**완벽한 개발 환경 구축 가이드 (Ver 1.0)**

---

## 1. 아키텍처 개요

Telepasi 프로젝트는 보안과 안정성을 위해 **Local**, **Development**, **Production**의 3단계로 철저히 격리된 환경을 운영합니다. 각 환경은 독립적인 데이터베이스와 인증 시스템을 가지며, 상호 간섭이 발생하지 않도록 설계되었습니다.

### 시스템 아키텍처

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│    🟡 Local Environment │   🔵 Dev Environment    │   🟢 Prod Environment  │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Computer: MacBook/PC    │ Server: Custom VPS      │ Server: Vercel Cloud    │
│ URL: localhost:5173     │ URL: dev.telepasi.com   │ URL: vision.echoit.co.kr   │
│ DB: Supabase (Dev)      │ DB: Supabase (Dev)      │ DB: Supabase (Prod)     │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
                    각 환경은 별도의 Google OAuth Client와 연결됩니다.
```

### 환경별 도메인 전략

- **Production (상용):** `vision.echoit.co.kr` - 실제 사용자가 접속하는 안정적인 버전. main 브랜치와 동기화됩니다.
- **Development (개발):** `dev.telepasi.com` - 개발팀 내부 테스트 및 QA용. dev 브랜치와 동기화되며, 최신 기능이 먼저 배포됩니다.
- **Local (로컬):** `http://localhost:5173` - 개별 개발자의 작업 환경.

---

## 2. 인프라 구성

### Vercel 및 배포 설정

| 환경 | Git 브랜치 | 배포 URL | 목적 |
|------|-----------|----------|------|
| 🟢 **Production** | `main` | vision.echoit.co.kr | 최종 사용자 서비스 제공 |
| 🔵 **Development** | `dev` | dev.telepasi.com | 기능 통합 테스트 및 내부 검증 |

### Supabase 프로젝트 분리

데이터 오염 방지를 위해 물리적으로 분리된 두 개의 프로젝트를 사용합니다.

- **개발용 (Dev):** `ozvkandsyfmvjxwcxwkn.supabase.co`  
  - 테스트 데이터 생성 및 스키마 변경 실험용.
- **프로덕션용 (Prod):** `czgtexdgawrnrelvjqur.supabase.co`  
  - 실제 사용자 데이터 보관. 엄격한 권한 관리 적용.

### Google OAuth 클라이언트 설정

> ⚠️ **중요:** 보안을 위해 반드시 환경별로 다른 Client ID를 사용해야 합니다.

#### 1. 개발용 클라이언트 (For Dev & Local)

**승인된 JavaScript 원본:**
- `http://localhost:5173`
- `http://localhost:5174`
- `https://dev.telepasi.com`

**승인된 리디렉션 URI:**
- `https://ozvkandsyfmvjxwcxwkn.supabase.co/auth/v1/callback`

#### 2. 프로덕션용 클라이언트 (For Prod)

**승인된 JavaScript 원본:**
- `https://vision.echoit.co.kr`
- `https://telepasi.com`

**승인된 리디렉션 URI:**
- `https://czgtexdgawrnrelvjqur.supabase.co/auth/v1/callback`

---

## 3. 소스코드 환경 설정 (SvelteKit 5)

### 환경 변수 파일 구조

프로젝트 루트에 다음과 같은 구조로 환경 변수를 관리합니다. `.env.local`은 gitignore에 포함되어야 합니다.

```
project-root/
├── .env.example       # 팀 공유용 템플릿 (값 비워둠)
├── .env.local         # 로컬 개발용 (gitignore)
├── .env.development   # 개발 서버 참고용
└── .env.production    # 프로덕션 참고용
```

### 환경 변수 정의 (.env.local 예시)

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://ozvkandsyfmvjxwcxwkn.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
PUBLIC_GOOGLE_CLIENT_ID=123456789-dev.apps.googleusercontent.com

# Site Configuration
PUBLIC_SITE_URL=http://localhost:5173
```

### 코드 구현 (TypeScript)

#### 1. 환경 변수 타입 안전성 확보 (src/lib/config/env.ts)

```typescript
import { dev } from '$app/environment';

export const config = {
    supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    googleClientId: import.meta.env.PUBLIC_GOOGLE_CLIENT_ID,
    siteUrl: import.meta.env.PUBLIC_SITE_URL,
    isDev: dev
};

// 필수 변수 검증
if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing');
}
```

#### 2. Supabase 클라이언트 생성 (src/lib/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';
import { config } from './config/env';

// 클라이언트 사이드용 싱글톤 인스턴스
export const supabase = createClient(
    config.supabaseUrl, 
    config.supabaseAnonKey
);
```

---

## 4. Vercel 환경 변수 설정

Vercel 대시보드에서 `Settings` > `Environment Variables` 메뉴를 통해 설정합니다.

### Production Environment (vision.echoit.co.kr)

| KEY | VALUE |
|-----|-------|
| `PUBLIC_SUPABASE_URL` | https://czgtexdgawrnrelvjqur.supabase.co |
| `PUBLIC_SUPABASE_ANON_KEY` | (프로덕션용 Anon Key) |
| `PUBLIC_SITE_URL` | https://vision.echoit.co.kr |

### Preview Environment (dev branch PRs)

Preview 배포 시 개발용 Supabase를 바라보도록 설정합니다.

| KEY | VALUE |
|-----|-------|
| `PUBLIC_SUPABASE_URL` | https://ozvkandsyfmvjxwcxwkn.supabase.co |
| `PUBLIC_SUPABASE_ANON_KEY` | (개발용 Anon Key) |
| `PUBLIC_SITE_URL` | System Assigned URL (자동) |

---

## 5. 별도 개발 서버 구축 (자체 호스팅)

`dev.telepasi.com`을 Vercel이 아닌 별도의 VPS(AWS EC2, DigitalOcean 등)에서 운영할 경우의 설정입니다.

### 1. 서버 기본 설정

- **OS:** Ubuntu 22.04 LTS 권장
- **Runtime:** Node.js 20.x (LTS)
- **Process Manager:** PM2

### 2. Nginx 리버스 프록시 설정

```nginx
server {
    server_name dev.telepasi.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. PM2 실행 명령

```bash
# 의존성 설치 및 빌드
npm install
npm run build

# SvelteKit Node 어댑터 실행 (build/index.js 기준)
PORT=3000 pm2 start build/index.js --name "telepasi-dev"
```

---

## 6. 폴더 구조 및 코드 조직

SvelteKit 프로젝트의 유지보수성을 극대화하기 위한 권장 폴더 구조입니다.

```
src/
├── lib/
│   ├── config/          # 환경 변수 및 상수 관리
│   │   ├── env.ts
│   │   └── constants.ts
│   ├── components/      # 재사용 가능한 UI 컴포넌트
│   │   ├── common/
│   │   └── layout/
│   ├── services/        # 비즈니스 로직 및 API 호출
│   │   ├── auth.ts
│   │   └── user.ts
│   └── stores/          # Svelte Stores (상태 관리)
├── routes/
│   ├── (auth)/          # 로그인/회원가입 (레이아웃 그룹)
│   │   ├── login/
│   │   └── callback/
│   ├── (app)/           # 메인 애플리케이션
│   │   └── dashboard/
│   └── api/             # 백엔드 API 엔드포인트
└── hooks.server.ts      # 서버 사이드 훅 (인증 체크 등)
```

---

## 7. 배포 워크플로우

안정적인 서비스를 위해 Git Flow를 변형한 전략을 사용합니다.

### 배포 흐름

**1. Feature 개발 (Local)**
- `dev` 브랜치에서 `feature/login-page` 브랜치 생성
- 로컬 환경(localhost)에서 개발 및 테스트

**2. 개발 서버 배포 (Dev)**
- `dev` 브랜치로 Pull Request 및 Merge
- GitHub Actions 또는 Vercel이 `dev.telepasi.com`에 자동 배포
- 팀 내부 QA 진행

**3. 프로덕션 배포 (Prod)**
- 검증 완료된 `dev` 브랜치를 `main` 브랜치로 Merge
- `vision.echoit.co.kr`에 자동 배포 (Production Build)

---

## 8. 개발 환경 검증 체크리스트

환경 설정 후 다음 항목들을 반드시 확인해야 합니다.

- [ ] dev.telepasi.com 접속 시 브라우저 주소창에 "주의 요함"이 뜨지 않는지 (SSL 적용 확인)
- [ ] 개발 환경 로그인 시 구글 동의 화면에 "Telepasi (Dev)"가 표시되는지
- [ ] 로그인 후 리디렉션이 dev.telepasi.com으로 정상 복귀되는지
- [ ] 개발 환경에서 회원가입 시 Prod Supabase가 아닌 Dev Supabase에 유저가 생성되는지
- [ ] .env.local 파일이 Git 저장소에 업로드되지 않았는지 (.gitignore 확인)

---

## 9. 보안 Best Practices

- **RLS (Row Level Security):** Supabase의 모든 테이블에 RLS 정책을 활성화하여 데이터 접근을 제어합니다.
- **환경 변수 분리:** Service Role Key(admin 권한)는 절대 클라이언트 측 환경변수(PUBLIC_)로 노출하지 않습니다.
- **API 키 로테이션:** 정기적으로, 혹은 팀원 퇴사 시 Supabase 및 Google Cloud의 키를 재발급합니다.
- **HTTPS 강제:** 모든 통신은 SSL/TLS를 통해 암호화되어야 합니다.

---

## 10. 트러블슈팅

### Q: 로그인 후 계속 프로덕션 도메인(www)으로 이동합니다.

**A:** 다음을 확인하세요.

1. Supabase 대시보드(개발용)의 `URL Configuration` > `Site URL`이 `https://dev.telepasi.com`인지 확인하십시오.
2. 로컬 `.env` 파일의 `PUBLIC_SUPABASE_URL`이 개발용 URL인지 확인하십시오.
3. Google Cloud Console의 개발용 프로젝트 설정에서 승인된 리디렉션 URI가 개발용 Supabase를 가리키는지 확인하십시오.

### Q: 로컬에서 500 에러가 발생합니다.

**A:** `.env.local` 파일이 프로젝트 루트에 존재하는지, 그리고 필수 키값들이 모두 채워져 있는지 확인하십시오. 서버 재시작이 필요할 수 있습니다.

---

*© 2024 Telepasi Project Team. All rights reserved.*