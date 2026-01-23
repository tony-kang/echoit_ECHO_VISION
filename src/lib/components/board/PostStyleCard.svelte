<script>
	import { onMount } from 'svelte';
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import UserAvatar from './UserAvatar.svelte';
	import ReactionBadge from './ReactionBadge.svelte';

	let {
		post,
		onClick = () => {}
	} = $props();

	/**
	 * HTML 태그 제거 및 텍스트 추출
	 * @param {string} html - HTML 문자열
	 * @param {number} maxLength - 최대 길이
	 * @returns {string} 추출된 텍스트
	 */
	function stripHtml(html, maxLength = 100) {
		if (!html) return '';
		const text = html.replace(/<[^>]*>/g, '').trim();
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	onMount(() => {
		// Froala CSS 로드 (HTML 콘텐츠 표시용)
		loadFroalaCSS();
	});

	/**
	 * Froala CSS 로드 함수
	 * @returns {void}
	 */
	function loadFroalaCSS() {
		if (typeof document === 'undefined') return;
		
		// 이미 로드되어 있는지 확인
		const existingLink = document.querySelector('link[href*="froala_editor.pkgd.min.css"]');
		if (existingLink) return;

		// CSS 로드
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://cdn.jsdelivr.net/npm/froala-editor@latest/css/froala_editor.pkgd.min.css';
		document.head.appendChild(link);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article
	class="pinterest-card"
	onclick={() => onClick()}
>
	{#if post.thumbnail_url}
		<div class="pinterest-image-container">
			<img
				src={post.thumbnail_url}
				alt={post.title}
				class="pinterest-image"
				loading="lazy"
			/>
			{#if post.is_pinned}
				<div class="pinned-badge">📌</div>
			{/if}
		</div>
	{/if}
	
	<div class="pinterest-content">
		<h3 class="pinterest-title">{post.title}</h3>
		
		{#if post.content}
			<p class="pinterest-description">
				{#if post.category?.options?.editor_style === 'html'}
					{stripHtml(post.content, 100)}
				{:else}
					{post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
				{/if}
			</p>
		{/if}
		
		<div class="pinterest-footer">
			<UserAvatar
				user={post.author}
				showName={true}
			/>
			<div class="pinterest-meta">
				<span>{formatDistanceToNow(post.created_at)}</span>
				{#if post.reaction_counts && (post.reaction_counts.like_count > 0 || post.reaction_counts.dislike_count > 0)}
					<span>·</span>
					<ReactionBadge counts={post.reaction_counts} />
				{/if}
			</div>
		</div>
	</div>
</article>

<style>
	.pinterest-card {
		background: white;
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.pinterest-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		transform: translateY(-4px);
	}

	.pinterest-image-container {
		position: relative;
		width: 100%;
		overflow: hidden;
		background: #f3f4f6;
	}

	.pinterest-image {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
	}

	.pinned-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(255, 255, 255, 0.9);
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		backdrop-filter: blur(4px);
	}

	.pinterest-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
	}

	.pinterest-title {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.pinterest-description {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex: 1;
	}

	.pinterest-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 0.75rem;
		border-top: 1px solid #f3f4f6;
		font-size: 0.75rem;
	}

	.pinterest-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #9ca3af;
	}
</style>

