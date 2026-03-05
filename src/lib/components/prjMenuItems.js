
	/**
	 * 메뉴 항목 타입 정의
	 * @typedef {Object} MenuItem 
	 * @property {string} id - 메뉴 ID
	 * @property {string} label - 메뉴 라벨
	 * @property {string} icon - 아이콘 SVG 경로
	 * @property {string} path - 기본 경로
	 * @property {Array<{label: string, path: string}>} subMenus - 하위 메뉴 목록
	 */

	/** @type {Array<MenuItem>} */
	export const prjMenuItems = [
		{
			id: 'performance', // profit and loss
			label: '경영 실적',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
			path: '/echovision/performance',
			subMenus: [
				{ label: '부서별 실적', path: '/echovision/performance/department' },
				{ label: '전사 실적', path: '/echovision/performance/company' },
				// { label: '경영 실적', path: '/echovision/performance' },
				// { label: '손익 현황', path: '/echovision/profit' },
			]
		},
		// {
		// 	id: 'sales',
		// 	label: '매출',
		// 	icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
		// 	path: '/echovision/sales',
		// 	subMenus: [
		// 		{ label: '매출 관리', path: '/echovision/sales' },
		// 		{ label: '매출 (엑셀)파일 관리', path: '/echovision/excel/sales' },
		// 		// { label: '매출 분석', path: '/echovision/compare/sales' },
		// 	]
		// },
		{
			id: 'cost',
			label: '매출 / 원가',
			icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
			path: '/echovision/cost',
			subMenus: [
				{ label: '매출 데이터 확인', path: '/echovision/sales' },
				{ label: '원가 데이터 확인', path: '/echovision/cost' },
				{ label: '매출 (엑셀)파일 관리', path: '/echovision/excel/sales' },
				{ label: '원가 (엑셀)파일 관리', path: '/echovision/excel/cost' },
				// { label: '원가 분석', path: '/echovision/compare/cost' },
			]
		},
		{
			id: 'settings',
			label: '환경설정',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
			path: '/echovision/settings',
			subMenus: [
				{ label: '사용자 관리', path: '/echovision/settings/user' },
				{ label: '엑셀 컬럼 관리', path: '/echovision/settings/excel-code' },
				{ label: '부서 관리', path: '/echovision/settings/department' },
				{ label: '금액 코드 관리', path: '/echovision/settings/amount-code' },
				{ label: '실적 회사 관리', path: '/echovision/settings/performance-company' },
				// { label: '시스템', path: '/echovision/settings/system' }
			]
		},
		{
			id: 'maintenance',
			label: '유지보수',
			icon: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.38.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 01-.16-3.38l.75-.75a2.548 2.548 0 013.38-.16l5.653 4.655M11.42 15.17l-2.496 3.03c-.317.38-.74.626-1.208.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 01-.16 3.38l.75.75a2.548 2.548 0 013.38.16l5.653-4.655',
			path: '/echovision/maintenance',
			subMenus: [
				{ label: '액션 로그', path: '/echovision/maintenance/logs' },
			]
		}
	];

export default prjMenuItems;