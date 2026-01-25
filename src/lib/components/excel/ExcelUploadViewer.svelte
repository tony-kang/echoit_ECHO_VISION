<script>
	import * as XLSX from 'xlsx';
	import { uploadExcelFile } from '$lib/excelUploadService';
	import { getSettings } from '$lib/settingsService';
	import ExcelDataTable from './ExcelDataTable.svelte';
	import { toast } from 'svelte-sonner';

	/**
	 * 컴포넌트 Props
	 * @type {{ excelType: string, onClose: Function, onUploadSuccess: Function, frozenColumns?: number, frozenRows?: number }}
	 */
	let { excelType = '', onClose, onUploadSuccess, frozenColumns = 1, frozenRows = 1 } = $props();

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
	/** @type {Array<any>} 환경 코드 목록 */
	let envCodes = $state([]);
	/** @type {boolean} 환경 코드 로딩 중 여부 */
	let isLoadingEnvCodes = $state(false);
	/** @type {Promise<any> | null} 로딩 중인 Promise (중복 로드 방지) */
	let loadingPromise = $state(null);

	/** @type {string[]} 매칭 검사에서 제외할 텍스트 목록 */
	const EXCLUDED_MATCHING_TEXTS = ['과목'];

	/**
	 * 컬럼명이 매칭 검사에서 제외되어야 하는지 확인
	 * @param {string} columnName - 컬럼명
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
		// 대괄호 안의 모든 문자(공백 포함)와 뒤의 공백 제거
		normalized = normalized.replace(/^\s*\[[^\]]+\]\s*/g, '');
		
		// 로마 숫자 패턴 제거 (전각: Ⅰ-Ⅻ, 반각: I-XII) + 공백(선택) + 점 + 공백(선택)
		// 예: 'Ⅰ . 매 출 액 ' → '매 출 액 '
		normalized = normalized.replace(/^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫI-VX]+\s*\.\s*/gi, '');
		
		// 모든 종류의 공백 제거 (일반 공백, 전각 공백, 탭, 줄바꿈 등)
		normalized = normalized.replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '');
		
		// 소문자 변환
		return normalized.toLowerCase();
	}

	/**
	 * 컬럼명과 매칭되는 환경 코드 찾기
	 * @param {string} columnName - 컬럼명
	 * @returns {any | null | 'excluded'} 매칭되는 코드, null, 또는 'excluded' (제외된 컬럼)
	 */
	function findMatchingCode(columnName) {
		if (!columnName) return null;
		
		// 제외할 텍스트가 포함된 컬럼은 매칭 검사에서 제외
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
	 * 데이터 행의 첫 번째 컬럼 값과 매칭되는 환경 코드 찾기 (sales 또는 cost 카테고리만)
	 * @param {string} cellValue - 첫 번째 컬럼의 셀 값
	 * @returns {any | null | 'excluded'} 매칭되는 코드, null, 또는 'excluded' (제외된 컬럼)
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
			// console.log(`env_code 로드 완료: ${allCodes.length}개 (${(endTime - startTime).toFixed(2)}ms)`);
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
	 * 매칭되지 않은 컬럼 수 계산 (제외된 컬럼은 제외)
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
	 * 매칭되지 않은 컬럼명 목록 (제외된 컬럼은 제외)
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
	 * 파일명에서 년도 추출
	 * @param {string} filename - 파일명
	 * @returns {number | null} 년도 (4자리 숫자) 또는 null
	 */
	 function extractYear(filename) {
		if (!filename) return null;
		
		// Unicode 정규화 (조합형 → 완성형)
		const normalized = filename.normalize('NFC');
		// console.log('[extractYear] 정규화된 파일명:', normalized);
		
		// 먼저 4자리 년도 패턴 찾기 ("yyyy년")
		const fourDigitPattern = /(\d{4})\s*년/;
		let match = normalized.match(fourDigitPattern);
		
		if (match && match[1]) {
			const year = parseInt(match[1], 10);
			// 1900-2100 범위의 유효한 년도인지 확인
			if (year >= 1900 && year <= 2100) {
				// console.log('[extractYear] 4자리 년도 찾음:', year, '파일명:', filename);
				return year;
			}
		}
		
		// 4자리 숫자만 있는 경우 (공백이나 다른 문자로 구분, "년" 없이)
		const fourDigitOnlyPattern = /\b(\d{4})\b/;
		match = normalized.match(fourDigitOnlyPattern);
		if (match && match[1]) {
			const year = parseInt(match[1], 10);
			// 1900-2100 범위의 유효한 년도인지 확인
			if (year >= 1900 && year <= 2100) {
				// console.log('[extractYear] 4자리 숫자만 찾음:', year, '파일명:', filename);
				return year;
			}
		}
		
		// 4자리 년도가 없으면 2자리 년도 패턴 찾기 ("yy년")
		const twoDigitPattern = /(\d{2})\s*년/;
		match = normalized.match(twoDigitPattern);
		
		if (match && match[1]) {
			const twoDigitYear = parseInt(match[1], 10);
			// 2자리 년도에 2000을 더해서 처리 (00-99 → 2000-2099)
			const year = 2000 + twoDigitYear;
			// 유효한 년도 범위인지 확인
			if (year >= 2000 && year <= 2099) {
				// console.log('[extractYear] 2자리 년도 찾음:', year, '파일명:', filename);
				return year;
			}
		}
		
		console.log('[extractYear] 년도를 찾지 못함. 파일명:', filename);
		return null;
	}

	/**
	 * 파일명에서 월 추출
	 * @param {string} filename - 파일명
	 * @returns {number | null} 월 (1-12) 또는 null
	 */
	 function extractMonth(filename) {
		// 1. 먼저 정규화 시도
		let normalized = filename.normalize('NFC');
		
		// 2. 완성형 "월" 매칭
		let monthPattern = /(\d{1,2})\s*월/;
		let match = normalized.match(monthPattern);
		
		if (match && match[1]) {
			const month = parseInt(match[1], 10);
			if (month >= 1 && month <= 12) {
				// console.log('[extractMonth] 월 찾음:', month);
				return month;
			}
		}
		
		// 3. 조합형 자모 패턴으로도 시도 (백업)
		// ㅇ(4363) + ㅓ(4463) + ㄹ(4527)
		monthPattern = /(\d{1,2})\s*[\u1167\u110b\u1169\u110f]/;
		match = filename.match(monthPattern);
		
		if (match && match[1]) {
			const month = parseInt(match[1], 10);
			if (month >= 1 && month <= 12) {
				// console.log('[extractMonth] 월 찾음 (조합형):', month);
				return month;
			}
		}
		
		console.log('[extractMonth] 월을 찾지 못함');
		return null;
	}


	/**
	 * 파일명에 년도와 월 정보가 모두 포함되어 있는지 확인
	 * @type {boolean}
	 */
	const hasYearAndMonth = $derived.by(() => {
		if (!fileName) {
			console.log('[hasYearAndMonth] fileName이 없음');
			return false;
		}
		const year = extractYear(fileName);
		const month = extractMonth(fileName);
		const result = year !== null && month !== null;
		// console.log('[hasYearAndMonth] 결과:', result, '년도:', year, '월:', month, '파일명:', fileName);
		return result;
	});

	/**
	 * 업로드 가능 여부 (모든 컬럼이 매칭되어야 하고, 파일명에 년도와 월이 있어야 함)
	 */
	const canUpload = $derived.by(() => {
		return unmatchedColumnsCount === 0 && headers.length > 0 && hasYearAndMonth;
	});

	/**
	 * 파일 선택 핸들러
	 * @param {Event} event - 파일 입력 이벤트
	 * @returns {void}
	 */
	function handleFileSelect(event) {
		error = '';
		isLoading = false;
		
		const target = event.currentTarget || event.target;
		const file = target?.files?.[0];
		
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
		// console.log('[handleFileSelect] 파일명 설정:', fileName);
		readExcelFile(file);
	}

	/**
	 * 엑셀 파일 읽기
	 * @param {File} file - 읽을 파일
	 * @returns {Promise<void>}
	 */
	async function readExcelFile(file) {
		isLoading = true;
		error = '';
		
		try {
			// 환경 코드 먼저 로드
			await loadEnvCodes();
		} catch (err) {
			console.error('env_code 로드 실패:', err);
		}
		
		const reader = new FileReader();

		reader.onload = async (e) => {
			try {
				const data = new Uint8Array(e.target.result);
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
			console.log('handleUpload data', data);
			uploadedFileId = data.fileId;
			uploadedFileName = data.fileName;
			if (onUploadSuccess) {
				onUploadSuccess();
			}
			toast.success('파일이 성공적으로 업로드되었습니다.', { duration: 1500 });
			handleClose();
		}

		isUploading = false;
	}

	/**
	 * 파일 초기화 핸들러
	 * @returns {void}
	 */
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
		// envCodes는 초기화하지 않음 (재사용을 위해 유지)
		// loadingPromise도 초기화하지 않음 (이미 로드된 경우 재로딩 방지)
		
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
		<h2 class="viewer-title">
			엑셀 파일 업로드 및 미리보기
			{#if excelType === 'sales'}
				<span class="excel-type-badge">매출</span>
			{:else if excelType === 'cost'}
				<span class="excel-type-badge">비용</span>
			{/if}
		</h2>
		<button onclick={handleClose} class="close-button" aria-label="닫기">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- 업로드 섹션 -->
	<div class="viewer-body">
		<div class="upload-section">
			{#if !fileName}
				<!-- 파일 선택 전: 중앙 정렬 -->
				<div class="upload-controls upload-controls-center">
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
						파일 선택
					</label>
				</div>
			{:else}
				<!-- 파일 선택 후: 기존 레이아웃 -->
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
							{fileName}
						</label>
					</div>

					<div class="upload-controls-right">
						{#if !isUploading}
							<button onclick={handleUpload} class="btn-primary" disabled={!canUpload}>
								업로드
							</button>
							{#if !hasYearAndMonth}
								<span class="year-month-warning">⚠️ 파일명에 년도와 월 정보가 필요합니다 (예: 2024년 01월)</span>
							{/if}
						{/if}

						{#if fileName}
							<button onclick={handleClear} class="btn-secondary">
								초기화
							</button>
						{/if}
					</div>
				</div>
			{/if}

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
					<div class="loading-icon">📤</div>
					<div class="spinner"></div>
					<p class="loading-text">파일 업로드 중...</p>
				</div>
			{/if}
		</div>

		<!-- 파일 정보 및 데이터 미리보기 -->
		{#if fileName && workbook}
			<div class="preview-section">
				<ExcelDataTable
					workbook={workbook}
					fileName={fileName}
					excelType={excelType}
					frozenColumns={frozenColumns}
					inline={true}
				/>
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

	.upload-controls-center {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
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

	.btn-primary:hover:not(:disabled) {
		background-color: #059669;
	}

	.btn-primary:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
		opacity: 0.6;
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

	.year-month-warning {
		font-size: 0.875rem;
		color: #dc2626;
		margin-left: 0.75rem;
		white-space: nowrap;
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
		padding: 3rem 2rem;
		color: #6b7280;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
	}

	.loading-icon {
		font-size: 3rem;
		animation: bounce 1.5s ease-in-out infinite;
	}

	.loading-text {
		font-size: 1.125rem;
		font-weight: 500;
		color: #374151;
		margin: 0;
	}

	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 4px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.preview-section {
		background: white;
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
