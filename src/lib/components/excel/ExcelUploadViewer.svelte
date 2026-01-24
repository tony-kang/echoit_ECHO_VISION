<script>
	import * as XLSX from 'xlsx';
	import { uploadExcelFile } from '$lib/excelUploadService';

	/**
	 * 컴포넌트 Props
	 * @type {{ excelType: string, onClose: Function, onUploadSuccess: Function }}
	 */
	let { excelType = '', onClose, onUploadSuccess } = $props();

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
	 * 파일 선택 핸들러
	 * @param {Event} event - 파일 입력 이벤트
	 * @returns {void}
	 */
	function handleFileSelect(event) {
		error = '';
		isLoading = false;
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
		if (!selectedFile || !excelType) {
			error = '파일을 선택하고 엑셀 타입을 확인해주세요.';
			return;
		}

		isUploading = true;
		error = '';

		const { data, error: uploadError } = await uploadExcelFile(selectedFile, excelType);

		if (uploadError) {
			error = uploadError.message || '파일 업로드에 실패했습니다.';
			isUploading = false;
			return;
		}

		if (data) {
			uploadedFileId = data.fileId;
			uploadedFileName = data.fileName;
			if (onUploadSuccess) {
				onUploadSuccess();
			}
			alert('파일이 성공적으로 업로드되었습니다.');
			handleClose();
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
		isLoading = false;
		isUploading = false;
		uploadedFileId = null;
		uploadedFileName = null;
		
		// 파일 입력 요소 초기화
		const fileInput = document.getElementById('file-input');
		if (fileInput) {
			fileInput.value = '';
		}
	}

	/**
	 * 닫기 핸들러
	 * @returns {void}
	 */
	function handleClose() {
		handleClear();
		if (onClose) {
			onClose();
		}
	}
</script>

<div class="excel-upload-viewer">
	<!-- 헤더 -->
	<div class="viewer-header">
		<h2 class="viewer-title">엑셀 파일 업로드 및 미리보기</h2>
		<button onclick={handleClose} class="close-button" aria-label="닫기">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- 업로드 섹션 -->
	<div class="viewer-body">
		<div class="upload-section">
			<div class="upload-controls">
				<div class="upload-controls-left">
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
				</div>

				<div class="upload-controls-right">
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
		</div>

		<!-- 파일 정보 및 데이터 미리보기 -->
		{#if fileName && workbook}
			<div class="preview-section">
				<div class="file-info-section">
					<div class="file-info-left">
						<div class="file-info">
							<strong>파일명:</strong> {fileName}
						</div>
						
						{#if headers.length > 0}
							<div class="data-info">
								컬럼: {headers.length}개 | 행: {rows.length}개
							</div>
						{/if}
						
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
					</div>
				</div>

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
		{/if}
	</div>
</div>

<style>
	.excel-upload-viewer {
		position: fixed;
		top: 100px;
		left: 100px;
		right: 100px;
		bottom: 100px;
		background: #ffffff;
		border: 10px solid #777777;
		border-radius: 1.5rem;
		display: flex;
		flex-direction: column;
		z-index: 1000;
		overflow: hidden;
	}

	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
		flex-shrink: 0;
	}

	.viewer-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #6b7280;
		cursor: pointer;
		padding: 0.5rem;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.close-button:hover {
		background-color: #f3f4f6;
		color: #111827;
	}

	.viewer-body {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	.upload-section {
		background: white;
		margin-bottom: 5px;
	}

	.upload-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.upload-controls-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.upload-controls-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
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
		gap: 0.75rem;
		padding: 1rem;
		margin-top: 1rem;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		color: #dc2626;
	}

	.loading-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
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

	.preview-section {
		background: white;
	}

	.file-info-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-left: 10px;
		margin-bottom: 1rem;
	}

	.file-info-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.file-info {
		font-size: 0.95rem;
		color: #374151;
	}

	.sheet-selector {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.sheet-selector label {
		font-weight: 500;
		color: #374151;
	}

	.sheet-selector select {
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		background: white;
		color: #374151;
		font-size: 0.9rem;
	}

	.data-info {
		font-size: 0.9rem;
		color: #6b7280;
	}

	.table-section {
		width: 100%;
	}

	.table-container {
		width: 100%;
		overflow-x: auto;
		max-height: calc(100vh - 400px);
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}

	.excel-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.excel-table thead {
		position: sticky;
		top: 0;
		background: #f9fafb;
		z-index: 10;
	}

	.excel-table th {
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
		border-right: 1px solid #e5e7eb;
		white-space: nowrap;
		background: #f9fafb;
	}

	.excel-table th:last-child {
		border-right: none;
	}

	.excel-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		border-right: 1px solid #e5e7eb;
		color: #374151;
		white-space: nowrap;
	}

	.excel-table td:last-child {
		border-right: none;
	}

	.excel-table tbody tr:hover {
		background-color: #f9fafb;
	}

	.empty-message {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
	}

	@media (max-width: 768px) {
		.viewer-header {
			padding: 1rem;
		}

		.viewer-title {
			font-size: 1.25rem;
		}

		.viewer-body {
			padding: 1rem;
		}

		.upload-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.upload-button,
		.btn-primary,
		.btn-secondary {
			width: 100%;
			justify-content: center;
		}
	}
</style>
