<script>
	import { createComment } from '$lib/commentService';

	let {
		postId,
		parentId = null,
		onSubmit = () => {}
	} = $props();

	let content = $state('');
	let isSubmitting = $state(false);
	let error = $state(null);

	async function handleSubmit() {
		if (!content.trim()) {
			error = '댓글 내용을 입력해주세요.';
			return;
		}

		isSubmitting = true;
		error = null;

		const { data, error: err } = await createComment({
			post_id: postId,
			content: content.trim(),
			parent_id: parentId
		});

		isSubmitting = false;

		if (err) {
			error = err.message || '댓글 작성에 실패했습니다.';
			return;
		}

		content = '';
		onSubmit(data);
	}
</script>

<div class="comment-form">
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-red-700 text-sm">
			{error}
		</div>
	{/if}

	<div class="flex gap-3">
		<textarea
			bind:value={content}
			placeholder={parentId ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
			class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			rows="3"
		></textarea>
		<button
			onclick={handleSubmit}
			disabled={isSubmitting || !content.trim()}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
		>
			{isSubmitting ? '작성 중...' : '작성'}
		</button>
	</div>
</div>

