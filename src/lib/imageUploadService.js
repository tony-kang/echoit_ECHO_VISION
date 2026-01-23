import { supabase } from './supabaseClient';

/**
 * 이미지 파일을 Supabase Storage에 업로드
 * @param {File} file - 업로드할 이미지 파일
 * @param {string} [folder='posts'] - 저장할 폴더 경로
 * @returns {Promise<{data: string | null, error: Error | null}>} 업로드된 파일의 공개 URL
 */
export async function uploadImage(file, folder = 'posts') {
	try {
		if (!file) {
			return { data: null, error: new Error('파일이 선택되지 않았습니다.') };
		}

		// 이미지 파일인지 확인
		if (!file.type.startsWith('image/')) {
			return { data: null, error: new Error('이미지 파일만 업로드할 수 있습니다.') };
		}

		// 파일 크기 제한 (10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return { data: null, error: new Error('파일 크기는 10MB 이하여야 합니다.') };
		}

		// 고유한 파일명 생성 (타임스탬프 + 랜덤 문자열)
		const timestamp = Date.now();
		const randomStr = Math.random().toString(36).substring(2, 15);
		const fileExt = file.name.split('.').pop();
		const fileName = `${timestamp}_${randomStr}.${fileExt}`;
		const filePath = `${folder}/${fileName}`;

		// 타임아웃 설정 (30초)
		let timeoutId;
		const timeoutPromise = new Promise((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new Error('업로드 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'));
			}, 30000); // 30초
		});

		// Supabase Storage에 업로드
		const uploadPromise = supabase.storage
			.from('images')
			.upload(filePath, file, {
				cacheControl: '3600',
				upsert: false
			});

		let uploadResult;
		try {
			// 타임아웃과 업로드 중 먼저 완료되는 것 처리
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
			console.error('이미지 업로드 에러:', error);
			// 에러 메시지 개선
			let errorMessage = '이미지 업로드에 실패했습니다.';
			if (error.message) {
				errorMessage = error.message;
			} else if (error.error) {
				errorMessage = error.error;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}
			
			// 버킷이 없는 경우 특별 메시지
			if (errorMessage.includes('Bucket not found') || errorMessage.includes('not found')) {
				errorMessage = '이미지 저장소가 설정되지 않았습니다. 관리자에게 문의하세요.';
			}
			
			// RLS 정책 에러인 경우
			if (errorMessage.includes('row-level security policy') || errorMessage.includes('RLS')) {
				errorMessage = '이미지 업로드 권한이 없습니다. Storage 정책 설정이 필요합니다. 관리자에게 문의하세요.';
			}
			
			return { data: null, error: new Error(errorMessage) };
		}

		// 공개 URL 가져오기
		const { data: { publicUrl } } = supabase.storage
			.from('images')
			.getPublicUrl(filePath);

		return { data: publicUrl, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}

/**
 * 이미지 파일 삭제
 * @param {string} url - 삭제할 이미지의 URL
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteImage(url) {
	try {
		if (!url) {
			return { error: null };
		}

		// URL에서 파일 경로 추출
		const urlObj = new URL(url);
		const pathParts = urlObj.pathname.split('/');
		const bucketIndex = pathParts.findIndex(part => part === 'images');
		
		if (bucketIndex === -1) {
			// 외부 URL인 경우 삭제 불가
			return { error: null };
		}

		const filePath = pathParts.slice(bucketIndex + 1).join('/');

		// Supabase Storage에서 삭제
		const { error } = await supabase.storage
			.from('images')
			.remove([filePath]);

		return { error };
	} catch (err) {
		return { error: err };
	}
}

