import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

/** @type {import('eslint').Linter.Config[]} */ export default [
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,

	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } }
	},

	{
		files: ['**/*.svelte', '**/*.svelte.js'],
		languageOptions: { parserOptions: { svelteConfig } }
	},
	{
		rules: {
		  	'svelte/no-navigation-without-resolve': 'off', 	// 네비게이션 규칙

			'jsx-a11y/label-has-associated-control': 'off', // 접근성 label 규칙

			// 'svelte/a11y-label-has-associated-control': 'off', // label-input 연결
			// 'svelte/a11y-click-events-have-key-events': 'off', // click 사용 시 키보드 이벤트 강제
			// 'svelte/a11y-no-static-element-interactions': 'off', // div 등에 이벤트 사용 제한
			// 'svelte/a11y-missing-attribute': 'off',           // img alt 등 속성 누락
			// 'svelte/a11y-no-noninteractive-element-interactions': 'off',
			// 'svelte/a11y-anchor-is-valid': 'off'               // href 없는 a 태그
	  
		}
	}
	
];
