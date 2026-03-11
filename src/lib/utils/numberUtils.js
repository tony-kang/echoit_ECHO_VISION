/**
 * 숫자 포맷 유틸리티 (공용)
 */

/**
 * 숫자를 1000단위 콤마 포맷 문자열로 변환
 * @param {number|string|null|undefined} num - 포맷할 값
 * @param {{ decimals?: number }} [options] - decimals: 소수 자리 수 (기본 0, 정수)
 * @returns {string} 포맷된 문자열. null/undefined/NaN이면 빈 문자열
 */
export function formatNumber(num, options = {}) {
	if (num == null || num === '') return '';
	const n = Number(num);
	if (Number.isNaN(n)) return '';
	const { decimals = 0 } = options;
	return n.toLocaleString('ko-KR', {
		maximumFractionDigits: decimals,
		minimumFractionDigits: decimals
	});
}

/**
 * 음수 포함 숫자를 1000단위 콤마로 포맷 (예: -1234 → "-1,234")
 * @param {number|string|null|undefined} num - 포맷할 값
 * @param {{ decimals?: number }} [options] - decimals: 소수 자리 수 (기본 0)
 * @returns {string} 포맷된 문자열
 */
export function formatNumberSigned(num, options = {}) {
	if (num == null || num === '') return '';
	const n = Number(num);
	if (Number.isNaN(n)) return '';
	const { decimals = 0 } = options;
	const formatted = Math.abs(n).toLocaleString('ko-KR', {
		maximumFractionDigits: decimals,
		minimumFractionDigits: decimals
	});
	return n < 0 ? `-${formatted}` : formatted;
}
