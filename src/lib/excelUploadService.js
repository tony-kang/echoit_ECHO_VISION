// 엑셀 파일 업로드 서비스
import { supabase } from './supabaseClient';

/**
 * 엑셀 파일을 Supabase Storage에 업로드
 * @param {File} file - 업로드할 엑셀 파일
 * @param {string} excelType - 엑셀 타입 ('sales' 또는 'cost')
 * @returns {Promise<{data: {fileId: string, fileName: string} | null, error: Error | null}>}
 */
export async function uploadExcelFile(file, excelType) {
	try {
		if (!file) {
			return { data: null, error: new Error('파일이 선택되지 않았습니다.') };
		}

		// 엑셀 파일인지 확인
		const allowedTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
			'application/vnd.ms-excel', // .xls
			'text/csv' // .csv
		];
		
		if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
			return { data: null, error: new Error('엑셀 파일(.xlsx, .xls, .csv)만 업로드할 수 있습니다.') };
		}

		// 파일 크기 제한 (50MB)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			return { data: null, error: new Error('파일 크기는 50MB 이하여야 합니다.') };
		}

		// 고유한 파일명 생성 (타입/타임스탬프_랜덤문자열.확장자)
		const timestamp = Date.now();
		const randomStr = Math.random().toString(36).substring(2, 15);
		const fileExt = file.name.split('.').pop();
		const fileName = `${excelType}/${timestamp}_${randomStr}.${fileExt}`;
		// Storage의 upload는 버킷 내의 상대 경로만 받음 (버킷 이름 제외)
		const filePath = fileName;

		console.log('[uploadExcelFile] 업로드 경로:', { filePath, excelType, fileName });

		// 타임아웃 설정 (60초)
		let timeoutId;
		const timeoutPromise = new Promise((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new Error('업로드 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'));
			}, 60000); // 60초
		});

		// Supabase Storage에 업로드
		const uploadPromise = supabase.storage
			.from('excel-files')
			.upload(filePath, file, {
				cacheControl: '3600',
				upsert: false
			});

		let uploadResult;
		try {
			uploadResult = await Promise.race([
				uploadPromise.then(result => {
					clearTimeout(timeoutId);
					return result;
				}),
				timeoutPromise
			]);
		} catch (timeoutError) {
			clearTimeout(timeoutId);
			throw timeoutError;
		}

		const { data, error } = uploadResult;

		if (error) {
			console.error('엑셀 파일 업로드 실패:', error);
			console.error('업로드 경로:', filePath);
			return { data: null, error };
		}

		console.log('[uploadExcelFile] 업로드 성공:', { filePath, data });

		return {
			data: {
				fileId: filePath,
				fileName: file.name
			},
			error: null
		};
	} catch (error) {
		console.error('엑셀 파일 업로드 중 오류:', error);
		return { data: null, error };
	}
}

/**
 * 엑셀 파일 다운로드 URL 가져오기
 * @param {string} filePath - Storage에 저장된 파일 경로
 * @returns {Promise<{data: string | null, error: Error | null}>}
 */
export async function getExcelFileUrl(filePath) {
	try {
		if (!filePath) {
			return { data: null, error: new Error('파일 경로가 필요합니다.') };
		}

		// filePath에 버킷 이름이 포함되어 있으면 제거
		const cleanPath = filePath.startsWith('excel-files/') 
			? filePath.replace('excel-files/', '') 
			: filePath;

		const { data, error } = await supabase.storage
			.from('excel-files')
			.createSignedUrl(cleanPath, 3600); // 1시간 유효한 URL

		if (error) {
			console.error('엑셀 파일 URL 생성 실패:', error);
			return { data: null, error };
		}

		return { data: data.signedUrl, error: null };
	} catch (error) {
		console.error('엑셀 파일 URL 생성 중 오류:', error);
		return { data: null, error };
	}
}

/**
 * 엑셀 파일 삭제
 * @param {string} filePath - Storage에 저장된 파일 경로
 * @returns {Promise<{data: boolean, error: Error | null}>}
 */
export async function deleteExcelFile(filePath) {
	try {
		if (!filePath) {
			return { data: false, error: new Error('파일 경로가 필요합니다.') };
		}

		// filePath에 버킷 이름이 포함되어 있으면 제거
		const cleanPath = filePath.startsWith('excel-files/') 
			? filePath.replace('excel-files/', '') 
			: filePath;

		const { data, error } = await supabase.storage
			.from('excel-files')
			.remove([cleanPath]);

		if (error) {
			console.error('엑셀 파일 삭제 실패:', error);
			return { data: false, error };
		}

		return { data: true, error: null };
	} catch (error) {
		console.error('엑셀 파일 삭제 중 오류:', error);
		return { data: false, error };
	}
}

/**
 * 엑셀 파일 목록 조회
 * @param {string} excelType - 엑셀 타입 ('sales' 또는 'cost')
 * @returns {Promise<{data: Array<{name: string, id: string, created_at: string, updated_at: string, metadata: any}> | null, error: Error | null}>}
 */
/**
 * 재귀적으로 모든 파일 찾기
 * @param {string} path - 현재 경로
 * @param {string} excelType - 엑셀 타입 필터
 * @returns {Promise<Array<any>>}
 */
async function listAllFilesRecursive(path = '', excelType = '') {
	const { data, error } = await supabase.storage
		.from('excel-files')
		.list(path, { limit: 1000 });

	if (error) {
		console.error(`[listAllFilesRecursive] 경로 "${path}" 조회 실패:`, error);
		return [];
	}

	let allFiles = [];

	for (const item of data || []) {
		const fullPath = path ? `${path}/${item.name}` : item.name;
		
		if (item.id === null) {
			// 폴더인 경우 재귀적으로 탐색
			const subFiles = await listAllFilesRecursive(fullPath, excelType);
			allFiles = allFiles.concat(subFiles);
		} else {
			// 파일인 경우
			// excelType이 지정된 경우 경로에 excelType이 포함되어야 함
			if (!excelType || fullPath.startsWith(`${excelType}/`)) {
				allFiles.push({
					...item,
					name: item.name, // 파일명만 (경로 제외)
					fullPath: fullPath // 전체 경로
				});
			}
		}
	}

	return allFiles;
}

export async function listExcelFiles(excelType) {
	try {
		// 재귀적으로 모든 파일 찾기
		const allFiles = await listAllFilesRecursive('', excelType);
		
		// created_at 기준으로 정렬
		allFiles.sort((a, b) => {
			const dateA = new Date(a.created_at || 0);
			const dateB = new Date(b.created_at || 0);
			return dateB - dateA; // 내림차순
		});

		return { data: allFiles, error: null };
	} catch (error) {
		console.error('엑셀 파일 목록 조회 중 오류:', error);
		return { data: [], error };
	}
}
