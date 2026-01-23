<script>
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import CommentForm from './CommentForm.svelte';
	import { updateComment, deleteComment } from '$lib/commentService';

	let {
		comment,
		postId,
		user,
		showReplyForm = false,
		onReply = () => {},
		onCommentAdded = () => {},
		onCommentUpdated = () => {},
		onCommentDeleted = () => {}
	} = $props();

	let isEditing = $state(false);
	let editContent = $state(comment.content);
	let isSubmitting = $state(false);

	async function handleUpdate() {
		if (!editContent.trim()) return;

		isSubmitting = true;
		const { error: err } = await updateComment(comment.id, { content: editContent });
		isSubmitting = false;

		if (err) {
			alert('댓글 수정에 실패했습니다.');
			return;
		}

		isEditing = false;
		onCommentUpdated();
	}

	async function handleDelete() {
		if (!confirm('정말 삭제하시겠습니까?')) return;

		const { error: err } = await deleteComment(comment.id);
		if (err) {
			alert('댓글 삭제에 실패했습니다.');
			return;
		}

		onCommentDeleted();
	}

	const isAuthor = $derived.by(() => {
		return user && user.id === comment.author_id;
	});
</script>

<div class="comment-item border-l-2 border-gray-200 pl-4 py-3">
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1">
			<div class="flex items-center gap-2 mb-1">
				<span class="font-medium text-gray-900">{comment.author?.full_name || '익명'}</span>
				<span class="text-xs text-gray-500">{formatDistanceToNow(comment.created_at)}</span>
			</div>

			{#if isEditing}
				<div class="mt-2">
					<textarea
						bind:value={editContent}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						rows="3"
					></textarea>
					<div class="flex gap-2 mt-2">
						<button
							onclick={handleUpdate}
							disabled={isSubmitting}
							class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
						>
							저장
						</button>
						<button
							onclick={() => { isEditing = false; editContent = comment.content; }}
							class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
						>
							취소
						</button>
					</div>
				</div>
			{:else}
				<!-- 댓글 내용 -->
				<div class="mt-2 pl-2 pr-4 py-3 text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg border border-gray-100">
					{comment.content}
				</div>
			{/if}

			<!-- 액션 버튼 -->
			{#if user && !isEditing}
				<div class="flex items-center gap-2 mt-3 ml-2">
					<button
						onclick={() => onReply()}
						class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
						</svg>
						답글
					</button>
					{#if isAuthor}
						<button
							onclick={() => { isEditing = true; }}
							class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
							</svg>
							수정
						</button>
						<button
							onclick={handleDelete}
							class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
							</svg>
							삭제
						</button>
					{/if}
				</div>
			{/if}

			<!-- 답글 작성 폼 -->
			{#if showReplyForm && user}
				<div class="mt-4 ml-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
					<CommentForm
						{postId}
						parentId={comment.id}
						onSubmit={() => {
							onCommentAdded();
							onReply(); // 닫기
						}}
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- 대댓글 -->
	{#if comment.replies && comment.replies.length > 0}
		<div class="mt-4 ml-8 space-y-3">
			<div class="flex items-center gap-2 mb-2">
				<div class="h-px flex-1 bg-gray-200"></div>
				<span class="text-xs font-medium text-gray-500">답글 {comment.replies.length}개</span>
				<div class="h-px flex-1 bg-gray-200"></div>
			</div>
			{#each comment.replies as reply (reply.id)}
				<div class="relative pl-6 py-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
					<!-- 답글 인디케이터 -->
					<div class="absolute left-0 top-4 bottom-4 w-0.5 bg-blue-300 rounded-full"></div>
					
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<!-- 작성자 정보 -->
							<div class="flex items-center gap-2 mb-2">
								<span class="font-semibold text-gray-900 text-sm">{reply.author?.full_name || '익명'}</span>
								<span class="text-xs text-gray-500">·</span>
								<span class="text-xs text-gray-500">{formatDistanceToNow(reply.created_at)}</span>
							</div>
							
							<!-- 답글 내용 -->
							<div class="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed pl-2">
								{reply.content}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

