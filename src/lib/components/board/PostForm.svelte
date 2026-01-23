<script>
	import { createPost, updatePost } from '$lib/postService';
	import { getUserLabels, getPostLabels, addLabelToPost, removeLabelFromPost, createLabel } from '$lib/labelService';
	import { addHashtagsToPost, getPostHashtags, removeHashtagFromPost } from '$lib/hashtagService';
	import { uploadImage } from '$lib/imageUploadService';
	import { authStore } from '$lib/stores/authStore';
	import { onMount } from 'svelte';
	import LabelForm from './LabelForm.svelte';
	import FroalaEditor from './FroalaEditor.svelte';

	/**
	 * @typedef {Object} Post
	 * @property {string} id - 게시물 ID
	 * @property {string} title - 게시물 제목
	 * @property {string} content - 게시물 내용
	 * @property {string} category_id - 카테고리 ID
	 * @property {Object} [category] - 게시물이 속한 카테고리
	 * 
	 * @typedef {Object} BoardCategory
	 * @property {string} id - 카테고리 ID
	 * @property {string} name - 카테고리 이름
	 * @property {string} slug - 카테고리 슬러그
	 * @property {Object} [options] - 카테고리 옵션
	 * 
	 * @typedef {Object} Label
	 * @property {string} id - 라벨 ID
	 * @property {string} name - 라벨 이름
	 * @property {string} [color] - 라벨 색상
	 * 
	 * @typedef {Object} Hashtag
	 * @property {string} [id] - 해시태그 ID
	 * @property {string} name - 해시태그 이름
	 */

	let {
		categoryId,
		/** @type {BoardCategory | null} */
		category = null,
		/** @type {Post | null} */
		post = null,
		/** @type {(post: Post) => void} */
		onSubmit = () => {},
		/** @type {() => void} */
		onCancel = () => {}
	} = $props();

	/** @type {import('@supabase/supabase-js').User | null} 현재 로그인한 사용자 */
	let user = $state(null);
	/** @type {string} 게시물 제목 */
	let title = $state('');
	/** @type {string} 게시물 내용 */
	let content = $state('');
	/** @type {string} 썸네일 이미지/영상 URL */
	let thumbnailUrl = $state('');
	/** @type {string} 해시태그 입력 필드 */
	let hashtagInput = $state('');
	/** @type {boolean} 제출 중 상태 */
	let isSubmitting = $state(false);
	/** @type {string | null} 에러 메시지 */
	let error = $state(null);
	/** @type {Array<Label>} 사용 가능한 라벨 목록 */
	let availableLabels = $state([]);
	/** @type {Array<Label>} 선택된 라벨 목록 */
	let selectedLabels = $state([]);
	/** @type {Array<Hashtag>} 게시물의 해시태그 목록 */
	let postHashtags = $state([]);
	/** @type {boolean} 라벨 로딩 상태 */
	let loadingLabels = $state(false);
	/** @type {boolean} 라벨 폼 표시 여부 */
	let showLabelForm = $state(false);
	/** @type {boolean} 라벨 리스트 표시 여부 */
	let showLabelList = $state(false);
	/** @type {boolean} 이미지 업로드 중 상태 */
	let isUploadingImage = $state(false);
	/** @type {File | null} 선택된 이미지 파일 */
	let selectedImageFile = $state(null);
	/** @type {string} 이미지 미리보기 URL */
	let imagePreviewUrl = $state('');

	/**
	 * 이미지 갤러리 모드 여부 (card_subtype이 'image-heavy'인 경우)
	 * @type {boolean}
	 */
	const isGalleryMode = $derived.by(() => {
		return category?.options?.card_subtype === 'image-heavy';
	});

	onMount(() => {
		// 레이아웃에서 이미 초기화되므로 여기서는 구독만 함
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
		});

		if (post && post.title && post.content) {
			title = post.title;
			content = post.content;
			thumbnailUrl = post.thumbnail_url || '';
			if (post.thumbnail_url) {
				imagePreviewUrl = getThumbnailUrl(post.thumbnail_url);
			}
		}

		return () => {
			unsubscribe();
		};
	});

	$effect(() => {
		const currentPost = post;
		if (currentPost && currentPost.id) {
			// post 객체가 유효하고 title과 content가 있는 경우에만 업데이트
			if (currentPost.title !== undefined && currentPost.title !== null) {
				title = currentPost.title;
			}
			if (currentPost.content !== undefined && currentPost.content !== null) {
				content = currentPost.content;
			}
			if (currentPost.thumbnail_url !== undefined && currentPost.thumbnail_url !== null) {
				thumbnailUrl = currentPost.thumbnail_url;
				imagePreviewUrl = getThumbnailUrl(currentPost.thumbnail_url);
			}
			loadPostData();
		} else if (!currentPost) {
			// post가 null이면 새 게시물 작성 모드
			title = '';
			content = '';
			thumbnailUrl = '';
			imagePreviewUrl = '';
			selectedImageFile = null;
		}
	});

	$effect(() => {
		const currentUser = user;
		if (currentUser && !post) {
			loadLabels();
		}
	});

	/**
	 * 사용자의 라벨 목록을 불러오는 함수
	 * @returns {Promise<void>}
	 */
	async function loadLabels() {
		if (!user) return;
		loadingLabels = true;
		const { data } = await getUserLabels();
		availableLabels = data || [];
		loadingLabels = false;
	}

	/**
	 * 게시물의 라벨과 해시태그를 불러오는 함수
	 * @returns {Promise<void>}
	 */
	async function loadPostData() {
		if (!post || !post.id) return;
		loadingLabels = true;
		
		const [labelsResult, hashtagsResult] = await Promise.all([
			getUserLabels(),
			getPostHashtags(post.id)
		]);
		
		availableLabels = labelsResult.data || [];
		const postLabelsResult = await getPostLabels(post.id);
		selectedLabels = (postLabelsResult.data || []).map(item => item.label).filter(Boolean);
		postHashtags = (hashtagsResult.data || []).map(item => item.hashtag).filter(Boolean);
		
		loadingLabels = false;
	}

	/**
	 * 라벨 선택/해제 핸들러
	 * @param {Label} label - 선택/해제할 라벨
	 * @returns {void}
	 */
	function handleLabelToggle(label) {
		const isSelected = selectedLabels.some(l => l.id === label.id);
		if (isSelected) {
			selectedLabels = selectedLabels.filter(l => l.id !== label.id);
		} else {
			selectedLabels = [...selectedLabels, label];
		}
	}

	/**
	 * 해시태그 입력 핸들러
	 * @param {Event} e - 입력 이벤트
	 * @returns {void}
	 */
	function handleHashtagInput(e) {
		const target = e.target;
		const value = target.value;
		if (value.includes(' ')) {
			const tags = value.split(' ').filter((tag) => tag.trim());
			tags.forEach((tag) => {
				const normalizedTag = tag.trim().replace(/^#/, '');
				if (normalizedTag && !postHashtags.some(h => h.name === normalizedTag)) {
					postHashtags = [...postHashtags, { name: normalizedTag, id: undefined }];
				}
			});
			hashtagInput = '';
		} else {
			hashtagInput = value;
		}
	}

	/**
	 * 해시태그 입력 키다운 핸들러
	 * @param {KeyboardEvent} e - 키보드 이벤트
	 * @returns {void}
	 */
	function handleHashtagKeydown(e) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const tag = hashtagInput.trim().replace(/^#/, '');
			if (tag && !postHashtags.some(h => h.name === tag)) {
				postHashtags = [...postHashtags, { name: tag, id: undefined }];
				hashtagInput = '';
			}
		}
	}

	/**
	 * 해시태그 제거 핸들러
	 * @param {number} index - 제거할 해시태그의 인덱스
	 * @returns {void}
	 */
	function removeHashtag(index) {
		postHashtags = postHashtags.filter((_, i) => i !== index);
	}

	/**
	 * 새 라벨 생성 완료 핸들러
	 * @param {Label} newLabel - 새로 생성된 라벨
	 * @returns {Promise<void>}
	 */
	async function handleLabelCreated(newLabel) {
		showLabelForm = false;
		availableLabels = [...availableLabels, newLabel];
		selectedLabels = [...selectedLabels, newLabel];
	}

	/**
	 * 유튜브 URL에서 VIDEO_ID 추출
	 * @param {string} url - 유튜브 URL
	 * @returns {string | null} VIDEO_ID 또는 null
	 */
	function extractYouTubeVideoId(url) {
		if (!url) return null;
		
		// 다양한 유튜브 URL 형식 지원
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
			/youtube\.com\/watch\?.*v=([^&\n?#]+)/
		];
		
		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) {
				return match[1];
			}
		}
		
		return null;
	}

	/**
	 * 유튜브 썸네일 URL 생성
	 * @param {string} videoId - 유튜브 VIDEO_ID
	 * @returns {string} 썸네일 URL
	 */
	function getYouTubeThumbnail(videoId) {
		return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
	}

	/**
	 * URL이 유튜브 URL인지 확인
	 * @param {string} url - 확인할 URL
	 * @returns {boolean} 유튜브 URL 여부
	 */
	function isYouTubeUrl(url) {
		if (!url) return false;
		return /youtube\.com|youtu\.be/.test(url);
	}

	/**
	 * 썸네일 URL 결정 (유튜브 URL인 경우 썸네일로 변환)
	 * @param {string} url - 원본 URL
	 * @returns {string} 최종 썸네일 URL
	 */
	function getThumbnailUrl(url) {
		if (!url) return '';
		
		if (isYouTubeUrl(url)) {
			const videoId = extractYouTubeVideoId(url);
			if (videoId) {
				return getYouTubeThumbnail(videoId);
			}
		}
		
		return url;
	}

	/**
	 * 파일 크기를 읽기 쉬운 형식으로 변환
	 * @param {number} bytes - 바이트 단위 크기
	 * @returns {string} 변환된 크기 문자열
	 */
	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	/**
	 * 이미지 파일 선택 핸들러
	 * @param {Event} e - 파일 입력 이벤트
	 * @returns {Promise<void>}
	 */
	async function handleImageFileSelect(e) {
		const target = e.target;
		const file = target.files?.[0];
		
		if (!file) return;

		selectedImageFile = file;
		
		// 미리보기 생성
		const reader = new FileReader();
		reader.onload = (event) => {
			imagePreviewUrl = event.target?.result || '';
		};
		reader.readAsDataURL(file);
	}

	/**
	 * 이미지 업로드 핸들러
	 * @returns {Promise<boolean>} 업로드 성공 여부
	 */
	async function handleImageUpload() {
		if (!selectedImageFile) return false;

		isUploadingImage = true;
		error = null;

		try {
			const { data: uploadedUrl, error: uploadError } = await uploadImage(selectedImageFile);
			
			if (uploadError) {
				const errorMessage = uploadError instanceof Error 
					? uploadError.message 
					: (uploadError?.message || String(uploadError) || '이미지 업로드에 실패했습니다.');
				error = errorMessage;
				console.error('이미지 업로드 실패:', uploadError);
				return false;
			}

			if (uploadedUrl) {
				thumbnailUrl = uploadedUrl;
				imagePreviewUrl = uploadedUrl;
				selectedImageFile = null;
				return true;
			} else {
				error = '이미지 업로드 URL을 받지 못했습니다.';
				return false;
			}
		} catch (err) {
			const errorMessage = err instanceof Error 
				? err.message 
				: (err?.message || String(err) || '이미지 업로드에 실패했습니다.');
			error = errorMessage;
			console.error('이미지 업로드 예외:', err);
			return false;
		} finally {
			isUploadingImage = false;
		}
	}

	/**
	 * 게시물 제출 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleSubmit() {
		if (!user) {
			error = '로그인이 필요합니다.';
			return;
		}

		// 이미지 파일이 선택되었지만 아직 업로드되지 않은 경우 먼저 업로드
		if (selectedImageFile && !thumbnailUrl) {
			const uploadSuccess = await handleImageUpload();
			if (!uploadSuccess || !thumbnailUrl) {
				// 에러 메시지는 handleImageUpload에서 이미 설정됨
				if (!error) {
					error = '이미지 업로드에 실패했습니다.';
				}
				return; // 업로드 실패 시 제출 중단
			}
		}

		// 이미지 갤러리 모드일 때는 제목과 이미지가 필수
		if (isGalleryMode) {
			if (!title.trim()) {
				error = '제목을 입력해주세요.';
				return;
			}
			if (!thumbnailUrl.trim() && !selectedImageFile) {
				error = '이미지를 선택하거나 URL을 입력해주세요.';
				return;
			}
		} else if (category?.options?.design_style === 'feed') {
			// Feed 스타일일 때는 제목과 (내용 또는 썸네일 URL)이 필요
			if (!title.trim() || (!content.trim() && !thumbnailUrl.trim())) {
				error = '제목과 내용 또는 이미지/영상 URL을 입력해주세요.';
				return;
			}
		} else {
			// 다른 스타일은 제목과 내용이 필수
			if (!title.trim() || !content.trim()) {
				error = '제목과 내용을 입력해주세요.';
				return;
			}
		}

		isSubmitting = true;
		error = null;

		try {
			let savedPost;
			// 유튜브 URL인 경우 원본 URL을 저장 (썸네일은 표시 시 변환)
			const finalThumbnailUrl = thumbnailUrl.trim();
			const postData = {
				title,
				content: isGalleryMode ? '' : (content.trim() || ''), // 갤러리 모드일 때는 빈 문자열
				...(finalThumbnailUrl && { thumbnail_url: finalThumbnailUrl })
			};

			if (post) {
				// 수정
				const { data, error: err } = await updatePost(post.id, postData);
				if (err) throw err;
				savedPost = data;
			} else {
				// 생성
				const { data, error: err } = await createPost({
					category_id: categoryId,
					...postData
				});
				if (err) throw err;
				savedPost = data;
			}

			// 라벨 저장
			if (savedPost && savedPost.id) {
				// 기존 라벨 조회 (수정 시)
				if (post && post.id) {
					const { data: existingLabels } = await getPostLabels(post.id);
					const existingLabelIds = (existingLabels || []).map(item => item.label?.id).filter(Boolean);
					const selectedLabelIds = selectedLabels.map(l => l.id);

					// 제거할 라벨
					const toRemove = existingLabelIds.filter(id => !selectedLabelIds.includes(id));
					for (const labelId of toRemove) {
						await removeLabelFromPost(savedPost.id, labelId);
					}

					// 추가할 라벨
					const toAdd = selectedLabelIds.filter(id => !existingLabelIds.includes(id));
					for (const labelId of toAdd) {
						await addLabelToPost(savedPost.id, labelId);
					}
				} else {
					// 새 게시물인 경우 모든 선택된 라벨 추가
					for (const label of selectedLabels) {
						await addLabelToPost(savedPost.id, label.id);
					}
				}

				// 해시태그 저장
				const hashtagNames = postHashtags.map(h => h.name);
				
				if (post && post.id) {
					// 수정 시: 기존 해시태그와 비교하여 업데이트
					const { data: existingHashtags } = await getPostHashtags(post.id);
					const existingNames = (existingHashtags || []).map(item => item.hashtag?.name).filter(Boolean);
					
					// 제거할 해시태그
					const toRemove = (existingHashtags || []).filter(item => 
						item.hashtag && !hashtagNames.includes(item.hashtag.name)
					);
					for (const item of toRemove) {
						if (item.hashtag?.id) {
							await removeHashtagFromPost(savedPost.id, item.hashtag.id);
						}
					}

					// 추가할 해시태그
					const toAdd = hashtagNames.filter(name => !existingNames.includes(name));
					if (toAdd.length > 0) {
						await addHashtagsToPost(savedPost.id, toAdd);
					}
				} else if (hashtagNames.length > 0) {
					// 새 게시물인 경우 모든 해시태그 추가
					await addHashtagsToPost(savedPost.id, hashtagNames);
				}
			}

			onSubmit(savedPost);
		} catch (err) {
			error = err.message || '게시물 저장에 실패했습니다.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="post-form">
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h2 class="text-xl font-bold mb-4">
			{post ? '게시물 수정' : '게시물 작성'}
		</h2>

		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			<div>
				<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
					제목
				</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					placeholder="제목을 입력하세요"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					required
				/>
			</div>

			<!-- 이미지 갤러리 모드: 이미지 업로드 또는 URL 입력 -->
			{#if isGalleryMode}
				<div>
					<label for="galleryImage" class="block text-sm font-medium text-gray-700 mb-1">
						이미지 <span class="text-red-500">*</span>
					</label>
					
					<!-- 파일 업로드 -->
					<div class="mb-3">
						<label
							for="imageFile"
							class="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors text-center"
						>
							<input
								id="imageFile"
								type="file"
								accept="image/*"
								class="hidden"
								onchange={handleImageFileSelect}
							/>
							<div class="flex flex-col items-center gap-2">
								<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								{#if selectedImageFile}
									<div class="flex flex-col items-center gap-1">
										<span class="text-sm font-medium text-gray-700">
											{selectedImageFile.name}
										</span>
										<span class="text-xs text-gray-500">
											{formatFileSize(selectedImageFile.size)}
										</span>
									</div>
								{:else}
									<span class="text-sm text-gray-600">이미지 파일 선택</span>
								{/if}
								<span class="text-xs text-gray-500">또는 아래에 URL을 입력하세요</span>
							</div>
						</label>
						{#if selectedImageFile && !thumbnailUrl}
							<button
								type="button"
								onclick={handleImageUpload}
								disabled={isUploadingImage}
								class="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
							>
								{isUploadingImage ? '업로드 중...' : '이미지 업로드'}
							</button>
						{/if}
					</div>

					<!-- URL 입력 -->
					<div class="mb-3">
						<label for="thumbnailUrl" class="block text-sm font-medium text-gray-700 mb-1">
							또는 이미지 URL 입력
						</label>
						<input
							id="thumbnailUrl"
							type="url"
							bind:value={thumbnailUrl}
							placeholder="https://example.com/image.jpg"
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							oninput={() => {
								if (thumbnailUrl) {
									imagePreviewUrl = getThumbnailUrl(thumbnailUrl);
									selectedImageFile = null;
								}
							}}
						/>
					</div>

					<!-- 이미지 미리보기 -->
					{#if imagePreviewUrl}
						<div class="mt-3">
							<img
								src={imagePreviewUrl}
								alt="이미지 미리보기"
								class="max-w-full h-auto max-h-96 rounded-lg border border-gray-200 object-contain"
								onerror={(e) => {
									e.target.style.display = 'none';
									error = '이미지를 불러올 수 없습니다.';
								}}
							/>
						</div>
					{/if}
				</div>
			{:else if category?.options?.design_style === 'feed'}
				<!-- 썸네일 이미지/영상 URL (Feed 스타일일 때만 표시) -->
				<div>
					<label for="thumbnailUrl" class="block text-sm font-medium text-gray-700 mb-1">
						이미지/영상 URL
					</label>
					<input
						id="thumbnailUrl"
						type="url"
						bind:value={thumbnailUrl}
						placeholder="https://example.com/image.jpg 또는 https://example.com/video.mp4"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<p class="mt-1 text-xs text-gray-500">
						이미지, 영상 또는 유튜브 URL을 입력하세요. Pinterest 스타일 피드에서 썸네일로 표시됩니다.
					</p>
					{#if thumbnailUrl}
						{@const previewUrl = getThumbnailUrl(thumbnailUrl)}
						{@const isYouTube = isYouTubeUrl(thumbnailUrl)}
						<div class="mt-2">
							{#if previewUrl}
								<div class="relative">
									<img
										src={previewUrl}
										alt="미리보기"
										class="max-w-full h-auto rounded-lg border border-gray-200"
										onerror={(e) => { e.target.style.display = 'none'; }}
									/>
									{#if isYouTube}
										<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
											<div class="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
												<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
													<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
												</svg>
												YouTube
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- 내용 입력 (갤러리 모드가 아닐 때만 표시) -->
			{#if !isGalleryMode}
				<div>
					<label for="content" class="block text-sm font-medium text-gray-700 mb-1">
						내용
						{#if category?.options?.design_style === 'feed'}
							<span class="text-gray-500 text-xs font-normal">(선택사항)</span>
						{/if}
					</label>
					{#if category?.options?.editor_style === 'html'}
						<!-- Froala HTML 에디터 -->
						<FroalaEditor bind:value={content} placeholder="내용을 입력하세요" />
					{:else}
						<!-- 기본 텍스트 에디터 -->
						<textarea
							id="content"
							bind:value={content}
							placeholder="내용을 입력하세요"
							rows="10"
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required={category?.options?.design_style !== 'feed'}
						></textarea>
					{/if}
				</div>
			{/if}

			<!-- 라벨 선택 (personal 카테고리 또는 enable_labels가 true인 경우만) -->
			{#if user && (category?.slug === 'personal' || category?.options?.enable_labels === true)}
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="block text-sm font-medium text-gray-700">
							라벨
						</span>
						{#if !showLabelForm && !loadingLabels && availableLabels.length > 0}
							<button
								type="button"
								onclick={() => { showLabelForm = true; }}
								class="text-xs text-blue-600 hover:text-blue-800 font-medium"
							>
								+ 새 라벨 추가
							</button>
						{/if}
					</div>
					{#if loadingLabels}
						<div class="text-sm text-gray-500">라벨 로딩 중...</div>
					{:else if showLabelForm}
						<div class="mb-3">
							<LabelForm
								onSubmit={handleLabelCreated}
								onCancel={() => { showLabelForm = false; }}
							/>
						</div>
					{:else if availableLabels.length > 0}
						<!-- 라벨 선택 버튼 -->
						<button
							type="button"
							onclick={() => { showLabelList = !showLabelList; }}
							class="w-full px-4 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
						>
							<span class="text-sm text-gray-700">
								{#if selectedLabels.length > 0}
									{selectedLabels.length}개 선택됨
								{:else}
									라벨 선택
								{/if}
							</span>
							<svg
								class="w-4 h-4 text-gray-500 transition-transform {showLabelList ? 'rotate-180' : ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						
						<!-- 체크박스 리스트 -->
						{#if showLabelList}
							<div class="mt-2 border border-gray-200 rounded-lg bg-white p-3 max-h-60 overflow-y-auto">
								<div class="space-y-2">
									{#each availableLabels as label (label.id)}
										<label class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
											<input
												type="checkbox"
												checked={selectedLabels.some(l => l.id === label.id)}
												onchange={() => handleLabelToggle(label)}
												class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
											/>
											<span
												class="inline-block w-3 h-3 rounded-full shrink-0"
												style="background-color: {label.color || '#3B82F6'}"
											></span>
											<span class="text-sm text-gray-700 flex-1">{label.name}</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- 선택된 라벨 표시 -->
						{#if selectedLabels.length > 0}
							<div class="mt-2 flex flex-wrap gap-2">
								{#each selectedLabels as label (label.id)}
									<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
										<span
											class="inline-block w-2 h-2 rounded-full"
											style="background-color: {label.color || '#3B82F6'}"
										></span>
										{label.name}
									</span>
								{/each}
							</div>
						{/if}
					{:else}
						<!-- 라벨이 없을 때 -->
						<button
							type="button"
							onclick={() => { showLabelForm = true; }}
							class="text-sm text-blue-600 hover:text-blue-800 font-medium"
						>
							+ 라벨 추가
						</button>
					{/if}
				</div>
			{/if}

			<!-- 해시태그 입력 -->
			<div>
				<label for="hashtags" class="block text-sm font-medium text-gray-700 mb-1">
					해시태그
				</label>
				<input
					id="hashtags"
					type="text"
					bind:value={hashtagInput}
					oninput={handleHashtagInput}
					onkeydown={handleHashtagKeydown}
					placeholder="#태그 입력 후 스페이스 또는 엔터 (예: #프로젝트 #개발)"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<p class="text-xs text-gray-500 mt-1">스페이스 또는 엔터로 태그를 추가하세요</p>
				
				{#if postHashtags.length > 0}
					<div class="flex flex-wrap gap-2 mt-2">
						{#each postHashtags as hashtag, index (index)}
							<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
								#{hashtag.name}
								<button
									type="button"
									onclick={() => removeHashtag(index)}
									class="text-blue-500 hover:text-blue-700 ml-1"
								>
									×
								</button>
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex justify-end gap-3 pt-4">
				<button
					type="button"
					onclick={() => onCancel()}
					class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
					disabled={isSubmitting}
				>
					취소
				</button>
				<button
					type="submit"
					class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isSubmitting}
				>
					{isSubmitting ? '저장 중...' : (post ? '수정' : '작성')}
				</button>
			</div>
		</form>
	</div>
</div>

