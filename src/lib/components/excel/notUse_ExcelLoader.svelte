<script>
	import * as XLSX from 'xlsx';
	
	let fileInput;
	let workbook = $state(null);
	let sheetNames = $state([]);
	let selectedSheet = $state('');
	let headers = $state([]);
	let rows = $state([]);
	let fileName = $state('');
	let error = $state('');
	let validationError = $state('');
	let isValidExcel = $state(false);
	let selectedRows = $state(new Set());
	let openMenuRowIndex = $state(null);
	let workResultMessage = $state(null); // 작업 결과 메시지 { type: 'success'|'error', title: '', items: [] }
	let isLoading = $state(false); // 작업 진행 중 로딩 상태
	let searchQuery = $state(''); // 검색어
	let allRows = $state([]); // 원본 데이터 (필터링 전)
	let editingRowIndex = $state(null); // 편집 중인 행 인덱스
	let editingRowData = $state(null); // 편집 중인 행의 원본 데이터 (복원용)
	let searchDebounceTimer = null; // 디바운싱 타이머
	let tableElement = $state(null); // 테이블 DOM 요소 참조
	let columnWidths = $state([]); // 실제 측정된 칼럼 너비 배열
	
	// 고정 칼럼의 left 위치 계산 함수 (실제 DOM 너비 사용)
	function getFixedColumnLeft(colIndex) {
		if (!workOption.fixedColumns || workOption.fixedColumns === 0) return 0;
		if (colIndex >= workOption.fixedColumns) return 0;
		
		let left = 0;
		
		// checkbox-col과 menu-col 너비 (isValidExcel이 true인 경우)
		if (isValidExcel) {
			if (tableElement && columnWidths.length >= 2) {
				// 실제 측정된 너비 사용
				left += columnWidths[0] || 50; // checkbox-col
				if (colIndex >= 0) {
					left += columnWidths[1] || 50; // menu-col
				}
			} else {
				// 폴백: 기본값 사용
				left += 50; // checkbox-col
				left += 50; // menu-col
			}
		}
		
		// 이전 고정 칼럼들의 너비 합계 (실제 DOM 너비 사용)
		for (let i = 0; i < colIndex; i++) {
			const actualIndex = i + (isValidExcel ? 2 : 0);
			if (tableElement && columnWidths.length > actualIndex) {
				// 실제 측정된 너비 사용
				left += columnWidths[actualIndex] || 120;
			} else {
				// 폴백: 설정값 또는 기본값 사용
				const header = headers[i];
				if (workOption.columnWidths?.[header]) {
					const width = workOption.columnWidths[header];
					if (typeof width === 'string' && width.includes('px')) {
						left += parseInt(width) || 120;
					} else if (typeof width === 'number') {
						left += width;
					} else {
						left += 120;
					}
				} else {
					left += 120;
				}
			}
		}
		
		return left;
	}
	
	// menu-col의 left 위치 계산 (checkbox-col 너비만)
	function getMenuColLeft() {
		if (!isValidExcel) return 0;
		if (tableElement && columnWidths.length >= 1) {
			return columnWidths[0] || 50;
		}
		return 50; // 폴백
	}
	
	// 칼럼 너비 측정 함수
	function measureColumnWidths() {
		if (!tableElement || headers.length === 0) return;
		
		const thead = tableElement.querySelector('thead tr');
		if (!thead) return;
		
		const thElements = Array.from(thead.querySelectorAll('th'));
		columnWidths = thElements.map(th => th.offsetWidth);
	}
	
	// 테이블이 업데이트될 때마다 칼럼 너비 재측정
	$effect(() => {
		if (headers.length > 0 && rows.length > 0 && tableElement) {
			// DOM이 렌더링된 후 측정 (여러 번 시도하여 정확한 너비 확보)
			const measure = () => {
				measureColumnWidths();
				// 한 번 더 측정하여 정확도 향상
				setTimeout(() => {
					measureColumnWidths();
				}, 50);
			};
			setTimeout(measure, 100);
		}
	});
	
	// Props
	let { 
		workOption = { 
			workList: [],
			requiredColumns: {}, // 필수 컬럼 객체 { 컬럼명: 정렬(left/center/right) }
			columnWidths: {}, // 헤더명: 폭(예: '150px', '20%')
			ignoreColumns: [], // 화면에 출력하지 않을 컬럼명 배열
			fixedColumns: 0 // 왼쪽에서 고정할 칼럼 개수 (0이면 고정 없음)
		} 
	} = $props();

	function handleFileUpload(event) {
		error = '';
		const file = event.target.files[0];
		
		if (!file) {
			return;
		}

		// console.log('File selected:', file.name);
		fileName = file.name;
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target.result);
				workbook = XLSX.read(data, { type: 'array' });
				sheetNames = workbook.SheetNames;
				
				// console.log('Workbook loaded, sheets:', sheetNames);
				
				// 기본 시트 선택: workOption.sheetIndex가 있으면 해당 시트, 없으면 첫 번째 시트
				if (sheetNames.length > 0) {
					if (workOption.sheetIndex > 0 && workOption.sheetIndex <= sheetNames.length) {
						selectedSheet = sheetNames[workOption.sheetIndex - 1];
					} else {
						selectedSheet = sheetNames[0];
					}
					loadSheet(selectedSheet);
				}
			} catch (err) {
				error = '엑셀 파일을 읽는 중 오류가 발생했습니다: ' + err.message;
				console.error('Error reading file:', err);
			}
		};

		reader.onerror = () => {
			error = '파일을 읽는 중 오류가 발생했습니다.';
		};

		reader.readAsArrayBuffer(file);
	}

	function loadSheet(sheetName) {
		if (!workbook || !sheetName) return;

		const worksheet = workbook.Sheets[sheetName];
		const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

		// console.log('Sheet loaded:', sheetName);
		// console.log('JSON Data:', jsonData);

		// 빈 행 제거 함수
		const isRowEmpty = (row) => {
			if (!row || row.length === 0) return true;
			return row.every(cell => cell === '' || cell === null || cell === undefined);
		};

		// 빈 행이 아닌 데이터만 필터링
		const filteredData = jsonData.filter(row => !isRowEmpty(row));
		
		// console.log('Filtered Data:', filteredData);

		if (filteredData.length > 0) {
			const tempHeaders = filteredData[0] || [];
			const tempRows = filteredData.slice(1);
			
			// ignoreColumns 목록 (대소문자 구분 없이)
			let ignoreColumnsLower = [];
			if (workOption.ignoreColumns && workOption.ignoreColumns.length > 0) {
				ignoreColumnsLower = workOption.ignoreColumns.map(col => col.toLowerCase());
			}
			
			// 빈 컬럼 식별 및 ignoreColumns 필터링
			const nonEmptyColumnIndices = [];
			tempHeaders.forEach((header, index) => {
				const isColumnEmpty = (header === '' || header === null || header === undefined) &&
					tempRows.every(row => !row[index] || row[index] === '' || row[index] === null || row[index] === undefined);
				
				// ignoreColumns에 포함된 컬럼인지 확인 (대소문자 구분 없이)
				const isIgnoredColumn = ignoreColumnsLower.includes(String(header).toLowerCase());
				
				if (!isColumnEmpty && !isIgnoredColumn) {
					nonEmptyColumnIndices.push(index);
				}
			});
			
			// 빈 컬럼 및 ignoreColumns 제거
			headers = nonEmptyColumnIndices.map(i => tempHeaders[i]);
			const filteredRows = tempRows.map(row => nonEmptyColumnIndices.map(i => row[i]));
			allRows = filteredRows; // 원본 데이터 저장
			rows = filteredRows; // 초기에는 필터링 없이 전체 표시
			
			// console.log('Headers set:', headers);
			// console.log('Rows set:', $state.snapshot(rows));
			// console.log('Rows count:', rows.length);
			// if (ignoreColumnsLower.length > 0) {
			// 	console.log('Ignored columns:', workOption.ignoreColumns);
			// }
			
			// 엑셀 컬럼 검증
			validateExcelColumns(headers);
		} else {
			headers = [];
			rows = [];
			allRows = [];
			validationError = '';
			isValidExcel = false;
			console.log('No data after filtering');
		}
		
		// 선택 초기화
		selectedRows = new Set();
		workResultMessage = null;
		searchQuery = ''; // 검색어 초기화
		editingRowIndex = null; // 편집 상태 초기화
		editingRowData = null;
	}
	
	function validateExcelColumns(currentHeaders) {
		validationError = '';
		isValidExcel = true;
		
		// excelColumns가 없거나 비어있으면 검증 생략하고 통과
		if (!workOption.excelColumns || 
			!Array.isArray(workOption.excelColumns) ||
			workOption.excelColumns.length === 0) {
			console.log('엑셀 컬럼 설정이 없거나 올바른 형식이 아닙니다. 검증을 생략합니다.');
			console.log('excelColumns:', workOption.excelColumns);
			return;
		}
		
		// required: true인 컬럼들의 caption 추출
		const requiredColumnNames = workOption.excelColumns
			.filter(col => col.required === true)
			.map(col => col.caption);
		
		// 필수 컬럼이 없으면 검증 생략
		if (requiredColumnNames.length === 0) {
			console.log('필수 컬럼이 지정되지 않았습니다. 검증을 생략합니다.');
			return;
		}
		
		// console.log('===== 엑셀 컬럼 검증 시작 =====');
		// console.log('필수 컬럼:', requiredColumnNames);
		// console.log('실제 헤더:', $state.snapshot(currentHeaders));
		
		// 필수 컬럼이 모두 있는지 확인
		const missingColumns = [];
		const extraColumns = [];
		
		// 대소문자 구분 없이 비교하기 위해 소문자로 변환
		const requiredLower = requiredColumnNames.map(col => col.toLowerCase());
		const headersLower = currentHeaders.map(col => String(col).toLowerCase());
		
		// 누락된 컬럼 찾기
		requiredColumnNames.forEach((required, index) => {
			if (!headersLower.includes(requiredLower[index])) {
				missingColumns.push(required);
			}
		});
		
		// 추가 컬럼 찾기 (경고용)
		currentHeaders.forEach((header, index) => {
			if (!requiredLower.includes(headersLower[index])) {
				extraColumns.push(header);
			}
		});
		
		if (missingColumns.length > 0) {
			isValidExcel = false;
			validationError = `필수 컬럼이 누락되었습니다.\n\n누락된 컬럼:\n${missingColumns.join(', ')}\n\n올바른 엑셀 파일을 업로드해주세요.`;
			console.error('검증 실패 - 누락된 컬럼:', missingColumns);
			alert(validationError);
		}
		// else {
		// 	console.log('검증 성공! 모든 필수 컬럼이 존재합니다.');
		// }
	}

	function handleSheetChange() {
		if (selectedSheet) {
			loadSheet(selectedSheet);
		}
	}

	function clearData() {
		// 검색 타이머 정리
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
			searchDebounceTimer = null;
		}
		
		workbook = null;
		sheetNames = [];
		selectedSheet = '';
		headers = [];
		rows = [];
		allRows = [];
		fileName = '';
		error = '';
		validationError = '';
		isValidExcel = false;
		selectedRows = new Set();
		openMenuRowIndex = null;
		workResultMessage = null;
		searchQuery = '';
		editingRowIndex = null;
		editingRowData = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
	
	// 검색어로 행 필터링 (최적화된 버전)
	function filterRows() {
		if (!searchQuery.trim()) {
			rows = allRows;
			selectedRows = new Set(); // 검색 초기화 시 선택도 초기화
			return;
		}
		
		const query = searchQuery.toLowerCase().trim();
		const filteredRows = [];
		const originalToFilteredIndexMap = new Map(); // 원본 인덱스 -> 필터링된 인덱스 매핑
		
		// 성능 최적화: 배열 순회 최소화
		for (let i = 0; i < allRows.length; i++) {
			const row = allRows[i];
			let matches = false;
			
			// 모든 컬럼의 데이터를 검색 (빠른 종료)
			for (let j = 0; j < row.length; j++) {
				const cellValue = String(row[j] || '').toLowerCase();
				if (cellValue.includes(query)) {
					matches = true;
					break; // 하나라도 매치되면 즉시 종료
				}
			}
			
			if (matches) {
				const filteredIndex = filteredRows.length;
				originalToFilteredIndexMap.set(i, filteredIndex);
				filteredRows.push(row);
			}
		}
		
		rows = filteredRows;
		
		// 선택된 행 인덱스를 필터링된 인덱스로 변환
		const newSelectedRows = new Set();
		selectedRows.forEach(originalIndex => {
			if (originalToFilteredIndexMap.has(originalIndex)) {
				newSelectedRows.add(originalToFilteredIndexMap.get(originalIndex));
			}
		});
		selectedRows = newSelectedRows;
	}
	
	// 디바운싱된 검색 함수
	function debouncedFilterRows() {
		// 이전 타이머가 있으면 취소
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
		}
		
		// 300ms 후에 검색 실행
		searchDebounceTimer = setTimeout(() => {
			filterRows();
			searchDebounceTimer = null;
		}, 300);
	}
	
	// 즉시 검색 실행 (검색 버튼 클릭 시)
	function executeSearch() {
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
			searchDebounceTimer = null;
		}
		filterRows();
	}
	
	function toggleRowSelection(rowIndex) {
		const newSelected = new Set(selectedRows);
		if (newSelected.has(rowIndex)) {
			newSelected.delete(rowIndex);
		} else {
			newSelected.add(rowIndex);
		}
		selectedRows = newSelected;
	}
	
	function toggleAllRows() {
		// 각 행의 현재 선택 상태를 반대로 토글
		const newSelected = new Set();
		rows.forEach((_, index) => {
			if (!selectedRows.has(index)) {
				newSelected.add(index);
			}
		});
		selectedRows = newSelected;
	}
	
	function toggleMenu(rowIndex) {
		// console.log('toggleMenu 호출:', rowIndex, '현재 openMenuRowIndex:', openMenuRowIndex);
		openMenuRowIndex = openMenuRowIndex === rowIndex ? null : rowIndex;
		// console.log('변경 후 openMenuRowIndex:', openMenuRowIndex, 'isLoading:', isLoading);
	}
	
	function editRow(rowIndex) {
		// 다른 행이 편집 중이면 취소
		if (editingRowIndex !== null && editingRowIndex !== rowIndex) {
			cancelRowEdit();
		}
		
		// 필터링된 rows에서의 인덱스를 원본 allRows 인덱스로 변환
		const originalIndex = searchQuery.trim() 
			? findOriginalIndex(rowIndex)
			: rowIndex;
		
		// 편집 모드 시작
		editingRowIndex = rowIndex;
		// 현재 행의 데이터를 복사하여 편집용으로 저장
		const currentRow = searchQuery.trim() ? allRows[originalIndex] : rows[rowIndex];
		editingRowData = [...currentRow]; // 배열 복사
		
		openMenuRowIndex = null;
	}
	
	function saveRowEdit(rowIndex) {
		if (editingRowIndex === null || editingRowData === null) return;
		
		// 필터링된 rows에서의 인덱스를 원본 allRows 인덱스로 변환
		const originalIndex = searchQuery.trim() 
			? findOriginalIndex(rowIndex)
			: rowIndex;
		
		// allRows에서 해당 행 업데이트
		allRows = allRows.map((row, i) => {
			if (i === originalIndex) {
				return editingRowData;
			}
			return row;
		});
		
		// 필터링 다시 적용
		filterRows();
		
		// 편집 모드 종료
		editingRowIndex = null;
		editingRowData = null;
	}
	
	function cancelRowEdit() {
		editingRowIndex = null;
		editingRowData = null;
	}
	
	function updateCellValue(rowIndex, colIndex, value) {
		if (editingRowData === null) return;
		editingRowData[colIndex] = value;
	}
	
	function deleteRow(rowIndex) {
		// 필터링된 rows에서의 인덱스를 원본 allRows 인덱스로 변환
		const originalIndex = searchQuery.trim() 
			? findOriginalIndex(rowIndex)
			: rowIndex;
		
		// allRows에서 삭제
		allRows = allRows.filter((_, i) => i !== originalIndex);
		
		// 필터링 다시 적용
		filterRows();
		
		openMenuRowIndex = null;
	}
	
	// 필터링된 인덱스를 원본 인덱스로 변환하는 헬퍼 함수
	function findOriginalIndex(filteredIndex) {
		if (!searchQuery.trim()) {
			return filteredIndex;
		}
		
		const query = searchQuery.toLowerCase().trim();
		let currentFilteredIndex = 0;
		
		for (let i = 0; i < allRows.length; i++) {
			const row = allRows[i];
			const matches = row.some(cell => {
				const cellValue = String(cell || '').toLowerCase();
				return cellValue.includes(query);
			});
			
			if (matches) {
				if (currentFilteredIndex === filteredIndex) {
					return i;
				}
				currentFilteredIndex++;
			}
		}
		
		return filteredIndex; // 찾지 못한 경우 (이론적으로 발생하지 않아야 함)
	}
	
	async function rowWork(rowIndex, work) {
		try {
			isLoading = true;
			// 필터링된 rows에서의 인덱스를 원본 allRows 인덱스로 변환
			const originalIndex = searchQuery.trim() 
				? findOriginalIndex(rowIndex)
				: rowIndex;
			
			const row = searchQuery.trim() ? allRows[originalIndex] : rows[rowIndex];
			const rowData = {
				data: headers.reduce((obj, header, i) => {
					obj[header] = row[i];
					return obj;
				}, {})
			};
			
			if (work.workFunc && typeof work.workFunc === 'function') {
				await work.workFunc(rowData);
			}
			
			openMenuRowIndex = null;
		} finally {
			isLoading = false;
		}
	}
	
	async function executeSheetWork(work) {
		try {
			isLoading = true;
			let selectedRowsData;
			
			// 이전 작업 결과 메시지 초기화
			workResultMessage = null;
			
			// 선택된 row가 없으면 전체 데이터로 진행할지 확인
			if (selectedRows.size === 0) {
				const confirmed = confirm('전체 데이터에 대해서 작업을 진행할까요?');
				if (!confirmed) {
					return; // 취소하면 작업 중단
				}
				
				// 전체 rows 데이터 생성
				selectedRowsData = rows.map((rowData, rowIndex) => {
					return {
						data: headers.reduce((obj, header, i) => {
							obj[header] = rowData[i];
							return obj;
						}, {})
					};
				});
			} else {
				// 선택된 rows만 데이터 생성
				selectedRowsData = Array.from(selectedRows).map(rowIndex => {
					return {
						// index: rowIndex,
						// headers: headers,
						// values: rows[rowIndex],
						data: headers.reduce((obj, header, i) => {
							obj[header] = rows[rowIndex][i];
							return obj;
						}, {})
					};
				});
			}
			
			if (work.workFunc && typeof work.workFunc === 'function') {
				const result = await work.workFunc(selectedRowsData);
				
				// callback이 결과를 반환하면 저장
				if (result) {
					workResultMessage = result;
				}
			}
		} finally {
			isLoading = false;
		}
	}

	function handleSelectedDelete() {
		if (selectedRows.size === 0) {
			alert('삭제할 항목을 선택해주세요.');
			return;
		}
		
		const confirmed = confirm(`선택한 ${selectedRows.size}개의 항목을 삭제하시겠습니까?`);
		if (!confirmed) {
			return;
		}
		
		// 선택된 행의 원본 인덱스를 모두 수집
		const originalIndices = Array.from(selectedRows).map(filteredIndex => {
			return searchQuery.trim() 
				? findOriginalIndex(filteredIndex)
				: filteredIndex;
		});
		
		// 중복 제거 및 내림차순 정렬 (뒤에서부터 삭제하면 인덱스 변경 문제 없음)
		const sortedIndices = [...new Set(originalIndices)].sort((a, b) => b - a);
		
		// allRows에서 선택된 행들을 한 번에 삭제
		allRows = allRows.filter((_, i) => !sortedIndices.includes(i));
		
		// 선택 초기화
		selectedRows = new Set();
		
		// 필터링 다시 적용 (한 번만 호출)
		filterRows();
		
		openMenuRowIndex = null;
	}
	
	function closeMenu(event) {
		// 편집 모드 중이면 메뉴만 닫고 편집은 유지
		if (editingRowIndex !== null) {
			openMenuRowIndex = null;
			return;
		}
		openMenuRowIndex = null;
	}
</script>

<div class="excel-loader">
	<div class="upload-section">
		<div class="upload-controls">
			<input
				type="file"
				accept=".xlsx,.xls,.csv"
				bind:this={fileInput}
				onchange={handleFileUpload}
				class="file-input-hidden"
			/>
			<button onclick={() => fileInput?.click()} class="upload-btn">
				📁 {fileName || '파일 선택'}
			</button>
			<p class="description">
				엑셀 파일(.xlsx, .xls, .csv)을 업로드하면 
				<span class="work-name">{workOption.workName}</span> 
				작업을 진행할 수 있습니다.
			</p>
			{#if fileName}
				<button onclick={clearData} class="clear-btn">
					초기화
				</button>
			{/if}
		</div>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		{#if fileName}
			<div class="file-info-row">
				<div class="file-name">
					<strong>파일명:</strong> {fileName}
				</div>
				
				{#if sheetNames.length > 0}
					<div class="sheet-selector">
						<label for="sheet-select">시트 선택:</label>
						<select id="sheet-select" bind:value={selectedSheet} onchange={handleSheetChange}>
							{#each sheetNames as sheet, index}
								<option value={sheet}>{index + 1} = {sheet}</option>
							{/each}
						</select>
					</div>
				{/if}
				
				{#if headers.length > 0}
					<div class="debug-info">
						Headers: {headers.length} | Rows: {rows.length}
					</div>
				{/if}
			</div>
		{/if}
		
		{#if validationError}
			<div class="validation-error">
				<strong>⚠️ 엑셀 파일 검증 실패</strong>
				<p>{validationError}</p>
			</div>
		{/if}
		
		{#if isLoading}
			<div class="loading-message">
				<div class="loading-spinner"></div>
				<strong>작업 진행 중입니다...</strong>
				<p>잠시만 기다려주세요.</p>
			</div>
		{/if}
		
		{#if workResultMessage}
			<div class="work-result-message {workResultMessage.type}">
				<div class="result-header">
					<strong>{workResultMessage.title}</strong>
					<button class="close-result-btn" onclick={() => workResultMessage = null}>✕</button>
				</div>
				{#if workResultMessage.items && workResultMessage.items.length > 0}
					<div class="result-items">
						{#each workResultMessage.items as item, index}
							<div class="result-item">
								<div class="item-number">{index + 1}.</div>
								<div class="item-content">
									<div class="item-main">{item.name} ({item.pccNumber})</div>
									{#if item.result}
										<div class="item-status">상태: {item.result}</div>
									{/if}
									{#if item.error}
										<div class="item-error">사유: {item.error} {@html item.resultActions}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>

    <!-- 시트 작업 버튼 및 검색 기능 - 검증 성공 시에만 표시 -->
    {#if isValidExcel && allRows.length > 0}
        <div class="sheet-work-buttons">
            {#if workOption.sheetWorkList && workOption.sheetWorkList.length > 0}
                <div class="sheet-work-buttons-left">
                    {#each workOption.sheetWorkList as work}
                        <button 
                            class="sheet-work-btn" 
                            onclick={() => executeSheetWork(work)}
                            disabled={isLoading}
                        >
                            {work.icon || '⚙️'} {work.name || '작업'}
                        </button>
                    {/each}
						<button 
                            class="sheet-work-btn" 
                            onclick={() => handleSelectedDelete()}
                            disabled={isLoading}
                        >
                            ❌ 선택항목 삭제
                        </button>
                </div>
            {/if}
            <div class="search-input-wrapper">
                <input
                    type="text"
                    class="search-input"
                    placeholder="검색어를 입력하세요..."
                    bind:value={searchQuery}
                    oninput={debouncedFilterRows}
                    onkeydown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            executeSearch();
                        }
                    }}
                />
                <button 
                    class="search-btn" 
                    onclick={executeSearch}
                    aria-label="검색"
                    title="검색 실행 (Enter)"
                >
                    🔍
                </button>
                {#if searchQuery}
                    <button class="search-clear-btn" onclick={() => { searchQuery = ''; executeSearch(); }} aria-label="검색 초기화">
                        ✕
                    </button>
                {/if}
            </div>
        </div>
        {#if searchQuery}
            <div class="search-result-info">
                {#if rows.length > 0}
                    전체 {allRows.length}개 중 {rows.length}개 표시
                {:else}
                    검색 결과가 없습니다. (전체 {allRows.length}개)
                {/if}
            </div>
        {/if}
    {/if}
    
	{#if headers.length > 0}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div 
			class="table-container" 
			onclick={closeMenu}
		>
			{#if rows.length > 0}
				<table class="excel-table" bind:this={tableElement}>
					<thead>
						<tr>
							{#if isValidExcel}
								<th class="checkbox-col fixed-col" style="position: sticky; left: 0; z-index: 20; background-color: #4CAF50;">
									<input 
										type="checkbox" 
										checked={selectedRows.size === rows.length && rows.length > 0}
										onchange={toggleAllRows}
									/>
								</th>
								<th 
									class="menu-col fixed-col"
									style="position: sticky; left: {getMenuColLeft()}px; z-index: 20;"
								>
									작업
								</th>
							{/if}
							{#each headers as header, colIndex}
								{@const isFixed = workOption.fixedColumns > 0 && colIndex < workOption.fixedColumns}
								{@const fixedLeft = isFixed ? getFixedColumnLeft(colIndex) : 0}
								<th 
									class:fixed-col={isFixed}
									style="text-align: {workOption.requiredColumns?.[header] || 'left'}; {workOption.columnWidths?.[header] ? `width: ${workOption.columnWidths[header]};` : ''} {isFixed ? `position: sticky; left: ${fixedLeft}px; z-index: 20; background-color: #4CAF50;` : ''}"
								>
									{header}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row, rowIndex}
						<tr class:selected={selectedRows.has(rowIndex)}>
						{#if isValidExcel}
							<td 
								class="checkbox-col fixed-col {selectedRows.has(rowIndex) ? 'selected' : ''} {rowIndex % 2 === 0 ? 'even-row' : 'odd-row'}"
								style="position: sticky; left: 0; z-index: 15;"
							>
								<input 
									type="checkbox" 
									checked={selectedRows.has(rowIndex)}
									onchange={() => toggleRowSelection(rowIndex)}
								/>
							</td>
							<td 
								class="menu-col fixed-col {selectedRows.has(rowIndex) ? 'selected' : ''} {rowIndex % 2 === 0 ? 'even-row' : 'odd-row'}"
								style="position: sticky; left: {getMenuColLeft()}px; z-index: 15;"
							>
								<div class="menu-wrapper">
									{#if editingRowIndex === rowIndex}
										<!-- 편집 모드: 저장/취소 버튼 -->
										<div class="edit-controls">
											<button 
												class="save-btn"
												onclick={() => saveRowEdit(rowIndex)}
												aria-label="저장"
												disabled={isLoading}
											>
												✓ 저장
											</button>
											<button 
												class="cancel-btn"
												onclick={() => cancelRowEdit()}
												aria-label="취소"
												disabled={isLoading}
											>
												✕ 취소
											</button>
										</div>
									{:else}
										<!-- 일반 모드: 메뉴 버튼 -->
										<button 
											class="menu-btn"
											onclick={(e) => { e.stopPropagation(); toggleMenu(rowIndex); }}
											aria-label="메뉴 열기"
											disabled={isLoading}
										>
											<span style="font-size: 10px;">{rowIndex + 1}</span>⋮
										</button>
										{#if openMenuRowIndex === rowIndex && !isLoading}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<div 
												class="context-menu" 
												onclick={(e) => e.stopPropagation()}
												data-debug="menu-visible"
												data-row-index={rowIndex}
												data-open-menu-index={openMenuRowIndex}
											>
												<!-- <div class="menu-header">행 {rowIndex + 1}</div> -->
												<button class="menu-item edit" onclick={() => editRow(rowIndex)} role="menuitem">✏️ 수정</button>
												<button class="menu-item delete" onclick={() => deleteRow(rowIndex)} role="menuitem">🗑️ 삭제</button>
												{#if workOption.rowWorkList && workOption.rowWorkList.length > 0}
													{#each workOption.rowWorkList as work}
														<button 
															class="menu-item custom"
															onclick={() => rowWork(rowIndex, work)}
															role="menuitem"
														>
															{work.icon || '⚙️'} {work.name || '작업'}
														</button>
													{/each}
												{/if}
											</div>
										{/if}
									{/if}
								</div>
							</td>
						{/if}
						{#each headers as header, colIndex}
							{@const isFixed = workOption.fixedColumns > 0 && colIndex < workOption.fixedColumns}
							{@const fixedLeft = isFixed ? getFixedColumnLeft(colIndex) : 0}
							<td 
								class="cell-content {editingRowIndex === rowIndex ? 'editing' : ''} {isFixed ? 'fixed-col' : ''} {selectedRows.has(rowIndex) ? 'selected' : ''} {rowIndex % 2 === 0 ? 'even-row' : 'odd-row'}"
								style="text-align: {workOption.requiredColumns?.[header] || 'left'}; {workOption.columnWidths?.[header] ? `width: ${workOption.columnWidths[header]};` : ''} {isFixed ? `position: sticky; left: ${fixedLeft}px; z-index: 15;` : ''}"
								title={editingRowIndex === rowIndex ? (editingRowData?.[colIndex] ?? '') : (row[colIndex] ?? '')}
								onclick={(e) => {
									// 편집 모드 중이면 이벤트 전파 중지
									if (editingRowIndex === rowIndex) {
										e.stopPropagation();
									}
								}}
							>
								{#if editingRowIndex === rowIndex && editingRowData}
									<input
										type="text"
										class="cell-input"
										value={editingRowData[colIndex] ?? ''}
										oninput={(e) => updateCellValue(rowIndex, colIndex, e.target.value)}
										onclick={(e) => e.stopPropagation()}
										onfocus={(e) => e.stopPropagation()}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												saveRowEdit(rowIndex);
											} else if (e.key === 'Escape') {
												e.preventDefault();
												cancelRowEdit();
											}
										}}
									/>
								{:else}
									{row[colIndex] ?? ''}
								{/if}
							</td>
						{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			{:else if searchQuery && allRows.length > 0}
				<div class="no-data">
					<p>검색 결과가 없습니다. (전체 {allRows.length}개)</p>
				</div>
			{:else}
				<div class="no-data">
					{#if fileName}
						<p>데이터를 불러오는 중이거나 빈 시트입니다.</p>
					{:else}
						<p>엑셀 파일을 업로드해주세요.</p>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="no-data">
			{#if fileName}
				<p>데이터를 불러오는 중이거나 빈 시트입니다.</p>
			{:else}
				<p>엑셀 파일을 업로드해주세요.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.excel-loader {
		width: 100%;
		/* padding: 20px; */
	}

	.upload-section {
		margin-bottom: 20px;
	}

	.upload-controls {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-bottom: 10px;
	}

	.file-input-hidden {
		display: none;
	}

	.upload-btn {
		flex: 1;
		padding: 10px 20px;
		background-color: #d4eed5;
		color: rgb(65, 62, 62);
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		font-size: 14px;
		transition: all 0.3s;
		text-align: left;
	}

	.upload-btn:hover {
		background-color: #c5e5c6;
		border-color: #aaa;
	}

	.clear-btn {
		padding: 10px 20px;
		background-color: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.3s;
		font-size: 14px;
	}

	.clear-btn:hover {
		background-color: #c82333;
	}

	.file-info-row {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 10px;
		background-color: #e7f3ff;
		border-left: 4px solid #2196F3;
		margin-top: 10px;
		border-radius: 4px;
		flex-wrap: wrap;
	}

	.file-name {
		flex-shrink: 0;
	}

	.file-name strong {
		margin-right: 5px;
	}

	.error-message {
		padding: 10px;
		background-color: #ffe7e7;
		border-left: 4px solid #dc3545;
		color: #721c24;
		margin-top: 10px;
		border-radius: 4px;
	}

	.validation-error {
		padding: 15px;
		background-color: #fff3cd;
		border: 2px solid #ff9800;
		border-radius: 4px;
		margin-top: 10px;
		color: #856404;
	}

	.validation-error strong {
		display: block;
		margin-bottom: 10px;
		font-size: 1.1rem;
		color: #d84315;
	}

	.validation-error p {
		margin: 5px 0;
		white-space: pre-line;
		line-height: 1.6;
	}

	.loading-message {
		padding: 20px;
		background-color: #e3f2fd;
		border: 2px solid #2196F3;
		border-radius: 4px;
		margin-top: 10px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.loading-message strong {
		font-size: 1.1rem;
		color: #1565c0;
	}

	.loading-message p {
		margin: 0;
		color: #1976d2;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #bbdefb;
		border-top-color: #2196F3;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.work-result-message {
		padding: 15px;
		border-radius: 4px;
		margin-top: 10px;
		position: relative;
	}

	.work-result-message.success {
		background-color: #d4edda;
		border: 2px solid #28a745;
		color: #155724;
	}

	.work-result-message.error {
		background-color: #f8d7da;
		border: 2px solid #dc3545;
		color: #721c24;
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
	}

	.result-header strong {
		font-size: 1.1rem;
		display: block;
	}

	.close-result-btn {
		background: none;
		border: none;
		font-size: 1.3rem;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.2s;
	}

	.close-result-btn:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.result-items {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.result-item {
		display: flex;
		gap: 8px;
		padding: 10px;
		background-color: rgba(255, 255, 255, 0.5);
		border-radius: 4px;
	}

	.item-number {
		font-weight: 600;
		flex-shrink: 0;
	}

	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.item-main {
		font-weight: 600;
		font-size: 1rem;
	}

	.item-status {
		font-size: 0.9rem;
		color: inherit;
	}

	.item-error {
		font-size: 0.9rem;
		color: inherit;
		padding-left: 10px;
	}

	.sheet-selector {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.sheet-selector label {
		font-weight: 500;
		white-space: nowrap;
	}

	.sheet-selector select {
		padding: 6px 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		background-color: white;
		font-size: 0.9rem;
	}

	.table-container {
		overflow-x: auto;
		border: 1px solid #ddd;
		border-radius: 4px;
		max-height: 600px;
		overflow-y: auto;
		margin-top: 10px;
		position: relative;
	}

	.excel-table {
		width: 100%;
		min-width: max-content;
		border-collapse: collapse;
		background-color: white;
		font-size: 14px;
		line-height: 1.3;
	}

	.excel-table thead {
		position: sticky;
		top: 0;
		background-color: #f8f9fa;
		z-index: 10;
	}

	.excel-table th {
		padding: 6px 10px;
		text-align: left;
		border: 1px solid #ddd;
		font-weight: 600;
		background-color: #4CAF50;
		color: white;
		line-height: 1.2;
		min-width: 80px;
	}
	
	.excel-table th.fixed-col {
		background-color: #4CAF50 !important;
		box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
	}

	.excel-table td {
		padding: 3px 8px;
		border: 1px solid #ddd;
		line-height: 1.3;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.excel-table td.menu-col {
		overflow: visible;
	}
	
	.excel-table td.cell-content {
		position: relative;
	}
	
	.excel-table td.cell-content:hover {
		overflow: visible;
		white-space: normal;
		background-color: #fff9e6;
		z-index: 100;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.excel-table tbody tr:hover {
		background-color: #f5f5f5;
	}
	
	.excel-table tbody tr:nth-child(even) {
		background-color: #fafafa;
	}
	
	/* 고정 칼럼 배경색 - 짝수 행 */
	.excel-table tbody tr.even-row .fixed-col,
	.excel-table tbody tr:nth-child(even) .fixed-col {
		background-color: #fafafa !important;
	}
	
	/* 고정 칼럼 배경색 - 홀수 행 */
	.excel-table tbody tr.odd-row .fixed-col,
	.excel-table tbody tr:nth-child(odd) .fixed-col {
		background-color: white !important;
	}
	
	/* 고정 칼럼 배경색 - hover */
	.excel-table tbody tr:hover .fixed-col {
		background-color: #f5f5f5 !important;
	}
	
	/* 고정 칼럼 배경색 - 선택된 행 */
	.excel-table tbody tr.selected .fixed-col,
	.excel-table tbody tr .fixed-col.selected {
		background-color: #e3f2fd !important;
	}
	
	/* 고정 칼럼 배경색 - 선택된 행 hover */
	.excel-table tbody tr.selected:hover .fixed-col,
	.excel-table tbody tr:hover .fixed-col.selected {
		background-color: #e3f2fd !important;
	}
	
	/* 고정 칼럼 그림자 효과 */
	.excel-table td.fixed-col,
	.excel-table th.fixed-col {
		box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
	}

	.excel-table tbody tr.selected {
		background-color: #e3f2fd !important;
	}

	.checkbox-col {
		width: 40px;
		text-align: center !important;
		padding: 4px !important;
	}

	.checkbox-col input[type="checkbox"] {
		cursor: pointer;
		width: 16px;
		height: 16px;
	}

	.menu-col {
		width: 50px;
		text-align: center !important;
		padding: 4px !important;
		position: relative;
		z-index: 100;
		overflow: visible;
	}

	.menu-wrapper {
		position: relative;
		display: inline-block;
		z-index: 100;
		overflow: visible;
	}

	.menu-btn {
		background: none;
		border: none;
		font-size: 18px;
		cursor: pointer;
		padding: 0px 6px;
		border-radius: 4px;
		transition: background-color 0.2s;
		color: #666;
		line-height: 1;
	}

	.menu-btn:hover:not(:disabled) {
		background-color: #e0e0e0;
	}

	.menu-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.context-menu {
		position: absolute;
		top: 0;
		left: calc(100% + 4px);
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		min-width: 150px;
		display: block !important;
		visibility: visible !important;
		opacity: 1 !important;
		white-space: nowrap;
	}
	
	.menu-header {
		padding: 8px 14px;
		font-size: 12px;
		font-weight: 600;
		color: #666;
		border-bottom: 1px solid #e0e0e0;
		background-color: #f5f5f5;
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 8px 14px;
		border: none;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
		font-size: 13px;
		white-space: nowrap;
		line-height: 1.4;
	}

	.menu-item:first-child {
		border-radius: 4px 4px 0 0;
	}

	.menu-item:last-child {
		border-radius: 0 0 4px 4px;
	}

	.menu-item:hover {
		background-color: #f5f5f5;
	}

	.menu-item.delete:hover {
		background-color: #ffebee;
		color: #c62828;
	}

	.menu-item.custom:hover {
		background-color: #e3f2fd;
		color: #1976d2;
	}

	/* 편집 모드 스타일 */
	.edit-controls {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.save-btn,
	.cancel-btn {
		padding: 4px 8px;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.save-btn {
		background-color: #4caf50;
		color: white;
		border-color: #4caf50;
	}

	.save-btn:hover:not(:disabled) {
		background-color: #45a049;
		border-color: #45a049;
	}

	.cancel-btn {
		background-color: #f44336;
		color: white;
		border-color: #f44336;
	}

	.cancel-btn:hover:not(:disabled) {
		background-color: #da190b;
		border-color: #da190b;
	}

	.save-btn:disabled,
	.cancel-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cell-content.editing {
		padding: 2px !important;
		background-color: #fff9c4;
	}

	.cell-input {
		width: 100%;
		padding: 4px 6px;
		border: 1px solid #2196F3;
		border-radius: 3px;
		font-size: inherit;
		font-family: inherit;
		background-color: white;
		box-sizing: border-box;
	}

	.cell-input:focus {
		outline: none;
		border-color: #1976d2;
		box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
	}

	tr:has(.cell-content.editing) {
		background-color: #fff9c4;
	}

	.debug-info {
		padding: 6px 12px;
		background-color: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 4px;
		font-size: 0.85rem;
		white-space: nowrap;
		font-weight: 500;
		margin-left: auto;
		flex-shrink: 0;
	}

	.no-data {
		padding: 40px;
		text-align: center;
		color: #666;
		background-color: #f8f9fa;
		border-radius: 4px;
		border: 2px dashed #ddd;
		margin-top: 10px;
	}

	.no-data p {
		margin: 0;
		font-size: 1.1rem;
	}

	.sheet-work-buttons {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	.sheet-work-buttons-left {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 10px;
		flex: 1;
	}

	.sheet-work-btn {
		padding: 8px 16px;
		background-color: #27285b;
		color: white;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		font-size: 14px;
	}

	.sheet-work-btn:hover:not(:disabled) {
		background-color: #45a049;
	}

	.sheet-work-btn:disabled {
		background-color: #9e9e9e;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* 검색 기능 스타일 */
	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.search-input {
		width: 200px;
		padding: 8px 12px;
		padding-right: 35px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 14px;
		transition: border-color 0.2s;
	}

	.search-btn {
		padding: 12px 12px;
		background-color: #2196F3;
		color: white;
		border: 1px solid #2196F3;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
		line-height: 1;
		flex-shrink: 0;
	}

	.search-btn:hover:not(:disabled) {
		background-color: #1976d2;
		border-color: #1976d2;
	}

	.search-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.search-input:focus {
		outline: none;
		border-color: #2196F3;
		box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
	}

	.search-clear-btn {
		position: absolute;
		right: 50px;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 18px;
		color: #999;
		padding: 4px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
		width: 24px;
		height: 24px;
		z-index: 1;
	}

	.search-clear-btn:hover {
		background-color: #e0e0e0;
		color: #666;
	}

	.search-result-info {
		margin-top: 8px;
		margin-bottom: 10px;
		font-size: 13px;
		color: #666;
		font-weight: 500;
		text-align: right;
	}
</style>

