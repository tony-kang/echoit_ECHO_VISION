// 환경설정 서비스
import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * 환경설정 데이터 타입
 * @typedef {Object} SettingData
 * @property {string} code - 환경설정 코드 (Primary Key, 최대 16자리)
 * @property {string|null} parent_code - 상위 코드 (종속성 관리)
 * @property {number} order - 표시 순서
 * @property {number} value - 값 (Number, 1~N)
 * @property {string} title - 제목
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 */

/**
 * 환경설정 목록 조회
 * @param {Object} [options] - 조회 옵션
 * @param {boolean} [options.orderByOrder] - 표시 순서로 정렬
 * @param {string|null} [options.parentCode] - 부모 코드로 필터링 (null이면 최상위만)
 * @param {string} [options.category] - 카테고리로 필터링 (없으면 필터링 안함)
 * @returns {Promise<{data: Array<SettingData>|null, error: Error|null}>}
 */
export async function getSettings(options = {}) {
	try {
		const { orderByOrder = true, parentCode, category } = options;

		let query = supabase
			.from('env_code')
			.select('*');
		
		// 카테고리 필터링 (옵션, 'all'인 경우 필터링하지 않음)
		if (category && category !== 'all') {
			query = query.eq('category', category);
		}

		// 상위 코드 필터링
		if (parentCode !== undefined) {
			if (parentCode === null) {
				// 최상위 항목만 (parent_code가 NULL인 것)
				query = query.is('parent_code', null);
			} else {
				// 특정 부모의 자식 항목만
				query = query.eq('parent_code', parentCode);
			}
		}

		if (orderByOrder) {
			query = query.order('order', { ascending: true });
		} else {
			query = query.order('created_at', { ascending: false });
		}

		const { data, error } = await query;
		
		// if (error) {
		// 	console.error('[getSettings] 쿼리 실행 실패:', { category, parentCode, error });
		// } else {
		// 	console.log('[getSettings] 데이터 배열:', data);
		// }

		if (error) {
			// 테이블이 없는 경우 또는 스키마 캐시 문제
			// if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
			// 	// 스키마 캐시 문제일 수 있으므로, 직접 SQL로 테이블 존재 확인 시도
			// 	try {
			// 		const { data: tableCheck, error: checkError } = await supabase.rpc('get_all_tables');
			// 		if (!checkError && tableCheck) {
			// 			const tables = Array.isArray(tableCheck) 
			// 				? tableCheck.map(t => typeof t === 'object' ? t.table_name : t)
			// 				: [];
			// 			const tableExists = tables.some(t => t === 'env_code');
						
			// 			if (tableExists) {
			// 				// 테이블은 존재하지만 스키마 캐시 문제
			// 				const cacheError = new Error(
			// 					'env_code 테이블은 존재하지만 Supabase 스키마 캐시 문제가 발생했습니다.\n\n' +
			// 					'해결 방법:\n' +
			// 					'1. Supabase Dashboard → Settings → API → "Reload schema cache" 클릭\n' +
			// 					'2. 또는 잠시 후 다시 시도 (캐시가 자동으로 업데이트됨)\n' +
			// 					'3. 브라우저를 완전히 종료한 후 다시 열기\n\n' +
			// 					'원본 에러: ' + error.message
			// 				);
			// 				cacheError.code = error.code;
			// 				throw cacheError;
			// 			}
			// 		}
			// 	} catch {
			// 		// RPC 함수가 없거나 실패한 경우 무시하고 원래 에러 메시지 사용
			// 	}
				
			// 	const setupError = new Error(
			// 		'env_code 테이블이 Supabase에 생성되지 않았거나 스키마 캐시 문제가 있습니다.\n\n' +
			// 		'해결 방법:\n' +
			// 		'1. Supabase Dashboard → Settings → API → "Reload schema cache" 클릭\n' +
			// 		'2. Supabase Dashboard → SQL Editor에서 다음 쿼리 실행:\n' +
			// 		'   SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'env_code\';\n' +
			// 		'3. 테이블이 없다면 docs/supabase/env_code.sql 파일을 실행\n' +
			// 		'4. 브라우저를 완전히 종료한 후 다시 열기\n\n' +
			// 		'원본 에러: ' + error.message
			// 	);
			// 	setupError.code = error.code;
			// 	throw setupError;
			// }
			throw error;
		}

		return { data: data || [], error: null };
	} catch (error) {
		// console.error('환경설정 목록 조회 실패:', error);
		// if (error.code === 'PGRST205') {
		// 	console.error('⚠️ env_code 테이블을 생성해야 합니다. docs/supabase/env_code.sql 파일을 Supabase SQL Editor에서 실행하세요.');
		// }
		return { data: [], error };
	}
}

/**
 * 환경설정 상세 조회
 * @param {string} code - 환경설정 코드
 * @param {string} [category] - 카테고리 (선택사항, 없으면 모든 카테고리에서 검색)
 * @returns {Promise<{data: SettingData|null, error: Error|null}>}
 */
export async function getSetting(code, category) {
	try {
		let query = supabase
			.from('env_code')
			.select('*')
			.eq('code', code);
		
		// 카테고리가 지정된 경우에만 필터링
		if (category) {
			query = query.eq('category', category);
		}
		
		const { data, error } = await query.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('환경설정 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 환경설정 생성
 * @param {Object} settingData - 환경설정 데이터
 * @param {string} settingData.code - 환경설정 코드 (최대 16자리)
 * @param {string|null} [settingData.parent_code] - 상위 코드
 * @param {number} [settingData.order] - 표시 순서
 * @param {number} settingData.value - 값 (1~N)
 * @param {string} settingData.title - 제목
 * @returns {Promise<{data: SettingData|null, error: Error|null}>}
 */
export async function createSetting(settingData) {
	try {
		const { code, parent_code, order, value, title, comment, category, param } = settingData;

		// 유효성 검사
		if (!code || code.length > 16) {
			throw new Error('코드는 필수이며 최대 16자리까지 가능합니다.');
		}
		if (value < 1) {
			throw new Error('값은 1 이상이어야 합니다.');
		}
		if (!title) {
			throw new Error('제목은 필수입니다.');
		}

		// 부모 코드가 있는 경우 존재 여부 확인
		if (parent_code) {
			const { data: parentExists } = await getSetting(parent_code, category);
			if (!parentExists) {
				throw new Error('부모 코드가 존재하지 않습니다.');
			}
		}

		const insertData = {
			code,
			order: order || 0,
			value,
			title,
			category: category || 'organization'
		};

		if (parent_code !== undefined) {
			insertData.parent_code = parent_code || null;
		}
		
		if (comment !== undefined) {
			insertData.comment = comment || null;
		}

		if (param !== undefined) {
			insertData.param = param && Array.isArray(param) && param.length > 0 ? param : null;
		} else {
			// param이 없으면 title을 기본값으로 설정
			insertData.param = [title];
		}

		const { data, error } = await supabase
			.from('env_code')
			.insert(insertData)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SETTINGS_CREATE,
			actionCategory: ACTION_CATEGORIES.SETTINGS,
			actionDetails: {
				code,
				title,
				parent_code: parent_code || null,
				description: `환경설정 생성: ${code} - ${title}${parent_code ? ` (부모: ${parent_code})` : ''}`
			}
		});

		return { data, error: null };
	} catch (error) {
		console.error('환경설정 생성 실패:', error);
		return { data: null, error };
	}
}

/**
 * 환경설정 수정
 * @param {string} code - 환경설정 코드
 * @param {Object} updateData - 수정할 데이터
 * @param {string|null} [updateData.parent_code] - 상위 코드
 * @param {number} [updateData.order] - 표시 순서
 * @param {number} [updateData.value] - 값 (1~N)
 * @param {string} [updateData.title] - 제목
 * @returns {Promise<{data: SettingData|null, error: Error|null}>}
 */
export async function updateSetting(code, updateData) {
	try {
		const { parent_code, order, value, title, comment, category, param } = updateData;

		// 유효성 검사
		if (value !== undefined && value < 1) {
			throw new Error('값은 1 이상이어야 합니다.');
		}

		// 순환 참조 방지: 자신을 부모로 설정할 수 없음
		if (parent_code === code) {
			throw new Error('자신을 부모로 설정할 수 없습니다.');
		}

		// 부모 코드가 있는 경우 존재 여부 확인
		if (parent_code !== undefined && parent_code !== null) {
			const { data: parentExists } = await getSetting(parent_code, category);
			if (!parentExists) {
				throw new Error('부모 코드가 존재하지 않습니다.');
			}
		}

		const updateFields = {};
		if (parent_code !== undefined) updateFields.parent_code = parent_code || null;
		if (order !== undefined) updateFields.order = order;
		if (value !== undefined) updateFields.value = value;
		if (title !== undefined) updateFields.title = title;
		if (comment !== undefined) updateFields.comment = comment || null;
		if (category !== undefined) updateFields.category = category || 'organization';
		if (param !== undefined) {
			updateFields.param = param && Array.isArray(param) && param.length > 0 ? param : null;
		}

		if (Object.keys(updateFields).length === 0) {
			throw new Error('수정할 데이터가 없습니다.');
		}

		// 카테고리 필터는 선택사항으로 처리 (카테고리가 지정된 경우에만 필터링)
		let query = supabase
			.from('env_code')
			.update(updateFields)
			.eq('code', code);
		
		// 카테고리가 지정된 경우에만 필터링 (기존 코드와의 호환성을 위해)
		const targetCategory = category || 'organization';
		query = query.eq('category', targetCategory);
		
		const { data, error } = await query
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SETTINGS_UPDATE,
			actionCategory: ACTION_CATEGORIES.SETTINGS,
			actionDetails: {
				code,
				description: `환경설정 수정: ${code}`
			}
		});

		return { data, error: null };
	} catch (error) {
		console.error('환경설정 수정 실패:', error);
		return { data: null, error };
	}
}

/**
 * 환경설정 삭제
 * @param {string} code - 환경설정 코드
 * @returns {Promise<{data: boolean, error: Error|null}>}
 */
/**
 * 환경설정 코드 삭제
 * @param {string} code - 삭제할 코드
 * @param {string} [category] - 카테고리 (선택사항, 없으면 모든 카테고리에서 삭제)
 * @returns {Promise<{data: boolean, error: Error|null}>}
 */
export async function deleteSetting(code, category) {
	try {
		let query = supabase
			.from('env_code')
			.delete()
			.eq('code', code);
		
		// 카테고리 필터링 (옵션, 'all'인 경우 필터링하지 않음)
		if (category && category !== 'all') {
			query = query.eq('category', category);
		}

		const { error } = await query;

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SETTINGS_DELETE,
			actionCategory: ACTION_CATEGORIES.SETTINGS,
			actionDetails: {
				code,
				description: `환경설정 삭제: ${code}`
			}
		});

		return { data: true, error: null };
	} catch (error) {
		console.error('환경설정 삭제 실패:', error);
		return { data: false, error };
	}
}

/**
 * 환경설정 코드로 값 조회
 * @param {string} code - 환경설정 코드
 * @returns {Promise<{data: number|null, error: Error|null}>}
 */
export async function getSettingValue(code) {
	try {
		const { data, error } = await getSetting(code);
		
		if (error) throw error;
		if (!data) return { data: null, error: null };

		return { data: data.value, error: null };
	} catch (error) {
		console.error('환경설정 값 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 여러 환경설정 값 일괄 조회
 * @param {string[]} codes - 환경설정 코드 배열
 * @returns {Promise<{data: Object<string, number>|null, error: Error|null}>}
 */
export async function getSettingValues(codes) {
	try {
		const { data, error } = await supabase
			.from('env_code')
			.select('code, value')
			.in('code', codes)
			.eq('category', 'organization');

		if (error) throw error;

		const result = {};
		(data || []).forEach(item => {
			result[item.code] = item.value;
		});

		return { data: result, error: null };
	} catch (error) {
		console.error('환경설정 값 일괄 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 부모 코드로 자식 환경설정 조회
 * @param {string} parentCode - 상위 코드
 * @returns {Promise<{data: Array<SettingData>|null, error: Error|null}>}
 */
export async function getChildSettings(parentCode) {
	try {
		return await getSettings({ parentCode, orderByOrder: true });
	} catch (error) {
		console.error('자식 환경설정 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 최상위 환경설정 조회 (부모가 없는 항목)
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.category] - 카테고리로 필터링
 * @returns {Promise<{data: Array<SettingData>|null, error: Error|null}>}
 */
export async function getRootSettings(options = {}) {
	try {
		return await getSettings({ parentCode: null, orderByOrder: true, ...options });
	} catch (error) {
		console.error('최상위 환경설정 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 모든 환경설정 코드를 title로 검색 (parent_code 제약 없음)
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.search] - 검색어 (title에 대한 LIKE 검색)
 * @returns {Promise<{data: Array<SettingData>|null, error: Error|null}>}
 */
export async function searchSettingsByTitle(options = {}) {
	try {
		const { search } = options;
		
		let query = supabase
			.from('env_code')
			.select('*')
			.eq('category', 'organization');
		
		// 검색어가 있으면 title에 LIKE 검색 적용
		if (search && search.trim()) {
			const searchTerm = search.trim();
			query = query.ilike('title', `%${searchTerm}%`);
		}
		
		query = query.order('order', { ascending: true });
		
		const { data, error } = await query;
		
		if (error) {
			console.error('환경설정 코드 검색 실패:', error);
			return { data: [], error };
		}
		
		return { data: data || [], error: null };
	} catch (error) {
		console.error('환경설정 코드 검색 실패:', error);
		return { data: [], error };
	}
}

/**
 * DB에서 환경설정 코드 검색 (코드 정확 일치, 제목 부분 일치)
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.code] - 코드 검색어 (정확 일치)
 * @param {string} [options.title] - 제목 검색어 (부분 일치)
 * @param {string} [options.category] - 카테고리 필터링
 * @returns {Promise<{data: Array<SettingData>|null, error: Error|null}>}
 */
export async function searchSettings(options = {}) {
	try {
		const { code, title, category } = options;
		
		let query = supabase
			.from('env_code')
			.select('*');
		
		// 카테고리 필터링 ('all'인 경우 필터링하지 않음)
		if (category && category !== 'all') {
			query = query.eq('category', category);
		}
		
		// 코드 검색: 정확 일치
		if (code && code.trim()) {
			query = query.eq('code', code.trim());
		}
		
		// 제목 검색: 부분 일치 (LIKE)
		if (title && title.trim()) {
			query = query.ilike('title', `%${title.trim()}%`);
		}
		
		query = query.order('order', { ascending: true });
		
		const { data, error } = await query;
		
		if (error) {
			console.error('[searchSettings] 쿼리 실행 실패:', { code, title, category, error });
			return { data: [], error };
		}
		
		console.log(`[searchSettings] 쿼리 성공: ${data?.length || 0}개 조회`, { code, title, category });
		return { data: data || [], error: null };
	} catch (error) {
		console.error('[searchSettings] 예외 발생:', error);
		return { data: [], error };
	}
}

/**
 * 계층 구조로 환경설정 조회 (부모-자식 관계 포함)
 * @returns {Promise<{data: Array<SettingData & {children?: SettingData[]}>|null, error: Error|null}>}
 */
export async function getSettingsHierarchy() {
	try {
		// 모든 설정 조회
		const { data: allSettings, error } = await getSettings({ orderByOrder: true });
		
		if (error) throw error;
		if (!allSettings || allSettings.length === 0) {
			return { data: [], error: null };
		}

		// 부모별로 그룹화
		const settingsMap = new Map();
		const rootSettings = [];

		// 모든 설정을 맵에 저장
		allSettings.forEach(setting => {
			settingsMap.set(setting.code, { ...setting, children: [] });
		});

		// 부모-자식 관계 구성
		allSettings.forEach(setting => {
			const settingWithChildren = settingsMap.get(setting.code);
			if (setting.parent_code) {
				const parent = settingsMap.get(setting.parent_code);
				if (parent) {
					parent.children.push(settingWithChildren);
				}
			} else {
				rootSettings.push(settingWithChildren);
			}
		});

		return { data: rootSettings, error: null };
	} catch (error) {
		console.error('계층 구조 환경설정 조회 실패:', error);
		return { data: [], error };
	}
}

// ============================================================================
// ev_code 서비스 함수
// ============================================================================

/**
 * ev_code 목록 조회
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.category] - 카테고리로 필터링 ('sales' 또는 'cost')
 * @returns {Promise<{data: Array<any>|null, error: Error|null}>}
 */
export async function getEvCodes(options = {}) {
	try {
		const { category } = options;

		let query = supabase
			.from('ev_code')
			.select('*')
			.order('created_at', { ascending: false });
		
		// 카테고리 필터링
		if (category && category !== 'all') {
			query = query.eq('category', category);
		}

		const { data, error } = await query;

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('ev_code 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * ev_code 단일 조회
 * @param {string} code - 코드 (item_code)
 * @returns {Promise<{data: any|null, error: Error|null}>}
 */
export async function getEvCode(code) {
	try {
		const { data, error } = await supabase
			.from('ev_code')
			.select('*')
			.eq('item_code', code)
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('ev_code 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * ev_code 생성
 * @param {Object} evCodeData - ev_code 데이터
 * @param {string} evCodeData.code - 코드 (item_code)
 * @param {string} evCodeData.category - 구분 ('sales' 또는 'cost')
 * @param {string[]} [evCodeData.items] - 항목 배열 (env_code의 code 배열)
 * @param {string} [evCodeData.title] - 제목
 * @param {string} [evCodeData.comment] - 설명
 * @returns {Promise<{data: any|null, error: Error|null}>}
 */
export async function createEvCode(evCodeData) {
	try {
		const { code, category, items = [], title, comment } = evCodeData;

		// 유효성 검사
		if (!code || code.trim() === '') {
			throw new Error('코드는 필수입니다.');
		}
		if (!category || !['sales', 'cost'].includes(category)) {
			throw new Error('구분은 sales 또는 cost여야 합니다.');
		}

		const insertData = {
			item_code: code.trim(),
			category,
			items: Array.isArray(items) ? items.filter(item => item && item.trim() !== '') : [],
			title: title || null,
			comment: comment || null
		};

		const { data, error } = await supabase
			.from('ev_code')
			.insert(insertData)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SETTINGS_CREATE,
			actionCategory: ACTION_CATEGORIES.SETTINGS,
			actionDetails: {
				code,
				category,
				description: `ev_code 생성: ${code} - ${category}`
			}
		});

		return { data, error: null };
	} catch (error) {
		console.error('ev_code 생성 실패:', error);
		return { data: null, error };
	}
}

/**
 * ev_code 수정
 * @param {string} code - 코드 (item_code)
 * @param {Object} updateData - 수정할 데이터
 * @param {string} [updateData.category] - 구분
 * @param {string[]} [updateData.items] - 항목 배열
 * @param {string} [updateData.title] - 제목
 * @param {string} [updateData.comment] - 설명
 * @returns {Promise<{data: any|null, error: Error|null}>}
 */
export async function updateEvCode(code, updateData) {
	try {
		const { category, items, title, comment } = updateData;

		const updateFields = {};
		if (category !== undefined) {
			if (!['sales', 'cost'].includes(category)) {
				throw new Error('구분은 sales 또는 cost여야 합니다.');
			}
			updateFields.category = category;
		}
		if (items !== undefined) {
			updateFields.items = Array.isArray(items) ? items.filter(item => item && item.trim() !== '') : [];
		}
		if (title !== undefined) {
			updateFields.title = title || null;
		}
		if (comment !== undefined) {
			updateFields.comment = comment || null;
		}

		if (Object.keys(updateFields).length === 0) {
			throw new Error('수정할 데이터가 없습니다.');
		}

		const { data, error } = await supabase
			.from('ev_code')
			.update(updateFields)
			.eq('item_code', code)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SETTINGS_UPDATE,
			actionCategory: ACTION_CATEGORIES.SETTINGS,
			actionDetails: {
				code,
				description: `ev_code 수정: ${code}`
			}
		});

		return { data, error: null };
	} catch (error) {
		console.error('ev_code 수정 실패:', error);
		return { data: null, error };
	}
}

/**
 * ev_code 삭제
 * @param {string} code - 코드 (item_code)
 * @returns {Promise<{data: boolean, error: Error|null}>}
 */
export async function deleteEvCode(code) {
	try {
		const { error } = await supabase
			.from('ev_code')
			.delete()
			.eq('item_code', code);

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SETTINGS_DELETE,
			actionCategory: ACTION_CATEGORIES.SETTINGS,
			actionDetails: {
				code,
				description: `ev_code 삭제: ${code}`
			}
		});

		return { data: true, error: null };
	} catch (error) {
		console.error('ev_code 삭제 실패:', error);
		return { data: false, error };
	}
}
