<script>
	import { goto } from '$app/navigation';
	import { USER_ROLES, USER_ROLE_LABELS } from '$lib/userService';

	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {import('@supabase/supabase-js').User} user - 사용자 객체
	 * @property {Object | null} userProfile - 사용자 프로필
	 * @property {string} activeMenu - 활성 메뉴 ID
	 * @property {Array<{id: string, label: string, icon: string, href?: string}>} menuItems - 메뉴 항목 목록
	 * @property {Function} onMenuChange - 메뉴 변경 핸들러
	 * @property {string} [roleColorClass] - 역할 배지 색상 클래스
	 * @property {string} [activeColorClass] - 활성 메뉴 색상 클래스
	 * @property {import('svelte').Snippet} [children] - 자식 컴포넌트 슬롯
	 */
	let { 
		user, 
		userProfile, 
		activeMenu, 
		menuItems, 
		onMenuChange,
		roleColorClass = 'bg-gray-100 text-gray-800',
		activeColorClass = 'bg-blue-50 text-blue-700',
		children
	} = $props();

	/**
	 * 사용자 역할
	 * @type {string}
	 */
	const userRole = $derived.by(() => {
		/** @type {any} */
		const profile = userProfile;
		return profile?.role || USER_ROLES.USER;
	});

	/**
	 * 역할 라벨
	 * @type {string}
	 */
	const roleLabel = $derived.by(() => {
		const role = userRole;
		/** @type {keyof typeof USER_ROLE_LABELS} */
		const roleKey = role;
		return USER_ROLE_LABELS[roleKey] || '일반 사용자';
	});

	/**
	 * 메뉴 클릭 핸들러
	 * @param {any} item - 메뉴 항목
	 */
	function handleMenuClick(item) {
		if (item.href) {
			goto(item.href);
		} else {
			onMenuChange(item.id);
		}
	}
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
	<div class="flex flex-col lg:flex-row gap-6">
		<!-- 사이드 패널 -->
		<aside class="w-full lg:w-64 shrink-0">
			<div class="bg-white rounded-lg shadow-md p-4 sticky top-24">
				<!-- 사용자 정보 요약 -->
				<div class="mb-6 pb-6 border-b">
					<div class="flex items-center space-x-3 mb-2">
						<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
							{user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
						</div>
						<div class="flex-1 min-w-0">
							<p class="font-semibold text-gray-900 truncate">
								{user.user_metadata?.full_name || '사용자'}
							</p>
							<p class="text-xs text-gray-500 truncate">{user.email}</p>
						</div>
					</div>
					<div class="mt-3">
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {roleColorClass}">
							{roleLabel}
						</span>
					</div>
				</div>

				<!-- 메뉴 목록 -->
				<nav class="space-y-1">
					{#each menuItems as item}
						<button
							onclick={() => handleMenuClick(item)}
							class="w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition {
								activeMenu === item.id ? '{activeColorClass} font-medium' :
								'text-gray-700 hover:bg-gray-50'
							}"
						>
							<span class="text-lg">{item.icon}</span>
							<span>{item.label}</span>
						</button>
					{/each}
				</nav>
			</div>
		</aside>

		<!-- 메인 컨텐츠 -->
		<div class="flex-1">
			<div class="bg-white rounded-lg shadow-md p-6">
				{#if activeMenu === 'profile'}
					<h1 class="text-3xl font-bold text-gray-900 mb-6">개인-프로필</h1>
					
					<div class="space-y-6">
						<div class="border-b pb-6">
							<h2 class="text-xl font-semibold text-gray-900 mb-4">사용자 정보</h2>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p class="text-sm text-gray-500">이름</p>
									<p class="text-lg font-medium text-gray-900">
										{user.user_metadata?.full_name || '이름 없음'}
									</p>
								</div>
								<div>
									<p class="text-sm text-gray-500">이메일</p>
									<p class="text-lg font-medium text-gray-900">{user.email}</p>
								</div>
								<div>
									<p class="text-sm text-gray-500">역할</p>
									<p class="text-lg font-medium text-gray-600">
										{roleLabel}
									</p>
								</div>
								<div>
									<p class="text-sm text-gray-500">가입일</p>
									<p class="text-lg font-medium text-gray-900">
										{user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
									</p>
								</div>
								{#if userProfile?.top_level_codes && Array.isArray(userProfile.top_level_codes) && userProfile.top_level_codes.length > 0}
									<div class="md:col-span-2">
										<p class="text-sm text-gray-500">접근 가능한 최상위 코드</p>
										<div class="flex flex-wrap gap-2 mt-1">
											{#each userProfile.top_level_codes as code}
												<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
													{code}
												</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else if activeMenu === 'settings'}
					<h1 class="text-3xl font-bold text-gray-900 mb-6">C-설정</h1>
					
					<div class="space-y-6">
						<div class="border-b pb-6">
							<h2 class="text-xl font-semibold text-gray-900 mb-4">계정 설정</h2>
							<div class="space-y-4">
								<div class="p-4 border border-gray-200 rounded-lg">
									<p class="text-sm text-gray-600">계정 설정 기능이 곧 추가될 예정입니다.</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
				
				<!-- 슬롯으로 역할별 컨텐츠 추가 -->
				{@render children?.()}
			</div>
		</div>
	</div>
</div>

