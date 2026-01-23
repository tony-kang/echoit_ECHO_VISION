<script>
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/Logo.svelte';
	import ___prjConst from '$prj/prjConst';
	
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let fullName = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	
	/**
	 * @param {SubmitEvent} e
	 */
	async function handleSignup(e) {
		e.preventDefault();
		loading = true;
		errorMessage = '';
		successMessage = '';
		
		// 비밀번호 확인
		if (password !== confirmPassword) {
			errorMessage = '비밀번호가 일치하지 않습니다.';
			loading = false;
			return;
		}
		
		// 비밀번호 길이 확인
		if (password.length < 6) {
			errorMessage = '비밀번호는 최소 6자리 이상이어야 합니다.';
			loading = false;
			return;
		}
		
		const { data, error } = await authStore.signUp(email, password, {
			full_name: fullName
		});
		
		if (error) {
			errorMessage = getErrorMessage(error);
			loading = false;
		} else {
			successMessage = '회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.';
			loading = false;
			
			// 3초 후 로그인 페이지로 이동
			setTimeout(() => {
				goto('/login');
			}, 3000);
		}
	}
	
	/**
	 * @param {any} error
	 */
	function getErrorMessage(error) {
		if (error?.message?.includes('already registered')) {
			return '이미 등록된 이메일입니다.';
		} else if (error?.message?.includes('Invalid email')) {
			return '유효하지 않은 이메일 주소입니다.';
		}
		return error?.message || '회원가입에 실패했습니다.';
	}
</script>

<svelte:head>
	<title>회원가입 - {___prjConst.app.name}</title>
</svelte:head>

<div class="signup-page">
	<div class="signup-container">
		<div class="logo">
			<Logo />
			<p>{___prjConst.login.description}</p>
		</div>
		
		<form onsubmit={handleSignup}>
			<h2>회원가입</h2>
			
			<div class="form-group">
				<label for="fullName">이름</label>
				<input 
					id="fullName"
					type="text" 
					bind:value={fullName}
					placeholder="홍길동"
					required
					autocomplete="name"
				/>
			</div>
			
			<div class="form-group">
				<label for="email">이메일</label>
				<input 
					id="email"
					type="email" 
					bind:value={email}
					placeholder="example@email.com"
					required
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
					autocomplete="new-password"
				/>
			</div>
			
			<div class="form-group">
				<label for="confirmPassword">비밀번호 확인</label>
				<input 
					id="confirmPassword"
					type="password" 
					bind:value={confirmPassword}
					placeholder="비밀번호 재입력"
					required
					autocomplete="new-password"
				/>
			</div>
			
			{#if errorMessage}
				<div class="error-message">
					⚠️ {errorMessage}
				</div>
			{/if}
			
			{#if successMessage}
				<div class="success-message">
					✅ {successMessage}
				</div>
			{/if}
			
			<button type="submit" class="btn-primary" disabled={loading}>
				{loading ? '가입 중...' : '회원가입'}
			</button>
		</form>
		
		<div class="footer-links">
			<p>
				이미 계정이 있으신가요? 
				<a href="/login">로그인</a>
			</p>
		</div>
	</div>
</div>

<style>
	.signup-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}
	
	.signup-container {
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
	
	.logo p {
		color: #666;
		font-size: 0.95em;
		margin-top: 10px;
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
		box-sizing: border-box;
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
	
	.success-message {
		background: #d4edda;
		color: #155724;
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
	
	@media (max-width: 480px) {
		.signup-container {
			padding: 30px 20px;
		}
	}
</style>
