import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// 환경 변수 로드 (.env 파일에서)
	const env = loadEnv(mode, process.cwd(), '');
	
	// Vercel 등 배포 환경: 직접 설정된 변수가 있으면 우선 사용
	// 로컬 개발 환경: ENV_MODE 기반으로 선택
	let supabaseUrl = env.PUBLIC_SUPABASE_URL;
	let supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;
	let serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	
	// 직접 설정된 변수가 없으면 ENV_MODE 기반으로 선택 (로컬 개발 환경)
	if (!supabaseUrl || !supabaseAnonKey) {
		const envMode = env.ENV_MODE || 'dev';
		const suffix = envMode === 'production' ? 'PROD' : 'DEV';
		
		supabaseUrl = supabaseUrl || env[`PUBLIC_SUPABASE_URL_${suffix}`];
		supabaseAnonKey = supabaseAnonKey || env[`PUBLIC_SUPABASE_ANON_KEY_${suffix}`];
		serviceRoleKey = serviceRoleKey || env[`SUPABASE_SERVICE_ROLE_KEY_${suffix}`];
	}
	
	// 선택된 환경 변수를 process.env에 설정 (SvelteKit이 $env/static에서 읽을 수 있도록)
	if (supabaseUrl) {
		process.env.PUBLIC_SUPABASE_URL = supabaseUrl;
	}
	if (supabaseAnonKey) {
		process.env.PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
	}
	if (serviceRoleKey) {
		process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
	}
	
	return {
		plugins: [sveltekit()]
	};
});
