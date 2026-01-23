import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		alias: {
			$src: 'src',
			$lib: 'src/lib',
			$prj: 'src/prj',
			$data: 'src/data',
			$common: 'src/common',
		}
	},

	compilerOptions: {

	},
	
	onwarn: (warning, handler) => {
		// 접근성 관련 경고들 무시
		if (
			warning.code === 'a11y-click-events-have-key-events' ||
			warning.code === 'a11y-no-static-element-interactions' ||
			warning.code === 'a11y-missing-aria-attribute' ||
			warning.code === 'a11y-missing-role' ||
			warning.code === 'a11y-no-noninteractive-element-interactions' ||
			warning.code === 'a11y-role-has-required-aria-props' ||
			warning.code === 'a11y-role-supports-aria-props' ||
			warning.code === 'a11y-label-has-associated-control'
		) {
			return;
		}
		// 다른 경고는 기본 처리
		handler(warning);
	},
};

export default config;
