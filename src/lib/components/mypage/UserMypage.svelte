<script>
	import { USER_ROLES } from '$lib/userService';
	import CommonMypageItem from './CommonMypageItem.svelte';
	import UserMypageItem from './UserMypageItem.svelte';

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
	 * 메뉴 항목 (공통 + 일반 사용자)
	 * @type {Array<{id: string, label: string, icon: string, href?: string}>}
	 */
	const menuItems = $derived([
		{ id: 'profile', label: '개인-프로필', icon: '👤' },
		{ id: 'settings', label: '개인-설정', icon: '⚙️' }
	]);
</script>

<CommonMypageItem
	{user}
	{userProfile}
	{activeMenu}
	{menuItems}
	onMenuChange={handleMenuChange}
	roleColorClass="bg-gray-100 text-gray-800"
	activeColorClass="bg-blue-50 text-blue-700"
>
	<UserMypageItem {activeMenu} />
</CommonMypageItem>

