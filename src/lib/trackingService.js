// 운송 정보 서비스
import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * 운송 유형 상수
 */
export const TRACKING_TYPES = {
	SEA: '해상',
	AIR: '항공'
};

/**
 * 운송 상태 상수
 */
export const TRACKING_STATUS = {
	PREPARING: '준비중',
	DEPARTED: '출고완료',
	SHIPPED: '선적완료',
	PORT_ARRIVED: '항구도착',
	WAREHOUSE_ARRIVED: '입고완료'
};

/**
 * 운송 정보 데이터 타입
 * @typedef {Object} TrackingData
 * @property {string} tracking_no - 송장번호
 * @property {string} tracking_type - 운송 유형 (해상, 항공)
 * @property {string} [product_id] - 부품 코드
 * @property {string} [warehouse_id] - 목적지 창고 코드
 * @property {string} [status] - 상태 (준비중, 출고완료, 선적완료, 항구도착, 입고완료 등)
 * @property {string} [departure_date] - 출고일 (YYYY-MM-DD)
 * @property {string} [shipment_date] - 선적일 (YYYY-MM-DD)
 * @property {string} [port_arrival_expected_date] - 항구도착 예정일 (YYYY-MM-DD)
 * @property {string} [warehouse_arrival_expected_date] - 입고 예정일 (YYYY-MM-DD)
 * @property {string} [port_arrival_date] - 항구 도착일 (YYYY-MM-DD)
 * @property {string} [warehouse_arrival_date] - 창고 입고일 (YYYY-MM-DD)
 * @property {string} [carrier_name] - 운송사명
 * @property {string} [vessel_flight_no] - 선박명/항공편명
 * @property {string} [port_of_departure] - 출발 항구/공항
 * @property {string} [port_of_arrival] - 도착 항구/공항
 * @property {string} [notes] - 비고
 * @property {Object} [metadata] - 추가 메타데이터 (JSON)
 */

/**
 * 운송 정보 목록 조회
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.trackingType] - 운송 유형 필터
 * @param {string} [options.status] - 상태 필터
 * @param {string} [options.productId] - 부품 코드 필터
 * @param {string} [options.warehouseId] - 창고 코드 필터
 * @param {string} [options.search] - 검색어 (송장번호)
 * @returns {Promise<{data: Array<TrackingData>|null, error: Error|null}>}
 */
export async function getTrackings(options = {}) {
	try {
		const {
			trackingType = null,
			status = null,
			productId = null,
			warehouseId = null,
			search = null
		} = options;

		let query = supabase
			.from('el_tracking')
			.select(`
				*,
				product:el_product!product_id(id, name, part_no, customer_id)
			`)
			.order('created_at', { ascending: false });

		if (trackingType) {
			query = query.eq('tracking_type', trackingType);
		}

		if (status) {
			query = query.eq('status', status);
		}

		if (productId) {
			query = query.eq('product_id', productId);
		}

		if (warehouseId) {
			query = query.eq('warehouse_id', warehouseId);
		}

		if (search) {
			query = query.ilike('tracking_no', `%${search}%`);
		}

		const { data, error } = await query;

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('운송 정보 목록 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 운송 정보 상세 조회
 * @param {string} trackingId - 운송 정보 ID
 * @returns {Promise<{data: TrackingData|null, error: Error|null}>}
 */
export async function getTrackingById(trackingId) {
	try {
		const { data, error } = await supabase
			.from('el_tracking')
			.select(`
				*,
				product:el_product!product_id(id, name, part_no, customer_id)
			`)
			.eq('id', trackingId)
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('운송 정보 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 송장번호로 운송 정보 조회
 * @param {string} trackingNo - 송장번호
 * @returns {Promise<{data: TrackingData|null, error: Error|null}>}
 */
export async function getTrackingByNo(trackingNo) {
	try {
		const { data, error } = await supabase
			.from('el_tracking')
			.select(`
				*,
				product:el_product!product_id(id, name, part_no, customer_id)
			`)
			.eq('tracking_no', trackingNo)
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('운송 정보 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 운송 정보 생성
 * @param {TrackingData} trackingData - 운송 정보 데이터
 * @returns {Promise<{data: TrackingData|null, error: Error|null}>}
 */
export async function createTracking(trackingData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_tracking')
			.insert([
				{
					...trackingData,
					status: trackingData.status || TRACKING_STATUS.PREPARING,
					created_by: user.id
				}
			])
			.select(`
				*,
				product:el_product!product_id(id, name, part_no, customer_id)
			`)
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.TRACKING_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				trackingId: data?.id,
				trackingNo: trackingData.tracking_no,
				trackingType: trackingData.tracking_type
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('운송 정보 생성 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.TRACKING_CREATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				trackingNo: trackingData.tracking_no,
				trackingType: trackingData.tracking_type
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 운송 정보 수정
 * @param {string} trackingId - 운송 정보 ID
 * @param {Partial<TrackingData>} updates - 수정할 데이터
 * @returns {Promise<{data: TrackingData|null, error: Error|null}>}
 */
export async function updateTracking(trackingId, updates) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('el_tracking')
			.update(updates)
			.eq('id', trackingId)
			.select(`
				*,
				product:el_product!product_id(id, name, part_no, customer_id)
			`)
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.TRACKING_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				trackingId: trackingId,
				updates: updates
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('운송 정보 수정 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.TRACKING_UPDATE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				trackingId: trackingId,
				updates: updates
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 운송 정보 삭제
 * @param {string} trackingId - 운송 정보 ID
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteTracking(trackingId) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		// 삭제 전 데이터 조회
		const { data: oldData } = await supabase
			.from('el_tracking')
			.select('tracking_no, tracking_type')
			.eq('id', trackingId)
			.single();

		const { error } = await supabase
			.from('el_tracking')
			.delete()
			.eq('id', trackingId);

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.TRACKING_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				trackingId: trackingId,
				trackingNo: oldData?.tracking_no || null
			},
			result: 'success'
		});

		return { error: null };
	} catch (error) {
		console.error('운송 정보 삭제 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.TRACKING_DELETE,
			actionCategory: ACTION_CATEGORIES.LOGISTICS,
			actionDetails: {
				trackingId: trackingId
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { error };
	}
}
