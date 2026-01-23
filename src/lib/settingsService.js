// 환경설정 서비스
import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * 환경설정 데이터 타입
 * @typedef {Object} SettingData
 * @property {string} code - 환경설정 코드 (Primary Key, 최대 16자리)
 * @property {string|null} parent_code - 부모 코드 (종속성 관리)
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
 * @returns {Promise<{data: Array<SettingData>|null, error: Error|null}>}
 */
export async function getSettings(options = {}) {
	try {
		const { orderByOrder = true, parentCode } = options;

		let query = supabase
			.from('env_code')
			.select('*');

		// 부모 코드 필터링
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

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('환경설정 목록 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 환경설정 상세 조회
 * @param {string} code - 환경설정 코드
 * @returns {Promise<{data: SettingData|null, error: Error|null}>}
 */
export async function getSetting(code) {
	try {
		const { data, error } = await supabase
			.from('env_code')
			.select('*')
			.eq('code', code)
			.single();

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
 * @param {string|null} [settingData.parent_code] - 부모 코드
 * @param {number} [settingData.order] - 표시 순서
 * @param {number} settingData.value - 값 (1~N)
 * @param {string} settingData.title - 제목
 * @returns {Promise<{data: SettingData|null, error: Error|null}>}
 */
export async function createSetting(settingData) {
	try {
		const { code, parent_code, order, value, title } = settingData;

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
			const { data: parentExists } = await getSetting(parent_code);
			if (!parentExists) {
				throw new Error('부모 코드가 존재하지 않습니다.');
			}
		}

		const insertData = {
			code,
			order: order || 0,
			value,
			title
		};

		if (parent_code !== undefined) {
			insertData.parent_code = parent_code || null;
		}

		const { data, error } = await supabase
			.from('env_code')
			.insert(insertData)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			type: ACTION_TYPES.CREATE,
			category: ACTION_CATEGORIES.SETTINGS,
			description: `환경설정 생성: ${code} - ${title}${parent_code ? ` (부모: ${parent_code})` : ''}`
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
 * @param {string|null} [updateData.parent_code] - 부모 코드
 * @param {number} [updateData.order] - 표시 순서
 * @param {number} [updateData.value] - 값 (1~N)
 * @param {string} [updateData.title] - 제목
 * @returns {Promise<{data: SettingData|null, error: Error|null}>}
 */
export async function updateSetting(code, updateData) {
	try {
		const { parent_code, order, value, title } = updateData;

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
			const { data: parentExists } = await getSetting(parent_code);
			if (!parentExists) {
				throw new Error('부모 코드가 존재하지 않습니다.');
			}
		}

		const updateFields = {};
		if (parent_code !== undefined) updateFields.parent_code = parent_code || null;
		if (order !== undefined) updateFields.order = order;
		if (value !== undefined) updateFields.value = value;
		if (title !== undefined) updateFields.title = title;

		if (Object.keys(updateFields).length === 0) {
			throw new Error('수정할 데이터가 없습니다.');
		}

		const { data, error } = await supabase
			.from('env_code')
			.update(updateFields)
			.eq('code', code)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			type: ACTION_TYPES.UPDATE,
			category: ACTION_CATEGORIES.SETTINGS,
			description: `환경설정 수정: ${code}`
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
export async function deleteSetting(code) {
	try {
		const { error } = await supabase
			.from('env_code')
			.delete()
			.eq('code', code);

		if (error) throw error;

		// 로그 기록
		await logAction({
			type: ACTION_TYPES.DELETE,
			category: ACTION_CATEGORIES.SETTINGS,
			description: `환경설정 삭제: ${code}`
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
			.in('code', codes);

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
 * @param {string} parentCode - 부모 코드
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
 * @returns {Promise<{data: Array<SettingData>|null, error: Error|null}>}
 */
export async function getRootSettings() {
	try {
		return await getSettings({ parentCode: null, orderByOrder: true });
	} catch (error) {
		console.error('최상위 환경설정 조회 실패:', error);
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
