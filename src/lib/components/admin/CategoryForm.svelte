<script>
	// @ts-nocheck
	import { createCategory, updateCategory } from '$lib/boardCategoryService';

	let {
		category = null,
		onSubmit = () => {},
		onUpdate = () => {},
		onCancel = () => {}
	} = $props();

	let error = $state(null);
	let isSubmitting = $state(false);
	
	// 초기값은 $effect에서 설정하므로 빈 값으로 시작
	let name = $state('');
	let slug = $state('');
	let description = $state('');
	let displayOrder = $state(0);
	let isActive = $state(true);
	
	// 옵션 필드 (enable_labels는 personal 카테고리에서만 자동 활성화되므로 제외)
	let editorStyle = $state('text');
	let designStyle = $state('list');
	let cardSubtype = $state('news'); // 카드형 세부 스타일 (기본값: 뉴스/기사형)
	let enableComments = $state(true);
	let enableImages = $state(false);
	let enableFiles = $state(false);
	let enableReactions = $state(true);

	$effect(() => {
		const currentCategory = category;
		if (currentCategory) {
			name = currentCategory.name || '';
			slug = currentCategory.slug || '';
			description = currentCategory.description || '';
			displayOrder = currentCategory.display_order || 0;
			isActive = currentCategory.is_active ?? true;
			
			// 옵션 필드 초기화
			const opts = currentCategory.options || {};
			editorStyle = opts.editor_style || 'text';
			designStyle = opts.design_style || 'list';
			cardSubtype = opts.card_subtype || 'news';
			enableComments = opts.enable_comments ?? true;
			enableImages = opts.enable_images ?? false;
			enableFiles = opts.enable_files ?? false;
			enableReactions = opts.enable_reactions ?? true;
		} else {
			// 새 카테고리인 경우 기본값 설정
			name = '';
			slug = '';
			description = '';
			displayOrder = 0;
			isActive = true;
			editorStyle = 'text';
			designStyle = 'list';
			cardSubtype = 'news';
			enableComments = true;
			enableImages = false;
			enableFiles = false;
			enableReactions = true;
		}
	});

	function generateSlug() {
		slug = name
			.toLowerCase()
			.replace(/[^a-z0-9가-힣]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	async function handleSubmit() {
		if (!name.trim()) {
			error = '카테고리 이름을 입력해주세요.';
			return;
		}

		if (!slug.trim()) {
			error = '슬러그를 입력해주세요.';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			// personal 카테고리인 경우 enable_labels를 true로 설정, 그 외는 false
			const isPersonal = slug === 'personal';
			const options = {
				editor_style: editorStyle,
				design_style: designStyle,
				card_subtype: designStyle === 'card' ? cardSubtype : undefined, // 카드형일 때만 저장
				enable_comments: enableComments,
				enable_images: enableImages,
				enable_files: enableFiles,
				enable_reactions: enableReactions,
				enable_labels: isPersonal // personal 카테고리에서만 자동 활성화
			};
			
			if (category) {
				const { error: err } = await updateCategory(category.id, {
					name,
					slug,
					description,
					display_order: displayOrder,
					is_active: isActive,
					options
				});
				if (err) throw err;
				onUpdate();
			} else {
				const { data, error: err } = await createCategory({
					name,
					slug,
					description,
					display_order: displayOrder,
					is_active: isActive,
					options
				});
				if (err) throw err;
				onSubmit(data);
			}
		} catch (err) {
			/** @type {any} */
			const errorObj = err;
			error = errorObj?.message || '카테고리 저장에 실패했습니다.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
	<h2 class="text-xl font-bold mb-4">
		{category ? '카테고리 수정' : '새 카테고리'}
	</h2>

	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
			{error}
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
		<div>
			<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
				이름 *
			</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				oninput={generateSlug}
				placeholder="카테고리 이름"
				class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				required
			/>
		</div>

		<div>
			<label for="slug" class="block text-sm font-medium text-gray-700 mb-1">
				슬러그 *
			</label>
			<input
				id="slug"
				type="text"
				bind:value={slug}
				placeholder="category-slug"
				class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				required
			/>
			<p class="mt-1 text-xs text-gray-500">
				URL에 사용되는 고유 식별자입니다. 예: "free", "notice" 등. 
				카테고리 이름을 입력하면 자동으로 생성되며, 수동으로 수정할 수 있습니다.
			</p>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
				설명
			</label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="카테고리 설명"
				rows="3"
				class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			></textarea>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="displayOrder" class="block text-sm font-medium text-gray-700 mb-1">
					표시 순서
				</label>
				<input
					id="displayOrder"
					type="number"
					bind:value={displayOrder}
					min="0"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div>
				<div class="block text-sm font-medium text-gray-700 mb-1">
					상태
				</div>
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={isActive}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">활성화</span>
				</label>
			</div>
		</div>

		<!-- 옵션 설정 -->
		<div class="border-t border-gray-200 pt-4 mt-4">
			<h3 class="text-lg font-semibold mb-4">게시판 옵션</h3>
			
			<div class="space-y-4">
				<!-- 편집 스타일 -->
				<div>
					<div class="block text-sm font-medium text-gray-700 mb-2">
						편집 스타일
					</div>
					<div class="flex gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								bind:group={editorStyle}
								value="text"
								class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">텍스트</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								bind:group={editorStyle}
								value="html"
								class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">HTML (Froala)</span>
						</label>
					</div>
				</div>

				<!-- 디자인 스타일 -->
				<div>
					<label for="designStyle" class="block text-sm font-medium text-gray-700 mb-2">
						디자인 스타일
					</label>
					<select
						id="designStyle"
						bind:value={designStyle}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="list">목록형 (List Style)</option>
						<option value="card">카드형 / 갤러리형 (Card / Gallery Style)</option>
						<option value="webzine">웹진형 (Webzine Style)</option>
						<option value="timeline">타임라인형 (Timeline Style)</option>
						<option value="feed">피드형 (Social Feed Style)</option>
					</select>
					<p class="mt-1 text-xs text-gray-500">
						💡 각 스타일의 특징과 적합한 용도는 시스템 가이드의 "게시판 스타일 가이드" 탭에서 확인할 수 있습니다.
					</p>
				</div>

				<!-- 카드형 세부 스타일 (카드형 선택 시에만 표시) -->
				{#if designStyle === 'card'}
					<div>
						<label for="cardSubtype" class="block text-sm font-medium text-gray-700 mb-2">
							카드형 세부 스타일
						</label>
						<select
							id="cardSubtype"
							bind:value={cardSubtype}
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="image-heavy">1. 이미지 강조형 (Image-Heavy / Gallery)</option>
							<option value="news">2. 뉴스/기사형 (Editorial / News)</option>
							<option value="commerce">3. 상품/커머스형 (Product / Commerce)</option>
							<option value="profile">4. 프로필/인물형 (Profile / Identity)</option>
						</select>
						<p class="mt-1 text-xs text-gray-500">
							💡 각 세부 스타일의 특징은 시스템 가이드의 "게시판 스타일 가이드" 탭에서 확인할 수 있습니다.
						</p>
					</div>
				{/if}

				<!-- 기능 활성화 옵션 -->
				<div>
					<div class="block text-sm font-medium text-gray-700 mb-2">
						기능 활성화
					</div>
					<div class="space-y-2">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={enableComments}
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">댓글 활성화</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={enableImages}
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">이미지 업로드</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={enableFiles}
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">파일 업로드</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={enableReactions}
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<span class="text-sm text-gray-700">좋아요/싫어요</span>
						</label>
						{#if slug === 'personal'}
							<div class="text-xs text-gray-500 mt-1 ml-6">
								💡 개인 라벨 기능은 personal 카테고리에서 자동으로 활성화됩니다.
							</div>
						{/if}
					</div>
				</div>
			</div>
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
				{isSubmitting ? '저장 중...' : (category ? '수정' : '생성')}
			</button>
		</div>
	</form>
</div>

