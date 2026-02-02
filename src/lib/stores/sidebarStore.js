import { writable } from 'svelte/store';

/**
 * 사이드바 열림 상태 관리 스토어
 * 전역적으로 사이드바 상태를 관리하여 Header와 페이지 간 동기화
 */

/**
 * @typedef {Object} SidebarState
 * @property {boolean} isOpen - 사이드바 열림 상태
 */

/**
 * 사이드바 상태 스토어 생성
 * @returns {import('svelte/store').Writable<SidebarState>}
 */
function createSidebarStore() {
	const { subscribe, set, update } = writable({
		isOpen: false
	});

	return {
		subscribe,
		
		/**
		 * 사이드바 열기
		 */
		open() {
			console.log('📂 sidebarStore.open() 호출됨');
			update(state => {
				console.log('📂 이전 상태:', state);
				const newState = { ...state, isOpen: true };
				console.log('📂 새 상태:', newState);
				return newState;
			});
		},
		
		/**
		 * 사이드바 닫기
		 */
		close() {
			update(state => ({ ...state, isOpen: false }));
		},
		
		/**
		 * 사이드바 토글
		 */
		toggle() {
			update(state => ({ ...state, isOpen: !state.isOpen }));
		},
		
		/**
		 * 사이드바 상태 설정
		 * @param {boolean} isOpen
		 */
		setOpen(isOpen) {
			update(state => ({ ...state, isOpen }));
		}
	};
}

export const sidebarStore = createSidebarStore();
