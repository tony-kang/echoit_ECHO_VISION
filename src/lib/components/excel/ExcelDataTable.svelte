<script>
	import * as XLSX from 'xlsx';
	import { getExcelFileUrl } from '$lib/excelUploadService';
	import { getSettings } from '$lib/settingsService';

	/**
	 * 컴포넌트 Props
	 * @type {{ file?: any, excelType: string, onClose?: Function, frozenColumns?: number, workbook?: any, fileName?: string, inline?: boolean }}
	 */
	let { file, excelType = '', onClose, frozenColumns = 1, workbook: providedWorkbook, fileName: providedFileName, inline = false } = $props();

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
	/** @type {boolean} 파일 읽기 중 여부 */
	let isLoading = $state(false);
	/** @type {Array<any>} 환경 코드 목록 */
	let envCodes = $state([]);
	/** @type {boolean} 환경 코드 로딩 중 여부 */
	let isLoadingEnvCodes = $state(false);
	/** @type {Promise<any> | null} 로딩 중인 Promise (중복 로드 방지) */
	let loadingPromise = $state(null);

	/** @type {string[]} 매칭 검사에서 제외할 텍스트 목록 */
	const EXCLUDED_MATCHING_TEXTS = ['과목'];

	/**
	 * 칼럼명이 매칭 검사에서 제외되어야 하는지 확인
	 * @param {string} columnName - 칼럼명
	 * @returns {boolean} 제외 여부
	 */
	function shouldExcludeFromMatching(columnName) {
		if (!columnName || typeof columnName !== 'string') return false;
		const normalizedColumn = normalizeString(columnName);
		return EXCLUDED_MATCHING_TEXTS.some(excludedText => 
			normalizedColumn.includes(normalizeString(excludedText))
		);
	}

	/**
	 * 엑셀 타입에 따른 카테고리 결정
	 * @param {string} type - 엑셀 타입 (sales, cost 등)
	 * @returns {string[]} 카테고리 배열
	 */
	function getCategoryFromExcelType(type) {
		if (type === 'sales') {
			return ['organization', 'sales'];
		} else if (type === 'cost') {
			return ['organization', 'cost'];
		}
		return ['organization'];
	}

	/**
	 * 문자열 정규화 (trim, 공백 제거, 소문자 변환)
	 * [xxxx] 패턴, 로마 숫자 패턴 제거 후 정규화
	 * @param {string} str - 정규화할 문자열
	 * @returns {string} 정규화된 문자열
	 */
	function normalizeString(str) {
		if (!str || typeof str !== 'string') return '';
		let normalized = str;
		
		// [xxxx] 패턴 제거 (예: [4120001] SAP/SI → SAP/SI)
		normalized = normalized.replace(/^\[[^\]]+\]\s*/g, '');
		
		// 로마 숫자 패턴 제거 (전각: Ⅰ-Ⅻ, 반각: I-XII) + 점 + 공백
		normalized = normalized.replace(/^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫI-VX]+\.\s*/gi, '');
		
		// 공백 제거 및 소문자 변환
		return normalized.trim().replace(/\s+/g, '').toLowerCase();
	}

	/**
	 * 칼럼명과 매칭되는 환경 코드 찾기
	 * @param {string} columnName - 칼럼명
	 * @returns {any | null | 'excluded'} 매칭되는 코드, null, 또는 'excluded' (제외된 칼럼)
	 */
	function findMatchingCode(columnName) {
		if (!columnName) return null;
		
		// 제외할 텍스트가 포함된 칼럼은 매칭 검사에서 제외
		if (shouldExcludeFromMatching(columnName)) {
			return 'excluded';
		}
		
		if (envCodes.length === 0) return null;
		
		const normalizedColumn = normalizeString(columnName);
		
		for (const code of envCodes) {
			if (code.param && Array.isArray(code.param)) {
				for (const param of code.param) {
					const normalizedParam = normalizeString(param);
					if (normalizedParam === normalizedColumn) {
						return code;
					}
				}
			}
		}
		
		return null;
	}

	/**
	 * 데이터 행의 첫 번째 칼럼 값과 매칭되는 환경 코드 찾기 (sales 또는 cost 카테고리만)
	 * @param {string} cellValue - 첫 번째 칼럼의 셀 값
	 * @returns {any | null | 'excluded'} 매칭되는 코드, null, 또는 'excluded' (제외된 칼럼)
	 */
	function findMatchingCodeForFirstColumn(cellValue) {
		if (!cellValue) return null;
		
		// 제외할 텍스트가 포함된 경우 매칭 검사에서 제외
		if (shouldExcludeFromMatching(cellValue)) {
			return 'excluded';
		}
		
		if (envCodes.length === 0) return null;
		
		// excelType에 따라 검색할 카테고리 결정
		const targetCategory = excelType === 'sales' ? 'sales' : excelType === 'cost' ? 'cost' : null;
		if (!targetCategory) return null;
		
		const normalizedValue = normalizeString(cellValue);
		
		// 해당 카테고리의 코드만 검색
		for (const code of envCodes) {
			if (code.category === targetCategory && code.param && Array.isArray(code.param)) {
				for (const param of code.param) {
					if (normalizeString(param) === normalizedValue) {
						return code;
					}
				}
			}
		}
		
		return null;
	}

	/**
	 * 환경 코드 로드
	 * @returns {Promise<void>}
	 */
	async function loadEnvCodes() {
		// envCodes가 이미 있으면 로드하지 않음
		if (envCodes.length > 0) {
			return Promise.resolve();
		}

		// 이미 로딩 중이면 기존 Promise 반환
		if (loadingPromise) {
			try {
				await loadingPromise;
				return;
			} catch (err) {
				// 이전 로드가 실패했으면 다시 시도
				loadingPromise = null;
			}
		}

		isLoadingEnvCodes = true;
		const startTime = performance.now();

		const categories = getCategoryFromExcelType(excelType);
		
		// 실제 로드 Promise
		const loadPromise = Promise.allSettled(
			categories.map(category => getSettings({ category }))
		).then(results => {
			const allCodes = [];
			results.forEach((result, index) => {
				if (result.status === 'fulfilled' && result.value.data) {
					allCodes.push(...result.value.data);
				} else {
					console.error(`[${categories[index]}] env_code 로드 실패:`, result.reason);
				}
			});

			envCodes = allCodes;
			const endTime = performance.now();
			console.log(`env_code 로드 완료: ${allCodes.length}개 (${(endTime - startTime).toFixed(2)}ms)`);
		}).catch(err => {
			console.error('env_code 로드 실패:', err);
			throw err;
		}).finally(() => {
			isLoadingEnvCodes = false;
			loadingPromise = null;
		});

		loadingPromise = loadPromise;
		return loadPromise;
	}

	/**
	 * 매칭되지 않은 칼럼 수 계산 (제외된 칼럼은 제외)
	 */
	const unmatchedColumnsCount = $derived.by(() => {
		if (headers.length === 0) return 0;
		return headers.filter(header => {
			if (!header) return true;
			const matchResult = findMatchingCode(header);
			// 'excluded'는 제외하고, null인 경우만 카운트
			return matchResult === null;
		}).length;
	});

	/**
	 * 매칭되지 않은 칼럼명 목록 (제외된 칼럼은 제외)
	 */
	const unmatchedColumnNames = $derived.by(() => {
		if (headers.length === 0) return [];
		return headers.filter(header => {
			if (!header) return true;
			const matchResult = findMatchingCode(header);
			// 'excluded'는 제외하고, null인 경우만 포함
			return matchResult === null;
		}).filter(header => header); // 빈 문자열 제거
	});

	/**
	 * 엑셀 파일 다운로드 및 읽기
	 * @returns {Promise<void>}
	 */
	async function loadExcelFile() {
		if (!file) return;

		isLoading = true;
		error = '';
		
		try {
			// 환경 코드 먼저 로드
			await loadEnvCodes();
		} catch (err) {
			console.error('env_code 로드 실패:', err);
		}

		try {
			// 파일 경로 가져오기
			const filePath = file.fullPath || (excelType ? `${excelType}/${file.name}` : file.name);
			const { data: url, error: urlError } = await getExcelFileUrl(filePath);

			if (urlError || !url) {
				throw new Error('파일 다운로드 URL 생성에 실패했습니다.');
			}

			// 파일 다운로드
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('파일 다운로드에 실패했습니다.');
			}

			const arrayBuffer = await response.arrayBuffer();
			const data = new Uint8Array(arrayBuffer);
			workbook = XLSX.read(data, { type: 'array' });
			sheetNames = workbook.SheetNames;
			
			if (sheetNames.length > 0) {
				selectedSheet = sheetNames[0];
				await loadSheet(selectedSheet);
			} else {
				error = '엑셀 파일에 시트가 없습니다.';
				isLoading = false;
			}
		} catch (err) {
			error = '엑셀 파일을 읽는 중 오류가 발생했습니다: ' + err.message;
			console.error('Error reading file:', err);
			isLoading = false;
		}
	}

	/**
	 * 시트 로드
	 * @param {string} sheetName - 시트 이름
	 * @returns {Promise<void>}
	 */
	async function loadSheet(sheetName) {
		if (!workbook || !sheetName) {
			isLoading = false;
			return;
		}

		try {
			// envCodes가 비어있으면 로드 시도 (이미 로딩 중이면 대기)
			if (envCodes.length === 0) {
				try {
					await loadEnvCodes();
				} catch (err) {
					console.error('env_code 로드 실패:', err);
					// 로드 실패해도 시트는 계속 로드
				}
			}

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

			// fileName은 이미 설정되어 있거나 file에서 가져옴
			if (!fileName && file) {
				fileName = file.originalFileName || file.name || '';
			}
		} catch (err) {
			console.error('시트 로드 오류:', err);
			error = '시트를 로드하는 중 오류가 발생했습니다: ' + err.message;
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 시트 변경 핸들러
	 * @param {Event} event - 변경 이벤트
	 * @returns {Promise<void>}
	 */
	async function handleSheetChange(event) {
		const sheetName = event.target.value;
		selectedSheet = sheetName;
		await loadSheet(sheetName);
	}

	// 컴포넌트 마운트 시 파일 로드 또는 제공된 workbook 사용
	$effect(() => {
		if (providedWorkbook) {
			// 제공된 workbook이 있으면 직접 사용
			workbook = providedWorkbook;
			sheetNames = workbook.SheetNames;
			if (sheetNames.length > 0) {
				selectedSheet = sheetNames[0];
				loadSheet(selectedSheet);
			}
			if (providedFileName) {
				fileName = providedFileName;
			}
		} else if (file) {
			// file이 있으면 다운로드하여 로드
			loadExcelFile();
		}
	});
</script>

<div class="excel-data-table" class:inline={inline}>
	{#if !inline}
		<div class="viewer-header">
			<h2 class="viewer-title">
				엑셀 데이터 미리보기
				{#if excelType === 'sales'}
					<span class="excel-type-badge">매출</span>
				{:else if excelType === 'cost'}
					<span class="excel-type-badge">비용</span>
				{/if}
			</h2>
			{#if onClose}
				<button class="close-button" onclick={onClose} aria-label="닫기">×</button>
			{/if}
		</div>
	{/if}

	<div class="viewer-body" class:inline-body={inline}>
		{#if error}
			<div class="error-message">
				<span>⚠️</span>
				<span>{error}</span>
			</div>
		{:else if isLoading}
			<div class="loading-message">
				<div class="spinner"></div>
				<p>엑셀 파일을 읽는 중...</p>
			</div>
		{:else if fileName && workbook}
			<div class="preview-section">
				<div class="file-info-section">
					<div class="file-info-left">
						<!-- <div class="file-info">
							<strong>파일명:</strong> {fileName}
						</div> -->
						
						{#if headers.length > 0}
							<div class="data-info">
								컬럼: {headers.length}개 | 행: {rows.length}개
								{#if unmatchedColumnsCount > 0}
									<span class="unmatched-badge">매칭 안됨: {unmatchedColumnsCount}개 - 환경설정 - 코드관리 - 조직 에서 코드를 매칭시켜 주세요. </span>
								{/if}
								{#if unmatchedColumnNames.length > 0}
									<div class="unmatched-names">
										매칭 안된 칼럼: {unmatchedColumnNames.join(', ')}
									</div>
								{/if}
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

				{#if headers.length > 0}
					<div class="table-section">
						<div class="table-container">
							<table class="excel-table">
								<thead>
									<tr>
										{#each headers as header, index}
											{@const matchingCode = findMatchingCode(header)}
											<th
												class:frozen={index < frozenColumns}
												style={index < frozenColumns ? `left: ${index * 150}px;` : ''}
											>
												{#if index < frozenColumns}
													<div class="frozen-th-cell-content {index === (frozenColumns - 1) ? `th-frozen` : ''}">
														{header || `컬럼 ${index + 1}`}
														{#if header && matchingCode !== 'excluded'}
															{#if matchingCode}
																<span class="code-match">({matchingCode.code})</span>
															{:else}
																<span class="code-unmatched">(없음)</span>
															{/if}
														{/if}
													</div>
												{:else}
													<div class="th-cell-content">
														{header || `컬럼 ${index + 1}`}
														{#if header && matchingCode !== 'excluded'}
															{#if matchingCode}
																<span class="code-match">({matchingCode.code})</span>
															{:else}
																<span class="code-unmatched">(없음)</span>
															{/if}
														{/if}
													</div>
												{/if}
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each rows as row, rowIndex}
										<tr>
											{#each headers as header, colIndex}
												{@const cellValue = row[colIndex] ?? ''}
												{@const isFirstColumn = colIndex === 0}
												{@const matchingCode = isFirstColumn ? findMatchingCodeForFirstColumn(cellValue) : null}
												<td
													class:frozen={colIndex < frozenColumns}
													style={colIndex < frozenColumns ? `left: ${colIndex * 150}px;` : ''}
												>
													<div class="frozen-td-cell-content">
														{cellValue}
														{#if isFirstColumn && cellValue && matchingCode !== 'excluded'}
															{#if matchingCode}
																<span class="code-match">({matchingCode.code})</span>
															{:else}
																<span class="code-unmatched">(없음)</span>
															{/if}
														{/if}
													</div>
												</td>
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
	.excel-data-table {
		position: fixed;
		top: 50px;
		left: 50px;
		right: 50px;
		bottom: 50px;
		background: #ffffff;
		border: 10px solid #777777;
		border-radius: 1.5rem;
		display: flex;
		flex-direction: column;
		z-index: 1000;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.excel-data-table.inline {
		position: static;
		border: none;
		border-radius: 0;
		box-shadow: none;
		background: transparent;
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
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.excel-type-badge {
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		border-radius: 0.5rem;
		background-color: #3b82f6;
		color: #ffffff;
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

	.viewer-body.inline-body {
		padding: 0;
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
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
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
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.unmatched-badge {
		background-color: #dc2626;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.unmatched-names {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.25rem;
		font-size: 0.85rem;
		color: #991b1b;
		word-break: break-word;
	}

	.code-match {
		color: #2563eb;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.code-unmatched {
		color: #dc2626;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.table-section {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.table-container {
		width: 100%;
		overflow-x: auto;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
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

	.excel-table thead tr {
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.excel-table th {
		padding: 0;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-right: 1px solid #e5e7eb;
		white-space: nowrap;
		background: #f9fafb;
		position: relative;
		z-index: 1;
	}

	.excel-table th .th-cell-content {
		padding: 0.75rem;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
		background: #f9fafb;
		display: flex;
		align-items: center;
		border-bottom: 2px solid #0a0a0a;
		position: relative;
		z-index: 2;
	}

	.excel-table th.frozen {
		position: sticky;
		left: 0;
		z-index: 20;
		background: transparent;
		padding: 0;
		height: 100%;
	}

	.excel-table th.frozen div.frozen-th-cell-content {
		padding: 0.75rem;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
		background: #f9fafb;
		display: flex;
		align-items: center;
		border-bottom: 2px solid #0a0a0a;
		position: relative;
		z-index: 21;
	}

	.th-frozen {
		border-right: 2px solid #0a0a0a;
	}

	.excel-table td.frozen .frozen-td-cell-content {
		padding: 0.75rem;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
		border-right: 2px solid #0a0a0a;
		background: white;
		display: flex;
		align-items: center;
		position: relative;
		z-index: 2;
	}


	.excel-table tbody tr:hover td.frozen .frozen-td-cell-content {
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

	.excel-table td.frozen {
		position: sticky;
		left: 0;
		z-index: 1;
		background: transparent;
		padding: 0;
		height: 100%;
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

</style>
