<script>
    import ___prjConst from '$prj/prjConst';
    import SupabaseInfo from '$lib/C/SupabaseInfo.svelte';
</script>
<div>
    <img src="/logo/logo_b.png" alt="logo" class="w-100 mx-auto">
    <h1 class="p-5 text-center text-3xl font-bold text-green-500 mb-8">Welcome to {___prjConst.NAME}</h1>

    <!-- Supabase 연결 테스트 컴포넌트 -->
    <SupabaseInfo />

    <p class="p-4 text-center text-sm text-gray-500">
        {___prjConst.copyright}
    </p>
</div>