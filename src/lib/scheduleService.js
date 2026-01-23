import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * @typedef {Object} ScheduleData
 * @property {string} title
 * @property {string} [description]
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} [category]
 * @property {string} [color]
 * @property {boolean} [is_all_day]
 * @property {string} [location]
 */

// 일정 카테고리
export const SCHEDULE_CATEGORIES = {
	GENERAL: 'general',
	WORK: 'work',
	PERSONAL: 'personal',
	MEETING: 'meeting',
	VACATION: 'vacation',
	OTHER: 'other'
};

export const SCHEDULE_CATEGORY_LABELS = {
	general: '일반',
	work: '업무',
	personal: '개인',
	meeting: '회의',
	vacation: '휴가',
	other: '기타'
};

// 기본 색상
export const SCHEDULE_COLORS = {
	blue: '#3b82f6',
	green: '#10b981',
	yellow: '#f59e0b',
	red: '#ef4444',
	purple: '#8b5cf6',
	pink: '#ec4899',
	gray: '#6b7280'
};

/**
 * 일정 생성
 * @param {ScheduleData} scheduleData
 */
export async function createSchedule(scheduleData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {ScheduleData} */
		const schedule = scheduleData;

		const { data, error } = await supabase
			.from('schedules')
			.insert([
				{
					user_id: user.id,
					title: schedule.title,
					description: schedule.description || null,
					start_date: schedule.start_date,
					end_date: schedule.end_date,
					category: schedule.category || SCHEDULE_CATEGORIES.GENERAL,
					color: schedule.color || SCHEDULE_COLORS.blue,
					is_all_day: schedule.is_all_day || false,
					location: schedule.location || null
				}
			])
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_CREATE || 'schedule_create',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				scheduleId: data?.id,
				title: schedule.title,
				category: schedule.category || SCHEDULE_CATEGORIES.GENERAL,
				startDate: schedule.start_date,
				endDate: schedule.end_date
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('일정 생성 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_CREATE || 'schedule_create',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				title: scheduleData.title,
				category: scheduleData.category
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 일정 조회 (기간별)
 * @param {string} startDate
 * @param {string} endDate
 */
export async function getSchedules(startDate, endDate) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string} */
		const start = startDate;
		/** @type {string} */
		const end = endDate;

		const { data, error } = await supabase
			.from('schedules')
			.select('*')
			.eq('user_id', user.id)
			.gte('end_date', start)
			.lte('start_date', end)
			.order('start_date', { ascending: true });

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('일정 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 일정 조회 (전체)
 */
export async function getAllSchedules() {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		const { data, error } = await supabase
			.from('schedules')
			.select('*')
			.eq('user_id', user.id)
			.order('start_date', { ascending: true });

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('일정 조회 실패:', error);
		return { data: [], error };
	}
}

/**
 * 일정 조회 (ID로)
 * @param {string} id
 */
export async function getScheduleById(id) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string} */
		const scheduleId = id;

		const { data, error } = await supabase
			.from('schedules')
			.select('*')
			.eq('id', scheduleId)
			.eq('user_id', user.id)
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		console.error('일정 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 일정 수정
 * @param {string} id
 * @param {Partial<ScheduleData>} scheduleData
 */
export async function updateSchedule(id, scheduleData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string} */
		const scheduleId = id;
		/** @type {Partial<ScheduleData>} */
		const scheduleUpdate = scheduleData;

		const updateData = {};
		if (scheduleUpdate.title !== undefined) updateData.title = scheduleUpdate.title;
		if (scheduleUpdate.description !== undefined) updateData.description = scheduleUpdate.description;
		if (scheduleUpdate.start_date !== undefined) updateData.start_date = scheduleUpdate.start_date;
		if (scheduleUpdate.end_date !== undefined) updateData.end_date = scheduleUpdate.end_date;
		if (scheduleUpdate.category !== undefined) updateData.category = scheduleUpdate.category;
		if (scheduleUpdate.color !== undefined) updateData.color = scheduleUpdate.color;
		if (scheduleUpdate.is_all_day !== undefined) updateData.is_all_day = scheduleUpdate.is_all_day;
		if (scheduleUpdate.location !== undefined) updateData.location = scheduleUpdate.location;

		const { data, error } = await supabase
			.from('schedules')
			.update(updateData)
			.eq('id', scheduleId)
			.eq('user_id', user.id)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_UPDATE || 'schedule_update',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				scheduleId: scheduleId,
				updates: updateData
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('일정 수정 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_UPDATE || 'schedule_update',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				scheduleId: id,
				updates: scheduleData
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 일정 삭제
 * @param {string} id
 */
export async function deleteSchedule(id) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string} */
		const scheduleId = id;

		// 삭제 전 데이터 조회
		const { data: oldData } = await supabase
			.from('schedules')
			.select('title, category')
			.eq('id', scheduleId)
			.eq('user_id', user.id)
			.single();

		const { error } = await supabase
			.from('schedules')
			.delete()
			.eq('id', scheduleId)
			.eq('user_id', user.id);

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_DELETE || 'schedule_delete',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				scheduleId: scheduleId,
				title: oldData?.title || null,
				category: oldData?.category || null
			},
			result: 'success'
		});

		return { error: null };
	} catch (error) {
		console.error('일정 삭제 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.SCHEDULE_DELETE || 'schedule_delete',
			actionCategory: ACTION_CATEGORIES.SCHEDULE,
			actionDetails: {
				scheduleId: id
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { error };
	}
}

/**
 * 특정 날짜의 일정 조회
 * @param {string | Date} date
 */
export async function getSchedulesByDate(date) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			throw new Error('로그인이 필요합니다.');
		}

		/** @type {string | Date} */
		const targetDate = date;

		const startOfDay = new Date(targetDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(targetDate);
		endOfDay.setHours(23, 59, 59, 999);

		const { data, error } = await supabase
			.from('schedules')
			.select('*')
			.eq('user_id', user.id)
			.gte('end_date', startOfDay.toISOString())
			.lte('start_date', endOfDay.toISOString())
			.order('start_date', { ascending: true });

		if (error) throw error;

		return { data: data || [], error: null };
	} catch (error) {
		console.error('일정 조회 실패:', error);
		return { data: [], error };
	}
}
