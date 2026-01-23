<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ___prjConst from '$prj/prjConst';
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { authStore } from '$lib/stores/authStore';

	let { children } = $props();
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);

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

	onMount(() => {
		authStore.initialize();
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
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
</style>
