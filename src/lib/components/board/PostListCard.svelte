<script>
	let {
		posts = [],
		cardSubtype = 'news',
		onPostClick = () => {}
	} = $props();

	/**
	 * 날짜 포맷팅 (YYYY.MM.DD)
	 * @param {string} dateString
	 * @returns {string}
	 */
	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}.${month}.${day}`;
	}

	/**
	 * 사용자 이름의 첫 글자 추출
	 * @param {string} name
	 * @returns {string}
	 */
	function getInitial(name) {
		if (!name) return '?';
		return name.charAt(0);
	}

	/**
	 * 아바타 배경색 생성 (이름 기반)
	 * @param {string} name
	 * @returns {string}
	 */
	function getAvatarColor(name) {
		if (!name) return 'bg-gray-400';
		const colors = [
			'bg-yellow-400',
			'bg-green-400',
			'bg-blue-400',
			'bg-purple-400',
			'bg-pink-400',
			'bg-indigo-400',
			'bg-red-400',
			'bg-orange-400'
		];
		const index = name.charCodeAt(0) % colors.length;
		return colors[index];
	}

	/**
	 * HTML 태그 제거 및 텍스트만 추출
	 * @param {string} html
	 * @returns {string}
	 */
	function stripHtml(html) {
		if (!html) return '';
		const tmp = document.createElement('DIV');
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
	}

	/**
	 * 텍스트 자르기
	 * @param {string} text
	 * @param {number} maxLength
	 * @returns {string}
	 */
	function truncateText(text, maxLength = 100) {
		if (!text) return '';
		const plainText = stripHtml(text);
		if (plainText.length <= maxLength) return plainText;
		return plainText.substring(0, maxLength) + '...';
	}

	/**
	 * 이미지 URL 추출 (HTML 콘텐츠에서 첫 번째 이미지 찾기)
	 * @param {string} content
	 * @returns {string | null}
	 */
	function extractFirstImage(content) {
		if (!content) return null;
		const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
		return imgMatch ? imgMatch[1] : null;
	}
</script>

<!-- 카드형 리스트 -->
<div class="card-list-container" data-subtype={cardSubtype}>
	{#each posts as post (post.id)}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<article
			class="post-card post-card-{cardSubtype}"
			onclick={() => onPostClick(post)}
		>
			{#if cardSubtype === 'image-heavy'}
				<!-- 1. 이미지 강조형 (갤러리) -->
				<div class="card-image-heavy">
					<div class="image-container">
						{#if post.thumbnail_url}
							<!-- thumbnail_url 우선 사용 -->
							<img
								src={post.thumbnail_url}
								alt={post.title}
								class="card-image"
								onerror={(e) => {
									// thumbnail_url 로드 실패 시 content에서 이미지 추출 시도
									const fallbackImage = extractFirstImage(post.content);
									if (fallbackImage) {
										e.target.src = fallbackImage;
									} else {
										e.target.style.display = 'none';
										e.target.nextElementSibling?.classList.remove('hidden');
									}
								}}
							/>
							<div class="image-placeholder hidden">
								<span class="placeholder-icon">📷</span>
							</div>
						{:else if extractFirstImage(post.content)}
							<!-- content에서 이미지 추출 -->
							<img
								src={extractFirstImage(post.content)}
								alt={post.title}
								class="card-image"
							/>
						{:else}
							<!-- 이미지 없음 -->
							<div class="image-placeholder">
								<span class="placeholder-icon">📷</span>
							</div>
						{/if}
					</div>
					<div class="image-overlay">
						<h3 class="image-title">{post.title}</h3>
					</div>
				</div>

			{:else if cardSubtype === 'news'}
				<!-- 2. 뉴스/기사형 -->
				<div class="card-news">
					{#if extractFirstImage(post.content)}
						<div class="news-thumbnail">
							<img
								src={extractFirstImage(post.content)}
								alt={post.title}
								class="thumbnail-image"
							/>
						</div>
					{/if}
					<div class="news-content">
						<h3 class="news-title">{post.title}</h3>
						<p class="news-excerpt">
							{truncateText(post.content, 150)}
						</p>
						<div class="news-footer">
							<div class="news-meta">
								<span class="news-date">{formatDate(post.created_at)}</span>
								<span class="news-separator">·</span>
								<span class="news-author">{post.author?.full_name || '익명'}</span>
							</div>
							<div class="news-stats">
								<span class="stat-item">👁️ {post.view_count || 0}</span>
								<span class="stat-item">❤️ {post.reaction_counts?.like_count || 0}</span>
								<span class="stat-item">💬 {post.comment_count || 0}</span>
							</div>
						</div>
					</div>
				</div>

			{:else if cardSubtype === 'commerce'}
				<!-- 3. 상품/커머스형 -->
				<div class="card-commerce">
					<div class="commerce-image-wrapper">
						{#if extractFirstImage(post.content)}
							<img
								src={extractFirstImage(post.content)}
								alt={post.title}
								class="commerce-image"
							/>
						{:else}
							<div class="commerce-placeholder">
								<span class="placeholder-icon">🛍️</span>
							</div>
						{/if}
						<button class="commerce-wishlist" onclick={(e) => { e.stopPropagation(); }}>
							❤️
						</button>
					</div>
					<div class="commerce-info">
						<div class="commerce-brand">{post.author?.full_name || '브랜드'}</div>
						<h3 class="commerce-title">{post.title}</h3>
						<div class="commerce-rating">
							<span class="stars">⭐⭐⭐⭐⭐</span>
							<span class="review-count">({post.comment_count || 0})</span>
						</div>
						<div class="commerce-price">
							<span class="price-label">가격</span>
							<span class="price-value">정보 없음</span>
						</div>
					</div>
				</div>

			{:else if cardSubtype === 'profile'}
				<!-- 4. 프로필/인물형 -->
				<div class="card-profile">
					<div class="profile-avatar-wrapper">
						{#if post.author?.avatar_url}
							<img
								src={post.author.avatar_url}
								alt={post.author.full_name || 'User'}
								class="profile-avatar"
							/>
						{:else}
							<div class="profile-avatar-circle {getAvatarColor(post.author?.full_name || '')}">
								{getInitial(post.author?.full_name || '?')}
							</div>
						{/if}
					</div>
					<div class="profile-info">
						<h3 class="profile-name">{post.author?.full_name || '익명'}</h3>
						<div class="profile-title">{post.title}</div>
						{#if post.content}
							<div class="profile-tags">
								{truncateText(post.content, 80)}
							</div>
						{/if}
						<div class="profile-stats">
							<span class="profile-stat">게시물 {post.view_count || 0}</span>
							<span class="profile-stat">·</span>
							<span class="profile-stat">좋아요 {post.reaction_counts?.like_count || 0}</span>
						</div>
					</div>
				</div>

			{:else}
				<!-- 기본: 뉴스/기사형 -->
				<div class="card-news">
					{#if extractFirstImage(post.content)}
						<div class="news-thumbnail">
							<img
								src={extractFirstImage(post.content)}
								alt={post.title}
								class="thumbnail-image"
							/>
						</div>
					{/if}
					<div class="news-content">
						<h3 class="news-title">{post.title}</h3>
						<p class="news-excerpt">
							{truncateText(post.content, 150)}
						</p>
						<div class="news-footer">
							<div class="news-meta">
								<span class="news-date">{formatDate(post.created_at)}</span>
								<span class="news-separator">·</span>
								<span class="news-author">{post.author?.full_name || '익명'}</span>
							</div>
							<div class="news-stats">
								<span class="stat-item">👁️ {post.view_count || 0}</span>
								<span class="stat-item">❤️ {post.reaction_counts?.like_count || 0}</span>
								<span class="stat-item">💬 {post.comment_count || 0}</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</article>
	{/each}
</div>

<style>
	.card-list-container {
		display: grid;
		gap: 1rem;
	}

	/* 공통 카드 스타일 */
	.post-card {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.post-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	/* 1. 이미지 강조형 */
	.card-list-container[data-subtype="image-heavy"] {
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	}

	.card-image-heavy {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		overflow: hidden;
	}

	.image-container {
		width: 100%;
		height: 100%;
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.image-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon {
		font-size: 3rem;
		opacity: 0.5;
	}

	.image-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
		padding: 1rem;
	}

	.image-title {
		color: white;
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		line-height: 1.4;
	}

	/* 2. 뉴스/기사형 */
	.card-news {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
	}

	.news-thumbnail {
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: 6px;
	}

	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.news-content {
		flex: 1;
	}

	.news-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.75rem 0;
		line-height: 1.4;
	}

	.news-excerpt {
		font-size: 0.875rem;
		color: #4b5563;
		line-height: 1.6;
		margin: 0 0 1rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.news-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.news-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.news-separator {
		color: #d1d5db;
	}

	.news-stats {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* 3. 상품/커머스형 */
	.card-list-container[data-subtype="commerce"] {
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	}

	.card-commerce {
		display: flex;
		flex-direction: column;
		padding: 1rem;
	}

	.commerce-image-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		margin-bottom: 0.75rem;
		border-radius: 6px;
		overflow: hidden;
	}

	.commerce-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.commerce-placeholder {
		width: 100%;
		height: 100%;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.commerce-wishlist {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: white;
		border: none;
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-size: 1rem;
		transition: transform 0.2s;
	}

	.commerce-wishlist:hover {
		transform: scale(1.1);
	}

	.commerce-info {
		flex: 1;
	}

	.commerce-brand {
		font-size: 0.75rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.commerce-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.commerce-rating {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
	}

	.stars {
		color: #fbbf24;
	}

	.review-count {
		color: #6b7280;
	}

	.commerce-price {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.price-label {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.price-value {
		font-size: 1rem;
		font-weight: 700;
		color: #1f2937;
	}

	/* 4. 프로필/인물형 */
	.card-list-container[data-subtype="profile"] {
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	}

	.card-profile {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1.5rem;
		text-align: center;
	}

	.profile-avatar-wrapper {
		margin-bottom: 1rem;
	}

	.profile-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #e5e7eb;
	}

	.profile-avatar-circle {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 700;
		font-size: 2rem;
		border: 3px solid #1f2937;
	}

	.profile-info {
		width: 100%;
	}

	.profile-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.profile-title {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.75rem;
		font-weight: 500;
	}

	.profile-tags {
		font-size: 0.75rem;
		color: #4b5563;
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.profile-stats {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.profile-stat {
		color: #6b7280;
	}

	/* 반응형 */
	@media (max-width: 640px) {
		.card-list-container[data-subtype="image-heavy"],
		.card-list-container[data-subtype="commerce"],
		.card-list-container[data-subtype="profile"] {
			grid-template-columns: 1fr;
		}

		.card-list-container[data-subtype="news"] {
			grid-template-columns: 1fr;
		}

		.card-news {
			padding: 0.75rem;
		}

		.news-title {
			font-size: 0.9375rem;
		}

		.news-excerpt {
			font-size: 0.8125rem;
			-webkit-line-clamp: 2;
			line-clamp: 2;
		}

		.news-footer {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.profile-avatar,
		.profile-avatar-circle {
			width: 60px;
			height: 60px;
			font-size: 1.5rem;
		}

		.card-profile {
			padding: 1.25rem 1rem;
		}

		.image-title {
			font-size: 0.875rem;
		}
	}
</style>
