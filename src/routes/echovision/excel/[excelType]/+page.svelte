<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getExcelFileUrl, listExcelFiles, deleteExcelFile } from '$lib/excelUploadService';
	import { authStore } from '$lib/stores/authStore';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import ExcelUploadViewer from '$lib/components/excel/ExcelUploadViewer.svelte';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $state(null);
	let authLoading = $state(true);
	/** @type {boolean} 모바일 사이드바 열림 상태 */
	let isSidebarOpen = $state(false);

	/** @type {Array<any>} 엑셀 파일 목록 */
	let excelFiles = $state([]);
	/** @type {Record<string, any>} 필터 객체 */
	let filters = $state({ search: '' });
	/** @type {boolean} 파일 목록 로딩 중 */
	let isLoadingFiles = $state(false);
	/** @type {boolean} 업로드 뷰어 표시 여부 */
	let showUploadViewer = $state(false);

	/**
	 * URL 파라미터에서 excelType 읽기
	 * @type {string}
	 */
	const excelTypeParam = $derived.by(() => {
		const params = page.params;
		return params?.excelType || '';
	});

	/**
	 * 엑셀 파일 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadExcelFiles() {
		if (!excelTypeParam) return;
		
		isLoadingFiles = true;
		const { data, error: listError } = await listExcelFiles(excelTypeParam);
		
		if (listError) {
			console.error('파일 목록을 불러오는 중 오류가 발생했습니다:', listError);
			isLoadingFiles = false;
			return;
		}
		
		excelFiles = data || [];
		isLoadingFiles = false;
	}

	/**
	 * 업로드 뷰어 열기 핸들러
	 * @returns {void}
	 */
	function handleOpenUploadViewer() {
		showUploadViewer = true;
	}

	/**
	 * 업로드 뷰어 닫기 핸들러
	 * @returns {void}
	 */
	function handleCloseUploadViewer() {
		showUploadViewer = false;
	}

	/**
	 * 업로드 성공 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleUploadSuccess() {
		await loadExcelFiles();
	}

	/**
	 * 필터 필드 정의
	 * @type {Array<any>}
	 */
	const filterFields = [
		{
			key: 'search',
			type: 'input',
			placeholder: '파일명 검색...'
		}
	];

	/**
	 * 액션 버튼 정의
	 * @type {Array<any>}
	 */
	const actionButtons = [
		{
			label: '엑셀 업로드',
			variant: 'primary',
			onClick: handleOpenUploadViewer
		}
	];

	/**
	 * 필터 적용 핸들러
	 * @returns {void}
	 */
	function handleApplyFilters() {
		// 필터는 자동으로 적용되므로 별도 처리 불필요
	}

	/**
	 * 필터 초기화 핸들러
	 * @returns {void}
	 */
	function handleResetFilters() {
		filters = { search: '' };
	}

	/**
	 * 검색어로 필터링된 파일 목록
	 * @type {Array<any>}
	 */
	const filteredFiles = $derived.by(() => {
		const searchQuery = filters.search || '';
		if (!searchQuery.trim()) {
			return excelFiles;
		}
		
		const query = searchQuery.toLowerCase();
		return excelFiles.filter((file) => {
			const fileName = file.name.toLowerCase();
			return fileName.includes(query);
		});
	});

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;

			if (!state.loading && !state.user) {
				goto('/login');
			} else if (state.user && !authLoading) {
				loadExcelFiles();
			}
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * excelType 변경 시 파일 목록 다시 로드
	 */
	$effect(() => {
		if (user && !authLoading && excelTypeParam) {
			loadExcelFiles();
		}
	});


	/**
	 * 파일 삭제 핸들러
	 * @param {any} file - 삭제할 파일 정보
	 * @returns {Promise<void>}
	 */
	async function handleDeleteFile(file) {
		if (!confirm(`정말로 "${file.name}" 파일을 삭제하시겠습니까?`)) {
			return;
		}

		const filePath = excelTypeParam ? `${excelTypeParam}/${file.name}` : file.name;
		const { error: deleteError } = await deleteExcelFile(`excel-files/${filePath}`);

		if (deleteError) {
			alert(`파일 삭제 실패: ${deleteError.message}`);
			return;
		}

		await loadExcelFiles();
		alert('파일이 삭제되었습니다.');
	}

	/**
	 * 파일 다운로드 핸들러
	 * @param {any} file - 다운로드할 파일 정보
	 * @returns {Promise<void>}
	 */
	async function handleDownloadFile(file) {
		const filePath = excelTypeParam ? `${excelTypeParam}/${file.name}` : file.name;
		const { data: url, error: urlError } = await getExcelFileUrl(`excel-files/${filePath}`);

		if (urlError || !url) {
			alert('파일 다운로드 URL 생성에 실패했습니다.');
			return;
		}

		window.open(url, '_blank');
	}

	/**
	 * 파일명에서 원본 파일명 추출
	 * @param {string} fileName - Storage 파일명
	 * @returns {string}
	 */
	function getOriginalFileName(fileName) {
		// 파일명 형식: timestamp_random.ext
		// 원본 파일명은 메타데이터에 저장되어 있지 않으므로 파일명 그대로 반환
		return fileName;
	}

	/**
	 * 날짜 포맷팅
	 * @param {string} dateString - ISO 날짜 문자열
	 * @returns {string}
	 */
	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * 엑셀 타입 라벨 가져오기
	 * @param {string} type - 엑셀 타입
	 * @returns {string}
	 */
	function getExcelTypeLabel(type) {
		const labels = {
			sales: '매출',
			cost: '비용'
		};
		return labels[type] || type;
	}
</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<PrjMainSidebar bind:isOpen={isSidebarOpen} />

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto bg-gray-50">
			<div class="p-3">
				{#if authLoading}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로딩 중...</div>
					</div>
				{:else if !user}
					<div class="flex items-center justify-center h-full">
						<div class="text-gray-500">로그인이 필요합니다.</div>
					</div>
				{:else}
					<div class="admin-content-page">
						<!-- 헤더 -->
						<div class="mb-6">
							<div class="flex items-center gap-3 mb-2">
								<!-- 모바일 햄버거 버튼 -->
								<button
									onclick={() => (isSidebarOpen = true)}
									class="md:hidden p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
									aria-label="메뉴 열기"
								>
									<svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6h16M4 12h16M4 18h16"
										/>
									</svg>
								</button>
								<h1 class="text-2xl font-bold text-gray-900">{getExcelTypeLabel(excelTypeParam) || '엑셀'} 파일 관리</h1>
							</div>
						</div>

						<!-- 검색 필터 및 업로드 버튼 -->
						<FilterBar
							bind:filters={filters}
							fields={filterFields}
							onApply={handleApplyFilters}
							onReset={handleResetFilters}
							actions={actionButtons}
						/>

						<!-- 파일 목록 -->
						{#if isLoadingFiles}
							<div class="text-center py-12">
								<div class="spinner mx-auto"></div>
								<p class="mt-4 text-gray-500">파일 목록을 불러오는 중...</p>
							</div>
						{:else if filteredFiles.length === 0}
							<div class="text-center py-12 bg-white border border-gray-200 rounded-lg">
								<p class="text-gray-500">
									{filters.search ? '검색 결과가 없습니다.' : '업로드된 엑셀 파일이 없습니다.'}
								</p>
							</div>
						{:else}
							<DataTable
								headers={[
									{ label: '파일명', align: 'left' },
									{ label: '업로드 일시', align: 'center' },
									{ label: '작업', align: 'center' }
								]}
								rowCount={filteredFiles.length}
								emptyMessage="엑셀 파일이 없습니다."
							>
								{#each filteredFiles as file}
									<tr class="hover:bg-gray-50">
										<td class="font-medium">{getOriginalFileName(file.name)}</td>
										<td class="text-center text-sm text-gray-600">{formatDate(file.created_at)}</td>
										<td class="flex justify-center gap-2">
											<button
												onclick={() => handleDownloadFile(file)}
												class="btn-small btn-secondary"
											>
												다운로드
											</button>
											<button
												onclick={() => handleDeleteFile(file)}
												class="btn-small btn-danger"
											>
												삭제
											</button>
										</td>
									</tr>
								{/each}
							</DataTable>
						{/if}

						<!-- 업로드 뷰어 (전체 화면) -->
						{#if showUploadViewer}
							<ExcelUploadViewer
								excelType={excelTypeParam}
								onClose={handleCloseUploadViewer}
								onUploadSuccess={handleUploadSuccess}
							/>
						{/if}
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<style>
	.admin-content-page {
		width: 100%;
	}
</style>
