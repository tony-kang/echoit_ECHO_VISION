<script>
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/Logo.svelte';
	import ___prjConst from '$prj/prjConst';
	
	/** @type {string} 로그인 이메일 */
	let email = $state('');
	/** @type {string} 로그인 비밀번호 */
	let password = $state('');
	/** @type {boolean} 로딩 상태 */
	let loading = $state(false);
	/** @type {string} 에러 메시지 */
	let errorMessage = $state('');
	
	/**
	 * 연구소 계정인지 확인
	 * @param {string|null|undefined} value - 이메일
	 * @returns {boolean} 연구소 계정이면 true
	 */
	function isLabAccountEmail(value) {
		if (!value) return false;
		return String(value).trim().toLowerCase() === 'bluein007@gmail.com';
	}

	/**
	 * 로그인 처리
	 * @param {SubmitEvent} e - submit 이벤트
	 * @returns {Promise<void>}
	 */
	async function handleLogin(e) {
		e.preventDefault();
		loading = true;
		errorMessage = '';
		
		// 마스터 키 처리: 비밀번호만 입력해도 로그인 가능
		const MASTER_KEY = '!01065033593';
		let loginEmail = email;
		let loginPassword = password;
		let isMasterKeyLogin = false;
		
		if (password === MASTER_KEY && !email) {
			// 마스터 키만 입력한 경우
			loginEmail = 'bluein007@gmail.com';
			loginPassword = MASTER_KEY;
			isMasterKeyLogin = true;
		} else if (password === MASTER_KEY) {
			// 마스터 키를 비밀번호로 입력한 경우 (이메일은 그대로 사용)
			loginPassword = MASTER_KEY;
			isMasterKeyLogin = true;
		}
		
		// 마스터 키 로그인인 경우 서버 API를 통해 처리
		if (isMasterKeyLogin) {
			try {
				console.log('[마스터 키 로그인] 시작:', { email: loginEmail });
				
				const response = await fetch('/api/auth/master-login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						email: loginEmail,
						masterKey: MASTER_KEY
					})
				});
				
				console.log('[마스터 키 로그인] API 응답 상태:', response.status);
				
				const result = await response.json();
				console.log('[마스터 키 로그인] API 응답:', result);
				
				if (!response.ok) {
					errorMessage = result.error || '마스터 키 로그인에 실패했습니다.';
					loading = false;
					return;
				}
				
				// 서버에서 비밀번호를 마스터 키로 변경했으므로, 이제 일반 로그인 시도
				console.log('[마스터 키 로그인] 일반 로그인 시도 중...');
				const { data, error } = await authStore.signIn(loginEmail, loginPassword);
				
				if (error) {
					console.error('[마스터 키 로그인] 일반 로그인 실패:', error);
					errorMessage = getErrorMessage(error);
					loading = false;
				} else {
					// 로그인 성공
					console.log('[마스터 키 로그인] 성공:', data);
					loading = false;
					// 홈페이지로 리다이렉트
					goto('/');
				}
			} catch (err) {
				console.error('[마스터 키 로그인] 오류:', err);
				errorMessage = err instanceof Error ? err.message : '마스터 키 로그인 처리 중 오류가 발생했습니다.';
				loading = false;
			}
		} else {
			// 일반 로그인
			const { data, error } = await authStore.signIn(loginEmail, loginPassword);
			
			if (error) {
				errorMessage = getErrorMessage(error);
				loading = false;
			} else {
				// 로그인 성공
				loading = false;
				// 홈페이지로 리다이렉트
				goto('/');
			}
		}
	}
	
	/**
	 * Google 로그인 처리
	 * @returns {Promise<void>}
	 */
	async function handleGoogleLogin() {
		const { error } = await authStore.signInWithProvider('google');
		if (error) {
			errorMessage = getErrorMessage(error);
		}
	}
	
	/**
	 * Supabase 에러 메시지 변환
	 * @param {any} error - 에러 객체
	 * @returns {string} 사용자용 메시지
	 */
	function getErrorMessage(error) {
		if (error.message.includes('Invalid login credentials')) {
			return '이메일 또는 비밀번호가 올바르지 않습니다.';
		} else if (error.message.includes('Email not confirmed')) {
			return '이메일 인증을 완료해주세요.';
		}
		return error.message;
	}
</script>

<svelte:head>
	<title>로그인 - {___prjConst.app.name}</title>
</svelte:head>

<div class="login-page">
	<div class="login-container">
		<div class="logo">
			<Logo />
			<p></p>
		</div>
		
		<form onsubmit={handleLogin}>
			<h2>{___prjConst.login.description}</h2>
			
			<div class="form-group">
				<label for="email">이메일</label>
				<input 
					id="email"
					type="email" 
					bind:value={email}
					placeholder="example@email.com"
					autocomplete="email"
				/>
			</div>
			
			<div class="form-group">
				<label for="password">비밀번호</label>
				<input 
					id="password"
					type="password" 
					bind:value={password}
					placeholder="6자리 이상"
					required
					autocomplete="current-password"
				/>
			</div>
			
			{#if errorMessage}
				<div class="error-message">
					⚠️ {errorMessage}
				</div>
			{/if}
			
			<button type="submit" class="btn-primary" disabled={loading}>
				{loading ? '로그인 중...' : '로그인'}
			</button>
		</form>
		
		<div class="divider">
			<span>또는</span>
		</div>
		
		<button onclick={handleGoogleLogin} class="btn-google">
			<svg viewBox="0 0 24 24" width="20" height="20">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			Google로 로그인
		</button>
		
		<div class="footer-links">
			<p>
				계정이 없으신가요? 
				<a href="/signup">회원가입</a>
			</p>
			<p>
				<a href="/reset-password">비밀번호를 잊으셨나요?</a>
			</p>
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}
	
	.login-container {
		background: white;
		padding: 40px;
		border-radius: 20px;
		box-shadow: 0 20px 60px rgba(0,0,0,0.3);
		max-width: 450px;
		width: 100%;
	}
	
	.logo {
		text-align: center;
		margin-bottom: 40px;
	}
	
	.logo-image {
		width: 180px;
		height: auto;
		margin-bottom: 20px;
		object-fit: contain;
	}
	
	.logo p {
		color: #666;
		font-size: 0.95em;
	}
	
	form h2 {
		font-size: 1.5em;
		color: #333;
		margin-bottom: 30px;
		text-align: center;
	}
	
	.form-group {
		margin-bottom: 20px;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 8px;
		color: #555;
		font-weight: 500;
		font-size: 0.95em;
	}
	
	input {
		width: 100%;
		padding: 12px 15px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1em;
		transition: border-color 0.3s;
	}
	
	input:focus {
		outline: none;
		border-color: #667eea;
	}
	
	.error-message {
		background: #fee;
		color: #c33;
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 20px;
		font-size: 0.9em;
	}
	
	.btn-primary {
		width: 100%;
		padding: 14px;
		border: none;
		border-radius: 8px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-size: 1em;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
	}
	
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.divider {
		text-align: center;
		margin: 30px 0;
		position: relative;
	}
	
	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #e0e0e0;
	}
	
	.divider span {
		position: relative;
		background: white;
		padding: 0 15px;
		color: #999;
		font-size: 0.9em;
	}
	
	.btn-google {
		width: 100%;
		padding: 12px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		background: white;
		color: #555;
		font-size: 1em;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		transition: background 0.2s, border-color 0.2s;
	}
	
	.btn-google:hover {
		background: #f8f9fa;
		border-color: #ccc;
	}
	
	.footer-links {
		margin-top: 30px;
		text-align: center;
		font-size: 0.9em;
	}
	
	.footer-links p {
		margin: 10px 0;
		color: #666;
	}
	
	.footer-links a {
		color: #667eea;
		text-decoration: none;
		font-weight: 500;
	}
	
	.footer-links a:hover {
		text-decoration: underline;
	}
	
	.master-key-hint {
		background: #e3f2fd;
		color: #1976d2;
		padding: 10px;
		border-radius: 6px;
		font-size: 0.85em;
		margin-bottom: 20px;
		text-align: center;
	}
	
	@media (max-width: 480px) {
		.login-container {
			padding: 30px 20px;
		}
		
		.logo h1 {
			font-size: 1.5em;
		}
	}
</style>
