<script>
	/** @type {string} 검색어 */
	let searchQuery = $state('');
	/** @type {boolean} 검색 중 여부 */
	let isSearching = $state(false);
	/** @type {Array<any>} 검색 결과 */
	let searchResults = $state([]);
	/** @type {string | null} 에러 메시지 */
	let error = $state(null);

	/**
	 * 화물 검색 실행
	 * @returns {Promise<void>}
	 */
	async function handleSearch() {
		if (!searchQuery.trim()) {
			error = '검색어를 입력해주세요.';
			return;
		}

		isSearching = true;
		error = null;
		searchResults = [];

		try {
			// TODO: 실제 검색 API 연동
			// 예시: const { data, error: err } = await searchShipments(searchQuery);
			
			// 임시 데이터
			await new Promise(resolve => setTimeout(resolve, 500));
			searchResults = [];
		} catch (err) {
			error = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.';
		} finally {
			isSearching = false;
		}
	}

	/**
	 * Enter 키 입력 시 검색 실행
	 * @param {KeyboardEvent} event
	 * @returns {void}
	 */
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}
</script>

<svelte:head>
	<title>화물 검색 - 에코비전</title>
</svelte:head>

<div class="main-content-page">
	<main>
		<div class="max-w-4xl mx-auto px-4 py-8">
			<!-- 페이지 헤더 -->
			<div class="text-center mb-8">
				<h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">화물 검색</h1>
				<p class="text-gray-600">화물번호, 송장번호, 운송장번호로 검색하세요</p>
			</div>

			<!-- 검색 영역 -->
			<div class="bg-white rounded-lg shadow-md p-6 mb-8">
				<div class="flex flex-col md:flex-row gap-4">
					<div class="flex-1">
						<input
							type="text"
							bind:value={searchQuery}
							onkeypress={handleKeyPress}
							placeholder="화물번호, 송장번호, 운송장번호 입력"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
							disabled={isSearching}
						/>
					</div>
					<button
						onclick={handleSearch}
						disabled={isSearching}
						class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if isSearching}
							<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							검색 중...
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
							</svg>
							검색
						{/if}
					</button>
				</div>

				{#if error}
					<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
						{error}
					</div>
				{/if}
			</div>

			<!-- 검색 결과 영역 -->
			{#if searchResults.length > 0}
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">검색 결과</h2>
					<div class="space-y-4">
						{#each searchResults as result}
							<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
								<!-- 검색 결과 항목 -->
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h3 class="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
										<p class="text-gray-600">{result.description}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if searchQuery && !isSearching && !error}
				<div class="bg-white rounded-lg shadow-md p-12 text-center">
					<svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<p class="text-gray-500 text-lg">검색 결과가 없습니다.</p>
					<p class="text-gray-400 text-sm mt-2">다른 검색어로 시도해보세요.</p>
				</div>
			{/if}
		</div>
	</main>
</div>
