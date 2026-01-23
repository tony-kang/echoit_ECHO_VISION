<script>
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
	 * 썸네일 URL (유튜브 URL 변환 포함)
	 */
	const thumbnailUrl = $derived.by(() => {
		return post.thumbnail_url ? getThumbnailUrl(post.thumbnail_url) : null;
	});

	/**
	 * 유튜브 URL 여부
	 */
	const isYouTube = $derived.by(() => {
		return post.thumbnail_url ? isYouTubeUrl(post.thumbnail_url) : false;
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article
	class="feed-pin"
	onclick={() => onClick()}
>
	{#if thumbnailUrl}
		<div class="feed-image-container">
			<img
				src={thumbnailUrl}
				alt={post.title}
				class="feed-image"
				loading="lazy"
			/>
			{#if post.is_pinned}
				<div class="pinned-badge">📌</div>
			{/if}
			{#if isYouTube}
				<div class="youtube-badge">
					<svg class="youtube-icon" fill="currentColor" viewBox="0 0 24 24">
						<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
					</svg>
				</div>
			{/if}
		</div>
	{/if}
	
	<div class="feed-content">
		<h3 class="feed-title">{post.title}</h3>
		
		{#if post.content}
			<p class="feed-description">
				{#if post.category?.options?.editor_style === 'html'}
					{stripHtml(post.content, 100)}
				{:else}
					{post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
				{/if}
			</p>
		{/if}
		
		<div class="feed-footer">
			<UserAvatar
				user={post.author}
				showName={true}
			/>
			<div class="feed-meta">
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
	.feed-pin {
		background: white;
		border-radius: 1rem;
		border: none;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
	}

	.feed-pin:hover {
		box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
		transform: scale(1.02);
	}

	.feed-image-container {
		position: relative;
		width: 100%;
		overflow: hidden;
		background: #f3f4f6;
	}

	.feed-image {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
	}

	.pinned-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(255, 255, 255, 0.95);
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		backdrop-filter: blur(4px);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		z-index: 2;
	}

	.youtube-badge {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		background: rgba(255, 0, 0, 0.9);
		padding: 0.375rem;
		border-radius: 0.375rem;
		backdrop-filter: blur(4px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		z-index: 2;
	}

	.youtube-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: white;
	}

	.feed-content {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.5rem;
		min-height: 0;
	}

	.feed-title {
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

	.feed-description {
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

	.feed-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 0.5rem;
		font-size: 0.75rem;
	}

	.feed-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #9ca3af;
	}
</style>

