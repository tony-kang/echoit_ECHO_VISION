<script>
	import { onMount } from 'svelte';
	import { supabase, getCurrentSession, getCurrentUser } from '$lib/supabaseClient';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { authStore } from '$lib/stores/authStore';
	import prjConst from '$prj/prjConst.js';

	let connectionStatus = '연결 중...';
	/** @type {import('@supabase/supabase-js').Session | null} */
	let sessionInfo = null;
	/** @type {import('@supabase/supabase-js').User | null} */
	let userInfo = null;
	/** @type {Error | null} */
	let error = null;
	let isLoading = true;
	/** @type {boolean | null} */
	let hasUsers = null; // null: 확인 중, true: 사용자 있음, false: 사용자 없음
	let showMasterSignup = false;
	
	// 마스터 사용자 등록 폼 상태
	let masterEmail = '';
	let masterPassword = '';
	let masterPasswordConfirm = '';
	let masterName = '';
	let masterDomain = '';
	let isRegistering = false;
	/** @type {string | null} */
	let registerError = null;
	let registerSuccess = false;

	onMount(async () => {
		try {
			// Supabase 연결 테스트
			connectionStatus = '연결 확인 중...';

			// Supabase URL이 설정되어 있는지 확인
			if (!PUBLIC_SUPABASE_URL) {
				throw new Error('Supabase URL이 설정되지 않았습니다.');
			}

			// 세션 정보 가져오기
			/** @type {{ session?: import('@supabase/supabase-js').Session | null, error?: Error | null }} */
			const sessionResult = await getCurrentSession();
			/** @type {import('@supabase/supabase-js').Session | null} */
			const session = sessionResult?.session || null;
			/** @type {Error | null} */
			const sessionError = sessionResult?.error || null;
			
			// "Auth session missing"은 에러가 아니라 로그인되지 않은 정상 상태
			if (sessionError) {
				const errorMessage = sessionError?.message || String(sessionError);
				if (!errorMessage.includes('Auth session missing') && 
				    !errorMessage.includes('session') && 
				    !errorMessage.includes('JWT')) {
					// 실제 연결 에러인 경우에만 throw
					throw sessionError;
				}
			} else if (session) {
				sessionInfo = session;
			}

			// 사용자 정보 가져오기
			/** @type {{ user?: import('@supabase/supabase-js').User | null, error?: Error | null }} */
			const userResult = await getCurrentUser();
			/** @type {import('@supabase/supabase-js').User | null} */
			const user = userResult?.user || null;
			/** @type {Error | null} */
			const userError = userResult?.error || null;
			
			// "Auth session missing"은 에러가 아니라 로그인되지 않은 정상 상태
			if (userError) {
				const errorMessage = userError?.message || String(userError);
				if (!errorMessage.includes('Auth session missing') && 
				    !errorMessage.includes('session') && 
				    !errorMessage.includes('JWT')) {
					// 실제 연결 에러인 경우에만 throw
					throw userError;
				}
			} else if (user) {
				userInfo = user;
			}

			// 연결 성공 (로그인 여부와 관계없이)
			connectionStatus = '연결 성공';
			
			// 세션이나 사용자 정보가 있으면 사용자가 있다고 판단
			if (session || user) {
				hasUsers = true;
			} else {
				// 사용자 수 확인 (RLS 때문에 실패할 수 있지만 시도)
				await checkUserCount();
			}
			
			isLoading = false;
		} catch (err) {
			// 실제 연결 에러만 처리
			error = err instanceof Error ? err : new Error(String(err));
			connectionStatus = '연결 실패';
			isLoading = false;
		}
	});

	/**
	 * 사용자 수 확인 (서버 사이드 함수 사용)
	 */
	async function checkUserCount() {
		try {
			// 이미 사용자가 있다고 확인된 경우 업데이트하지 않음
			if (hasUsers) {
				return;
			}

			// 현재 로그인한 사용자가 있으면 사용자가 있다고 판단
			if (userInfo || sessionInfo) {
				hasUsers = true;
				return;
			}

			// 서버 사이드 함수를 사용하여 사용자 존재 여부 확인
			// RLS를 우회하여 안전하게 확인 가능
			const { data, error } = await supabase.rpc('check_user_exists');

			if (error) {
				console.warn('사용자 존재 여부 확인 실패:', error);
				// 에러 시 null 상태 유지
			} else {
				// 함수 결과에 따라 hasUsers 설정
				hasUsers = data === true;
			}
		} catch (err) {
			console.warn('사용자 수 확인 중 에러:', err);
			// 에러가 나면 현재 상태 유지 (null 상태 유지)
		}
	}

	/**
	 * 마스터 사용자 등록
	 */
	async function registerMasterUser() {
		if (!masterEmail || !masterPassword || !masterPasswordConfirm || !masterDomain) {
			registerError = '모든 필드를 입력해주세요.';
			return;
		}

		// 도메인 확인
		const expectedDomain = prjConst.production.domain;
		if (masterDomain.trim() !== expectedDomain) {
			registerError = '도메인 정보를 정확하게 입력해 주세요.';
			return;
		}

		if (masterPassword !== masterPasswordConfirm) {
			registerError = '비밀번호가 일치하지 않습니다.';
			return;
		}

		if (masterPassword.length < 6) {
			registerError = '비밀번호는 최소 6자 이상이어야 합니다.';
			return;
		}

		isRegistering = true;
		registerError = null;
		registerSuccess = false;

		try {
			// 회원가입
			const { data, error: signUpError } = await authStore.signUp(
				masterEmail,
				masterPassword,
				{ full_name: masterName || '마스터 관리자' }
			);

			if (signUpError) {
				throw signUpError;
			}

			if (!data?.user) {
				throw new Error('사용자 생성에 실패했습니다.');
			}

			// 첫 사용자를 master로 만들기 위해 user_profiles 업데이트 시도
			// RLS 때문에 실패할 수 있으므로, 트리거 함수가 처리하도록 함
			// 트리거 함수가 첫 사용자를 자동으로 master로 설정함
			try {
				const { error: updateError } = await supabase
					.from('user_profiles')
					.update({ role: 'master' })
					.eq('id', data.user.id);

				if (updateError) {
					console.warn('master 권한 부여 실패 (트리거 함수가 처리할 수 있음):', updateError);
					// 트리거 함수가 첫 사용자를 master로 만들도록 설정되어 있다면 괜찮음
				}
			} catch (updateErr) {
				console.warn('master 권한 부여 중 에러:', updateErr);
			}

			registerSuccess = true;
			
			// 사용자가 등록되었으므로 hasUsers를 true로 설정
			hasUsers = true;
			
			// 등록된 사용자 정보로 userInfo 업데이트 시도
			if (data.user) {
				userInfo = data.user;
			}
			
			// 사용자 수 다시 확인 (추가 확인, 하지만 hasUsers가 true이면 업데이트하지 않음)
			await checkUserCount();
			
			// 폼 초기화
			masterEmail = '';
			masterPassword = '';
			masterPasswordConfirm = '';
			masterName = '';
			masterDomain = '';
			showMasterSignup = false;

			// 잠시 후 성공 메시지 숨기기
			setTimeout(() => {
				registerSuccess = false;
			}, 5000);
		} catch (err) {
			registerError = err instanceof Error ? err.message : String(err);
		} finally {
			isRegistering = false;
		}
	}
</script>

<div class="supabase-info-container p-6 bg-white rounded-lg shadow-md">
	<h2 class="text-2xl font-bold mb-4 text-gray-800">Supabase 연결 정보</h2>

	<div class="space-y-4">
		<!-- 연결 상태 -->
		<div class="status-section">
			<h3 class="text-lg font-semibold mb-2 text-gray-700">연결 상태</h3>
			<div class="flex items-center gap-2">
				<div
					class="status-indicator w-3 h-3 rounded-full {isLoading
						? 'bg-yellow-500 animate-pulse'
						: error
							? 'bg-red-500'
							: 'bg-green-500'}"
				></div>
				<span class="text-gray-600">{connectionStatus}</span>
			</div>
		</div>

		<!-- Supabase URL -->
		<div class="info-section">
			<h3 class="text-lg font-semibold mb-2 text-gray-700">Supabase URL</h3>
			<p class="text-sm text-gray-600 break-all bg-gray-50 p-2 rounded">
				{PUBLIC_SUPABASE_URL || '설정되지 않음'}
			</p>
		</div>

		<!-- 세션 정보 -->
		{#if sessionInfo}
			<div class="info-section">
				<h3 class="text-lg font-semibold mb-2 text-gray-700">세션 정보</h3>
				<div class="bg-gray-50 p-3 rounded">
					<p class="text-sm text-gray-600">
						<span class="font-medium">액세스 토큰:</span>
						{sessionInfo?.access_token ? `${sessionInfo.access_token.substring(0, 20)}...` : '없음'}
					</p>
					<p class="text-sm text-gray-600">
						<span class="font-medium">만료 시간:</span>
						{sessionInfo?.expires_at ? new Date(sessionInfo.expires_at * 1000).toLocaleString('ko-KR') : '없음'}
					</p>
				</div>
			</div>
		{:else if !isLoading}
			<div class="info-section">
				<h3 class="text-lg font-semibold mb-2 text-gray-700">세션 정보</h3>
				<p class="text-sm text-gray-500">로그인되지 않음</p>
			</div>
		{/if}

		<!-- 사용자 정보 -->
		{#if userInfo}
			<div class="info-section">
				<h3 class="text-lg font-semibold mb-2 text-gray-700">사용자 정보</h3>
				<div class="bg-gray-50 p-3 rounded">
					<p class="text-sm text-gray-600">
						<span class="font-medium">이메일:</span> {userInfo?.email || '없음'}
					</p>
					<p class="text-sm text-gray-600">
						<span class="font-medium">사용자 ID:</span> {userInfo?.id || '없음'}
					</p>
				</div>
			</div>
		{:else if !isLoading}
			<div class="info-section">
				<h3 class="text-lg font-semibold mb-2 text-gray-700">사용자 정보</h3>
				<p class="text-sm text-gray-500">로그인되지 않음</p>
			</div>
		{/if}

		<!-- 에러 정보 -->
		{#if error}
			<div class="error-section bg-red-50 border border-red-200 rounded p-3">
				<h3 class="text-lg font-semibold mb-2 text-red-700">에러</h3>
				<p class="text-sm text-red-600">{error?.message || String(error)}</p>
			</div>
		{/if}

		<!-- 마스터 사용자 등록 섹션 -->
		{#if !isLoading && !hasUsers}
			<div class="master-signup-section bg-blue-50 border border-blue-200 rounded p-4 mt-4">
				<h3 class="text-lg font-semibold mb-2 text-blue-700">마스터 사용자 등록</h3>
				<p class="text-sm text-blue-600 mb-4">
					등록된 사용자가 없습니다. 마스터 권한을 가진 첫 관리자를 등록해주세요.
				</p>

				{#if registerSuccess}
					<div class="bg-green-50 border border-green-200 rounded p-3 mb-4">
						<p class="text-sm text-green-700">✅ 마스터 사용자가 성공적으로 등록되었습니다!</p>
					</div>
				{/if}

				{#if !showMasterSignup}
					<button
						onclick={() => showMasterSignup = true}
						class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
					>
						마스터 사용자 등록하기
					</button>
				{:else}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							registerMasterUser();
						}}
						class="space-y-4"
					>
						<div>
							<label for="master-name" class="block text-sm font-medium text-gray-700 mb-1">
								이름 (선택사항)
							</label>
							<input
								id="master-name"
								type="text"
								bind:value={masterName}
								placeholder="마스터 관리자"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="master-domain" class="block text-sm font-medium text-gray-700 mb-1">
								도메인 <span class="text-red-500">*</span>
							</label>
							<input
								id="master-domain"
								type="text"
								bind:value={masterDomain}
								required
								placeholder="서비스 도메인을 입력해 주세요."
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<p class="text-xs text-gray-500 mt-1">정확한 도메인을 입력해주세요.</p>
						</div>

						<div>
							<label for="master-email" class="block text-sm font-medium text-gray-700 mb-1">
								이메일 <span class="text-red-500">*</span>
							</label>
							<input
								id="master-email"
								type="email"
								bind:value={masterEmail}
								required
								placeholder="admin@example.com"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="master-password" class="block text-sm font-medium text-gray-700 mb-1">
								비밀번호 <span class="text-red-500">*</span>
							</label>
							<input
								id="master-password"
								type="password"
								bind:value={masterPassword}
								required
								minlength="6"
								placeholder="최소 6자 이상"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label for="master-password-confirm" class="block text-sm font-medium text-gray-700 mb-1">
								비밀번호 확인 <span class="text-red-500">*</span>
							</label>
							<input
								id="master-password-confirm"
								type="password"
								bind:value={masterPasswordConfirm}
								required
								minlength="6"
								placeholder="비밀번호를 다시 입력하세요"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{#if registerError}
							<div class="bg-red-50 border border-red-200 rounded p-3">
								<p class="text-sm text-red-600">{registerError}</p>
							</div>
						{/if}

						<div class="flex gap-2">
							<button
								type="submit"
								disabled={isRegistering}
								class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								{isRegistering ? '등록 중...' : '마스터 사용자 등록'}
							</button>
							<button
								type="button"
							onclick={() => {
								showMasterSignup = false;
								registerError = null;
								masterEmail = '';
								masterPassword = '';
								masterPasswordConfirm = '';
								masterName = '';
								masterDomain = '';
							}}
								class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
							>
								취소
							</button>
						</div>
					</form>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.supabase-info-container {
		max-width: 800px;
		margin: 0 auto;
	}

	.status-indicator {
		transition: background-color 0.3s ease;
	}
</style>
