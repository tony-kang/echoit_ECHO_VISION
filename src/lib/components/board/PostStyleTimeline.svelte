<script>
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import UserAvatar from './UserAvatar.svelte';
	import ReactionBadge from './ReactionBadge.svelte';

	let {
		post,
		onClick = () => {}
	} = $props();

	/**
	 * 날짜 포맷팅 (YYYY-MM-DD)
	 * @param {string} dateString - 날짜 문자열
	 * @returns {string} 포맷팅된 날짜
	 */
	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}

	/**
	 * 시간 포맷팅 (HH:mm)
	 * @param {string} dateString - 날짜 문자열
	 * @returns {string} 포맷팅된 시간
	 */
	function formatTime(dateString) {
		const date = new Date(dateString);
		return date.toLocaleTimeString('ko-KR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	/**
	 * HTML 태그 제거 및 텍스트 추출
	 * @param {string} html - HTML 문자열
	 * @param {number} maxLength - 최대 길이
	 * @returns {string} 추출된 텍스트
	 */
	function stripHtml(html, maxLength = 200) {
		if (!html) return '';
		const text = html.replace(/<[^>]*>/g, '').trim();
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article
	class="timeline-item"
	onclick={() => onClick()}
>
	<div class="timeline-item-content">
		<!-- 헤더: 제목과 상태 -->
		<div class="timeline-item-header">
			<div class="timeline-item-title-section">
				{#if post.is_pinned}
					<span class="pinned-indicator" title="고정된 이력">📌</span>
				{/if}
				<h3 class="timeline-item-title">{post.title}</h3>
			</div>
			<div class="timeline-item-time">
				<span class="time-label">{formatTime(post.created_at)}</span>
			</div>
		</div>

		<!-- 본문: 내용 -->
		<div class="timeline-item-body">
			<p class="timeline-item-content-text">
				{#if post.category?.options?.editor_style === 'html'}
					{stripHtml(post.content, 200)}
				{:else}
					{post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
				{/if}
			</p>
		</div>

		<!-- 푸터: 작성자 및 메타 정보 -->
		<div class="timeline-item-footer">
			<div class="timeline-item-author">
				<UserAvatar
					user={post.author}
					showName={true}
				/>
			</div>
			<div class="timeline-item-meta">
				{#if post.reaction_counts && (post.reaction_counts.like_count > 0 || post.reaction_counts.dislike_count > 0)}
					<ReactionBadge counts={post.reaction_counts} />
				{/if}
				<span class="meta-separator">·</span>
				<span class="meta-text">{formatDistanceToNow(post.created_at)}</span>
			</div>
		</div>
	</div>
</article>

<style>
	.timeline-item {
		position: relative;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-left: 0.3rem;
		width: 100%;
	}

	@media (min-width: 1024px) {
		.timeline-item {
			margin: 0 1rem;
			max-width: 100%;
			width: auto;
		}
	}

	.timeline-item:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	@media (max-width: 1023px) {
		.timeline-item:hover {
			transform: translateX(4px);
		}
	}

	@media (min-width: 1024px) {
		.timeline-item:hover {
			transform: translateY(-2px);
		}
	}

	.timeline-item-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.timeline-item-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.timeline-item-title-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.pinned-indicator {
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.timeline-item-title {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		line-height: 1.4;
		flex: 1;
		min-width: 0;
	}

	@media (min-width: 640px) {
		.timeline-item-title {
			font-size: 1.125rem;
		}
	}

	.timeline-item-time {
		flex-shrink: 0;
	}

	.time-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		white-space: nowrap;
	}

	.timeline-item-body {
		margin-top: 0.25rem;
	}

	.timeline-item-content-text {
		font-size: 0.875rem;
		color: #4b5563;
		line-height: 1.6;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.timeline-item-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f3f4f6;
	}

	.timeline-item-author {
		display: flex;
		align-items: center;
	}

	.timeline-item-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.meta-separator {
		color: #d1d5db;
	}

	.meta-text {
		color: #6b7280;
	}

	/* 반응형 */
	@media (max-width: 640px) {
		.timeline-item-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.timeline-item-time {
			align-self: flex-end;
		}
	}
</style>

