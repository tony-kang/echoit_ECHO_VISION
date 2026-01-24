<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as XLSX from 'xlsx';
	import { uploadExcelFile, getExcelFileUrl, listExcelFiles, deleteExcelFile } from '$lib/excelUploadService';
	import { authStore } from '$lib/stores/authStore';
	import PrjMainSidebar from '$lib/components/PrjMainSidebar.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';

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
	/** @type {boolean} 업로드 모달 표시 여부 */
	let showUploadModal = $state(false);

	/** @type {File | null} 선택된 파일 */
	let selectedFile = $state(null);
	/** @type {string} 파일명 */
	let fileName = $state('');
	/** @type {any} 워크북 객체 */
	let workbook = $state(null);
	/** @type {string[]} 시트 이름 목록 */
	let sheetNames = $state([]);
	/** @type {string} 선택된 시트 */
	let selectedSheet = $state('');
	/** @type {string[]} 헤더 목록 */
	let headers = $state([]);
	/** @type {Array<any[]>} 행 데이터 */
	let rows = $state([]);
	/** @type {string} 에러 메시지 */
	let error = $state('');
	/** @type {boolean} 업로드 중 여부 */
	let isUploading = $state(false);
	/** @type {boolean} 파일 읽기 중 여부 */
	let isLoading = $state(false);
	/** @type {string | null} 업로드된 파일 ID */
	let uploadedFileId = $state(null);
	/** @type {string | null} 업로드된 파일명 */
	let uploadedFileName = $state(null);

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
			error = '파일 목록을 불러오는 중 오류가 발생했습니다.';
			isLoadingFiles = false;
			return;
		}
		
		excelFiles = data || [];
		isLoadingFiles = false;
	}

	/**
	 * 업로드 모달 열기 핸들러
	 * @returns {void}
	 */
	function handleOpenUploadModal() {
		showUploadModal = true;
		handleClear();
	}

	/**
	 * 업로드 모달 닫기 핸들러
	 * @returns {void}
	 */
	function handleCloseUploadModal() {
		showUploadModal = false;
		handleClear();
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
			onClick: handleOpenUploadModal
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
	 * 파일 선택 핸들러
	 * @param {Event} event - 파일 입력 이벤트
	 * @returns {void}
	 */
	function handleFileSelect(event) {
		error = '';
		const file = event.target.files?.[0];
		
		if (!file) {
			return;
		}

		// 엑셀 파일인지 확인
		const allowedTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-excel',
			'text/csv'
		];
		
		if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
			error = '엑셀 파일(.xlsx, .xls, .csv)만 선택할 수 있습니다.';
			return;
		}

		selectedFile = file;
		fileName = file.name;
		readExcelFile(file);
	}

	/**
	 * 엑셀 파일 읽기
	 * @param {File} file - 읽을 파일
	 * @returns {void}
	 */
	function readExcelFile(file) {
		isLoading = true;
		error = '';
		
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target.result);
				workbook = XLSX.read(data, { type: 'array' });
				sheetNames = workbook.SheetNames;
				
				if (sheetNames.length > 0) {
					selectedSheet = sheetNames[0];
					loadSheet(selectedSheet);
				} else {
					error = '엑셀 파일에 시트가 없습니다.';
					isLoading = false;
				}
			} catch (err) {
				error = '엑셀 파일을 읽는 중 오류가 발생했습니다: ' + err.message;
				console.error('Error reading file:', err);
				isLoading = false;
			}
		};

		reader.onerror = () => {
			error = '파일을 읽는 중 오류가 발생했습니다.';
			isLoading = false;
		};

		reader.readAsArrayBuffer(file);
	}

	/**
	 * 시트 로드
	 * @param {string} sheetName - 시트 이름
	 * @returns {void}
	 */
	function loadSheet(sheetName) {
		if (!workbook || !sheetName) return;

		const worksheet = workbook.Sheets[sheetName];
		const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

		// 빈 행 제거 함수
		const isRowEmpty = (row) => {
			if (!row || row.length === 0) return true;
			return row.every(cell => cell === '' || cell === null || cell === undefined);
		};

		// 빈 행이 아닌 데이터만 필터링
		const filteredData = jsonData.filter(row => !isRowEmpty(row));

		if (filteredData.length > 0) {
			headers = filteredData[0] || [];
			rows = filteredData.slice(1);
		} else {
			headers = [];
			rows = [];
		}

		isLoading = false;
	}

	/**
	 * 시트 변경 핸들러
	 * @param {Event} event - 변경 이벤트
	 * @returns {void}
	 */
	function handleSheetChange(event) {
		const sheetName = event.target.value;
		selectedSheet = sheetName;
		loadSheet(sheetName);
	}

	/**
	 * 파일 업로드 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleUpload() {
		if (!selectedFile || !excelTypeParam) {
			error = '파일을 선택하고 엑셀 타입을 확인해주세요.';
			return;
		}

		isUploading = true;
		error = '';

		const { data, error: uploadError } = await uploadExcelFile(selectedFile, excelTypeParam);

		if (uploadError) {
			error = uploadError.message || '파일 업로드에 실패했습니다.';
			isUploading = false;
			return;
		}

		if (data) {
			uploadedFileId = data.fileId;
			uploadedFileName = data.fileName;
			showUploadModal = false;
			selectedFile = null;
			fileName = '';
			workbook = null;
			headers = [];
			rows = [];
			await loadExcelFiles();
			alert('파일이 성공적으로 업로드되었습니다.');
		}

		isUploading = false;
	}

	/**
	 * 파일 초기화 핸들러
	 * @returns {void}
	 */
	function handleClear() {
		selectedFile = null;
		fileName = '';
		workbook = null;
		sheetNames = [];
		selectedSheet = '';
		headers = [];
		rows = [];
		error = '';
		uploadedFileId = null;
		uploadedFileName = null;
	}

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

						<!-- 업로드 모달 -->
						{#if showUploadModal}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="modal-overlay" onclick={handleCloseUploadModal}>
								<div class="modal-content" onclick={(e) => e.stopPropagation()}>
									<div class="modal-header">
										<h2>엑셀 파일 업로드</h2>
										<button onclick={handleCloseUploadModal} class="modal-close">×</button>
									</div>
									<div class="modal-body">
										<div class="upload-section">
											<div class="upload-controls">
												<input
													type="file"
													accept=".xlsx,.xls,.csv"
													onchange={handleFileSelect}
													id="file-input"
													class="file-input-hidden"
												/>
												<label for="file-input" class="upload-button">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
													</svg>
													{fileName || '파일 선택'}
												</label>

												{#if fileName && !isUploading}
													<button onclick={handleUpload} class="btn-primary">
														업로드
													</button>
												{/if}

												{#if fileName}
													<button onclick={handleClear} class="btn-secondary">
														초기화
													</button>
												{/if}
											</div>

											{#if error}
												<div class="error-message">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													{error}
												</div>
											{/if}

											{#if isUploading}
												<div class="loading-message">
													<div class="spinner"></div>
													<p>파일 업로드 중...</p>
												</div>
											{/if}

											{#if uploadedFileId && uploadedFileName}
												<div class="success-message">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<div>
														<p><strong>업로드 완료:</strong> {uploadedFileName}</p>
														<p class="file-id">파일 ID: {uploadedFileId}</p>
													</div>
												</div>
											{/if}
										</div>

										{#if fileName && workbook}
											<div class="file-info-section">
												<div class="file-info">
													<strong>파일명:</strong> {fileName}
												</div>
												
												{#if sheetNames.length > 1}
													<div class="sheet-selector">
														<label for="sheet-select">시트 선택:</label>
														<select id="sheet-select" value={selectedSheet} onchange={handleSheetChange}>
															{#each sheetNames as sheet, index}
																<option value={sheet}>{index + 1}. {sheet}</option>
															{/each}
														</select>
													</div>
												{/if}

												{#if headers.length > 0}
													<div class="data-info">
														컬럼: {headers.length}개 | 행: {rows.length}개
													</div>
												{/if}
											</div>
										{/if}

										{#if isLoading}
											<div class="loading-message">
												<div class="spinner"></div>
												<p>엑셀 파일을 읽는 중...</p>
											</div>
										{:else if headers.length > 0}
											<div class="table-section">
												<div class="table-container">
													<table class="excel-table">
														<thead>
															<tr>
																{#each headers as header, index}
																	<th>{header || `컬럼 ${index + 1}`}</th>
																{/each}
															</tr>
														</thead>
														<tbody>
															{#each rows as row, rowIndex}
																<tr>
																	{#each headers as header, colIndex}
																		<td>{row[colIndex] ?? ''}</td>
																	{/each}
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											</div>
										{:else if fileName && !isLoading}
											<div class="empty-message">
												<p>엑셀 파일에 데이터가 없습니다.</p>
											</div>
										{/if}
									</div>
									<div class="modal-footer">
										<button onclick={handleCloseUploadModal} class="btn-secondary">닫기</button>
									</div>
								</div>
							</div>
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		width: 90%;
		max-width: 1000px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #6b7280;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
	}

	.modal-close:hover {
		background-color: #f3f4f6;
		color: #111827;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.upload-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.upload-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.file-input-hidden {
		display: none;
	}

	.upload-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.upload-button:hover {
		background-color: #2563eb;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background-color: #10b981;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-primary:hover {
		background-color: #059669;
	}

	.btn-secondary {
		padding: 0.75rem 1.5rem;
		background-color: #6b7280;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-secondary:hover {
		background-color: #4b5563;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 1rem;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		color: #dc2626;
	}

	.success-message {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-top: 1rem;
		padding: 1rem;
		background-color: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 0.5rem;
		color: #166534;
	}

	.success-message .file-id {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.loading-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
		padding: 2rem;
		color: #6b7280;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.file-info-section {
		display: flex;
		align-items: center;
		gap: 2rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: #f9fafb;
		border-radius: 0.5rem;
		flex-wrap: wrap;
	}

	.file-info {
		font-size: 0.875rem;
		color: #374151;
	}

	.sheet-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sheet-selector label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.sheet-selector select {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background-color: white;
		font-size: 0.875rem;
	}

	.data-info {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.table-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.table-container {
		overflow-x: auto;
		max-height: 600px;
		overflow-y: auto;
	}

	.excel-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.excel-table thead {
		position: sticky;
		top: 0;
		background-color: #f9fafb;
		z-index: 10;
	}

	.excel-table th {
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
		background-color: #f9fafb;
		white-space: nowrap;
	}

	.excel-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		color: #111827;
	}

	.excel-table tbody tr:hover {
		background-color: #f9fafb;
	}

	.empty-message {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}
</style>
