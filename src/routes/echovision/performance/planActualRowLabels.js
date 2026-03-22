/**
 * 경영 실적 테이블에서 사용하는 '계획' 전체 명칭
 * @type {string}
 */
export const PERFORMANCE_ROW_LABEL_PLAN_FULL = '계획';

/**
 * 경영 실적 테이블에서 사용하는 '예상' 전체 명칭
 * @type {string}
 */
export const PERFORMANCE_ROW_LABEL_FORECAST_FULL = '전망';

/**
 * 경영 실적 테이블에서 사용하는 '실제' 전체 명칭
 * @type {string}
 */
export const PERFORMANCE_ROW_LABEL_ACTUAL_FULL = '실제';

/**
 * 계획·예상·실제 행 메타 (한 글자 표기 / 툴팁·접근성용 전체 명칭 / 라벨 색상 클래스)
 * @type {readonly { shortLabel: string, fullLabel: string, labelClass: string }[]}
 */
export const PLAN_FORECAST_ACTUAL_ROW_DEFS = [
	{
		shortLabel: '계',
		fullLabel: PERFORMANCE_ROW_LABEL_PLAN_FULL,
		labelClass: 'text-gray-500'
	},
	{
		shortLabel: '전',
		fullLabel: PERFORMANCE_ROW_LABEL_FORECAST_FULL,
		labelClass: 'text-blue-600'
	},
	{
		shortLabel: '실',
		fullLabel: PERFORMANCE_ROW_LABEL_ACTUAL_FULL,
		labelClass: 'text-gray-600'
	}
];
