<script>
	import { onMount, onDestroy } from 'svelte';

	let {
		value = $bindable(''),
		placeholder = '내용을 입력하세요'
	} = $props();

	/** @type {any} */
	let editorInstance = $state(null);
	/** @type {HTMLTextAreaElement | null} */
	let editorElement = $state(null);
	
	/** @type {boolean} */
	let isEditorLoaded = $state(false);

	// editorElement가 바인딩되고 아직 에디터가 로드되지 않았을 때만 로드
	$effect(() => {
		if (editorElement && !isEditorLoaded) {
			isEditorLoaded = true;
			loadFroalaEditor();
		}
	});

	onDestroy(() => {
		if (editorInstance) {
			editorInstance.destroy();
		}
	});

	async function loadFroalaEditor() {
		try {
			// CDN에서 Froala 로드
			/** @type {any} */
			const win = typeof window !== 'undefined' ? window : null;
			if (win && !win.FroalaEditor) {
				// CSS 로드
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = 'https://cdn.jsdelivr.net/npm/froala-editor@latest/css/froala_editor.pkgd.min.css';
				document.head.appendChild(link);

				// JS 로드
				await new Promise((resolve, reject) => {
					const script = document.createElement('script');
					script.src = 'https://cdn.jsdelivr.net/npm/froala-editor@latest/js/froala_editor.pkgd.min.js';
					script.onload = resolve;
					script.onerror = reject;
					document.head.appendChild(script);
				});
			}

			// 에디터 초기화
			if (win && win.FroalaEditor && editorElement) {
				editorInstance = new win.FroalaEditor(editorElement, {
					placeholderText: placeholder,
					toolbarButtons: {
						'moreText': {
							'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'inlineClass', 'inlineStyle', 'clearFormatting']
						},
						'moreParagraph': {
							'buttons': ['alignLeft', 'alignCenter', 'formatOLSimple', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight', 'outdent', 'indent', 'quote']
						},
						'moreRich': {
							'buttons': ['insertLink', 'insertImage', 'insertVideo', 'insertTable', 'emoticons', 'fontAwesome', 'specialCharacters', 'embedly', 'insertFile', 'insertHR']
						},
						'moreMisc': {
							'buttons': ['undo', 'redo', 'fullscreen', 'print', 'getPDF', 'spellChecker', 'selectAll', 'html', 'help']
						}
					},
					language: 'ko',
					heightMin: 300,
					heightMax: 500,
					events: {
						'contentChanged': function() {
							// html 속성이 존재하는지 확인
							if (this.html && typeof this.html.get === 'function') {
								value = this.html.get();
							}
						},
						'initialized': function() {
							// 초기화 완료 후 초기 값 설정
							if (value && this.html && typeof this.html.set === 'function') {
								this.html.set(value);
							}
						}
					}
				});
			}
		} catch (error) {
			console.error('Froala 에디터 로드 실패:', error);
		}
	}

	$effect(() => {
		const currentValue = value;
		// editorInstance와 html 속성이 모두 존재하는지 확인
		if (editorInstance && editorInstance.html && 
		    typeof editorInstance.html.get === 'function' && 
		    typeof editorInstance.html.set === 'function') {
			try {
				const currentHtml = editorInstance.html.get();
				if (currentValue !== currentHtml) {
					editorInstance.html.set(currentValue);
				}
			} catch (error) {
				// 에디터가 아직 완전히 초기화되지 않은 경우 무시
				console.warn('Froala 에디터 업데이트 중 오류:', error);
			}
		}
	});
</script>

<div class="froala-editor-wrapper">
	<textarea
		bind:this={editorElement}
		placeholder={placeholder}
		class="hidden"
	></textarea>
</div>

<style>
	.froala-editor-wrapper {
		width: 100%;
	}
	
	:global(.fr-wrapper) {
		border-radius: 0.5rem;
	}
	
	:global(.fr-box) {
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
	}

	/* 에디터 내부 콘텐츠 스타일 - PostDetail과 동일하게 맞춤 */
	:global(.froala-editor-wrapper .fr-view) {
		color: #1f2937;
		line-height: 1.8;
		font-size: 1.125rem;
	}

	:global(.froala-editor-wrapper .fr-view p) {
		margin: 1.25rem 0;
		color: #374151;
	}

	:global(.froala-editor-wrapper .fr-view h1) {
		font-size: 2.25rem;
		font-weight: 700;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: #111827;
		line-height: 1.2;
	}

	:global(.froala-editor-wrapper .fr-view h2) {
		font-size: 1.875rem;
		font-weight: 700;
		margin-top: 1.75rem;
		margin-bottom: 0.875rem;
		color: #111827;
		line-height: 1.3;
	}

	:global(.froala-editor-wrapper .fr-view h3) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #111827;
		line-height: 1.4;
	}

	:global(.froala-editor-wrapper .fr-view h4),
	:global(.froala-editor-wrapper .fr-view h5),
	:global(.froala-editor-wrapper .fr-view h6) {
		font-weight: 600;
		margin-top: 1.25rem;
		margin-bottom: 0.625rem;
		color: #111827;
	}

	:global(.froala-editor-wrapper .fr-view ul),
	:global(.froala-editor-wrapper .fr-view ol) {
		margin: 1.25rem 0;
		padding-left: 2rem;
	}

	:global(.froala-editor-wrapper .fr-view li) {
		margin: 0.5rem 0;
	}

	:global(.froala-editor-wrapper .fr-view blockquote) {
		border-left: 4px solid #3b82f6;
		padding-left: 1.5rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: #6b7280;
		background-color: #f9fafb;
		padding-top: 1rem;
		padding-bottom: 1rem;
		border-radius: 0 0.5rem 0.5rem 0;
	}

	:global(.froala-editor-wrapper .fr-view code) {
		background-color: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
		color: #dc2626;
	}

	:global(.froala-editor-wrapper .fr-view pre) {
		background-color: #1f2937;
		color: #f9fafb;
		padding: 1.25rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1.5rem 0;
	}

	:global(.froala-editor-wrapper .fr-view pre code) {
		background-color: transparent;
		color: inherit;
		padding: 0;
	}

	:global(.froala-editor-wrapper .fr-view a) {
		color: #3b82f6;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.froala-editor-wrapper .fr-view a:hover) {
		color: #2563eb;
	}

	:global(.froala-editor-wrapper .fr-view table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	:global(.froala-editor-wrapper .fr-view table th),
	:global(.froala-editor-wrapper .fr-view table td) {
		border: 1px solid #e5e7eb;
		padding: 0.75rem 1rem;
		text-align: left;
	}

	:global(.froala-editor-wrapper .fr-view table th) {
		background-color: #f9fafb;
		font-weight: 600;
		color: #111827;
	}

	:global(.froala-editor-wrapper .fr-view table tr:nth-child(even)) {
		background-color: #f9fafb;
	}

	:global(.froala-editor-wrapper .fr-view table tr:hover) {
		background-color: #f3f4f6;
	}

	:global(.froala-editor-wrapper .fr-view img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.75rem;
		margin: 1.5rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	/* 반응형 디자인 */
	@media (max-width: 768px) {
		:global(.froala-editor-wrapper .fr-view h1) {
			font-size: 1.875rem;
		}

		:global(.froala-editor-wrapper .fr-view h2) {
			font-size: 1.5rem;
		}

		:global(.froala-editor-wrapper .fr-view h3) {
			font-size: 1.25rem;
		}
	}
</style>

