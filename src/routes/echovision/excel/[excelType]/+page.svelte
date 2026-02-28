<script>
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getExcelFileUrl, listExcelFiles, deleteExcelFile, updateExcelFileYearMonth } from '$lib/excelUploadService';
	import { authStore } from '$lib/stores/authStore.svelte.js';
	import { supabase } from '$lib/supabaseClient';
	import PrjSidebar from '$lib/components/PrjSidebar.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import ExcelUploadViewer from '$lib/components/excel/ExcelUploadViewer.svelte';
	import ExcelDataTable from '$lib/components/excel/ExcelDataTable.svelte';
	import Pagination from '$lib/components/admin/Pagination.svelte';

	/** @type {import('@supabase/supabase-js').User | null} */
	let user = $derived(authStore.user);
	/** @type {boolean} */
	let authLoading = $derived(authStore.loading);

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
	/** @type {any | null} 수정할 파일 */
	let editingFile = $state(null);
	/** @type {number | null} 수정할 년도 */
	let editYear = $state(null);
	/** @type {number | null} 수정할 월 */
	let editMonth = $state(null);
	/** @type {boolean} 수정 중 여부 */
	let isUpdating = $state(false);
	/** 데이터 보기 전 년도/월 미입력 시 입력 다이얼로그 */
	let showYearMonthInputForView = $state(false);
	/** @type {any | null} 년도/월 입력 후 데이터 보기할 파일 */
	let filePendingForView = $state(null);
	/** @type {number | null} 데이터 보기용 입력 년도 */
	let viewYear = $state(null);
	/** @type {number | null} 데이터 보기용 입력 월 */
	let viewMonth = $state(null);
	/** 데이터 보기용 년도/월 저장 중 */
	let isSavingViewYearMonth = $state(false);

	let listLoaded = $state(false);
	/** @type {number} 현재 페이지 번호 */
	let currentPage = $state(1);
	/** @type {number} 페이지당 항목 수 */
	const pageSize = 20;

	/**
	 * URL 파라미터에서 excelType 읽기
	 * @type {string}
	 */
	const excelTypeParam = $derived.by(() => {
		const params = page.params;
		return params?.excelType || '';
	});

	/**
	 * 엑셀 파일의 데이터 존재 여부 확인
	 * @param {any} file - 파일 객체
	 * @returns {Promise<boolean>}
	 */
	async function checkFileHasData(file) {
		if (!file || !excelTypeParam) return false;

		try {
			// ev_excel_file에서 excel_file_id 조회
			const filePath = file.fullPath || (excelTypeParam ? `${excelTypeParam}/${file.name}` : file.name);
			const { data: excelFileData, error: excelFileError } = await supabase
				.from('ev_excel_file')
				.select('id')
				.eq('storage_path', `excel-files/${filePath}`)
				.single();

			if (excelFileError || !excelFileData) {
				return false;
			}

			const excelFileId = excelFileData.id;
			const tableName = excelTypeParam === 'sales' ? 'ev_sales' : 'ev_cost';

			// 해당 excel_file_id로 데이터 존재 여부 확인
			const { count, error: countError } = await supabase
				.from(tableName)
				.select('*', { count: 'exact', head: true })
				.eq('excel_file_id', excelFileId);

			if (countError) {
				console.error('[checkFileHasData] 데이터 확인 실패:', countError);
				return false;
			}

			return (count || 0) > 0;
		} catch (err) {
			console.error('[checkFileHasData] 오류:', err);
			return false;
		}
	}

	/**
	 * 엑셀 파일 목록 로드
	 * @returns {Promise<void>}
	 */
	async function loadExcelFiles() {
		if (!excelTypeParam) return;

		// excelTypeParam이 변경되었는지 확인
		const currentExcelType = excelTypeParam;
		if (previousExcelTypeParam !== null && previousExcelTypeParam !== currentExcelType) {
			// excelType이 변경되었으면 리스트 리셋
			listLoaded = false;
			excelFiles = [];
		}

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
		
		const files = data || [];
		
		// 각 파일의 데이터 존재 여부 확인
		const filesWithDataStatus = await Promise.all(
			files.map(async (file) => {
				const hasData = await checkFileHasData(file);
				return { ...file, hasData };
			})
		);
		
		excelFiles = filesWithDataStatus;
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
		currentPage = 1; // 필터 적용 시 첫 페이지로 이동
		await loadExcelFiles();
	}

	/**
	 * 필터 초기화 핸들러
	 * @returns {void}
	 */
	function handleResetFilters() {
		filters = { search: '' };
		currentPage = 1; // 필터 초기화 시 첫 페이지로 이동
	}

	/**
	 * 필터링된 파일 목록 (서버에서 이미 필터링된 결과 사용)
	 * @type {Array<any>}
	 */
	const filteredFiles = $derived.by(() => {
		// 서버에서 이미 검색어로 필터링된 결과를 반환
		return excelFiles;
	});

	/**
	 * 전체 페이지 수
	 * @type {number}
	 */
	const totalPages = $derived.by(() => {
		return Math.ceil(filteredFiles.length / pageSize);
	});

	/**
	 * 현재 페이지에 표시할 파일 목록
	 * @type {Array<any>}
	 */
	const paginatedFiles = $derived.by(() => {
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		return filteredFiles.slice(start, end);
	});

	/**
	 * 페이지 변경 핸들러
	 * @param {number} page - 변경할 페이지 번호
	 */
	function handlePageChange(page) {
		currentPage = page;
		// 페이지 변경 시 스크롤을 상단으로 이동
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		if (!authStore.loading && !authStore.user) {
			goto('/login');
		}
	});

	/** @type {string | null} 이전 excelTypeParam 값 추적 */
	let previousExcelTypeParam = $state(null);
	/** @type {boolean} 파일 목록 로드 완료 여부 */
	let isFilesLoaded = $state(false);

	/**
	 * excelTypeParam 변경 감지 및 리셋
	 */
	$effect(() => {
		const currentType = excelTypeParam;
		if (previousExcelTypeParam !== null && previousExcelTypeParam !== currentType) {
			// excelTypeParam이 변경되었으면 상태 리셋
			isFilesLoaded = false;
			listLoaded = false;
			excelFiles = [];
			filters = { search: '' };
			currentPage = 1;
		}
		previousExcelTypeParam = currentType;
	});

	/**
	 * excelType 변경 시 파일 목록 다시 로드
	 */
	$effect(() => {
		if (authStore.user && !authStore.loading && excelTypeParam && !isFilesLoaded) {
			untrack(async () => {
				isFilesLoaded = true;
				await loadExcelFiles();
			});
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
		if (!confirm(`정말로 "${getOriginalFileName(file)}" 파일에서 추출한 데이터를 삭제하시겠습니까?`)) {
			return;
		}

		try {
			// ev_excel_file에서 excel_file_id 조회
			const filePath = file.fullPath || (excelTypeParam ? `${excelTypeParam}/${file.name}` : file.name);
			const { data: excelFileData, error: excelFileError } = await supabase
				.from('ev_excel_file')
				.select('id')
				.eq('storage_path', `excel-files/${filePath}`)
				.single();

			if (excelFileError || !excelFileData) {
				alert('엑셀 파일 정보를 찾을 수 없습니다.');
				return;
			}

			const excelFileId = excelFileData.id;
			const tableName = excelTypeParam === 'sales' ? 'ev_sales' : 'ev_cost';

			// 해당 excel_file_id의 모든 데이터 삭제
			const { error: deleteError } = await supabase
				.from(tableName)
				.delete()
				.eq('excel_file_id', excelFileId);

			if (deleteError) {
				console.error('[handleDeleteData] 데이터 삭제 실패:', deleteError);
				alert(`데이터 삭제 실패: ${deleteError.message}`);
				return;
			}

			// 파일 목록 갱신
			listLoaded = false;
			await loadExcelFiles();
			// alert('데이터가 삭제되었습니다.');
		} catch (err) {
			console.error('[handleDeleteData] 오류:', err);
			alert('데이터 삭제 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 파일에서 추출한 데이터 보기 핸들러. 년도/월이 없으면 입력 다이얼로그 표시 후 진행.
	 * @param {any} file - 보여줄 데이터의 파일 정보
	 */
	function handleDataView(file) {
		const hasYear = file.year != null && file.year !== '';
		const hasMonth = file.month != null && file.month !== '';
		if (hasYear && hasMonth) {
			selectedFileForView = file;
			showDataTable = true;
			return;
		}
		const currentYear = new Date().getFullYear();
		filePendingForView = file;
		viewYear = file.year ?? currentYear;
		viewMonth = file.month ?? null;
		showYearMonthInputForView = true;
	}

	/**
	 * 데이터 보기용 년도/월 입력 확인 시 DB 반영 후 데이터 테이블 열기
	 * @returns {Promise<void>}
	 */
	async function handleConfirmViewYearMonth() {
		if (!filePendingForView || viewYear == null || viewMonth == null) {
			alert('년도와 월을 모두 선택하세요.');
			return;
		}
		isSavingViewYearMonth = true;
		try {
			const filePath = filePendingForView.fullPath || (excelTypeParam ? `${excelTypeParam}/${filePendingForView.name}` : filePendingForView.name);
			const { error } = await updateExcelFileYearMonth(filePath, viewYear, viewMonth);
			if (error) {
				alert(`년도/월 저장 실패: ${error.message}`);
				return;
			}
			selectedFileForView = { ...filePendingForView, year: viewYear, month: viewMonth };
			showDataTable = true;
			showYearMonthInputForView = false;
			filePendingForView = null;
			viewYear = null;
			viewMonth = null;
			listLoaded = false;
			await loadExcelFiles();
		} catch (err) {
			console.error('[handleConfirmViewYearMonth] 오류:', err);
			alert('년도/월 저장 중 오류가 발생했습니다.');
		} finally {
			isSavingViewYearMonth = false;
		}
	}

	/**
	 * 데이터 보기용 년도/월 입력 다이얼로그 닫기
	 */
	function handleCloseViewYearMonthDialog() {
		showYearMonthInputForView = false;
		filePendingForView = null;
		viewYear = null;
		viewMonth = null;
	}

	/**
	 * 데이터 테이블 닫기 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleCloseDataTable() {
		showDataTable = false;
		selectedFileForView = null;
		
		// 파일 목록 갱신 (데이터 저장 여부 상태 업데이트)
		listLoaded = false;
		await loadExcelFiles();
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

	/**
	 * 최근 3년 목록 (현재 년도 포함)
	 * @type {number[]}
	 */
	const recentYears = $derived.by(() => {
		const currentYear = new Date().getFullYear();
		return [currentYear - 2, currentYear - 1, currentYear];
	});

	/**
	 * 파일 수정 다이얼로그 열기 핸들러
	 * @param {any} file - 수정할 파일 정보
	 * @returns {void}
	 */
	function handleEditFile(file) {
		editingFile = file;
		const currentYear = new Date().getFullYear();
		editYear = file.year || currentYear;
		editMonth = file.month || null;
	}

	/**
	 * 파일 수정 다이얼로그 닫기 핸들러
	 * @returns {void}
	 */
	function handleCloseEditDialog() {
		editingFile = null;
		editYear = null;
		editMonth = null;
	}

	/**
	 * 파일 년도/월 업데이트 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleUpdateYearMonth() {
		if (!editingFile) return;

		isUpdating = true;
		try {
			const filePath = editingFile.fullPath || (excelTypeParam ? `${excelTypeParam}/${editingFile.name}` : editingFile.name);
			const { error } = await updateExcelFileYearMonth(filePath, editYear, editMonth);

			if (error) {
				alert(`년도/월 업데이트 실패: ${error.message}`);
				return;
			}

			// 파일 목록 갱신
			listLoaded = false;
			await loadExcelFiles();
			handleCloseEditDialog();
			// alert('년도/월이 업데이트되었습니다.');
		} catch (err) {
			console.error('[handleUpdateYearMonth] 오류:', err);
			alert('년도/월 업데이트 중 오류가 발생했습니다.');
		} finally {
			isUpdating = false;
		}
	}

	// console.log('(F)', new Date().toISOString());
</script>

<div class="main-content-page">
	<div class="flex h-[calc(100vh-100px)]">
		<!-- Left Sidebar -->
		<PrjSidebar />

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
							<h1 class="text-2xl font-bold text-gray-900">{getExcelTypeLabel(excelTypeParam) || '엑셀'} 파일 관리</h1>
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
									{ label: '데이터 상태', align: 'center' },
									{ label: '업로드 일시', align: 'center' },
									{ label: '작업', align: 'center' }
								]}
								rowCount={paginatedFiles.length}
								emptyMessage="엑셀 파일이 없습니다."
							>
								{#each paginatedFiles as file}
									<tr class="hover:bg-gray-50">
										<td class="font-medium">{getOriginalFileName(file)}</td>
										<td class="text-center text-sm text-gray-600">{file.year || '-'}</td>
										<td class="text-center text-sm text-gray-600">{file.month || '-'}</td>
										<td class="text-center text-sm">
											{#if file.hasData}
												<span class="data-status-badge data-saved">데이터 저장됨</span>
											{:else}
												<span class="data-status-badge data-not-saved">데이터 없음</span>
											{/if}
										</td>
										<td class="text-center text-sm text-gray-600">{formatDate(file.created_at)}</td>
										<td class="flex justify-center gap-2">
											<button
												onclick={() => handleEditFile(file)}
												class="btn-edit btn-xs"
											>
												수정
											</button>
											<button
												onclick={() => handleDownloadFile(file)}
												class="btn-secondary btn-xs"
											>
												다운로드
											</button>
											<button
												onclick={() => handleDeleteFile(file)}
												class="btn-danger btn-xs"
												disabled={file.hasData}
											>
												파일삭제
											</button>
											<button
												onclick={() => handleDeleteData(file)}
												class="btn-delete btn-xs"
												disabled={!file.hasData}
											>
												데이터삭제
											</button>
											<button
												onclick={() => handleDataView(file)}
												class="btn-success btn-xs"
											>
												데이터보기
											</button>
										</td>
									</tr>
								{/each}
							</DataTable>

							<!-- 페이지네이션 -->
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalCount={filteredFiles.length}
								pageSize={pageSize}
								onPageChange={handlePageChange}
							/>
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

						<!-- 년도/월 수정 다이얼로그 -->
						{#if editingFile}
							<div class="fixed inset-0 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title">
								<div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
									<h2 id="edit-dialog-title" class="text-xl font-bold mb-4">년도/월 수정</h2>
									<div class="mb-4">
										<p class="text-sm text-gray-600 mb-2">파일명: {getOriginalFileName(editingFile)}</p>
									</div>
									<div class="space-y-4">
										<div>
											<label for="edit-year" class="block text-sm font-medium text-gray-700 mb-1">년도</label>
											<select
												id="edit-year"
												bind:value={editYear}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												<option value={null}>선택 안함</option>
												{#each recentYears as year}
													<option value={year}>{year}년</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="edit-month" class="block text-sm font-medium text-gray-700 mb-1">월</label>
											<select
												id="edit-month"
												bind:value={editMonth}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												<option value={null}>선택 안함</option>
												{#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
													<option value={month}>{month}월</option>
												{/each}
											</select>
										</div>
									</div>
									<div class="flex justify-end gap-2 mt-6">
										<button
											onclick={handleCloseEditDialog}
											class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
											disabled={isUpdating}
										>
											취소
										</button>
										<button
											onclick={handleUpdateYearMonth}
											class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
											disabled={isUpdating}
										>
											{isUpdating ? '저장 중...' : '저장'}
										</button>
									</div>
								</div>
							</div>
						{/if}

						<!-- 데이터 보기 전 년도/월 입력 다이얼로그 -->
						{#if showYearMonthInputForView && filePendingForView}
							<div class="fixed inset-0 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="view-yearmonth-dialog-title">
								<div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
									<h2 id="view-yearmonth-dialog-title" class="text-xl font-bold mb-4">년도/월 입력</h2>
									<p class="text-sm text-gray-600 mb-4">데이터 보기를 위해 년도와 월을 선택하세요.</p>
									<div class="mb-2 text-sm text-gray-500">파일: {getOriginalFileName(filePendingForView)}</div>
									<div class="space-y-4">
										<div>
											<label for="view-year" class="block text-sm font-medium text-gray-700 mb-1">년도</label>
											<select
												id="view-year"
												bind:value={viewYear}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												{#each recentYears as y}
													<option value={y}>{y}년</option>
												{/each}
											</select>
										</div>
										<div>
											<label for="view-month" class="block text-sm font-medium text-gray-700 mb-1">월</label>
											<select
												id="view-month"
												bind:value={viewMonth}
												class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											>
												<option value={null}>선택</option>
												{#each Array.from({ length: 12 }, (_, i) => i + 1) as m}
													<option value={m}>{m}월</option>
												{/each}
											</select>
										</div>
									</div>
									<div class="flex justify-end gap-2 mt-6">
										<button
											onclick={handleCloseViewYearMonthDialog}
											class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
											disabled={isSavingViewYearMonth}
										>
											취소
										</button>
										<button
											onclick={handleConfirmViewYearMonth}
											class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
											disabled={isSavingViewYearMonth || viewYear == null || viewMonth == null}
										>
											{isSavingViewYearMonth ? '저장 중...' : '확인'}
										</button>
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

	.data-status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.data-status-badge.data-saved {
		background-color: #d1fae5;
		color: #065f46;
	}

	.data-status-badge.data-not-saved {
		background-color: #fee2e2;
		color: #991b1b;
	}
</style>
