<script>
	import { onMount } from 'svelte';
	import { getCommentsByPost } from '$lib/commentService';
	import CommentForm from './CommentForm.svelte';
	import CommentItem from './CommentItem.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import ErrorMessage from './ErrorMessage.svelte';
	import EmptyState from './EmptyState.svelte';
	import { authStore } from '$lib/stores/authStore';

	let {
		postId,
		onCommentAdded = () => {},
		onCommentUpdated = () => {},
		onCommentDeleted = () => {}
	} = $props();

	/** @type {Array<any>} */
	let comments = $state([]);
	let loading = $state(true);
	let error = $state(null);
	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let showReplyForm = $state(null); // 댓글 ID

	onMount(() => {
		// 레이아웃에서 이미 초기화되므로 여기서는 구독만 함
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
		});

		loadComments();

		return () => {
			unsubscribe();
		};
	});

	async function loadComments() {
		loading = true;
		error = null;
		const { data, error: err } = await getCommentsByPost(postId);

		if (err) {
			error = err.message || '댓글을 불러오는데 실패했습니다.';
			loading = false;
			return;
		}

		comments = data || [];
		loading = false;
	}

	function handleCommentAdded() {
		loadComments();
		onCommentAdded();
	}

	function handleCommentUpdated() {
		loadComments();
		onCommentUpdated();
	}

	function handleCommentDeleted() {
		loadComments();
		onCommentDeleted();
	}

	function toggleReplyForm(commentId) {
		if (showReplyForm === commentId) {
			showReplyForm = null;
		} else {
			showReplyForm = commentId;
		}
	}
</script>

<div class="comment-list">
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-semibold mb-4">댓글 ({comments.length})</h3>

		{#if user}
			<div class="mb-6">
				<CommentForm
					{postId}
					onSubmit={handleCommentAdded}
				/>
			</div>
		{:else}
			<div class="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
				댓글을 작성하려면 <a href="/login" class="text-blue-600 hover:underline">로그인</a>이 필요합니다.
			</div>
		{/if}

	{#if loading}
		<LoadingSpinner size="sm" />
	{:else if error}
		<ErrorMessage message={error} />
	{:else if comments.length === 0}
		<EmptyState
			title="아직 댓글이 없습니다."
			message=""
		/>
		{:else}
			<div class="space-y-4">
				{#each comments as comment (comment.id)}
					<CommentItem
						{comment}
						{postId}
						{user}
						showReplyForm={showReplyForm === comment.id}
						onReply={() => toggleReplyForm(comment.id)}
						onCommentAdded={handleCommentAdded}
						onCommentUpdated={handleCommentUpdated}
						onCommentDeleted={handleCommentDeleted}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

