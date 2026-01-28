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
	import ExcelDataTable from '$lib/components/excel/ExcelDataTable.svelte';

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
	/** @type {boolean} 데이터 테이블 표시 여부 */
	let showDataTable = $state(false);
	/** @type {any | null} 데이터 테이블에 표시할 파일 */
	let selectedFileForView = $state(null);

	let listLoaded = $state(false);

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

		if (listLoaded || isLoadingFiles) return;	// 이미 로드되었거나 로딩 중이면 중복 로드 방지

		isLoadingFiles = true;
		// 검색어를 포함하여 파일 목록 조회
		const searchQuery = filters.search || '';
		const { data, error: listError } = await listExcelFiles(excelTypeParam, searchQuery);
		
		if (listError) {
			console.error('파일 목록을 불러오는 중 오류가 발생했습니다:', listError);
			isLoadingFiles = false;
			return;
		}
		
		excelFiles = data || [];
		isLoadingFiles = false;
		listLoaded = true;
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
		listLoaded = false; // 리스트 갱신을 위해 플래그 리셋
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
	 * @returns {Promise<void>}
	 */
	async function handleApplyFilters() {
		// 검색어가 변경되면 파일 목록 다시 로드
		listLoaded = false; // 리스트 갱신을 위해 플래그 리셋
		await loadExcelFiles();
	}

	/**
	 * 필터 초기화 핸들러
	 * @returns {void}
	 */
	function handleResetFilters() {
		filters = { search: '' };
	}

	/**
	 * 필터링된 파일 목록 (서버에서 이미 필터링된 결과 사용)
	 * @type {Array<any>}
	 */
	const filteredFiles = $derived.by(() => {
		// 서버에서 이미 검색어로 필터링된 결과를 반환
		return excelFiles;
	});

	onMount(() => {
		// console.log('(S)', new Date().toISOString());
		const unsubscribe = authStore.subscribe((state) => {
			user = state.user;
			authLoading = state.loading;
			// console.log('(A)',user === null, authLoading, new Date().toISOString());

			if (!state.loading && !state.user) {
				goto('/login');
			} 
			// else if (state.user && !authLoading) {
			// 	console.log('---(1)----', excelTypeParam);
			// 	loadExcelFiles();
			// }
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * excelType 또는 검색어 변경 시 파일 목록 다시 로드
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

		// fullPath가 있으면 사용, 없으면 기존 방식
		const filePath = file.fullPath || (excelTypeParam ? `${excelTypeParam}/${file.name}` : file.name);
		const { error: deleteError } = await deleteExcelFile(filePath);

		if (deleteError) {
			alert(`파일 삭제 실패: ${deleteError.message}`);
			return;
		}

		listLoaded = false; // 리스트 갱신을 위해 플래그 리셋
		await loadExcelFiles();
		alert('파일이 삭제되었습니다.');
	}

	/**
	 * 파일에서 추출한 데이터 삭제 핸들러
	 * @param {any} file - 삭제할 데이터의 파일 정보
	 * @returns {Promise<void>}
	 */
	async function handleDeleteData(file) {
		if (!confirm(`정말로 "${file.name}" 파일에서 추출한 데이터를 삭제하시겠습니까?`)) {
			return;
		}
	}

	/**
	 * 파일에서 추출한 데이터 보기 핸들러
	 * @param {any} file - 보여줄 데이터의 파일 정보
	 * @returns {Promise<void>}
	 */
	function handleDataView(file) {
		selectedFileForView = file;
		showDataTable = true;
	}

	/**
	 * 데이터 테이블 닫기 핸들러
	 * @returns {void}
	 */
	function handleCloseDataTable() {
		showDataTable = false;
		selectedFileForView = null;
	}

	/**
	 * 파일 다운로드 핸들러
	 * @param {any} file - 다운로드할 파일 정보
	 * @returns {Promise<void>}
	 */
	async function handleDownloadFile(file) {
		// fullPath가 있으면 사용, 없으면 기존 방식
		const filePath = file.fullPath || (excelTypeParam ? `${excelTypeParam}/${file.name}` : file.name);
		const { data: url, error: urlError } = await getExcelFileUrl(filePath);

		if (urlError || !url) {
			alert('파일 다운로드 URL 생성에 실패했습니다.');
			return;
		}

		try {
			// 원본 파일명 가져오기
			const originalFileName = getOriginalFileName(file);
			const downloadFileName = `download_${originalFileName}`;

			// 파일을 fetch로 가져와서 Blob으로 변환 후 다운로드
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('파일 다운로드에 실패했습니다.');
			}

			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);

			// 동적으로 a 태그 생성하여 다운로드 처리
			const link = document.createElement('a');
			link.href = blobUrl;
			link.download = downloadFileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Blob URL 정리
			window.URL.revokeObjectURL(blobUrl);
		} catch (error) {
			console.error('파일 다운로드 중 오류:', error);
			alert('파일 다운로드에 실패했습니다.');
		}
	}

	/**
	 * 파일명에서 원본 파일명 추출
	 * @param {any} file - 파일 객체 (metadata 포함)
	 * @returns {string}
	 */
	function getOriginalFileName(file) {
		// originalFileName 속성이 있으면 사용
		if (file.originalFileName) {
			return file.originalFileName;
		}
		// 메타데이터에서 원본 파일명 가져오기
		if (file.metadata?.originalFileName) {
			return file.metadata.originalFileName;
		}
		// 메타데이터가 없으면 저장된 파일명 반환
		return file.name;
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

	// console.log('(F)', new Date().toISOString());
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
									{ label: '년도', align: 'center' },
									{ label: '월', align: 'center' },
									{ label: '업로드 일시', align: 'center' },
									{ label: '작업', align: 'center' }
								]}
								rowCount={filteredFiles.length}
								emptyMessage="엑셀 파일이 없습니다."
							>
								{#each filteredFiles as file}
									<tr class="hover:bg-gray-50">
										<td class="font-medium">{getOriginalFileName(file)}</td>
										<td class="text-center text-sm text-gray-600">{file.year || '-'}</td>
										<td class="text-center text-sm text-gray-600">{file.month || '-'}</td>
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
												파일삭제
											</button>
											<button
												onclick={() => handleDeleteData(file)}
												class="btn-small btn-delete-data"
											>
												데이터삭제
											</button>
											<button
												onclick={() => handleDataView(file)}
												class="btn-small btn-data-view"
											>
												데이터보기
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

						<!-- 데이터 테이블 (전체 화면) -->
						{#if showDataTable && selectedFileForView}
							<ExcelDataTable
								file={selectedFileForView}
								excelType={excelTypeParam}
								onClose={handleCloseDataTable}
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

	.btn-small {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		border-radius: 0.5rem;
		border: none;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn-small.btn-secondary {
		background-color: #6b7280;
		color: white;
	}

	.btn-small.btn-secondary:hover:not(:disabled) {
		background-color: #4b5563;
	}

	.btn-small.btn-danger {
		background-color: #ef4444;
		color: white;
	}

	.btn-small.btn-danger:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.btn-small.btn-data-view {
		background-color: #22c55e;
		color: white;
	}

	.btn-small.btn-data-view:hover:not(:disabled) {
		background-color: #16a34a;
	}

	.btn-small.btn-delete-data {
		background-color: #f97316;
		color: white;
	}

	.btn-small.btn-delete-data:hover:not(:disabled) {
		background-color: #ea580c;
	}

	.btn-small:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
