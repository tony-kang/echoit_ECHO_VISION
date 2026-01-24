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

		// 원본 파일명 저장
		const originalFileName = file.name;
		
		// 고유한 저장 파일명 생성 (타입/타임스탬프_랜덤문자열.확장자)
		const timestamp = Date.now();
		const randomStr = Math.random().toString(36).substring(2, 15);
		const fileExt = originalFileName.split('.').pop();
		const storagePath = `${excelType}/${timestamp}_${randomStr}.${fileExt}`;
		// Storage의 upload는 버킷 내의 상대 경로만 받음 (버킷 이름 제외)

		console.log('[uploadExcelFile] 업로드 경로:', { 
			storagePath, 
			excelType, 
			originalFileName 
		});

		// 타임아웃 설정 (60초)
		let timeoutId;
		const timeoutPromise = new Promise((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new Error('업로드 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'));
			}, 60000); // 60초
		});

		// Supabase Storage에 업로드 (메타데이터에 원본 파일명 저장)
		const uploadPromise = supabase.storage
			.from('excel-files')
			.upload(storagePath, file, {
				cacheControl: '3600',
				upsert: false,
				metadata: {
					originalFileName: originalFileName,
					uploadedAt: new Date().toISOString()
				}
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
			console.error('업로드 경로:', storagePath);
			return { data: null, error };
		}

		// 실제 저장된 경로 확인
		const actualPath = data?.path || storagePath;
		const fullStoragePath = `excel-files/${actualPath}`;
		
		// 현재 사용자 정보 가져오기
		const { data: { user } } = await supabase.auth.getUser();
		
		// ev_excel_file 테이블에 파일 정보 저장 (Trigger가 자동으로 처리하지만, 원본 파일명을 위해 수동으로도 저장)
		// Trigger가 자동으로 처리하지만, 원본 파일명은 metadata에 없을 수 있으므로 직접 업데이트
		const filePath = actualPath.split('/').slice(0, -1).join('/');
		const storedFileName = actualPath.split('/').pop();
		const fileExtension = '.' + originalFileName.split('.').pop();
		
		const { error: metadataError } = await supabase
			.from('ev_excel_file')
			.upsert({
				storage_path: fullStoragePath,
				stored_file_name: storedFileName,
				original_file_name: originalFileName,
				excel_type: excelType,
				file_size: file.size,
				file_extension: fileExtension,
				file_path: filePath + '/',
				uploaded_by: user?.id || null
			}, {
				onConflict: 'storage_path'
			});
		
		if (metadataError) {
			console.error('[uploadExcelFile] ev_excel_file 저장 실패:', metadataError);
			// 저장 실패해도 파일 업로드는 성공했으므로 계속 진행
		} else {
			console.log('[uploadExcelFile] ev_excel_file 저장 성공:', {
				storage_path: fullStoragePath,
				original_file_name: originalFileName
			});
		}

		// 실제 저장된 경로를 반환
		return {
			data: {
				fileId: actualPath,
				fileName: originalFileName
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

		const fullStoragePath = `excel-files/${cleanPath}`;

		// Storage에서 파일 삭제 (Trigger가 자동으로 ev_excel_file에서도 삭제)
		const { error } = await supabase.storage
			.from('excel-files')
			.remove([cleanPath]);

		if (error) {
			console.error('엑셀 파일 삭제 실패:', error);
			return { data: false, error };
		}

		// ev_excel_file에서도 삭제 (Trigger가 자동으로 처리하지만, 혹시 모를 경우를 대비)
		await supabase
			.from('ev_excel_file')
			.delete()
			.eq('storage_path', fullStoragePath);

		return { data: true, error: null };
	} catch (error) {
		console.error('엑셀 파일 삭제 중 오류:', error);
		return { data: false, error };
	}
}

/**
 * 엑셀 파일 목록 조회
 * @param {string} excelType - 엑셀 타입 ('sales' 또는 'cost')
 * @param {string} searchQuery - 검색어 (원본 파일명 LIKE 검색)
 * @returns {Promise<{data: Array<{name: string, id: string, created_at: string, updated_at: string, metadata: any}> | null, error: Error | null}>}
 */
export async function listExcelFiles(excelType, searchQuery = '') {
	try {
		if (!excelType) {
			return { data: [], error: new Error('excelType이 필요합니다.') };
		}

		// ev_excel_file 테이블에서 파일 목록 조회
		let query = supabase
			.from('ev_excel_file')
			.select('*')
			.eq('excel_type', excelType);
		
		// 검색어가 있으면 원본 파일명으로 LIKE 검색
		if (searchQuery && searchQuery.trim()) {
			const trimmedQuery = searchQuery.trim();
			query = query.ilike('original_file_name', `%${trimmedQuery}%`);
			console.log('[listExcelFiles] 검색 쿼리:', {
				excelType,
				searchQuery: trimmedQuery,
				ilikePattern: `%${trimmedQuery}%`,
				queryString: `SELECT * FROM ev_excel_file WHERE excel_type = '${excelType}' AND original_file_name ILIKE '%${trimmedQuery}%' ORDER BY created_at DESC`
			});
		} else {
			console.log('[listExcelFiles] 전체 조회 쿼리:', {
				excelType,
				queryString: `SELECT * FROM ev_excel_file WHERE excel_type = '${excelType}' ORDER BY created_at DESC`
			});
		}
		
		const { data, error } = await query.order('created_at', { ascending: false });

		if (error) {
			console.error('[listExcelFiles] ev_excel_file 조회 실패:', { excelType, searchQuery, error });
			return { data: [], error };
		}

		// ev_excel_file 데이터를 Storage 파일 형식으로 변환
		const files = (data || []).map(item => {
			return {
				id: item.id,
				name: item.stored_file_name,
				fullPath: item.file_path + item.stored_file_name,
				originalFileName: item.original_file_name,
				created_at: item.created_at,
				updated_at: item.updated_at,
				// Storage API와 호환성을 위한 필드
				metadata: {
					originalFileName: item.original_file_name,
					size: item.file_size
				}
			};
		});

		// console.log('[listExcelFiles] 파일 목록 (ev_excel_file):', files.length, '개');

		return { data: files, error: null };
	} catch (error) {
		console.error('엑셀 파일 목록 조회 중 오류:', error);
		return { data: [], error };
	}
}
