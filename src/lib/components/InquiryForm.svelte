<script>
	import { onMount } from 'svelte';
	import { createInquiry, INQUIRY_TYPES, INQUIRY_TYPE_LABELS } from '$lib/inquiryService';
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	
	/**
	 * @typedef {Object} User
	 * @property {string} id
	 * @property {string} email
	 * @property {Object} [user_metadata]
	 * @property {string} [user_metadata.full_name]
	 */
	
	/**
	 * @typedef {Object} FormErrors
	 * @property {string} [name]
	 * @property {string} [email]
	 * @property {string} [subject]
	 * @property {string} [message]
	 */
	
	let { onSuccess, onCancel } = $props();
	
	let user = $state(null);
	let userProfile = $state(null);
	let authLoading = $state(true);
	
	// 인증 상태 구독
	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			userProfile = state.userProfile;
			
			// 로그인 사용자 정보로 폼 자동 채우기 (비어있을 때만)
			if (state.user && state.userProfile) {
				if (state.user.email && !formData.email) {
					formData.email = state.user.email;
				}
				if (state.user.user_metadata?.full_name && !formData.name) {
					formData.name = state.user.user_metadata.full_name;
				}
			}
		});
		
		return () => {
			unsubscribe();
		};
	});
	
	// 로그인 체크
	$effect(() => {
		if (!authLoading && !user) {
			alert('문의하기는 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
			goto('/login');
			if (onCancel) onCancel();
		}
	});
	
	let formData = $state({
		name: '',
		email: '',
		phone: '',
		company: '',
		inquiry_type: 'product',
		subject: '',
		message: ''
	});
	
	let errors = $state({});
	let isSubmitting = $state(false);
	let submitError = $state('');
	
	function validate() {
		const newErrors = {};
		
		if (!formData.name.trim()) {
			newErrors.name = '이름을 입력해주세요.';
		}
		
		if (!formData.email.trim()) {
			newErrors.email = '이메일을 입력해주세요.';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = '올바른 이메일 형식이 아닙니다.';
		}
		
		if (!formData.subject.trim()) {
			newErrors.subject = '제목을 입력해주세요.';
		}
		
		if (!formData.message.trim()) {
			newErrors.message = '문의 내용을 입력해주세요.';
		} else if (formData.message.trim().length < 10) {
			newErrors.message = '문의 내용을 10자 이상 입력해주세요.';
		}
		
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}
	
	async function handleSubmit() {
		// 로그인 체크
		const currentUser = user;
		if (!currentUser) {
			alert('문의하기는 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
			goto('/login');
			return;
		}
		
		if (!validate()) return;
		
		isSubmitting = true;
		submitError = '';
		
		try {
			const { data, error } = await createInquiry({
				...formData,
				user_id: currentUser.id
			});
			
			if (error) {
				throw error;
			}
			
			if (!data) {
				throw new Error('응답 데이터가 없습니다.');
			}
			
			if (onSuccess) {
				onSuccess(data);
			}
			
			// 폼 초기화
			formData = {
				name: '',
				email: '',
				phone: '',
				company: '',
				inquiry_type: 'product',
				subject: '',
				message: ''
			};
			userInfoLoaded = false;
		} catch (error) {
			let errorMessage = '문의 제출에 실패했습니다.';
			
			const err = error instanceof Error ? error : new Error(String(error));
			
			if (err.message) {
				errorMessage += ` (${err.message})`;
			}
			
			if (err.code === 'PGRST116') {
				errorMessage = 'inquiries 테이블이 존재하지 않습니다. 스키마를 먼저 생성해주세요.';
			} else if (err.code === '42501') {
				errorMessage = '권한이 없습니다. RLS 정책을 확인해주세요.';
			}
			
			submitError = errorMessage;
		} finally {
			isSubmitting = false;
		}
	}
	
	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
	}
</script>

<div class="inquiry-form">
	<div class="form-header">
		<h2>비즈니스 문의</h2>
		<p>궁금하신 사항을 남겨주시면 빠르게 답변드리겠습니다.</p>
		{#if user}
			{@const currentUser = user}
			<p class="user-info">로그인된 계정으로 문의합니다: {currentUser.email}</p>
		{/if}
	</div>
	
	{#if !user && !authLoading}
		<div class="alert alert-warning">
			<p>문의하기는 로그인이 필요합니다.</p>
			<button onclick={() => goto('/login')} class="btn btn-primary" style="margin-top: 1rem;">
				로그인하기
			</button>
		</div>
	{:else if user}
	
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<!-- 문의 유형 -->
		<div class="form-group">
			<label for="inquiry_type">문의 유형 <span class="required">*</span></label>
			<select 
				id="inquiry_type" 
				bind:value={formData.inquiry_type}
				class="form-control"
			>
				{#each Object.entries(INQUIRY_TYPE_LABELS) as [value, label]}
					<option value={value}>{label}</option>
				{/each}
			</select>
		</div>
		
		<!-- 이름 -->
		<div class="form-group">
			<label for="name">이름 <span class="required">*</span></label>
			<input 
				type="text" 
				id="name" 
				bind:value={formData.name}
				class="form-control"
				class:error={errors.name}
				placeholder="이름을 입력하세요"
			/>
			{#if errors.name}
				<span class="error-message">{errors.name}</span>
			{/if}
		</div>
		
		<!-- 이메일 -->
		<div class="form-group">
			<label for="email">이메일 <span class="required">*</span></label>
			<input 
				type="email" 
				id="email" 
				bind:value={formData.email}
				class="form-control"
				class:error={errors.email}
				placeholder="email@example.com"
			/>
			{#if errors.email}
				<span class="error-message">{errors.email}</span>
			{/if}
		</div>
		
		<!-- 전화번호 -->
		<div class="form-group">
			<label for="phone">전화번호</label>
			<input 
				type="tel" 
				id="phone" 
				bind:value={formData.phone}
				class="form-control"
				placeholder="010-1234-5678"
			/>
		</div>
		
		<!-- 회사명 -->
		<div class="form-group">
			<label for="company">회사명</label>
			<input 
				type="text" 
				id="company" 
				bind:value={formData.company}
				class="form-control"
				placeholder="회사명을 입력하세요"
			/>
		</div>
		
		<!-- 제목 -->
		<div class="form-group">
			<label for="subject">제목 <span class="required">*</span></label>
			<input 
				type="text" 
				id="subject" 
				bind:value={formData.subject}
				class="form-control"
				class:error={errors.subject}
				placeholder="문의 제목을 입력하세요"
			/>
			{#if errors.subject}
				<span class="error-message">{errors.subject}</span>
			{/if}
		</div>
		
		<!-- 문의 내용 -->
		<div class="form-group">
			<label for="message">문의 내용 <span class="required">*</span></label>
			<textarea 
				id="message" 
				bind:value={formData.message}
				class="form-control"
				class:error={errors.message}
				placeholder="문의 내용을 상세히 입력해주세요 (최소 10자)"
				rows="8"
			></textarea>
			{#if errors.message}
				<span class="error-message">{errors.message}</span>
			{/if}
		</div>
		
		<!-- 에러 메시지 -->
		{#if submitError}
			<div class="alert alert-error">
				{submitError}
			</div>
		{/if}
		
		<!-- 버튼 -->
		<div class="form-actions">
			<button 
				type="button" 
				class="btn btn-secondary" 
				onclick={handleCancel}
				disabled={isSubmitting}
			>
				취소
			</button>
			<button 
				type="submit" 
				class="btn btn-primary" 
				disabled={isSubmitting}
			>
				{isSubmitting ? '제출 중...' : '문의하기'}
			</button>
		</div>
	</form>
	{/if}
</div>

<style>
	.inquiry-form {
		margin: 0 auto;
		padding: 2rem;
	}
	
	.form-header {
		margin-bottom: 2rem;
		text-align: center;
	}
	
	.form-header h2 {
		font-size: 1.75rem;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}
	
	.form-header p {
		color: #6b7280;
		font-size: 0.95rem;
	}
	
	.user-info {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: #667eea;
		font-weight: 500;
	}
	
	.alert-warning {
		background-color: #fef3c7;
		color: #92400e;
		border: 1px solid #fde68a;
		text-align: center;
		padding: 2rem;
		border-radius: 0.5rem;
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
	}
	
	.required {
		color: #ef4444;
	}
	
	.form-control {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.95rem;
		transition: all 0.2s;
	}
	
	.form-control:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
	
	.form-control.error {
		border-color: #ef4444;
	}
	
	textarea.form-control {
		resize: vertical;
		min-height: 150px;
	}
	
	.error-message {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: #ef4444;
	}
	
	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.alert-error {
		background-color: #fee2e2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}
	
	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}
	
	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font-size: 1rem;
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}
	
	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #e5e7eb;
	}
</style>
