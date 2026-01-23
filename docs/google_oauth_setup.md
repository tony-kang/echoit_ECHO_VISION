# Google OAuth 설정 가이드

localhost와 production(vision.echoit.co.kr) 모두에서 Google OAuth가 작동하도록 설정하는 방법입니다.

## 1. Supabase Dashboard 설정

### Redirect URLs 설정

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - `vision.echoit.co.kr` 프로젝트 선택

2. **Authentication → URL Configuration 이동**
   - 좌측 메뉴에서 `Authentication` 클릭
   - `URL Configuration` 탭 선택

3. **Site URL 설정**
   - **Site URL**: `https://vision.echoit.co.kr` (프로덕션 URL만 설정)
   - ⚠️ **중요**: 개발 URL이 아닌 프로덕션 URL만 설정합니다.
   - 이 값은 리디렉트 URL이 지정되지 않았거나 허용 목록에 없을 때 사용되는 기본 URL입니다.

4. **Redirect URLs 추가**
   - **Additional Redirect URLs** 섹션에 다음 URL들을 모두 추가합니다:

   ```
   http://localhost:5173/auth/callback
   http://localhost:5174/auth/callback
   https://vision.echoit.co.kr/auth/callback
   ```

   **참고**: 
   - 포트 번호는 개발 서버 설정에 따라 다를 수 있습니다. 사용 중인 포트를 확인하여 추가하세요.
   - 개발용 localhost URL과 프로덕션 URL을 모두 추가해야 localhost와 production 모두에서 작동합니다.

## 2. Google Cloud Console 설정

### OAuth 동의 화면 설정 (로그인 화면에 표시될 정보)

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com 접속
   - 프로젝트 선택 (또는 새 프로젝트 생성)

2. **API 및 서비스 → OAuth 동의 화면 이동**
   - 좌측 메뉴에서 `API 및 서비스` → `OAuth 동의 화면` 클릭

3. **앱 정보 설정**
   - **앱 이름**: `에코비전` (정확히 입력, 오타나 불필요한 공백 없이)
     - ⚠️ **중요**: 이 이름은 홈페이지에 표시되는 앱 이름과 정확히 일치해야 합니다.
     - Google OAuth 인증 심사 시 홈페이지의 앱 이름과 대조하므로 일치하지 않으면 심사가 거부될 수 있습니다.
   - **사용자 지원 이메일**: 본인의 이메일 주소 선택
   - **앱 로고**: (선택사항) 로고 이미지 업로드
   - **앱 도메인**: `vision.echoit.co.kr` (프로덕션 도메인만)
   - ⚠️ **중요**: 승인된 도메인에는 **localhost를 입력할 수 없습니다**. 이 필드는 공개적으로 접근 가능한 도메인만 허용합니다.
   - **개발자 연락처 정보**: 본인의 이메일 주소 입력

4. **범위 설정** (기본값 유지)
   - 기본적으로 필요한 범위가 자동으로 설정됩니다.

5. **테스트 사용자 추가** (선택사항, 개발 중)
   - 개발 중인 경우 테스트 사용자 이메일 추가 가능

6. **저장 후 계속**

⚠️ **참고**: 
- **승인된 도메인** 필드는 프로덕션 도메인(`telepasi.com`, `vision.echoit.co.kr`)만 추가합니다.
- localhost는 승인된 도메인에 추가할 수 없지만, 아래의 "승인된 JavaScript 원본"과 "승인된 리디렉션 URI"에 localhost를 추가하면 개발 환경에서도 정상 작동합니다.

### OAuth 2.0 클라이언트 ID 설정

1. **API 및 서비스 → 사용자 인증 정보 이동**
   - 좌측 메뉴에서 `API 및 서비스` → `사용자 인증 정보` 클릭

3. **OAuth 2.0 클라이언트 ID 확인/생성**
   - 기존 클라이언트 ID가 있으면 편집, 없으면 생성
   - **애플리케이션 유형**: `웹 애플리케이션`

4. **승인된 리디렉션 URI 추가**
   다음 URI들을 모두 추가합니다:

   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   ```

   **참고**: 
   - `[YOUR_SUPABASE_PROJECT_ID]`는 Supabase 프로젝트의 실제 ID로 교체해야 합니다.
   - Supabase Dashboard → Settings → API에서 프로젝트 URL을 확인할 수 있습니다.
   - 예: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

5. **승인된 JavaScript 원본 추가**
   다음 원본들을 모두 추가합니다:
   ```
   http://localhost:5173
   http://localhost:5174
   https://vision.echoit.co.kr
   ```
   
   ⚠️ **중요**: 
   - localhost는 **승인된 JavaScript 원본**에 추가할 수 있습니다.
   - 개발 환경에서 OAuth가 작동하려면 localhost URL을 여기에 추가해야 합니다.
   - 포트 번호는 개발 서버 설정에 따라 다를 수 있습니다.

## 3. Supabase에서 Google OAuth Provider 설정

1. **Supabase Dashboard → Authentication → Providers 이동**

2. **Google Provider 활성화**
   - Google 토글을 `Enabled`로 설정

3. **Client ID 및 Client Secret 입력**
   - Google Cloud Console에서 생성한 OAuth 2.0 클라이언트의:
     - **Client ID**: 복사하여 입력 (필수)
     - **Client Secret (for OAuth)**: 복사하여 입력 (필수)
   
   ⚠️ **중요**: 
   - **웹 애플리케이션의 경우 Client Secret이 필수입니다.**
   - Google Cloud Console에서 OAuth 2.0 클라이언트 ID를 생성할 때 "웹 애플리케이션" 유형으로 생성했다면 Client Secret이 함께 제공됩니다.
   - Client Secret 없이는 Google OAuth가 정상적으로 작동하지 않을 수 있습니다.
   - Client Secret은 보안상 중요한 정보이므로 절대 공개 저장소에 커밋하지 마세요.

4. **저장**

## 4. 코드 확인

현재 코드는 이미 동적으로 설정되어 있습니다:

```javascript
// src/lib/stores/authStore.js
async signInWithProvider(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  // ...
}
```

`window.location.origin`을 사용하므로:
- localhost: `http://localhost:5173/auth/callback`
- production: `https://vision.echoit.co.kr/auth/callback`

자동으로 올바른 URL이 설정됩니다.

## 5. 테스트

### Localhost 테스트
1. 개발 서버 실행: `npm run dev`
2. 로그인 페이지에서 "Google로 로그인" 클릭
3. Google 로그인 완료 후 `/auth/callback`으로 리디렉트되는지 확인

### Production 테스트
1. 프로덕션 배포 확인
2. https://vision.echoit.co.kr/login 접속
3. "Google로 로그인" 클릭
4. Google 로그인 완료 후 정상적으로 리디렉트되는지 확인

## 문제 해결

### Google 로그인 화면에 "ozvkandsyfmvjxwcxwkn.supabase.co(으)로 이동" 표시되는 문제

**원인**: OAuth 동의 화면에서 앱 이름이 설정되지 않았거나, Supabase 프로젝트 이름이 표시되고 있습니다.

**해결 방법**:
1. Google Cloud Console → API 및 서비스 → OAuth 동의 화면 이동
2. "앱 이름" 필드에 원하는 이름 입력 (예: `Telepasi`)
3. 저장 후 Google 로그인을 다시 시도하면 설정한 앱 이름이 표시됩니다.

**참고**: 
- OAuth 동의 화면 설정은 Google OAuth 로그인 시 사용자에게 표시되는 정보를 제어합니다.
- 앱 이름, 로고, 지원 이메일 등을 설정할 수 있습니다.
- 프로덕션 배포 전에 OAuth 동의 화면 설정을 완료하는 것이 좋습니다.

### 승인된 도메인에 localhost를 추가할 수 있나요?

**답변**: **아니요, 승인된 도메인에는 localhost를 추가할 수 없습니다.**

- **승인된 도메인** 필드는 공개적으로 접근 가능한 도메인만 허용합니다.
- localhost는 로컬 개발 환경이므로 승인된 도메인에 추가할 수 없습니다.

**대신 다음을 설정하세요**:
- **승인된 JavaScript 원본**: `http://localhost:5173`, `http://localhost:5174` 등 추가 가능
- **승인된 리디렉션 URI**: Supabase 콜백 URL만 추가 (localhost는 자동으로 처리됨)

이렇게 설정하면 localhost에서도 Google OAuth가 정상적으로 작동합니다.

### "redirect_uri_mismatch" 에러
- Google Cloud Console의 승인된 리디렉션 URI에 Supabase 콜백 URL이 정확히 추가되었는지 확인
- Supabase 프로젝트 ID가 정확한지 확인

### "access_denied" 에러
- Supabase Dashboard의 Redirect URLs에 모든 URL이 추가되었는지 확인
- Google Cloud Console의 승인된 리디렉션 URI 확인

### 로그인 후 콜백 페이지에서 에러 발생
- `/auth/callback` 페이지가 정상적으로 작동하는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### OAuth 인증 심사: "앱 이름 불일치" 오류

구글 Cloud Console의 OAuth 인증 심사에서 발생하는 "앱 이름 불일치" 오류는 구글에 등록된 이름과 실제 사용자가 접속하는 웹사이트(홈페이지)상에 표시된 이름이 시각적으로 다를 때 발생합니다.

#### 1. Google Cloud Console에서 앱 이름 확인 및 수정

**수정 위치**: Google Cloud Console → API 및 서비스 → OAuth 동의 화면

**확인 사항**:
- '앱 이름' 필드에 **"에코비전"**이 정확히 입력되어 있는지 확인합니다.
- 오타나 불필요한 공백이 없는지 다시 한번 체크하세요.
- 예: "에코비전 " (뒤에 공백) 또는 "텔레파시커뮤니케이션" (공백 없음)은 일치하지 않습니다.

#### 2. 홈페이지의 앱 이름 수정 (중요)

구글 심사팀은 제공하신 홈페이지 URL에 접속하여 화면에 보이는 서비스 명칭을 대조합니다.

**수정 위치**:
- 홈페이지의 메인 로고 옆
- 브라우저 타이틀(`<title>` 태그)
- 페이지 하단(Footer)의 저작권 표시 부분
- Open Graph 메타 태그 (`og:site_name`)

**확인 방법**:
- `src/routes/+layout.svelte` 파일에서 다음이 설정되어 있는지 확인:
  ```svelte
  <svelte:head>
    <title>{___prjConst.oAuth.appName}</title>
    <meta name="application-name" content={___prjConst.oAuth.appName} />
    <meta property="og:site_name" content={___prjConst.oAuth.appName} />
  </svelte:head>
  ```
- `src/prj/prjConst.js` 파일에서 `oAuth.appName` 값이 **"에코비전"**으로 설정되어 있는지 확인

**주의사항**:
- 홈페이지 하단에 "Telepasi"라고만 적혀 있다면 구글은 이를 다른 앱으로 간주합니다.
- 이를 **"에코비전"**으로 변경해야 합니다.
- Footer 컴포넌트(`src/lib/components/Footer.svelte`)에서도 앱 이름이 일치하는지 확인하세요.

#### 3. 개인정보 처리방침 및 서비스 약관 확인

구글에 제출한 개인정보 처리방침(Privacy Policy) 문서 내에서도 앱 이름이 일치해야 합니다.

**확인 위치**:
- `static/terms/privacy.html` - 개인정보 처리방침
- `static/terms/terms.html` - 서비스 약관

**확인 사항**:
- 문서 내에서 해당 서비스를 지칭할 때 **"에코비전"**이라는 명칭을 일관되게 사용하고 있는지 확인하세요.
- 다른 이름(예: 회사명만 기재됨)이 적혀 있다면 수정이 필요합니다.

#### 4. 도메인 소유권 확인

사용 중인 홈페이지 도메인이 구글 콘솔의 '승인된 도메인' 리스트에 포함되어 있는지 확인하세요.

**확인 위치**: Google Cloud Console → OAuth 동의 화면 → 승인된 도메인

**확인 사항**:
- `telepasi.com` 또는 `vision.echoit.co.kr`이 승인된 도메인에 포함되어 있는지 확인
- Search Console을 통해 도메인 소유권 인증이 완료된 상태여야 브랜드 수정 사항이 원활하게 반영됩니다.

#### 해결 요약 가이드

1. **OAuth 브랜드 구성 페이지**에서 앱 이름을 **"에코비전"**으로 저장합니다.
2. **실제 웹사이트 메인 화면과 하단 정보**에 텍스트로 **"에코비전"**이 명시되도록 수정합니다.
   - `src/routes/+layout.svelte`의 `<title>` 및 메타 태그 확인
   - `src/lib/components/Footer.svelte`의 앱 이름 확인 (이미 `___prjConst.oAuth.appName` 사용 중)
   - `src/prj/prjConst.js`의 `oAuth.appName` 값 확인
3. **개인정보 처리방침 및 서비스 약관** 문서에서도 앱 이름이 일치하는지 확인합니다.
4. **수정 후 구글 콘솔에서 [저장 후 계속]**을 눌러 다시 심사를 요청합니다.

## 참고 사항

- **개발 포트 변경 시**: Supabase와 Google Cloud Console 모두에 새 포트 URL 추가 필요
- **새 도메인 추가 시**: 위의 설정 단계를 반복하여 새 도메인 추가
- **보안**: Client Secret은 절대 공개 저장소에 커밋하지 마세요
