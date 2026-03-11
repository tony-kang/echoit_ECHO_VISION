// 날짜 유틸리티 함수

/**
 * 날짜를 상대 시간으로 포맷 (예: "3분 전", "2시간 전")
 * @param {string|Date} dateString 
 * @returns {string}
 */
export function formatDistanceToNow(dateString) {
	try {
		const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
		const now = new Date();
		const diffMs = now - date;
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffSec < 60) {
			return '방금 전';
		} else if (diffMin < 60) {
			return `${diffMin}분 전`;
		} else if (diffHour < 24) {
			return `${diffHour}시간 전`;
		} else if (diffDay < 7) {
			return `${diffDay}일 전`;
		} else {
			return date.toLocaleDateString('ko-KR');
		}
	} catch {
		return dateString;
	}
}

/**
 * 날짜를 한국어 형식으로 포맷
 * @param {string|Date} dateString 
 * @returns {string}
 */
// export function formatDate(dateString) {
// 	try {
// 		const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
// 		return date.toLocaleDateString('ko-KR', {
// 			year: 'numeric',
// 			month: 'long',
// 			day: 'numeric'
// 		});
// 	} catch {
// 		return dateString;
// 	}
// }

/**
 * 날짜 포맷팅
 * @param {string} dateString - 날짜 문자열
 * @returns {string}
 */
export function formatDate(dateString) {
	if (!dateString) return '';//'-';
	const date = new Date(dateString);
	return date.toLocaleString('ko-KR', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
}

/**
 * 날짜만 포맷팅 (시간 제외)
 * @param {string} dateString - 날짜 문자열
 * @returns {string}
 */
export function formatDateOnly(dateString) {
	if (!dateString) return '';//'-';
	const date = new Date(dateString);
	return date.toISOString().split('T')[0];
	// return date.toLocaleDateString('ko-KR', {
	// 	year: 'numeric',
	// 	month: '2-digit',
	// 	day: '2-digit'
	// });
}

/**
 * input[type=date] value용 YYYY-MM-DD 문자열
 * @param {string} dateString - 날짜 문자열
 * @returns {string}
 */
export function toDateInputValue(dateString) {
	if (!dateString) return '';
	const s = String(dateString);
	if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
	const date = new Date(dateString);
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}