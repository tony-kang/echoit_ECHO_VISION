<script>
	import ___prjConst from '$prj/prjConst';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { supabase } from '$lib/supabaseClient';
	import { authStore } from '$lib/stores/authStore';
	import Logo from '$lib/components/Logo.svelte';
	
	let status = $state('처리 중...');
	let errorMessage = $state('');
	let showRetry = $state(false);
	let showResendForm = $state(false);
	let resendEmail = $state('');
	let resendLoading = $state(false);
	let resendSuccess = $state(false);
	let isOtpExpired = $state(false);
	let urlError = $state('');
	let errorCode = $state('');
	
	onMount(async () => {
		try {
			// URL 파라미터에서 에러 확인
			const urlParams = page.url.searchParams;
			urlError = urlParams.get('error') || '';
			errorCode = urlParams.get('error_code') || '';
			const errorDescription = urlParams.get('error_description');
			
			if (urlError || errorCode) {
				console.error('인증 에러:', { urlError, errorCode, errorDescription });
				
				// 에러 타입에 따른 메시지 설정
				if (errorCode === 'otp_expired') {
					status = '이메일 링크가 만료되었거나 이미 사용되었습니다.';
					const decodedDescription = errorDescription 
						? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
						: '';
					errorMessage = decodedDescription || '인증 링크가 만료되었거나 이미 사용되었습니다. 링크는 한 번만 사용할 수 있으며, 만료 시간은 Supabase 설정에 따라 다를 수 있습니다.';
					showRetry = true;
					showResendForm = true;
					isOtpExpired = true;
				} else if (urlError === 'access_denied') {
					status = '인증이 거부되었습니다.';
					const decodedDescription = errorDescription 
						? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
						: '';
					errorMessage = decodedDescription || '인증 과정에서 문제가 발생했습니다.';
					// access_denied도 OTP 만료일 수 있으므로 재발송 폼 표시
					if (decodedDescription && decodedDescription.toLowerCase().includes('expired')) {
						showResendForm = true;
						isOtpExpired = true;
					}
					showRetry = true;
				} else {
					status = '인증에 실패했습니다.';
					const decodedDescription = errorDescription 
						? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
						: '';
					errorMessage = decodedDescription || `알 수 없는 오류가 발생했습니다. (에러 코드: ${errorCode || urlError})`;
					showRetry = true;
				}
				return;
			}
			
			// URL에서 인증 코드 확인
			const { data, error } = await supabase.auth.getSession();
			
			if (error) {
				console.error('인증 오류:', error);
				status = '인증에 실패했습니다.';
				errorMessage = error.message || '세션을 가져오는 중 오류가 발생했습니다.';
				showRetry = true;
				return;
			}
			
			if (data.session) {
				status = '로그인 성공! 마이페이지로 이동합니다...';
				setTimeout(() => goto('/mypage'), 1000);
			} else {
				// 해시에서 토큰 확인 시도
				const hashParams = new URLSearchParams(page.url.hash.substring(1));
				const accessToken = hashParams.get('access_token');
				const refreshToken = hashParams.get('refresh_token');
				
				if (accessToken && refreshToken) {
					// 토큰으로 세션 설정 시도
					const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken
					});
					
					if (sessionError) {
						console.error('세션 설정 오류:', sessionError);
						status = '세션 설정에 실패했습니다.';
						errorMessage = sessionError.message || '세션을 설정하는 중 오류가 발생했습니다.';
						showRetry = true;
					} else if (sessionData.session) {
						status = '로그인 성공! 마이페이지로 이동합니다...';
						setTimeout(() => goto('/mypage'), 1000);
					} else {
						status = '세션을 찾을 수 없습니다.';
						errorMessage = '인증 정보를 확인할 수 없습니다. 다시 시도해주세요.';
						showRetry = true;
					}
				} else {
					status = '세션을 찾을 수 없습니다.';
					errorMessage = '인증 정보를 확인할 수 없습니다. 다시 시도해주세요.';
					showRetry = true;
				}
			}
		} catch (err) {
			console.error('처리 오류:', err);
			status = '오류가 발생했습니다.';
			errorMessage = (err instanceof Error ? err.message : String(err)) || '예상치 못한 오류가 발생했습니다.';
			showRetry = true;
		}
	});
	
	function handleRetry() {
		goto('/login');
	}
	
	/**
	 * @param {SubmitEvent} e
	 */
	async function handleResendEmail(e) {
		e.preventDefault();
		if (!resendEmail) {
			errorMessage = '이메일 주소를 입력해주세요.';
			return;
		}
		
		resendLoading = true;
		resendSuccess = false;
		errorMessage = '';
		
		try {
			// Magic Link 재발송
			const { error } = await authStore.signInWithMagicLink(resendEmail);
			
			if (error) {
				/** @type {any} */
				const err = error;
				errorMessage = err?.message || '이메일 발송에 실패했습니다.';
				resendLoading = false;
			} else {
				resendSuccess = true;
				status = '새로운 인증 링크를 발송했습니다.';
				errorMessage = `${resendEmail}로 전송된 이메일을 확인해주세요.`;
				resendLoading = false;
			}
		} catch (err) {
			console.error('이메일 재발송 오류:', err);
			errorMessage = '이메일 발송 중 오류가 발생했습니다.';
			resendLoading = false;
		}
	}
</script>

<svelte:head>
	<title>로그인 처리 중 - {___prjConst.app.name}</title>
</svelte:head>

<div class="callback-page">
	<div class="callback-container">
		<Logo />
		{#if !showRetry}
			<div class="spinner"></div>
		{/if}
		<h2>{status}</h2>
		{#if errorMessage}
			<p class="error-message">{errorMessage}</p>
			{#if urlError || errorCode}
				<p class="debug-info">
					<small>에러 코드: {errorCode || urlError || '없음'}</small>
				</p>
			{/if}
		{/if}
		
		{#if showResendForm && isOtpExpired}
			{#if !resendSuccess}
				<form onsubmit={handleResendEmail} class="resend-form">
					<input 
						type="email" 
						bind:value={resendEmail}
						placeholder="이메일 주소를 입력하세요"
						required
						class="email-input"
						disabled={resendLoading}
					/>
					<button type="submit" class="resend-button" disabled={resendLoading}>
						{resendLoading ? '발송 중...' : '새 인증 링크 받기'}
					</button>
				</form>
			{/if}
		{/if}
		
		{#if showRetry}
			<button onclick={handleRetry} class="retry-button">로그인 페이지로 이동</button>
		{/if}
	</div>
</div>

<style>
	.callback-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.callback-container {
		background: white;
		padding: 60px 40px;
		border-radius: 20px;
		box-shadow: 0 20px 60px rgba(0,0,0,0.3);
		text-align: center;
		max-width: 400px;
	}
	
	.spinner {
		width: 50px;
		height: 50px;
		margin: 0 auto 30px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	h2 {
		color: #333;
		font-size: 1.2em;
		margin-bottom: 1rem;
	}
	
	.error-message {
		color: #e74c3c;
		font-size: 0.9em;
		margin: 1rem 0;
		line-height: 1.5;
	}
	
	.debug-info {
		color: #999;
		font-size: 0.8em;
		margin-top: 0.5rem;
	}
	
	.retry-button {
		margin-top: 1.5rem;
		padding: 12px 24px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1em;
		cursor: pointer;
		transition: background 0.3s;
	}
	
	.retry-button:hover {
		background: #5568d3;
	}
	
	.resend-form {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.email-input {
		width: 100%;
		padding: 12px 15px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 0.95em;
		box-sizing: border-box;
		transition: border-color 0.3s;
	}
	
	.email-input:focus {
		outline: none;
		border-color: #667eea;
	}
	
	.email-input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}
	
	.resend-button {
		width: 100%;
		padding: 12px 24px;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1em;
		cursor: pointer;
		transition: background 0.3s;
	}
	
	.resend-button:hover:not(:disabled) {
		background: #218838;
	}
	
	.resend-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
