/** @typedef {{ isOpen: boolean }} SidebarState */

// 1. 내부 상태 (은닉화)
let state = $state({ isOpen: false });

/** 사이드바 전역 상태 관리 */
export const sidebarStore = {
    // Getter를 통해 읽기 전용으로 제공
    get isOpen() { return state.isOpen; },

    open() { 
        console.log('📂 sidebar open');
        state.isOpen = true; 
    },
    close() { state.isOpen = false; },
    toggle() { state.isOpen = !state.isOpen; },
    setOpen(value) { state.isOpen = value; }
};
