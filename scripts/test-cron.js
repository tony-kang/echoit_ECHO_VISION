#!/usr/bin/env node

/**
 * 로컬에서 Cron Job을 테스트하는 스크립트
 * 
 * 사용법:
 *   node scripts/test-cron.js [endpoint] [interval]
 * 
 * 예시:
 *   node scripts/test-cron.js test-minute 60000  # 1분마다
 *   node scripts/test-cron.js daily-task         # 한 번만 실행
 */

const BASE_URL = process.env.LOCAL_URL || 'http://localhost:5173';
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret-key';

/**
 * Cron Job API 호출
 * @param {string} endpoint - API 엔드포인트 (예: 'test-minute', 'daily-task')
 * @returns {Promise<void>}
 */
async function callCronJob(endpoint) {
	const url = `${BASE_URL}/api/cron/${endpoint}`;
	
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${CRON_SECRET}`,
				'Content-Type': 'application/json'
			}
		});

		const data = await response.json();
		const timestamp = new Date().toISOString();

		if (response.ok) {
			console.log(`[${timestamp}] ✅ 성공: ${endpoint}`);
			console.log(`   응답:`, JSON.stringify(data, null, 2));
		} else {
			console.error(`[${timestamp}] ❌ 실패: ${endpoint}`);
			console.error(`   상태: ${response.status}`);
			console.error(`   응답:`, JSON.stringify(data, null, 2));
		}
	} catch (error) {
		const timestamp = new Date().toISOString();
		console.error(`[${timestamp}] ❌ 오류: ${endpoint}`);
		console.error(`   메시지:`, error.message);
	}
}

/**
 * 주기적으로 Cron Job 실행
 * @param {string} endpoint - API 엔드포인트
 * @param {number} intervalMs - 실행 간격 (밀리초)
 * @returns {void}
 */
function runPeriodically(endpoint, intervalMs) {
	console.log(`\n🔄 주기적 실행 시작: ${endpoint}`);
	console.log(`   URL: ${BASE_URL}/api/cron/${endpoint}`);
	console.log(`   간격: ${intervalMs}ms (${intervalMs / 1000}초)`);
	console.log(`   중지: Ctrl+C\n`);

	// 즉시 한 번 실행
	callCronJob(endpoint);

	// 주기적으로 실행
	const intervalId = setInterval(() => {
		callCronJob(endpoint);
	}, intervalMs);

	// 종료 시그널 처리
	process.on('SIGINT', () => {
		console.log('\n\n⏹️  실행 중지');
		clearInterval(intervalId);
		process.exit(0);
	});
}

/**
 * 한 번만 실행
 * @param {string} endpoint - API 엔드포인트
 * @returns {Promise<void>}
 */
async function runOnce(endpoint) {
	console.log(`\n▶️  한 번만 실행: ${endpoint}`);
	console.log(`   URL: ${BASE_URL}/api/cron/${endpoint}\n`);
	await callCronJob(endpoint);
	process.exit(0);
}

// 메인 실행
const args = process.argv.slice(2);
const endpoint = args[0] || 'test-minute';
const intervalArg = args[1];

if (intervalArg) {
	const intervalMs = parseInt(intervalArg, 10);
	if (isNaN(intervalMs) || intervalMs < 1000) {
		console.error('❌ 간격은 1000ms(1초) 이상이어야 합니다.');
		process.exit(1);
	}
	runPeriodically(endpoint, intervalMs);
} else {
	runOnce(endpoint);
}
