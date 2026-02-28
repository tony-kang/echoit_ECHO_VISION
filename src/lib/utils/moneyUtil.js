/**
 * 금액 포맷팅 (천원 단위, 음수면 앞에 - 붙임)
 * @param {number} value - 금액 (원 단위)
 * @returns {string}
 */
export function formatCurrency(value) {
	const absThousand = Math.round(Math.abs(value) / 1000);
	const formatted = new Intl.NumberFormat('ko-KR').format(absThousand);
	return value < 0 ? `-${formatted}` : formatted;
}

/**
 * 4자리 이하 수를 숫자+단위 띄어쓰기로 변환 (예: 4562 -> "4천 5백 6십 2")
 * @param {number} n - 0 이상 9999 이하
 * @returns {string}
 */
export function segmentWithSpaces(n) {
	if (n === 0) return '';
	const a = Math.floor(n / 1000);
	const b = Math.floor((n % 1000) / 100);
	const c = Math.floor((n % 100) / 10);
	const d = n % 10;
	const parts = [];
	if (a > 0) parts.push(a + '천');
	if (b > 0) parts.push(b + '백');
	if (c > 0) parts.push(c + '십');
	if (d > 0) parts.push(String(d));
	return parts.join(' ');
}

/**
 * 금액(원)을 한글 읽기 문자열로 변환 (음수면 앞에 - 붙임, 예: -123억 4천 5백 6십 2만 4천원)
 * @param {number} value - 금액 (원 단위)
 * @returns {string}
 */
export function toKoreanAmount(value) {
	const n = Math.round(Math.abs(value));
	const prefix = value < 0 ? '- ' : '';
	if (n === 0) return prefix + '0원';
	const eok = Math.floor(n / 1e8);
	const man = Math.floor((n % 1e8) / 1e4);
	const rest = n % 1e4;
	/** 원 단위는 천단위까지 반올림 */
	const restRounded = Math.round(rest / 1000) * 1000;
	const parts = [];
	if (eok > 0) parts.push(eok + '억');
	if (man > 0) parts.push(segmentWithSpaces(man) + '만');
	if (restRounded > 0) parts.push(segmentWithSpaces(restRounded) + '원');
	else if (parts.length > 0) parts.push('원');
	return prefix + parts.join(' ');
}
