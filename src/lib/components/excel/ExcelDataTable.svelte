<script>
	import * as XLSX from 'xlsx';
	import { getExcelFileUrl } from '$lib/excelUploadService';
	import { getSettings, createSetting, getRootSettings } from '$lib/settingsService';
	import { toast } from 'svelte-sonner';
	import { supabase } from '$lib/supabaseClient';
	import { SvelteMap } from 'svelte/reactivity';

	/**
	 * 컴포넌트 Props
	 * @type {{ file?: any, excelType: string, onClose?: Function, frozenColumns?: number, workbook?: any, fileName?: string, inline?: boolean, isUploaded?: boolean }}
	 */
	let { file, excelType = '', onClose, frozenColumns = 1, workbook: providedWorkbook, fileName: providedFileName, inline = false, isUploaded = false } = $props();

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
	// let isLoadingEnvCodes = $state(false);
	/** @type {Promise<any> | null} 로딩 중인 Promise (중복 로드 방지) */
	let loadingPromise = $state(null);
	/** @type {boolean} 코드 등록 팝업 표시 여부 */
	let showCodeRegisterPopup = $state(false);
	/** @type {string | null} 등록할 컬럼명 또는 셀 값 */
	let registerTargetValue = $state(null);
	/** @type {string} 등록할 코드 */
	let registerCode = $state('');
	/** @type {string} 등록할 제목 */
	let registerTitle = $state('');
	/** @type {string} 등록할 설명 */
	let registerComment = $state('');
	/** @type {boolean} 코드 등록 중 여부 */
	let isRegisteringCode = $state(false);
	/** @type {string | null} 등록할 카테고리 (null이면 excelType에 따라 결정) */
	let registerCategory = $state(null);
	/** @type {string} 등록할 상위코드 */
	let registerParentCode = $state('');
	/** @type {Array<any>} 상위코드 옵션 목록 */
	let parentCodeOptions = $state([]);
	/** @type {boolean} 상위코드 옵션 로딩 중 여부 */
	let isLoadingParentOptions = $state(false);
	/** @type {boolean} 데이터 저장 중 여부 */
	let isSavingData = $state(false);
	/** @type {boolean | null} 데이터 저장 여부 (null: 확인 중, true: 저장됨, false: 저장 안됨) */
	let hasDataSaved = $state(null);
	/** @type {boolean} 데이터 저장 여부 확인 중 */
	let isCheckingData = $state(false);
	/** @type {boolean} 상위코드 검색 팝업 표시 여부 */
	let showParentCodeSearchPopup = $state(false);
	/** @type {string} 상위코드 검색 카테고리 */
	let parentCodeSearchCategory = $state('');
	/** @type {Array<any>} 상위코드 검색 결과 */
	let parentCodeSearchResults = $state([]);
	/** @type {string} 상위코드 검색어 */
	let parentCodeSearchQuery = $state('');
	/** @type {boolean} 상위코드 검색 로딩 중 여부 */
	let isLoadingParentCodeSearch = $state(false);
	/** @type {number | null} 파일의 년도 (DB에서 로드) */
	let fileYearFromDB = $state(null);
	/** @type {number | null} 파일의 월 (DB에서 로드) */
	let fileMonthFromDB = $state(null);

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
		let normalized = str.trim();
		
		// [xxxx] 패턴 제거 (예: [4120001] SAP/SI → SAP/SI)
		// 대괄호 안의 모든 문자(공백 포함)와 뒤의 공백 제거
		normalized = normalized.replace(/^\s*\[[^\]]+\]\s*/g, '');
		
		// 로마 숫자 패턴 제거 (전각: Ⅰ-Ⅻ, 반각: I-XII) + 공백(선택) + 점 + 공백(선택)
		// 예: 'Ⅰ . 매 출 액 ' → '매 출 액 '
		normalized = normalized.replace(/^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫI-VX]+\s*\.\s*/gi, '');
		
		// 모든 종류의 공백 제거 (일반 공백, 전각 공백, 탭, 줄바꿈 등)
		// \s는 모든 공백 문자를 포함하므로 추가 유니코드 공백도 제거
		normalized = normalized.replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\u200C\u200D]/g, '');
		
		// 소문자 변환
		return normalized.toLowerCase();
	}

	/**
	 * 컬럼명과 매칭되는 환경 코드 찾기
	 * @param {string} columnName - 컬럼명
	 * @param {number} [columnIndex] - 컬럼 인덱스 (frozenColumns와 비교용)
	 * @returns {any | null | 'excluded'} 매칭되는 코드, null, 또는 'excluded' (제외된 컬럼)
	 */
	function findMatchingCode(columnName, columnIndex = -1) {
		if (!columnName) return null;
		
		// 제외할 텍스트가 포함된 컬럼은 매칭 검사에서 제외
		if (shouldExcludeFromMatching(columnName)) {
			return 'excluded';
		}
		
		if (envCodes.length === 0) return null;
		
		const normalizedColumn = normalizeString(columnName);
		
		// 칼럼 인덱스가 frozenColumns보다 큰 경우 organization 카테고리만 검색
		const targetCategories = (columnIndex >= 0 && columnIndex > frozenColumns) 
			? ['organization']
			: getCategoryFromExcelType(excelType);
		
		for (const code of envCodes) {
			// 카테고리 필터링
			if (!targetCategories.includes(code.category)) {
				continue;
			}
			
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
		if (!cellValue || cellValue.trim() === '') return null;
		
		// 제외할 텍스트가 포함된 경우 매칭 검사에서 제외
		if (shouldExcludeFromMatching(cellValue)) {
			return 'excluded';
		}
		
		// envCodes가 로드되지 않았으면 null 반환 (매칭 안됨으로 표시)
		if (envCodes.length === 0) return null;
		
		// excelType에 따라 검색할 카테고리 결정
		const targetCategory = excelType === 'sales' ? 'sales' : excelType === 'cost' ? 'cost' : null;
		if (!targetCategory) return null;
		
		const normalizedValue = normalizeString(cellValue);
		
		// 해당 카테고리의 코드만 검색
		let matchedCodes = [];
		for (const code of envCodes) {
			if (code.category === targetCategory && code.param && Array.isArray(code.param)) {
				for (const param of code.param) {
					const normalizedParam = normalizeString(param);
					if (normalizedParam === normalizedValue) {
						// console.log('[findMatchingCodeForFirstColumn] 매칭됨:', code.code, 'param:', param, 'normalizedParam:', normalizedParam);
						return code;
					}
					matchedCodes.push({ code: code.code, param, normalizedParam });
				}
			}
		}
		
		// 매칭되지 않으면 null 반환 (매칭 안됨으로 표시)
		// console.log('[findMatchingCodeForFirstColumn] cellValue:', cellValue, 'normalizedValue:', normalizedValue);
		// console.log('[findMatchingCodeForFirstColumn] 검색한 코드들:', matchedCodes.slice(0, 5)); // 처음 5개만 출력
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

		// isLoadingEnvCodes = true;
		// const startTime = performance.now();

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
			// const endTime = performance.now();
			// console.log(`env_code 로드 완료: ${excelType} - ${allCodes.length}개 (${(endTime - startTime).toFixed(2)}ms)`, allCodes);
		}).catch(err => {
			console.error('env_code 로드 실패:', err);
			throw err;
		}).finally(() => {
			// isLoadingEnvCodes = false;
			loadingPromise = null;
		});

		loadingPromise = loadPromise;
		return loadPromise;
	}

	/**
	 * 매칭되지 않은 가로 컬럼 수 계산 (제외된 컬럼은 제외)
	 */
	const unmatchedColumnsCount = $derived.by(() => {
		if (headers.length === 0) return 0;
		// envCodes가 로드되지 않았으면 모든 헤더를 매칭 안됨으로 카운트
		if (envCodes.length === 0) {
			return headers.filter(header => header && header.trim() !== '').length;
		}
		
		return headers.filter(header => {
			if (!header || header.trim() === '') return false; // 빈 헤더는 제외
			const matchResult = findMatchingCode(header);
			// 'excluded'는 제외하고, null인 경우만 카운트
			return matchResult === null;
		}).length;
	});

	/**
	 * 매칭되지 않은 가로 컬럼 이름 목록
	 */
	const unmatchedColumnNames = $derived.by(() => {
		if (headers.length === 0) return [];
		if (envCodes.length === 0) {
			return headers.filter(header => header && header.trim() !== '');
		}
		
		return headers.filter(header => {
			if (!header || header.trim() === '') return false;
			const matchResult = findMatchingCode(header);
			return matchResult === null;
		});
	});

	/**
	 * 매칭되지 않은 세로 컬럼(첫 번째 열) 수 계산 (제외된 셀은 제외)
	 */
	const unmatchedVerticalColumnsCount = $derived.by(() => {
		if (rows.length === 0) return 0;
		// envCodes가 로드되지 않았으면 모든 첫 번째 열 셀을 매칭 안됨으로 카운트
		if (envCodes.length === 0) {
			return rows.filter(row => row[0] && String(row[0]).trim() !== '').length;
		}
		
		return rows.filter(row => {
			const cellValue = row[0];
			if (!cellValue || String(cellValue).trim() === '') return false; // 빈 셀은 제외
			const matchResult = findMatchingCodeForFirstColumn(String(cellValue));
			// 'excluded'는 제외하고, null인 경우만 카운트
			return matchResult === null;
		}).length;
	});

	/**
	 * 매칭되지 않은 세로 컬럼 이름 목록
	 */
	const unmatchedVerticalColumnNames = $derived.by(() => {
		if (rows.length === 0) return [];
		if (envCodes.length === 0) {
			return rows
				.filter(row => row[0] && String(row[0]).trim() !== '')
				.map(row => String(row[0]));
		}
		
		return rows
			.filter(row => {
				const cellValue = row[0];
				if (!cellValue || String(cellValue).trim() === '') return false;
				const matchResult = findMatchingCodeForFirstColumn(String(cellValue));
				return matchResult === null;
			})
			.map(row => String(row[0]));
	});

	/**
	 * 현재 파일의 연도와 월 정보 (버튼 표시용)
	 * DB에 저장된 값만 사용 (데이터 입력 시 년도/월을 입력받음)
	 * @type {{year: number | null, month: number | null}}
	 */
	const fileYearMonth = $derived.by(() => {
		if (!file) {
			return { year: null, month: null };
		}

		// DB에서 로드한 year, month를 우선 사용하고, 없으면 file 객체에서 가져오기
		const year = fileYearFromDB !== null ? fileYearFromDB : (file?.year || null);
		const month = fileMonthFromDB !== null ? fileMonthFromDB : ((file?.month !== null && file?.month !== undefined) ? file.month : null);

		return { year, month };
	});

	/**
	 * 셀 값을 천단위 콤마로 포맷팅
	 * @param {any} value - 포맷팅할 값
	 * @returns {string} 포맷팅된 문자열
	 */
	function formatCellValue(value) {
		if (value === null || value === undefined || value === '') {
			return '';
		}

		// 문자열인 경우 앞뒤 공백 제거
		const trimmedValue = typeof value === 'string' ? value.trim() : value;
		if (trimmedValue === '') {
			return '';
		}

		// 숫자인지 확인 (문자열 숫자 포함)
		// 숫자 타입이거나 숫자로 변환 가능한 문자열인지 확인
		let numValue;
		if (typeof trimmedValue === 'number') {
			numValue = trimmedValue;
		} else {
			// 문자열에서 숫자 부분만 추출 (콤마 제거 후 파싱)
			const cleanedValue = String(trimmedValue).replace(/,/g, '');
			numValue = parseFloat(cleanedValue);
		}
		
		// 숫자이고 유한한 값인 경우 포맷팅
		if (!isNaN(numValue) && isFinite(numValue)) {
			// 원본 값이 정수인지 확인 (소수점이 없는 경우)
			const isInteger = Number.isInteger(numValue);
			if (isInteger) {
				return numValue.toLocaleString('ko-KR');
			} else {
				// 소수점이 있는 경우
				return numValue.toLocaleString('ko-KR', { 
					minimumFractionDigits: 0,
					maximumFractionDigits: 10
				});
			}
		}

		// 숫자가 아니면 원본 반환
		return String(trimmedValue);
	}


	/**
	 * 엑셀 파일 다운로드 및 읽기
	 * @returns {Promise<void>}
	 */
	async function loadExcelFile() {
		if (!file) return;

		isLoading = true;
		error = '';
		hasDataSaved = null;
		
		try {
			// 환경 코드 먼저 로드
			await loadEnvCodes();
		} catch (err) {
			console.error('env_code 로드 실패:', err);
		}

		try {
			// 데이터 저장 여부 확인
			await checkDataSaved();
			// 파일 경로 가져오기
			const filePath = file.fullPath || (excelType ? `${excelType}/${file.name}` : file.name);
			
			// ev_excel_file에서 year, month 정보 가져오기
			const { data: excelFileData, error: excelFileError } = await supabase
				.from('ev_excel_file')
				.select('year, month')
				.eq('storage_path', `excel-files/${filePath}`)
				.single();
			
			if (!excelFileError && excelFileData) {
				// 내부 state에 year, month 정보 저장 (file prop 직접 수정 방지)
				fileYearFromDB = excelFileData.year || null;
				fileMonthFromDB = excelFileData.month !== null && excelFileData.month !== undefined ? excelFileData.month : null;
			}
			
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

	/**
	 * 상위코드 옵션 로드
	 * @param {string} category - 카테고리
	 * @returns {Promise<void>}
	 */
	async function loadParentCodeOptions(category) {
		console.log('loadParentCodeOptions', category);
		if (!category) {
			parentCodeOptions = [];
			return;
		}

		isLoadingParentOptions = true;
		try {
			const { data, error } = await getRootSettings({ 
				category: category === 'all' ? '' : category 
			});
			if (error) {
				console.error('상위 코드 옵션 로드 실패:', error);
				parentCodeOptions = [];
			} else {
				parentCodeOptions = data || [];
			}
		} catch (err) {
			console.error('상위 코드 옵션 로드 중 예외 발생:', err);
			parentCodeOptions = [];
		} finally {
			isLoadingParentOptions = false;
		}
	}

	/**
	 * 코드 등록 팝업 열기
	 * @param {string} targetValue - 등록할 컬럼명 또는 셀 값
	 * @param {string} [category] - 등록할 카테고리 (없으면 excelType에 따라 결정)
	 * @returns {Promise<void>}
	 */
	async function openCodeRegisterPopup(targetValue, category = null) {
		if (!targetValue || targetValue.trim() === '') {
			toast.error('등록할 값이 없습니다.');
			return;
		}

		console.log('[openCodeRegisterPopup] 팝업 열기:', targetValue, 'category:', category);
		registerTargetValue = targetValue.trim();
		registerTitle = registerTargetValue;
		registerCode = '';
		registerComment = '';
		registerParentCode = '';
		registerCategory = category;
		
		// 카테고리 결정
		const finalCategory = category || (excelType === 'sales' ? 'sales' : excelType === 'cost' ? 'cost' : 'organization');
		
		// 상위코드 옵션 로드
		await loadParentCodeOptions(finalCategory);
		
		showCodeRegisterPopup = true;
		console.log('[openCodeRegisterPopup] showCodeRegisterPopup:', showCodeRegisterPopup);
	}

	/**
	 * 코드 등록 팝업 닫기
	 * @returns {void}
	 */
	function closeCodeRegisterPopup() {
		showCodeRegisterPopup = false;
		registerTargetValue = null;
		registerCode = '';
		registerTitle = '';
		registerComment = '';
		registerCategory = null;
		registerParentCode = '';
		parentCodeOptions = [];
	}

	/**
	 * 상위코드 검색 팝업 열기
	 * @param {string} category - 검색할 카테고리
	 * @returns {Promise<void>}
	 */
	async function openParentCodeSearchPopup(category) {
		parentCodeSearchCategory = category || 'organization';
		parentCodeSearchQuery = '';
		parentCodeSearchResults = [];
		showParentCodeSearchPopup = true;
		
		// 초기 검색 (전체 목록)
		await searchParentCodes();
	}

	/**
	 * 상위코드 검색 팝업 닫기
	 * @returns {void}
	 */
	function closeParentCodeSearchPopup() {
		showParentCodeSearchPopup = false;
		parentCodeSearchCategory = '';
		parentCodeSearchQuery = '';
		parentCodeSearchResults = [];
	}

	/**
	 * 상위코드 검색 실행
	 * @returns {Promise<void>}
	 */
	async function searchParentCodes() {
		if (!parentCodeSearchCategory) return;

		isLoadingParentCodeSearch = true;
		try {
			const { data, error } = await getSettings({
				category: parentCodeSearchCategory === 'all' ? '' : parentCodeSearchCategory
			});

			if (error) {
				console.error('상위코드 검색 실패:', error);
				parentCodeSearchResults = [];
				return;
			}

			let results = data || [];

			// 검색어가 있으면 필터링
			if (parentCodeSearchQuery.trim()) {
				const query = parentCodeSearchQuery.trim().toLowerCase();
				results = results.filter((/** @type {any} */ item) => {
					return (
						item.code?.toLowerCase().includes(query) ||
						item.title?.toLowerCase().includes(query)
					);
				});
			}

			parentCodeSearchResults = results;
		} catch (err) {
			console.error('상위코드 검색 중 예외 발생:', err);
			parentCodeSearchResults = [];
		} finally {
			isLoadingParentCodeSearch = false;
		}
	}

	/**
	 * 상위코드 선택 핸들러
	 * @param {any} selectedCode - 선택한 코드 객체
	 * @returns {void}
	 */
	function handleSelectParentCode(selectedCode) {
		// parentCodeOptions에 이미 있는지 확인
		const exists = parentCodeOptions.some((/** @type {any} */ opt) => opt.code === selectedCode.code);
		
		if (!exists) {
			// parentCodeOptions에 추가
			parentCodeOptions = [...parentCodeOptions, selectedCode];
		}

		// registerParentCode에 설정
		registerParentCode = selectedCode.code;

		// 팝업 닫기
		closeParentCodeSearchPopup();
	}

	/**
	 * 코드 등록 핸들러
	 * @returns {Promise<void>}
	 */
	async function handleRegisterCode() {
		if (!registerTargetValue || !registerTitle.trim()) {
			toast.error('제목은 필수입니다.');
			return;
		}

		if (!registerCode.trim()) {
			toast.error('코드는 필수입니다.');
			return;
		}

		if (registerCode.length > 16) {
			toast.error('코드는 최대 16자리까지 가능합니다.');
			return;
		}

		if (!registerParentCode.trim()) {
			toast.error('상위코드는 필수입니다.');
			return;
		}

		isRegisteringCode = true;
		error = '';

		try {
			// 카테고리 결정 (registerCategory가 있으면 사용, 없으면 excelType에 따라)
			const category = registerCategory || (excelType === 'sales' ? 'sales' : excelType === 'cost' ? 'cost' : 'organization');

			// 다음 value 값 계산 (같은 카테고리의 최대 value + 1)
			const categoryCodes = envCodes.filter(code => code.category === category);
			const maxValue = categoryCodes.length > 0 
				? Math.max(...categoryCodes.map(code => code.value || 0))
				: 0;
			const nextValue = maxValue + 1;

			// param 배열 생성 (제목과 원본 값을 포함)
			const paramArray = [registerTitle];
			if (registerTargetValue !== registerTitle) {
				paramArray.push(registerTargetValue);
			}

			const { error: createError } = await createSetting({
				code: registerCode.trim(),
				title: registerTitle.trim(),
				comment: registerComment.trim() || null,
				category: category,
				parent_code: registerParentCode.trim() || null,
				value: nextValue,
				order: 0,
				param: paramArray
			});

			if (createError) {
				throw createError;
			}

			toast.success('코드가 성공적으로 등록되었습니다.');
			
			// envCodes 다시 로드하여 매칭 상태 업데이트
			await loadEnvCodes();
			
			closeCodeRegisterPopup();
		} catch (err) {
			console.error('코드 등록 실패:', err);
			const errorMessage = err.message || '코드 등록에 실패했습니다.';
			error = errorMessage;
			toast.error(errorMessage);
		} finally {
			isRegisteringCode = false;
		}
	}

	/**
	 * 파일의 데이터 저장 여부 확인
	 * @returns {Promise<void>}
	 */
	async function checkDataSaved() {
		if (!file || !excelType) {
			hasDataSaved = false;
			return;
		}

		isCheckingData = true;
		try {
			// ev_excel_file에서 excel_file_id 조회
			const filePath = file.fullPath || (excelType ? `${excelType}/${file.name}` : file.name);
			const { data: excelFileData, error: excelFileError } = await supabase
				.from('ev_excel_file')
				.select('id')
				.eq('storage_path', `excel-files/${filePath}`)
				.single();

			if (excelFileError || !excelFileData) {
				hasDataSaved = false;
				return;
			}

			const excelFileId = excelFileData.id;
			const tableName = excelType === 'sales' ? 'ev_sales' : 'ev_cost';

			// 해당 excel_file_id로 데이터 존재 여부 확인
			const { count, error: countError } = await supabase
				.from(tableName)
				.select('*', { count: 'exact', head: true })
				.eq('excel_file_id', excelFileId);

			if (countError) {
				console.error('[checkDataSaved] 데이터 확인 실패:', countError);
				hasDataSaved = false;
				return;
			}

			hasDataSaved = (count || 0) > 0;
		} catch (err) {
			console.error('[checkDataSaved] 오류:', err);
			hasDataSaved = false;
		} finally {
			isCheckingData = false;
		}
	}

	/**
	 * 가로 칼럼 데이터를 ev_sales/ev_cost 테이블에 저장
	 * 구조:
	 *   - Row 1: 헤더 (col 1은 매출/비용 과목, col 2~N은 조직코드)
	 *   - Row 2~N: 데이터 행
	 *   - 각 조직코드(col 2~N)별로 레코드 생성
	 *   - excel_file_data에 {과목코드: 값} 형태로 저장
	 * @returns {Promise<void>}
	 */
	/**
	 * 데이터 입력 버튼 클릭 핸들러
	 * 저장 로직:
	 *   - Col 1: 매출/비용 과목 코드 (ev_code)
	 *   - Row 1: 헤더 (col 1은 매출/비용 과목, col 2~N은 조직코드)
	 *   - Row 2~N: 데이터 행
	 *   - 각 조직코드(col 2~N)별로 레코드 생성
	 *   - excel_file_data에 {과목코드: 값} 형태로 저장
	 * @returns {Promise<void>}
	 */
	async function handleSaveColumnData() {
		if (!file || !excelType || headers.length === 0 || rows.length === 0) {
			console.log('저장할 데이터가 없습니다.', file, excelType, headers, rows);
			toast.error('저장할 데이터가 없습니다.');
			return;
		}

		isSavingData = true;
		error = '';

		try {
			// ev_excel_file에서 excel_file_id, year, month 조회
			const filePath = file.fullPath || (excelType ? `${excelType}/${file.name}` : file.name);
			const { data: excelFileData, error: excelFileError } = await supabase
				.from('ev_excel_file')
				.select('id, year, month')
				.eq('storage_path', `excel-files/${filePath}`)
				.single();

			if (excelFileError || !excelFileData) {
				throw new Error('엑셀 파일 정보를 찾을 수 없습니다.');
			}

			const excelFileId = excelFileData.id;
			// ev_excel_file에 저장된 year, month만 사용
			const fileYear = excelFileData.year || null;
			const fileMonth = (excelFileData.month !== null && excelFileData.month !== undefined) 
				? excelFileData.month 
				: null;

			console.log('[handleSaveColumnData] year/month (DB 값만 사용):', {
				excelFileDataYear: excelFileData.year,
				excelFileDataMonth: excelFileData.month,
				finalYear: fileYear,
				finalMonth: fileMonth
			});

			if (!fileYear) {
				throw new Error('연도 정보가 없습니다. 파일 리스트에서 년도를 설정해주세요.');
			}

			const tableName = excelType === 'sales' ? 'ev_sales' : 'ev_cost';

			/** @type {Map<string, {year: number, month: number | null, excel_file_id: string, org_code: string, excel_file_data: Record<string, any>}>} */
			const orgCodeDataMap = new SvelteMap();

			// col 2~N (조직코드 컬럼)을 순회
			for (let colIndex = 1; colIndex < headers.length; colIndex++) {
				const orgHeader = headers[colIndex];
				if (!orgHeader || orgHeader.trim() === '') continue;

				// 헤더에서 조직코드 찾기 (organization 카테고리)
				const orgMatchingCode = findMatchingCode(orgHeader);
				if (!orgMatchingCode || orgMatchingCode === 'excluded') {
					console.warn(`[handleSaveColumnData] 조직코드 매칭 실패: ${orgHeader}`);
					continue;
				}

				const orgCode = orgMatchingCode.code || orgMatchingCode.value;
				if (!orgCode) continue;

				// 해당 조직코드의 데이터 객체 초기화
				if (!orgCodeDataMap.has(orgCode)) {
					orgCodeDataMap.set(orgCode, {
						year: fileYear,
						month: (fileMonth !== null && fileMonth !== undefined) ? fileMonth : null,
						excel_file_id: excelFileId,
						org_code: orgCode,
						excel_file_data: {}
					});
				}

				const orgData = orgCodeDataMap.get(orgCode);
				if (!orgData) continue;

				// Row 2~N을 순회하면서 해당 조직코드 컬럼의 데이터 수집
				for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
					const row = rows[rowIndex];
					if (!row || row.length === 0) continue;

					// 첫 번째 컬럼(col 1)에서 매출/비용 과목 코드 찾기
					const firstCellValue = row[0] ?? '';
					const subjectMatchingCode = findMatchingCodeForFirstColumn(firstCellValue);

					if (!subjectMatchingCode || subjectMatchingCode === 'excluded') {
						continue; // 매칭되지 않거나 제외된 경우 건너뛰기
					}

					const subjectCode = subjectMatchingCode.code || subjectMatchingCode.value;
					if (!subjectCode) continue;

					// 해당 조직코드 컬럼의 셀 값 가져오기
					const cellValue = row[colIndex];

					// 숫자인 경우 콤마 제거 후 저장
					let value = cellValue;
					if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
						if (typeof cellValue === 'string' && cellValue.includes(',')) {
							const numValue = parseFloat(cellValue.replace(/,/g, ''));
							if (!isNaN(numValue) && isFinite(numValue)) {
								value = numValue;
							}
						}
					}

					// excel_file_data에 {과목코드: 값} 형태로 저장
					orgData.excel_file_data[subjectCode] = value;
				}
			}

			const insertData = Array.from(orgCodeDataMap.values());

			if (insertData.length === 0) {
				toast.error('저장할 데이터가 없습니다. 조직코드가 매칭되지 않았습니다.');
				isSavingData = false;
				return;
			}

			console.log('[handleSaveColumnData] 저장할 데이터:', {
				tableName,
				count: insertData.length,
				firstItem: insertData[0],
				fileYear,
				fileMonth,
				allItems: insertData.map(item => ({ org_code: item.org_code, year: item.year, month: item.month }))
			});

			// upsert 실행
			const { error: insertError } = await supabase
				.from(tableName)
				.upsert(insertData, { 
					onConflict: 'year,month,excel_file_id,org_code' 
				});

			if (insertError) {
				console.error('[handleSaveColumnData] upsert 에러:', insertError);
				throw insertError;
			}

			console.log('[handleSaveColumnData] 저장 완료');
			toast.success(`${insertData.length}개의 조직코드 데이터가 성공적으로 저장되었습니다.`);
			
			// 저장 후 데이터 저장 여부 상태 업데이트
			hasDataSaved = true;
			
			// 저장 성공 후 팝업 닫기 (부모 컴포넌트에서 페이지 새로고침 처리)
			if (onClose) {
				setTimeout(() => {
					onClose();
				}, 500); // 토스트 메시지를 보여주기 위해 약간의 지연
			}
		} catch (err) {
			console.error('[handleSaveColumnData] 데이터 저장 실패:', err);
			const errorMessage = err.message || '데이터 저장에 실패했습니다.';
			error = errorMessage;
			toast.error(errorMessage);
		} finally {
			isSavingData = false;
		}
	}

	// file prop이 변경될 때 내부 state 초기화
	$effect(() => {
		if (file) {
			// file prop이 변경되면 DB에서 로드한 값 초기화 (loadExcelFile에서 다시 로드됨)
			fileYearFromDB = null;
			fileMonthFromDB = null;
		}
	});

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
				<div class="loading-icon">📊</div>
				<div class="spinner"></div>
				<p class="loading-text">엑셀 파일을 읽는 중...</p>
			</div>
		{:else if fileName && workbook}
			<div class="preview-section">
				<div class="file-info-section">
					<div class="file-info-left">
						{#if !inline}
							<div class="file-info">
								<strong>파일명:</strong> {fileName}
							</div>
						{/if}
						
					{#if headers.length > 0}
						<div class="data-info">
							<div>컬럼: {headers.length}개 | 행: {rows.length}개</div>
							{#if unmatchedColumnsCount > 0}
								<div class="unmatched-badge">
									조직코드 매칭 안됨: {unmatchedColumnsCount}개
									{#if unmatchedColumnNames.length > 0}
										<span class="unmatched-names-inline">({unmatchedColumnNames.slice(0, 5).join(', ')}{unmatchedColumnNames.length > 5 ? '...' : ''})</span>
									{/if}
								</div>
							{/if}
							{#if unmatchedVerticalColumnsCount > 0}
								<div class="unmatched-badge">
									{excelType === 'sales' ? '매출' : '비용'}코드 매칭 안됨: {unmatchedVerticalColumnsCount}개
									{#if unmatchedVerticalColumnNames.length > 0}
										<span class="unmatched-names-inline">({unmatchedVerticalColumnNames.slice(0, 5).join(', ')}{unmatchedVerticalColumnNames.length > 5 ? '...' : ''})</span>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
						
						{#if sheetNames.length > 1}
							<div class="sheet-selector">
								<label for="sheet-select">시트 선택:</label>
								<select id="sheet-select" value={selectedSheet} onchange={handleSheetChange}>
									{#each sheetNames as sheet, index (index)}
										<option value={sheet}>{index + 1}. {sheet}</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- 데이터 입력 -->
						{#if file || isUploaded}
							<div class="data-input-section">
								{#if isCheckingData}
									<div class="data-status-message">데이터 확인 중...</div>
								{:else if hasDataSaved}
									<div class="data-status-message data-saved-message">데이터가 추가된 상태 입니다.</div>
								{:else}
								<button
									class="data-input-btn"
									onclick={handleSaveColumnData}
									disabled={isSavingData || headers.length === 0 || rows.length === 0 || unmatchedColumnsCount > 0 || unmatchedVerticalColumnsCount > 0}
								>
										{isSavingData 
											? '저장 중...' 
											: (() => {
												const { year, month } = fileYearMonth;
												if (year && month) {
													return `${year}년 ${month}월 데이터 입력`;
												} else if (year) {
													return `${year}년 데이터 입력`;
												} else {
													return '데이터 입력';
												}
											})()}
									</button>
								{#if unmatchedColumnsCount > 0 || unmatchedVerticalColumnsCount > 0}
									<span class="data-input-hint">
										매칭되지 않은 
										{#if unmatchedColumnsCount > 0 && unmatchedVerticalColumnsCount > 0}
											가로/세로 컬럼
										{:else if unmatchedColumnsCount > 0}
											가로 컬럼
										{:else}
											세로 컬럼
										{/if}
										이 있어 저장할 수 없습니다.
									</span>
								{/if}
								{/if}
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
										{#each headers as header, index (index)}
											{@const matchingCode = findMatchingCode(header, index)}
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
																<span 
																	class="code-unmatched clickable" 
																	role="button"
																	tabindex="0"
																	onclick={() => openCodeRegisterPopup(header, 'organization')}
																	onkeydown={(e) => {
																		if (e.key === 'Enter' || e.key === ' ') {
																			e.preventDefault();
																			openCodeRegisterPopup(header, 'organization');
																		}
																	}}
																	title="클릭하여 코드 등록 (organization)"
																>(등록)</span>
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
																<span 
																	class="code-unmatched clickable" 
																	role="button"
																	tabindex="0"
																	onclick={() => openCodeRegisterPopup(header, 'organization')}
																	onkeydown={(e) => {
																		if (e.key === 'Enter' || e.key === ' ') {
																			e.preventDefault();
																			openCodeRegisterPopup(header, 'organization');
																		}
																	}}
																	title="클릭하여 코드 등록 (organization)"
																>(등록)</span>
															{/if}
														{/if}
													</div>
												{/if}
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each rows as row, rowIndex (rowIndex)}
										<tr>
											{#each headers as header, colIndex (header)}
												{@const cellValue = row[colIndex] ?? ''}
												{@const isFirstColumn = colIndex === 0}
												{@const matchingCode = isFirstColumn ? findMatchingCodeForFirstColumn(cellValue) : null}
												<td
													class:frozen={colIndex < frozenColumns}
													style={colIndex < frozenColumns ? `left: ${colIndex * 150}px;` : ''}
												>
													<div class="frozen-td-cell-content text-right">
														{formatCellValue(cellValue)}
														{#if isFirstColumn && cellValue && cellValue.trim() !== '' && matchingCode !== 'excluded'}
															{#if matchingCode}
																<span class="code-match">({matchingCode.code})</span>
															{:else}
																<span 
																	class="code-unmatched clickable" 
																	role="button"
																	tabindex="0"
																	onclick={() => openCodeRegisterPopup(cellValue, excelType === 'sales' ? 'sales' : excelType === 'cost' ? 'cost' : null)}
																	onkeydown={(e) => {
																		if (e.key === 'Enter' || e.key === ' ') {
																			e.preventDefault();
																			openCodeRegisterPopup(cellValue, excelType === 'sales' ? 'sales' : excelType === 'cost' ? 'cost' : null);
																		}
																	}}
																	title="클릭하여 코드 등록"
																>(등록)</span>
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
						<p>데이터 확인 중...</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- 코드 등록 레이어 팝업 -->
	{#if showCodeRegisterPopup}
		<div 
			class="popup-overlay" 
			role="dialog"
			aria-modal="true"
			aria-labelledby="popup-title"
			tabindex="-1"
			onclick={closeCodeRegisterPopup}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					closeCodeRegisterPopup();
				}
			}}
		>
			<div 
				class="popup-content" 
				role="presentation"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<div class="popup-header">
					<h3 id="popup-title">코드 등록</h3>
					<button class="popup-close" onclick={closeCodeRegisterPopup} aria-label="닫기">×</button>
				</div>
				<div class="popup-body">
					<div class="form-group">
						<label for="register-target">등록할 값:</label>
						<input 
							id="register-target"
							type="text" 
							value={registerTargetValue || ''} 
							readonly 
							disabled
							class="form-input"
						/>
					</div>
					<div class="form-group">
						<div class="form-label">
							<label for="register-parent-code">상위코드 <span class="required">*</span></label>
							<button 
								class="btn-parent-code btn-blue" 
								onclick={() => openParentCodeSearchPopup(registerCategory || 'organization')}
								type="button"
							>
								검색
							</button>
						</div>
						{#if isLoadingParentOptions}
							<div class="form-info">로딩 중...</div>
						{:else if parentCodeOptions.length === 0}
							<div class="form-error">상위코드가 없습니다. 먼저 상위코드를 등록해주세요.</div>
						{:else}
							<select 
								id="register-parent-code"
								bind:value={registerParentCode}
								class="form-select"
								required
							>
								<option value="">선택하세요</option>
								{#each parentCodeOptions as option (option.code)}
									<option value={option.code}>{option.code} - {option.title}</option>
								{/each}
							</select>
						{/if}
					</div>
					<div class="form-group">
						<label for="register-code">코드 <span class="required">*</span>:</label>
						<input 
							id="register-code"
							type="text" 
							bind:value={registerCode}
							placeholder="예: SALES_0100"
							maxlength="16"
							class="form-input"
						/>
						<small class="form-hint">최대 16자리(중복되지 않아야 함)</small>
					</div>
					<div class="form-group">
						<label for="register-title">제목 <span class="required">*</span>:</label>
						<input 
							id="register-title"
							type="text" 
							bind:value={registerTitle}
							placeholder="코드 제목"
							class="form-input"
						/>
					</div>
					<div class="form-group">
						<label for="register-comment">설명:</label>
						<textarea 
							id="register-comment"
							bind:value={registerComment}
							placeholder="코드에 대한 설명 (선택사항)"
							class="form-textarea"
							rows="3"
						></textarea>
					</div>
					<div class="form-group">
						<label for="register-category">카테고리:</label>
						<div id="register-category" class="form-info">
							{registerCategory === 'organization' ? '조직 (organization)' : 
							 registerCategory === 'sales' ? '매출 (sales)' : 
							 registerCategory === 'cost' ? '비용 (cost)' :
							 (excelType === 'sales' ? '매출 (sales)' : excelType === 'cost' ? '비용 (cost)' : '조직 (organization)')}
						</div>
					</div>
					{#if error}
						<div class="form-error">{error}</div>
					{/if}
				</div>
				<div class="popup-footer">
					<button 
						class="btn-secondary" 
						onclick={closeCodeRegisterPopup}
						disabled={isRegisteringCode}
					>
						취소
					</button>
					<button 
						class="btn-primary" 
						onclick={handleRegisterCode}
						disabled={isRegisteringCode || !registerCode.trim() || !registerTitle.trim() || !registerParentCode.trim()}
					>
						{isRegisteringCode ? '등록 중...' : '등록'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- 상위코드 검색 팝업 -->
	{#if showParentCodeSearchPopup}
		<div 
			class="popup-overlay" 
			role="dialog"
			aria-modal="true"
			aria-labelledby="parent-code-search-title"
			tabindex="-1"
			onclick={closeParentCodeSearchPopup}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					closeParentCodeSearchPopup();
				}
			}}
		>
			<div 
				class="popup-content" 
				role="presentation"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<div class="popup-header">
					<h3 id="parent-code-search-title">상위코드 검색</h3>
					<button class="popup-close" onclick={closeParentCodeSearchPopup} aria-label="닫기">×</button>
				</div>
				<div class="popup-body">
					<div class="form-group">
						<label for="parent-code-search-query">검색어:</label>
						<div class="flex gap-2">
							<input 
								id="parent-code-search-query"
								type="text" 
								bind:value={parentCodeSearchQuery}
								placeholder="코드 또는 제목으로 검색"
								class="form-input flex-1"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										searchParentCodes();
									}
								}}
							/>
							<button 
								class="btn-primary" 
								onclick={searchParentCodes}
								disabled={isLoadingParentCodeSearch}
							>
								검색
							</button>
						</div>
					</div>
					<div class="form-group">
						<div class="form-label">검색 결과:</div>
						{#if isLoadingParentCodeSearch}
							<div class="form-info">검색 중...</div>
						{:else if parentCodeSearchResults.length === 0}
							<div class="form-info">검색 결과가 없습니다.</div>
						{:else}
							<div class="code-search-results">
								{#each parentCodeSearchResults as codeItem (codeItem.code)}
									<button
										class="code-search-item"
										onclick={() => handleSelectParentCode(codeItem)}
										type="button"
									>
										<div class="font-mono text-sm">{codeItem.code}</div>
										<div class="text-xs text-gray-500">{codeItem.title}</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
				<div class="popup-footer">
					<button 
						class="btn-secondary" 
						onclick={closeParentCodeSearchPopup}
					>
						닫기
					</button>
				</div>
			</div>
		</div>
	{/if}

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
		font-size: 1.2rem;
		color: #000000;
		font-weight: 600;
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
		padding: 4px 12px;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		display: inline-block;
	}

	.unmatched-names-inline {
		font-size: 0.8rem;
		font-weight: 400;
		margin-left: 0.5rem;
		opacity: 0.9;
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

	.code-unmatched.clickable {
		cursor: pointer;
		text-decoration: underline;
		color: #ef4444;
		transition: all 0.2s;
	}

	/* .code-unmatched.clickable:hover {
		color: #dc2626;
		background-color: #fef2f2;
		padding: 2px 4px;
		border-radius: 4px;
	} */

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

	.data-input-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.data-input-btn {
		padding: 2px 10px;
		font-size: 0.85rem;
		font-weight: 600;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		background-color: #10b981;
		color: white;
		border: none;
	}

	.data-input-btn:hover:not(:disabled) {
		background-color: #059669;
	}

	.data-input-btn:active:not(:disabled) {
		background-color: #047857;
	}

	.data-input-btn:disabled {
		cursor: not-allowed;
		background-color: #46eeab;
	}

	.data-input-hint {
		font-size: 0.875rem;
		color: #dc2626;
	}

	.data-status-message {
		padding: 2px 10px;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 0.5rem;
		background-color: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.data-status-message.data-saved-message {
		background-color: #d1fae5;
		color: #065f46;
		border-color: #10b981;
	}

	/* 레이어 팝업 스타일 */
	.popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		backdrop-filter: blur(2px);
	}

	.popup-content {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 10001;
	}

	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.popup-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	.popup-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.popup-close:hover {
		background-color: #f3f4f6;
		color: #111827;
	}

	.popup-body {
		padding: 1.5rem;
		flex: 1;
		overflow-y: auto;
	}

	.popup-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
	}

	.form-label {
		display: flex;
		align-items: center;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
	}

	.form-label label {
		margin-bottom: 0;
		margin-right: 0.5rem;
	}

	.form-group .required {
		color: #ef4444;
	}

	.form-input,
	.form-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #111827;
		box-sizing: border-box;
		font-family: inherit;
	}

	.form-select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #111827;
		box-sizing: border-box;
		font-family: inherit;
		background-color: white;
		cursor: pointer;
	}

	.form-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-input:disabled {
		background-color: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.form-hint {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.form-info {
		padding: 0.75rem;
		background-color: #f3f4f6;
		border-radius: 0.5rem;
		color: #374151;
		font-size: 0.875rem;
	}

	.form-error {
		padding: 0.75rem;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 1rem;
	}

	.btn-primary {
		background-color: #10b981;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #059669;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background-color: #f3f4f6;
		color: #374151;
		padding: 0.75rem 1.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: #e5e7eb;
	}

	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-parent-code {
		margin-left: 0.5rem;
		padding: 2px 10px;
		font-size: 0.875rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-parent-code.btn-blue {
		background-color: #3b82f6;
		color: white;
	}

	.btn-parent-code.btn-blue:hover {
		background-color: #2563eb;
	}

	.code-search-results {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}

	.code-search-item {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-bottom: 1px solid #e5e7eb;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.code-search-item:last-child {
		border-bottom: none;
	}

	.code-search-item:hover {
		background-color: #f3f4f6;
	}

	.flex {
		display: flex;
	}

	.gap-2 {
		gap: 0.5rem;
	}

	.flex-1 {
		flex: 1;
	}

</style>
