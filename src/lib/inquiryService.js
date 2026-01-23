import { supabase } from './supabaseClient';
import { logAction, ACTION_TYPES, ACTION_CATEGORIES } from './logService';

/**
 * @typedef {Object} InquiryData
 * @property {string} [user_id]
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [company]
 * @property {keyof typeof INQUIRY_TYPE_LABELS} inquiry_type
 * @property {string} subject
 * @property {string} message
 */

/**
 * @typedef {Object} InquiryFilters
 * @property {keyof typeof INQUIRY_STATUS_LABELS} [status]
 * @property {keyof typeof INQUIRY_TYPE_LABELS} [inquiry_type]
 * @property {keyof typeof PRIORITY_LABELS} [priority]
 * @property {string} [search]
 * @property {number} [page]
 * @property {number} [pageSize]
 */

/**
 * @typedef {Object} Inquiry
 * @property {string} id
 * @property {string} [user_id]
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [company]
 * @property {keyof typeof INQUIRY_TYPE_LABELS} inquiry_type
 * @property {string} subject
 * @property {string} message
 * @property {keyof typeof INQUIRY_STATUS_LABELS} status
 * @property {keyof typeof PRIORITY_LABELS} priority
 * @property {string} [admin_response]
 * @property {string} [admin_id]
 * @property {string} [responded_at]
 * @property {string} created_at
 */

// 문의 유형
export const INQUIRY_TYPES = {
	PRODUCT: 'product',
	PARTNERSHIP: 'partnership',
	SUPPORT: 'support',
	OTHER: 'other'
};

export const INQUIRY_TYPE_LABELS = {
	product: '제품 문의',
	partnership: '제휴 제안',
	support: '기술 지원',
	other: '기타 문의'
};

// 문의 상태
export const INQUIRY_STATUS = {
	PENDING: 'pending',
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled'
};

export const INQUIRY_STATUS_LABELS = {
	pending: '대기중',
	in_progress: '진행중',
	completed: '완료',
	cancelled: '취소'
};

// 우선순위
export const PRIORITY_LEVELS = {
	LOW: 'low',
	NORMAL: 'normal',
	HIGH: 'high',
	URGENT: 'urgent'
};

export const PRIORITY_LABELS = {
	low: '낮음',
	normal: '보통',
	high: '높음',
	urgent: '긴급'
};

/**
 * 문의 생성 (로그인 필수)
 * @param {InquiryData} inquiryData
 */
export async function createInquiry(inquiryData) {
	try {
		const { data, error } = await supabase
			.from('inquiries')
			.insert([
				{
					user_id: inquiryData.user_id || null,
					name: inquiryData.name,
					email: inquiryData.email,
					phone: inquiryData.phone || null,
					company: inquiryData.company || null,
					inquiry_type: inquiryData.inquiry_type,
					subject: inquiryData.subject,
					message: inquiryData.message,
					status: INQUIRY_STATUS.PENDING,
					priority: PRIORITY_LEVELS.NORMAL
				}
			])
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_CREATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryId: data?.id,
				inquiryType: inquiryData.inquiry_type,
				subject: inquiryData.subject
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('문의 생성 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_CREATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryType: inquiryData.inquiry_type,
				subject: inquiryData.subject
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 모든 문의 조회 (관리자 전용)
 * @param {InquiryFilters} [filters={}]
 * @returns {Promise<{data: Array|null, total: number|null, error: Error|null}>}
 */
export async function getAllInquiries(filters = {}) {
	try {
		// 전체 개수 조회용 쿼리
		let countQuery = supabase
			.from('inquiries')
			.select('*', { count: 'exact', head: true });

		// 데이터 조회용 쿼리
		let dataQuery = supabase
			.from('inquiries')
			.select('*')
			.order('created_at', { ascending: false });

		// 필터 적용
		const currentFilters = filters;
		if (currentFilters.status) {
			countQuery = countQuery.eq('status', currentFilters.status);
			dataQuery = dataQuery.eq('status', currentFilters.status);
		}
		if (currentFilters.inquiry_type) {
			countQuery = countQuery.eq('inquiry_type', currentFilters.inquiry_type);
			dataQuery = dataQuery.eq('inquiry_type', currentFilters.inquiry_type);
		}
		if (currentFilters.priority) {
			countQuery = countQuery.eq('priority', currentFilters.priority);
			dataQuery = dataQuery.eq('priority', currentFilters.priority);
		}
		if (currentFilters.search) {
			const searchPattern = `name.ilike.%${currentFilters.search}%,email.ilike.%${currentFilters.search}%,company.ilike.%${currentFilters.search}%,subject.ilike.%${currentFilters.search}%`;
			countQuery = countQuery.or(searchPattern);
			dataQuery = dataQuery.or(searchPattern);
		}

		// 전체 개수 조회
		const { count, error: countError } = await countQuery;
		if (countError) {
			console.error('문의 개수 조회 실패:', countError);
			throw countError;
		}

		// 페이지네이션
		if (currentFilters.page && currentFilters.pageSize) {
			const from = (currentFilters.page - 1) * currentFilters.pageSize;
			const to = from + currentFilters.pageSize - 1;
			dataQuery = dataQuery.range(from, to);
		}

		const { data, error } = await dataQuery;

		if (error) throw error;
		return { data, total: count || null, error: null };
	} catch (error) {
		console.error('문의 조회 실패:', error);
		return { data: null, total: null, error };
	}
}

/**
 * 문의 상세 조회 (관리자 전용)
 * @param {string} id
 */
export async function getInquiryById(id) {
	try {
		const { data, error } = await supabase
			.from('inquiries')
			.select('*')
			.eq('id', id)
			.single();

		if (error) throw error;
		return { data, error: null };
	} catch (error) {
		console.error('문의 상세 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * 문의 상태 업데이트 (관리자 전용)
 * @param {string} id
 * @param {keyof typeof INQUIRY_STATUS_LABELS} status
 */
export async function updateInquiryStatus(id, status) {
	try {
		// 이전 상태 조회
		const { data: oldData } = await supabase
			.from('inquiries')
			.select('status')
			.eq('id', id)
			.single();

		const { data, error } = await supabase
			.from('inquiries')
			.update({ status })
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_UPDATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryId: id,
				field: 'status',
				oldValue: oldData?.status || null,
				newValue: status
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('문의 상태 업데이트 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_UPDATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryId: id,
				field: 'status',
				newValue: status
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 관리자 응답 추가 (관리자 전용)
 * @param {string} id
 * @param {string} response
 * @param {string} adminId
 */
export async function addAdminResponse(id, response, adminId) {
	try {
		const { data, error } = await supabase
			.from('inquiries')
			.update({
				admin_response: response,
				admin_id: adminId,
				responded_at: new Date().toISOString(),
				status: INQUIRY_STATUS.COMPLETED
			})
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_UPDATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryId: id,
				field: 'admin_response',
				adminId: adminId,
				status: INQUIRY_STATUS.COMPLETED
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('관리자 응답 추가 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_UPDATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryId: id,
				field: 'admin_response',
				adminId: adminId
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 우선순위 변경 (관리자 전용)
 * @param {string} id
 * @param {keyof typeof PRIORITY_LABELS} priority
 */
export async function updatePriority(id, priority) {
	try {
		// 이전 우선순위 조회
		const { data: oldData } = await supabase
			.from('inquiries')
			.select('priority')
			.eq('id', id)
			.single();

		const { data, error } = await supabase
			.from('inquiries')
			.update({ priority })
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;

		// 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_UPDATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryId: id,
				field: 'priority',
				oldValue: oldData?.priority || null,
				newValue: priority
			},
			result: 'success'
		});

		return { data, error: null };
	} catch (error) {
		console.error('우선순위 변경 실패:', error);

		// 에러 로그 기록
		await logAction({
			actionType: ACTION_TYPES.INQUIRY_UPDATE,
			actionCategory: ACTION_CATEGORIES.INQUIRY,
			actionDetails: {
				inquiryId: id,
				field: 'priority',
				newValue: priority
			},
			result: 'error',
			errorMessage: error instanceof Error ? error.message : String(error)
		});

		return { data: null, error };
	}
}

/**
 * 문의 통계 (관리자 전용)
 */
export async function getInquiryStatistics() {
	try {
		const { data, error } = await supabase
			.from('inquiries')
			.select('status, inquiry_type, priority');

		if (error) throw error;

		// 통계 계산
		/** @type {{total: number, byStatus: Record<string, number>, byType: Record<string, number>, byPriority: Record<string, number>}} */
		const stats = {
			total: data.length,
			byStatus: {},
			byType: {},
			byPriority: {}
		};

		data.forEach((inquiry) => {
			// 상태별
			const status = String(inquiry.status);
			const currentStatusCount = stats.byStatus[status] || 0;
			stats.byStatus[status] = currentStatusCount + 1;
			// 유형별
			const inquiryType = String(inquiry.inquiry_type);
			const currentTypeCount = stats.byType[inquiryType] || 0;
			stats.byType[inquiryType] = currentTypeCount + 1;
			// 우선순위별
			const priority = String(inquiry.priority);
			const currentPriorityCount = stats.byPriority[priority] || 0;
			stats.byPriority[priority] = currentPriorityCount + 1;
		});

		return { data: stats, error: null };
	} catch (error) {
		console.error('통계 조회 실패:', error);
		return { data: null, error };
	}
}

/**
 * CSV 변환
 * @param {Inquiry[]} inquiries
 */
export function convertToCSV(inquiries) {
	if (!inquiries || inquiries.length === 0) return '';

	const headers = [
		'ID',
		'이름',
		'이메일',
		'전화번호',
		'회사명',
		'문의유형',
		'제목',
		'내용',
		'상태',
		'우선순위',
		'관리자응답',
		'응답일시',
		'생성일시'
	];

	const rows = inquiries.map((inquiry) => [
		inquiry.id,
		inquiry.name,
		inquiry.email,
		inquiry.phone || '',
		inquiry.company || '',
		INQUIRY_TYPE_LABELS[inquiry.inquiry_type],
		inquiry.subject,
		inquiry.message,
		INQUIRY_STATUS_LABELS[inquiry.status],
		PRIORITY_LABELS[inquiry.priority],
		inquiry.admin_response || '',
		inquiry.responded_at || '',
		inquiry.created_at
	]);

	const csvContent = [headers, ...rows]
		.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
		.join('\n');

	return csvContent;
}

/**
 * CSV 다운로드
 * @param {Inquiry[]} inquiries
 * @param {string} [filename='inquiries']
 */
export function downloadCSV(inquiries, filename = 'inquiries') {
	const csv = convertToCSV(inquiries);
	const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
