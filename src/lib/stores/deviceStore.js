import { writable } from 'svelte/store';

/**
 * 디바이스 타입 감지 스토어
 * 실제 모바일/태블릿 기기를 감지하여 모바일 UI를 표시
 */

/**
 * 모바일 기기인지 확인
 * @returns {boolean} 모바일 기기면 true
 */
function isMobileDevice() {
	if (typeof window === 'undefined') {
		return false;
	}

	// 터치 이벤트 지원 여부 확인
	const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

	// User-Agent 기반 모바일 기기 감지
	const userAgent = navigator.userAgent.toLowerCase();
	const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
	const isMobileUA = mobileRegex.test(userAgent);

	// CSS 미디어 쿼리로 터치 기기 확인 (hover: none은 터치 기기)
	const hasHoverNone = window.matchMedia('(hover: none)').matches;
	const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

	// 터치 지원 또는 모바일 User-Agent 또는 hover: none 또는 coarse pointer
	return hasTouch || isMobileUA || hasHoverNone || hasCoarsePointer;
}

/**
 * 초기 디바이스 타입 감지
 */
function createDeviceStore() {
	const { subscribe, set } = writable(false);

	/**
	 * 디바이스 타입 업데이트
	 */
	function update() {
		if (typeof window !== 'undefined') {
			set(isMobileDevice());
		}
	}

	// 초기화
	if (typeof window !== 'undefined') {
		update();

		// 화면 크기 변경 시 재확인 (디바이스 회전 등)
		const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)');
		mediaQuery.addEventListener('change', update);
	}

	return {
		subscribe,
		update
	};
}

export const deviceStore = createDeviceStore();
