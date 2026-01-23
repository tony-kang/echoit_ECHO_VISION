import prjConst from '$prj/prjConst.js';

/**
 * 현재 호스트명이 개발 도메인인지 확인
 * @param {string} [hostname] - 호스트명 (없으면 클라이언트에서 window.location.hostname 사용)
 * @returns {boolean} 개발 도메인이면 true
 */
export function isDevDomain(hostname) {
	// 호스트명이 제공되지 않으면 클라이언트에서 window.location.hostname 사용
	if (typeof hostname === 'undefined') {
		if (typeof window === 'undefined') {
			// 서버 사이드에서는 hostname을 반드시 제공해야 함
			throw new Error('서버 사이드에서는 hostname 파라미터를 제공해야 합니다.');
		}
		hostname = window.location.hostname;
	}

	// 개발 도메인 목록 확인
	const devDomains = prjConst.dev.domains || [];
	return devDomains.some(domain => {
		// 정확히 일치하거나, 서브도메인인 경우 (예: dev.telepasi.com)
		return hostname === domain || hostname.endsWith(`.${domain}`);
	});
}

/**
 * 현재 호스트명이 프로덕션 도메인인지 확인
 * @param {string} [hostname] - 호스트명 (없으면 클라이언트에서 window.location.hostname 사용)
 * @returns {boolean} 프로덕션 도메인이면 true
 */
export function isProductionDomain(hostname) {
	if (typeof hostname === 'undefined') {
		if (typeof window === 'undefined') {
			throw new Error('서버 사이드에서는 hostname 파라미터를 제공해야 합니다.');
		}
		hostname = window.location.hostname;
	}

	const productionDomain = prjConst.production.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
	return hostname === productionDomain || hostname === `www.${productionDomain}`;
}

/**
 * 현재 환경이 개발 환경인지 확인 (도메인 기반)
 * @param {string} [hostname] - 호스트명 (없으면 클라이언트에서 window.location.hostname 사용)
 * @returns {boolean} 개발 환경이면 true
 */
export function isDevEnvironment(hostname) {
	return isDevDomain(hostname);
}

