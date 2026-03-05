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
	
	// onwarn: (warning, handler) => {
	// 	// Svelte 5에서는 하이픈(-) 대신 언더바(_)를 사용합니다.
	// 	const ignoredCodes = [
	// 		'a11y_click_events_have_key_events',
	// 		'a11y_no_static_element_interactions',
	// 		'a11y_missing_aria_attribute',
	// 		'a11y_missing_role',
	// 		'a11y_no_noninteractive_element_interactions',
	// 		'a11y_role_has_required_aria_props',
	// 		'a11y_role_supports_aria_props',
	// 		'a11y_label_has_associated_control'
	// 	];
	
	// 	if (ignoredCodes.includes(warning.code)) {
	// 		return;
	// 	}
		
	// 	handler(warning);
	// },

	compilerOptions: {
		warningFilter: (warning) => {
			const ignored = [
				'a11y_label_has_associated_control',
				'a11y_click_events_have_key_events',
				'a11y_no_static_element_interactions',
				'a11y_missing_aria_attribute',
				'a11y_missing_role',
				'a11y_no_noninteractive_element_interactions',
				'a11y_role_has_required_aria_props',
				'a11y_role_supports_aria_props',
				
				'css_unused_selector'
			];
			// 포함되어 있으면 false를 반환하여 무시
			return !ignored.includes(warning.code);
		}
	},
	
};

export default config;
