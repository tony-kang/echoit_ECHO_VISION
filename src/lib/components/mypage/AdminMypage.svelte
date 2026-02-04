<script>
	import CommonMypageItem from './CommonMypageItem.svelte';
	import AdminMypageItem from './AdminMypageItem.svelte';

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
	 * 메뉴 항목 (공통 + 관리자)
	 * @type {Array<{id: string, label: string, icon: string, href?: string}>}
	 */
	const menuItems = $derived([
		{ id: 'profile', label: '개인-프로필', icon: '👤' },
		{ id: 'settings', label: '개인-설정', icon: '⚙️' },
		{ id: 'users', label: '관리자-사용자 관리', icon: '👥', href: '/admin/users' },
		{ id: 'inquiries', label: '관리자-문의 관리', icon: '💬', href: '/admin/inquiries' },
		{ id: 'categories', label: '관리자-일정 카테고리 관리', icon: '📁', href: '/admin/categories' },
		{ id: 'board-categories', label: '관리자-게시판 카테고리 관리', icon: '📋', href: '/admin/board-categories' },
		{ id: 'boards', label: '관리자-게시판 관리', icon: '📊', href: '/admin/boards' },
		{ id: 'database', label: '관리자-Database 관리', icon: '🗄️', href: '/admin/database' },
		{ id: 'logs', label: '관리자-액션 로그', icon: '📝', href: '/admin/logs' }
	]);
</script>

<CommonMypageItem
	{user}
	{userProfile}
	{activeMenu}
	{menuItems}
	onMenuChange={handleMenuChange}
	roleColorClass="bg-blue-100 text-blue-800"
	activeColorClass="bg-blue-50 text-blue-700"
>
	<AdminMypageItem {activeMenu} />
</CommonMypageItem>

