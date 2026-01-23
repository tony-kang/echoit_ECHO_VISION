<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabaseClient';
	import Logo from '$lib/components/Logo.svelte';
	
	/** @type {string} 새 비밀번호 */
	let newPassword = $state('');
	/** @type {string} 새 비밀번호 확인 */
	let confirmPassword = $state('');
	/** @type {boolean} 비밀번호 재설정 링크 유효 여부 */
	let isLinkValid = $state(true);
	/** @type {boolean} 비밀번호 변경 처리 중 여부 */
	let loading = $state(false);
	/** @type {string} 에러 메시지 */
	let error = $state('');
	/** @type {boolean} 비밀번호 변경 성공 여부 */
	let success = $state(false);
	
	/**
	 * 로그인 페이지로 이동
	 * @returns {void}
	 */
	function goToLogin() {
		goto('/login');
	}

	/**
	 * URL 파라미터(해시/쿼리)를 기반으로 recovery 세션을 확보합니다.
	 * - hash(`access_token`, `refresh_token`) 방식
	 * - PKCE code(`?code=...`) 방식
	 * @returns {Promise<boolean>} 세션 확보 성공 여부
	 */
	async function ensureRecoverySessionFromUrl() {
		const hash = page.url.hash?.startsWith('#') ? page.url.hash.slice(1) : page.url.hash;
		const hashParams = new URLSearchParams(hash || '');
		const searchParams = page.url.searchParams;

		const urlType = hashParams.get('type') || searchParams.get('type') || '';

		// Supabase가 URL에서 세션을 자동 감지했을 수도 있으니 먼저 확인
		const { data: sessionData } = await supabase.auth.getSession();
		if (sessionData.session) return true;

		// hash 토큰 방식 (구버전/implicit)
		const accessToken = hashParams.get('access_token');
		const refreshToken = hashParams.get('refresh_token');
		if (accessToken && refreshToken) {
			const { data, error: sessionError } = await supabase.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken
			});
			if (sessionError) {
				error = sessionError.message || '세션 설정에 실패했습니다.';
				return false;
			}
			return Boolean(data.session);
		}

		// PKCE token 방식
		const token = searchParams.get('token');
		if (token && token.startsWith('pkce_')) {
			const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(token);
			if (exchangeError) {
				error = exchangeError.message || '세션 교환에 실패했습니다.';
				return false;
			}
			return Boolean(data.session);
		}

		// URL이 recovery 타입이 아니면 접근 자체를 막음 (직접 접근 등)
		if (urlType && urlType !== 'recovery') return false;
		return false;
	}

	/**
	 * 비밀번호 재설정 페이지 진입 시 세션을 확보하고, 유효하지 않으면 로그인으로 이동합니다.
	 * @returns {Promise<void>}
	 */
	async function initUpdatePasswordPage() {
		isLinkValid = true;

		// URL 에러 파라미터(만료/이미 사용됨 등) 표시
		const urlError = page.url.searchParams.get('error') || '';
		const errorCode = page.url.searchParams.get('error_code') || '';
		const errorDescription = page.url.searchParams.get('error_description') || '';
		if (urlError || errorCode) {
			const decoded = errorDescription
				? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
				: '';
			error = decoded || `인증 오류가 발생했습니다. (코드: ${errorCode || urlError})`;
			isLinkValid = false;
			return;
		}

		const ok = await ensureRecoverySessionFromUrl();
		if (!ok) {
			error = error || 'Email link is invalid or has expired';
			isLinkValid = false;
		}
	}

	onMount(initUpdatePasswordPage);
	
	/**
	 * 비밀번호 변경 처리
	 * @returns {Promise<void>}
	 */
	async function handleUpdatePassword() {
		// 유효성 검사
		if (!newPassword || !confirmPassword) {
			error = '모든 필드를 입력해주세요.';
			return;
		}
		
		if (newPassword.length < 6) {
			error = '비밀번호는 최소 6자 이상이어야 합니다.';
			return;
		}
		
		if (newPassword !== confirmPassword) {
			error = '비밀번호가 일치하지 않습니다.';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const result = await authStore.updatePassword(newPassword);
			
			if (result.error) {
				/** @type {any} */
				const err = result.error;
				error = err?.message || '비밀번호 변경에 실패했습니다.';
			} else {
				success = true;
				// 3초 후 로그인 페이지로 이동
				setTimeout(goToLogin, 3000);
			}
		} catch (err) {
			error = '비밀번호 변경에 실패했습니다.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	/**
	 * 비밀번호 변경 폼 제출 핸들러
	 * @param {SubmitEvent} event - 폼 제출 이벤트
	 * @returns {Promise<void>}
	 */
	async function handleSubmit(event) {
		event.preventDefault();
		await handleUpdatePassword();
	}

	/**
	 * 로그인 버튼 클릭 핸들러
	 * @param {MouseEvent} event - 클릭 이벤트
	 * @returns {void}
	 */
	function handleGoLogin(event) {
		event.preventDefault();
		goToLogin();
	}
</script>

<svelte:head>
	<title>비밀번호 변경 - {___prjConst.app.name}</title>
</svelte:head>

<div class="update-password-page">
	<div class="update-password-card">
		<!-- 로고 -->
		<div class="logo-container">
			<Logo />
		</div>
		
		{#if !success && isLinkValid}
			<h2>새 비밀번호 설정</h2>
			<p class="description">
				새로운 비밀번호를 입력해주세요.
			</p>
			
			<form onsubmit={handleSubmit}>
				<!-- 새 비밀번호 -->
				<div class="form-group">
					<label for="newPassword">새 비밀번호</label>
					<input
						type="password"
						id="newPassword"
						bind:value={newPassword}
						placeholder="최소 6자 이상"
						disabled={loading}
						required
					/>
				</div>
				
				<!-- 비밀번호 확인 -->
				<div class="form-group">
					<label for="confirmPassword">비밀번호 확인</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						placeholder="비밀번호를 다시 입력하세요"
						disabled={loading}
						required
					/>
				</div>
				
				<!-- 에러 메시지 -->
				{#if error}
					<div class="error-message">
						{error}
					</div>
				{/if}
				
				<!-- 변경 버튼 -->
				<button type="submit" class="submit-btn" disabled={loading}>
					{loading ? '변경 중...' : '비밀번호 변경'}
				</button>
			</form>
		{:else if !success && !isLinkValid}
			<h2>페이지가 유효하지 않습니다.</h2>
			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}
			<p class="info-text">
				링크가 만료되었거나 이미 사용되었습니다.<br />
				비밀번호 재설정 링크를 다시 요청해주세요.
			</p>
			<div class="links">
				<a href="/reset-password">재설정 링크 다시 받기</a>
			</div>
		{:else}
			<!-- 성공 메시지 -->
			<div class="success-container">
				<div class="success-icon">✅</div>
				<h2>비밀번호가 변경되었습니다</h2>
				<p class="success-message">
					새로운 비밀번호로 로그인해주세요.
				</p>
				<p class="info-text">
					잠시 후 로그인 페이지로 이동합니다...
				</p>
				
				<button class="submit-btn" onclick={handleGoLogin}>
					로그인하기
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.update-password-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}
	
	.update-password-card {
		background: white;
		border-radius: 20px;
		padding: 40px;
		max-width: 450px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}
	
	.logo-container {
		display: flex;
		justify-content: center;
		margin-bottom: 30px;
	}
	
	h2 {
		text-align: center;
		color: #333;
		font-size: 28px;
		font-weight: 700;
		margin-bottom: 10px;
	}
	
	.description {
		text-align: center;
		color: #666;
		font-size: 14px;
		line-height: 1.6;
		margin-bottom: 30px;
	}
	
	.form-group {
		margin-bottom: 20px;
	}
	
	label {
		display: block;
		color: #333;
		font-weight: 600;
		margin-bottom: 8px;
		font-size: 14px;
	}
	
	input {
		width: 100%;
		padding: 12px 15px;
		border: 2px solid #e0e0e0;
		border-radius: 10px;
		font-size: 14px;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}
	
	input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
	
	input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}
	
	.error-message {
		background-color: #fee;
		color: #c33;
		padding: 12px 15px;
		border-radius: 10px;
		font-size: 14px;
		margin-bottom: 20px;
		border: 1px solid #fcc;
	}
	
	.submit-btn {
		width: 100%;
		padding: 14px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-top: 10px;
	}
	
	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
	}
	
	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	/* 성공 메시지 스타일 */
	.success-container {
		text-align: center;
	}
	
	.success-icon {
		font-size: 60px;
		margin-bottom: 20px;
	}
	
	.success-message {
		color: #333;
		font-size: 16px;
		line-height: 1.6;
		margin-bottom: 20px;
	}
	
	.info-text {
		color: #999;
		font-size: 13px;
		line-height: 1.6;
		margin-bottom: 30px;
	}
	
	/* 반응형 */
	@media (max-width: 480px) {
		.update-password-card {
			padding: 30px 20px;
		}
		
		h2 {
			font-size: 24px;
		}
		
		.description {
			font-size: 13px;
		}
	}
</style>
