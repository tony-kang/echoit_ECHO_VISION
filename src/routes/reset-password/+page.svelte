<script>
	import { authStore } from '$lib/stores/authStore';
	import Logo from '$lib/components/Logo.svelte';
	
	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);
	
	async function handleResetPassword() {
		if (!email) {
			error = '이메일을 입력해주세요.';
			return;
		}
		
		if (!email.includes('@')) {
			error = '올바른 이메일 형식이 아닙니다.';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const result = await authStore.resetPassword(email);
			
			if (result.error) {
				/** @type {any} */
				const err = result.error;
				console.error('비밀번호 재설정 에러 상세:', err);
				
				// 에러 메시지 설정
				if (err?.message) {
					error = err.message;
				} else if (err?.code) {
					error = `에러 코드: ${err.code}. 비밀번호 재설정 링크 전송에 실패했습니다.`;
				} else {
					error = '비밀번호 재설정 링크 전송에 실패했습니다.';
				}
				
				// 네트워크 에러인 경우 추가 안내
				if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
					error += ' 네트워크 연결을 확인해주세요.';
				}
			} else {
				success = true;
			}
		} catch (err) {
			console.error('비밀번호 재설정 예외 발생:', err);
			error = err instanceof Error ? err.message : '비밀번호 재설정 링크 전송에 실패했습니다.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>비밀번호 찾기 - {___prjConst.app.name}</title>
</svelte:head>

<div class="reset-password-page">
	<div class="reset-password-card">
		<!-- 로고 -->
		<div class="logo-container">
			<Logo />
		</div>
		
		{#if !success}
			<h2>비밀번호 찾기</h2>
			<p class="description">
				가입하신 이메일 주소를 입력하시면<br>
				비밀번호 재설정 링크를 보내드립니다.
			</p>
			
			<form onsubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
				<!-- 이메일 입력 -->
				<div class="form-group">
					<label for="email">이메일</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="example@email.com"
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
				
				<!-- 전송 버튼 -->
				<button type="submit" class="submit-btn" disabled={loading}>
					{loading ? '전송 중...' : '재설정 링크 받기'}
				</button>
			</form>
			
			<!-- 로그인으로 돌아가기 -->
			<div class="links">
				<a href="/login">로그인으로 돌아가기</a>
			</div>
		{:else}
			<!-- 성공 메시지 -->
			<div class="success-container">
				<div class="success-icon">✅</div>
				<h2>이메일을 확인해주세요</h2>
				<p class="success-message">
					<strong>{email}</strong>로<br>
					비밀번호 재설정 링크를 보냈습니다.
				</p>
				<p class="info-text">
					이메일을 받지 못하셨나요?<br>
					다음 사항을 확인해주세요:
				</p>
				<ul class="info-list">
					<li>스팸 메일함 확인</li>
					<li>입력하신 이메일 주소가 가입 시 사용한 주소와 동일한지 확인</li>
					<li>이메일 전송까지 몇 분 정도 소요될 수 있습니다</li>
					<li>여러 번 시도한 경우, 잠시 후 다시 시도해주세요</li>
				</ul>
				
				<button 
					class="submit-btn" 
					onclick={() => { success = false; email = ''; }}
				>
					다시 시도하기
				</button>
				
				<div class="links">
					<a href="/login">로그인으로 돌아가기</a>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.reset-password-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}
	
	.reset-password-card {
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
	
	.links {
		text-align: center;
		margin-top: 20px;
	}
	
	.links a {
		color: #667eea;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		transition: color 0.3s ease;
	}
	
	.links a:hover {
		color: #764ba2;
		text-decoration: underline;
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
	
	.success-message strong {
		color: #667eea;
		word-break: break-all;
	}
	
	.info-text {
		color: #999;
		font-size: 13px;
		line-height: 1.6;
		margin-bottom: 15px;
	}
	
	.info-list {
		color: #999;
		font-size: 13px;
		line-height: 1.8;
		margin: 0 auto 30px;
		padding-left: 20px;
		text-align: left;
		max-width: 400px;
	}
	
	.info-list li {
		margin-bottom: 8px;
	}
	
	/* 반응형 */
	@media (max-width: 480px) {
		.reset-password-card {
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
