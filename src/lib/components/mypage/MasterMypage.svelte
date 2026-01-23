<script>
	import CommonMypageItem from './CommonMypageItem.svelte';
	import MasterMypageItem from './MasterMypageItem.svelte';

	/**
	 * @type {Object} 컴포넌트 Props
	 * @property {import('@supabase/supabase-js').User} user - 사용자 객체
	 * @property {Object | null} userProfile - 사용자 프로필
	 */
	let { user, userProfile } = $props();

	/** @type {string} 활성 메뉴 */
	let activeMenu = $state('profile');

	/**
	 * 메뉴 변경 핸들러
	 * @param {string} menuId - 메뉴 ID
	 */
	function handleMenuChange(menuId) {
		activeMenu = menuId;
	}

	/**
	 * 메뉴 항목 (공통 + 관리자 + 마스터)
	 * @type {Array<{id: string, label: string, icon: string, href?: string}>}
	 */
	const menuItems = $derived([
		{ id: 'profile', label: 'C-프로필', icon: '👤' },
		{ id: 'settings', label: 'C-설정', icon: '⚙️' },
		{ id: 'users', label: 'A-사용자 관리', icon: '👥', href: '/admin/users' },
		{ id: 'inquiries', label: 'A-문의 관리', icon: '💬', href: '/admin/inquiries' },
		{ id: 'categories', label: 'A-일정 카테고리 관리', icon: '📁', href: '/admin/categories' },
		{ id: 'board-categories', label: 'A-게시판 카테고리 관리', icon: '📋', href: '/admin/board-categories' },
		{ id: 'boards', label: 'A-게시판 관리', icon: '📊', href: '/admin/boards' },
		{ id: 'database', label: 'A-Database 관리', icon: '🗄️', href: '/admin/database' },
		{ id: 'logs', label: 'A-액션 로그', icon: '📝', href: '/admin/logs' },
		{ id: 'system', label: 'M-시스템 관리', icon: '🔧' },
		{ id: 'system-guide', label: 'M-시스템 구성 가이드', icon: '🔑', href: '/admin/system-guide' },
		{ id: 'features', label: 'M-기능 개발', icon: '🔑', href: '/admin/features' }
	]);
</script>

<CommonMypageItem
	{user}
	{userProfile}
	{activeMenu}
	{menuItems}
	onMenuChange={handleMenuChange}
	roleColorClass="bg-purple-100 text-purple-800"
	activeColorClass="bg-purple-50 text-purple-700"
>
	<MasterMypageItem {activeMenu} />
</CommonMypageItem>

