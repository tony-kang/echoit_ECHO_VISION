<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ___prjConst from '$prj/prjConst';
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authStateVersion = $state(0); // 상태 변경 추적용

	// Footer를 숨길 페이지 목록
	const hideFooterPaths = ['/schedules', '/admin', '/echovision'];
	const shouldHideFooter = $derived.by(() => {
		const pathname = page.url.pathname;
		const result = hideFooterPaths.some(path => pathname.startsWith(path));
		return result;
	});

	// Header를 숨길 페이지 목록 (로그인/회원가입 등 인증 관련 페이지)
	const hideHeaderPaths = ['/login', '/signup', '/reset-password', '/auth'];
	const shouldHideHeader = $derived.by(() => {
		const pathname = page.url.pathname;
		const result = hideHeaderPaths.some(path => pathname.startsWith(path));
		return result;
	});

	onMount(async () => {
		console.log('+layout: onMount 시작');
		// 초기화를 완료할 때까지 기다림
		await authStore.initialize();
		console.log('+layout: initialize 완료');
		
		// authStore 구독 (onMount 내부에서 한 번만 설정)
		const unsubscribe = authStore.subscribe((state) => {
			const prevUser = user;
			user = state.user;
			// 사용자 상태가 실제로 변경되었을 때만 로그 출력
			if (prevUser?.id !== user?.id) {
				console.log('+layout: user changed', { 
					from: prevUser?.email || 'null', 
					to: user?.email || 'null' 
				});
				authStateVersion++; // 상태 변경 추적
			}
		});
		
		return () => {
			unsubscribe();
		};
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/logo/favicon.png" />
	<title>{___prjConst.oAuth.appName}</title>
	<meta name="application-name" content={___prjConst.oAuth.appName} />
	<meta property="og:site_name" content={___prjConst.oAuth.appName} />
</svelte:head>

<!-- Header -->
{#if !shouldHideHeader}
	<Header />
{/if}

{@render children()}

{#if !shouldHideFooter}
	<Footer user={user} />
{/if}

<Toaster position="top-right" />

<style>
	/* 공통 페이지 컨테이너 스타일 */
	:global(.main-content-page) {
		min-height: calc(100vh - 100px);
		padding-top: 100px;
		background-color: white;
	}

	:global(.main-content-page > main) {
		min-height: calc(100vh - 100px);
	}

	/* Toast 성공 메시지 녹색 배경 */
	:global([data-sonner-toast][data-type="success"]) {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
		color: white !important;
		border: none !important;
	}

	:global([data-sonner-toast][data-type="success"] [data-icon]) {
		color: white !important;
	}

	:global([data-sonner-toast][data-type="success"] [data-title]) {
		color: white !important;
	}

	:global([data-sonner-toast][data-type="success"] [data-description]) {
		color: rgba(255, 255, 255, 0.9) !important;
	}
</style>
