<script>
	import PostStyleTimeline from './PostStyleTimeline.svelte';

	let {
		posts = [],
		onPostClick = () => {}
	} = $props();

	/**
	 * 날짜 키 생성 (YYYY-MM-DD 형식)
	 * @param {Date} date - 날짜 객체
	 * @returns {string} 날짜 키
	 */
	function getDateKey(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/**
	 * 날짜 표시 라벨 생성
	 * @param {string} dateKey - 날짜 키 (YYYY-MM-DD)
	 * @returns {string} 표시용 날짜 라벨
	 */
	function getDateLabel(dateKey) {
		const [year, month, day] = dateKey.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'long'
		});
	}

	/**
	 * 날짜별로 게시물 그룹화 및 정렬
	 * @param {Array} posts - 게시물 배열
	 * @returns {Array<[string, Array]>} 날짜별로 그룹화되고 정렬된 게시물 배열
	 */
	function groupPostsByDate(posts) {
		const grouped = new Map();
		
		// 날짜별로 그룹화
		posts.forEach(post => {
			const date = new Date(post.created_at);
			const dateKey = getDateKey(date);
			
			if (!grouped.has(dateKey)) {
				grouped.set(dateKey, []);
			}
			grouped.get(dateKey).push(post);
		});
		
		// 같은 날짜 내에서 시간순 정렬 (최신이 위에)
		grouped.forEach((datePosts, dateKey) => {
			datePosts.sort((a, b) => {
				return new Date(b.created_at) - new Date(a.created_at);
			});
		});
		
		// 날짜별로 정렬 (최신 날짜가 위에)
		const sortedEntries = Array.from(grouped.entries()).sort(([dateKeyA], [dateKeyB]) => {
			return dateKeyB.localeCompare(dateKeyA);
		});
		
		return sortedEntries;
	}

	/**
	 * 날짜별 그룹화된 게시물 목록
	 */
	const groupedPosts = $derived.by(() => {
		return groupPostsByDate(posts);
	});
</script>

<!-- 타임라인형: 업무 이력 관리에 특화된 레이아웃 -->
<div class="timeline-container">
	<div class="timeline-center-line"></div>
	{#each groupedPosts as [dateKey, datePosts], index (dateKey)}
		{@const isLeft = index % 2 === 0}
		<div class="timeline-date-group" class:left={isLeft} class:right={!isLeft}>
			<div class="timeline-date-header">
				<div class="timeline-date-line"></div>
				<h2 class="timeline-date-title">{getDateLabel(dateKey)}</h2>
				<div class="timeline-date-line"></div>
			</div>
			
			<div class="timeline-posts-wrapper" class:left={isLeft} class:right={!isLeft}>
				<div class="timeline-line"></div>
				<div class="timeline-posts">
					{#each datePosts as post (post.id)}
						<div class="timeline-post-wrapper">
							<div class="timeline-dot"></div>
							<div class="timeline-dot-connector"></div>
							<div class="timeline-item-container">
								<PostStyleTimeline
									{post}
									onClick={() => onPostClick(post)}
								/>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.timeline-container {
		position: relative;
		padding: 1rem 0;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* PC: 중앙 타임라인 라인 */
	.timeline-center-line {
		display: none;
	}

	@media (min-width: 1024px) {
		.timeline-center-line {
			display: block;
			position: absolute;
			left: 50%;
			top: 0;
			bottom: 0;
			width: 3px;
			background: linear-gradient(to bottom, #3b82f6, #60a5fa, #93c5fd);
			transform: translateX(-50%);
			border-radius: 2px;
			z-index: 1;
		}
	}

	.timeline-date-group {
		margin-bottom: 3rem;
		position: relative;
	}

	.timeline-date-group:last-child {
		margin-bottom: 0;
	}

	/* PC: 왼쪽/오른쪽 배치 (중앙 기준) */
	@media (min-width: 1024px) {
		.timeline-date-group.left {
			position: relative;
			padding-right: calc(50% + 1rem);
		}

		.timeline-date-group.left .timeline-date-header {
			max-width: calc(50% - 2rem);
			margin-right: 0;
			margin-left: auto;
		}

		.timeline-date-group.left .timeline-posts-wrapper {
			margin-right: 0;
			margin-left: auto;
		}

		.timeline-date-group.left .timeline-posts {
			align-items: flex-end;
		}

		.timeline-date-group.right {
			position: relative;
			padding-left: calc(50% + 1rem);
		}

		.timeline-date-group.right .timeline-date-header {
			max-width: calc(50% - 2rem);
			margin-left: 0;
			margin-right: auto;
		}

		.timeline-date-group.right .timeline-posts-wrapper {
			margin-left: 0;
			margin-right: auto;
		}

		.timeline-date-group.right .timeline-posts {
			align-items: flex-start;
		}
	}

	.timeline-date-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		position: relative;
	}

	/* PC: 날짜 헤더 정렬 - 왼쪽은 오른쪽 정렬, 오른쪽은 왼쪽 정렬 */
	@media (min-width: 1024px) {
		.timeline-date-group.left .timeline-date-header {
			justify-content: flex-end;
		}

		.timeline-date-group.right .timeline-date-header {
			justify-content: flex-start;
		}
	}

	.timeline-date-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(to right, transparent, #e5e7eb, transparent);
	}

	@media (min-width: 1024px) {
		.timeline-date-group.left .timeline-date-line:first-child {
			display: none;
		}

		.timeline-date-group.right .timeline-date-line:last-child {
			display: none;
		}
	}

	.timeline-date-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: white;
		margin: 0;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #dbdee3, #111827);
		border: 2px solid #030712;
		border-radius: 0.5rem;
		white-space: nowrap;
		position: relative;
		z-index: 2;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	@media (min-width: 640px) {
		.timeline-date-title {
			font-size: 1.25rem;
		}
	}

	/* 모바일: 기존 스타일 */
	.timeline-posts-wrapper {
		position: relative;
		padding-left: 2rem;
	}

	@media (min-width: 1024px) {
		.timeline-posts-wrapper {
			padding-left: 0;
		}
	}

	/* 모바일: 왼쪽 타임라인 라인 */
	.timeline-line {
		position: absolute;
		left: 0.5rem;
		top: 0;
		bottom: 0;
		width: 2px;
		background: linear-gradient(to bottom, #3b82f6, #60a5fa, #93c5fd);
		border-radius: 1px;
	}

	@media (min-width: 1024px) {
		.timeline-line {
			display: none;
		}
	}

	/* PC: 중앙 라인과 연결되는 점 */
	.timeline-dot-connector {
		display: none;
	}

	@media (min-width: 1024px) {
		.timeline-dot-connector {
			display: block;
			position: absolute;
			width: 1rem;
			height: 1rem;
			background: #3b82f6;
			border: 3px solid white;
			border-radius: 50%;
			box-shadow: 0 0 0 3px #3b82f6;
			z-index: 2;
			top: 1rem;
		}

		/* 왼쪽 포스트: 포스트의 오른쪽 가장자리에서 중앙 라인까지의 거리
		   .timeline-post-wrapper 기준으로 계산
		   포스트가 오른쪽 정렬되어 있고, 중앙 라인은 컨테이너의 50% 위치에 있음
		   포스트의 오른쪽 가장자리에서 중앙 라인까지의 거리는 24px (연결점의 중심이 중앙 라인에 맞도록) */
		.timeline-posts-wrapper.left .timeline-dot-connector {
			right: -24px;
		}

		/* 오른쪽 포스트: 포스트의 왼쪽 가장자리에서 중앙 라인까지의 거리
		   .timeline-post-wrapper 기준으로 계산
		   포스트가 왼쪽 정렬되어 있고, 중앙 라인은 컨테이너의 50% 위치에 있음
		   포스트의 왼쪽 가장자리에서 중앙 라인까지의 거리는 24px (연결점의 중심이 중앙 라인에 맞도록) */
		.timeline-posts-wrapper.right .timeline-dot-connector {
			left: -24px;
		}
	}

	.timeline-posts {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.timeline-post-wrapper {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		width: 100%;
	}

	.timeline-item-container {
		flex: 1;
		min-width: 0;
	}

	@media (min-width: 1024px) {
		.timeline-date-group.left .timeline-post-wrapper {
			justify-content: flex-end;
		}

		.timeline-date-group.left .timeline-item-container {
			display: flex;
			justify-content: flex-end;
			width: 100%;
		}

		.timeline-date-group.right .timeline-post-wrapper {
			justify-content: flex-start;
		}

		.timeline-date-group.right .timeline-item-container {
			display: flex;
			justify-content: flex-start;
			width: 100%;
		}
	}

	/* 모바일: 왼쪽 점 */
	.timeline-dot {
		position: absolute;
		left: -1.8rem;
		top: 1rem;
		width: 0.75rem;
		height: 0.75rem;
		background: #3b82f6;
		border: 2px solid white;
		border-radius: 50%;
		box-shadow: 0 0 0 2px #3b82f6;
		flex-shrink: 0;
		z-index: 2;
	}

	@media (min-width: 1024px) {
		.timeline-dot {
			display: none;
		}
	}

	/* 반응형: 모바일 */
	@media (max-width: 640px) {
		.timeline-posts-wrapper {
			padding-left: 1.5rem;
		}

		.timeline-dot {
			left: -1.25rem;
			width: 0.625rem;
			height: 0.625rem;
		}

		.timeline-date-header {
			flex-direction: column;
			gap: 0.5rem;
		}

		.timeline-date-line {
			display: none;
		}

		.timeline-date-title {
			text-align: center;
		}
	}
</style>


