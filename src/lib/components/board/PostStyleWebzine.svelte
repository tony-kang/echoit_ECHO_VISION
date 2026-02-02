<script>
	import { formatDistanceToNow } from '$lib/utils/dateUtils';
	import UserAvatar from './UserAvatar.svelte';
	import ReactionBadge from './ReactionBadge.svelte';

	let {
		post,
		onClick = () => {}
	} = $props();

	/**
	 * HTML 콘텐츠에서 첫 번째 이미지 URL 추출
	 * @param {string} content - HTML 콘텐츠
	 * @returns {string | null} 이미지 URL 또는 null
	 */
	function extractFirstImage(content) {
		if (!content) return null;
		const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
		return imgMatch ? imgMatch[1] : null;
	}

	/**
	 * HTML 태그 제거 및 텍스트 추출
	 * @param {string} html - HTML 문자열
	 * @param {number} maxLength - 최대 길이
	 * @returns {string} 추출된 텍스트
	 */
	function stripHtml(html, maxLength = 150) {
		if (!html) return '';
		const text = html.replace(/<[^>]*>/g, '').trim();
		return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
	}

	/**
	 * 이미지 URL 결정 (우선순위: thumbnail_url > HTML 추출)
	 */
	const imageUrl = $derived.by(() => {
		return post.thumbnail_url || extractFirstImage(post.content);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article
	class="webzine-card"
	onclick={() => onClick()}
>
	{#if imageUrl}
		<div class="webzine-image-container">
			<img
				src={imageUrl}
				alt={post.title}
				class="webzine-image"
				loading="lazy"
			/>
		</div>
	{:else}
		<!-- <div class="webzine-image-placeholder">
			<span class="placeholder-icon">📷</span>
		</div> -->
	{/if}
	
	<div class="webzine-content">
		<div class="webzine-header">
			{#if post.is_pinned}
				<span class="pinned-badge">📌 고정</span>
			{/if}
			<h3 class="webzine-title">{post.title}</h3>
		</div>
		
		<p class="webzine-excerpt">
			{#if post.category?.options?.editor_style === 'html'}
				{stripHtml(post.content, 150)}
			{:else}
				{post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}
			{/if}
		</p>
		
		<div class="webzine-footer">
			<div class="footer-left">
				<UserAvatar
					user={post.author}
					showName={true}
				/>
				<span class="separator">·</span>
				<span class="meta-text">{formatDistanceToNow(post.created_at)}</span>
			</div>
			<div class="footer-right">
				<span class="meta-text">👁️ {post.view_count || 0}</span>
				{#if post.reaction_counts}
					<span class="separator">·</span>
					<ReactionBadge counts={post.reaction_counts} />
				{/if}
			</div>
		</div>
	</div>
</article>

<style>
	.webzine-card {
		background: white;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid #e5e7eb;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.webzine-card:hover {
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		transform: translateY(-4px);
		border-color: #d1d5db;
	}

	.webzine-image-container {
		width: 100%;
		height: 320px;
		overflow: hidden;
		background: #f3f4f6;
		position: relative;
	}

	@media (min-width: 1024px) {
		.webzine-image-container {
			height: 400px;
		}
	}

	.webzine-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.webzine-card:hover .webzine-image {
		transform: scale(1.05);
	}

	.webzine-content {
		padding: 1.5rem;
	}

	@media (min-width: 1024px) {
		.webzine-content {
			padding: 2rem;
		}
	}

	.webzine-header {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.pinned-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		background-color: #fef3c7;
		color: #92400e;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.webzine-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
		line-height: 1.3;
		flex: 1;
	}

	@media (min-width: 1024px) {
		.webzine-title {
			font-size: 1.75rem;
		}
	}

	.webzine-excerpt {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.7;
		margin: 0 0 1.25rem 0;
	}

	@media (min-width: 1024px) {
		.webzine-excerpt {
			font-size: 1rem;
		}
	}

	.webzine-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #9ca3af;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}

	.footer-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.footer-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.separator {
		color: #d1d5db;
	}

	.meta-text {
		color: #6b7280;
	}
</style>

