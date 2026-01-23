import { supabase } from './supabaseClient';

/**
 * 타임아웃이 있는 Promise 래퍼
 * @param {Promise} promise - 원본 Promise
 * @param {number} timeoutMs - 타임아웃 시간 (밀리초)
 * @param {string} errorMessage - 타임아웃 에러 메시지
 * @returns {Promise}
 */
function withTimeout(promise, timeoutMs, errorMessage) {
	return Promise.race([
		promise,
		new Promise((_, reject) => 
			setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
		)
	]);
}

/**
 * 테이블이 실제로 존재하는지 확인
 * @param {string} tableName - 테이블 이름
 * @returns {Promise<boolean>}
 */
async function tableExists(tableName) {
	try {
		// LIMIT 0으로 빠르게 테이블 존재 여부만 확인
		const { error } = await supabase
			.from(tableName)
			.select('*', { count: 'exact', head: true })
			.limit(0);
		
		// 에러가 없거나 PGRST116(테이블 없음) 에러가 아니면 테이블 존재
		return !error || error.code !== 'PGRST116';
	} catch {
		// 에러 발생 시 테이블이 없는 것으로 간주
		return false;
	}
}

/**
 * 여러 테이블 중 실제로 존재하는 테이블만 필터링
 * @param {string[]} tableNames - 테이블 이름 배열
 * @returns {Promise<string[]>}
 */
async function filterExistingTables(tableNames) {
	const existingTables = [];
	
	// 병렬로 모든 테이블 존재 여부 확인
	const checks = await Promise.allSettled(
		tableNames.map(async (tableName) => {
			const exists = await tableExists(tableName);
			return { tableName, exists };
		})
	);
	
	for (const check of checks) {
		if (check.status === 'fulfilled' && check.value.exists) {
			existingTables.push(check.value.tableName);
		}
	}
	
	return existingTables;
}

/**
 * 코드베이스에서 사용되는 테이블 목록 (fallback용)
 * @type {string[]}
 */
const CODEBASE_TABLES = [
	'profiles',
	'user_profiles',
	'board_categories',
	'posts',
	'comments',
	'post_reactions',
	'post_reaction_counts',
	'post_labels',
	'post_label_mappings',
	'hashtags',
	'post_hashtag_mappings',
	'schedules',
	'schedule_categories',
	'inquiries',
	'images'
];

/**
 * public 스키마의 모든 테이블 목록 조회
 * @returns {Promise<{data: string[] | null, error: Error | null}>}
 */
async function getAllTables() {
	try {
		// 1. RPC 함수를 통해 테이블 목록 가져오기 시도
		console.log('RPC 함수 get_all_tables 호출 시작...');
		
		const { data, error } = await supabase.rpc('get_all_tables');
		
		// 디버깅: RPC 함수 반환값 확인
		console.log('RPC 함수 get_all_tables 반환값:', JSON.stringify({ data, error }, null, 2));
		
		if (!error && data) {
			// RPC 함수가 TABLE을 반환하므로 배열로 변환 필요
			let tableNames = [];
			
			if (Array.isArray(data)) {
				// 이미 배열인 경우
				tableNames = data.map(item => {
					// { table_name: "..." } 형식이면 table_name 추출
					if (typeof item === 'object' && item !== null && 'table_name' in item) {
						return item.table_name;
					}
					// 문자열이면 그대로 사용
					return typeof item === 'string' ? item : String(item);
				});
			} else if (data && typeof data === 'object') {
				// 단일 객체인 경우
				if ('table_name' in data) {
					tableNames = [data.table_name];
				}
			}
			
			console.log('추출된 테이블 목록:', tableNames);
			
			if (tableNames && tableNames.length > 0) {
				// RPC 함수로 가져온 테이블 목록도 실제 존재하는지 확인
				const existingTables = await filterExistingTables(tableNames);
				
				console.log('실제 존재하는 테이블:', existingTables);
				
				if (existingTables.length > 0) {
					return { data: existingTables, error: null };
				}
			}
		}
		
		// 2. RPC 함수가 작동하지 않으면 코드베이스에서 사용하는 테이블 목록 사용
		console.warn('RPC 함수가 작동하지 않아 코드베이스에서 발견한 테이블을 사용합니다.');
		const existingTables = await filterExistingTables(CODEBASE_TABLES);
		
		if (existingTables.length === 0) {
			return { 
				data: null, 
				error: new Error(
					'백업할 테이블을 찾을 수 없습니다. ' +
					'코드베이스에서 사용하는 테이블도 접근할 수 없습니다. ' +
					'테이블 접근 권한(RLS 정책)을 확인해주세요.'
				) 
			};
		}
		
		console.log(`코드베이스에서 발견한 ${existingTables.length}개의 테이블을 백업합니다.`);
		return { data: existingTables, error: null };
	} catch (err) {
		// 예외 발생 시 fallback
		console.error('getAllTables 예외:', err);
		
		const existingTables = await filterExistingTables(CODEBASE_TABLES);
		
		if (existingTables.length === 0) {
			return { 
				data: null, 
				error: new Error(
					`테이블 목록 조회 실패: ${err.message}. ` +
					'코드베이스에서 사용하는 테이블도 접근할 수 없습니다.'
				) 
			};
		}
		
		return { data: existingTables, error: null };
	}
}

/**
 * 테이블 스키마(DDL) 백업
 * @param {string} tableName - 테이블 이름
 * @param {string[]} sqlParts - SQL 파트 배열
 * @returns {Promise<void>}
 */
async function backupTableSchema(tableName, sqlParts) {
	try {
		// RPC 함수를 통해 테이블 스키마 가져오기 시도 (3초 타임아웃)
		const rpcPromise = supabase.rpc('get_table_ddl', { table_name: tableName });
		const { data, error } = await withTimeout(
			rpcPromise,
			3000,
			'DDL 조회 타임아웃'
		);
		
		if (error) {
			// RPC 함수가 없으면 안내 메시지 추가
			sqlParts.push(`-- Table ${tableName} schema (DDL not available - use RPC function get_table_ddl)`);
			sqlParts.push(`-- CREATE TABLE ${tableName} (...);`);
			sqlParts.push('');
			return;
		}
		
		if (data) {
			sqlParts.push(`-- Table ${tableName} schema`);
			sqlParts.push(data);
			sqlParts.push('');
		}
	} catch (err) {
		// 타임아웃이나 기타 에러 발생 시 안내 메시지 추가
		sqlParts.push(`-- Table ${tableName} schema (DDL not available: ${err.message})`);
		sqlParts.push(`-- CREATE TABLE ${tableName} (...);`);
		sqlParts.push('');
	}
}

/**
 * 데이터베이스 백업 생성
 * @param {Function} [progressCallback] - 진행 상황 콜백 함수 (tableName, current, total) => void
 * @returns {Promise<{data: string | null, error: Error | null}>}
 */
export async function createDatabaseBackup(progressCallback) {
	try {
		const sqlParts = [];
		
		// 헤더 추가
		sqlParts.push('-- Database Backup');
		sqlParts.push(`-- Generated at: ${new Date().toISOString()}`);
		sqlParts.push('-- This backup includes table schemas (DDL) and data');
		sqlParts.push('');
		
		// 모든 테이블 목록 가져오기
		if (progressCallback) progressCallback('테이블 목록 조회 중...', 0, 0);
		const { data: tables, error: tablesError } = await getAllTables();
		
		if (tablesError) {
			return { data: null, error: tablesError };
		}
		
		if (!tables || tables.length === 0) {
			return { data: null, error: new Error('백업할 테이블이 없습니다.') };
		}
		
		sqlParts.push(`-- Found ${tables.length} tables to backup`);
		sqlParts.push('');
		
		// 1단계: 스키마 백업 (DDL)
		sqlParts.push('-- ============================================');
		sqlParts.push('-- STEP 1: TABLE SCHEMAS (DDL)');
		sqlParts.push('-- ============================================');
		sqlParts.push('');
		
		for (let i = 0; i < tables.length; i++) {
			const tableName = tables[i];
			if (progressCallback) {
				progressCallback(`스키마 백업 중: ${tableName}`, i + 1, tables.length * 2);
			}
			await backupTableSchema(tableName, sqlParts);
		}
		
		// 2단계: 데이터 백업
		sqlParts.push('-- ============================================');
		sqlParts.push('-- STEP 2: TABLE DATA');
		sqlParts.push('-- ============================================');
		sqlParts.push('');
		sqlParts.push('-- Disable foreign key checks temporarily');
		sqlParts.push('SET session_replication_role = replica;');
		sqlParts.push('');
		
		// 각 테이블 데이터 백업
		for (let i = 0; i < tables.length; i++) {
			const tableName = tables[i];
			if (progressCallback) {
				progressCallback(`데이터 백업 중: ${tableName}`, tables.length + i + 1, tables.length * 2);
			}
			try {
				await backupTableData(tableName, sqlParts);
			} catch (err) {
				console.warn(`Failed to backup table ${tableName}:`, err);
				sqlParts.push(`-- Error backing up ${tableName}: ${err.message}`);
				sqlParts.push('');
			}
		}
		
		// Foreign key checks 재활성화
		sqlParts.push('SET session_replication_role = DEFAULT;');
		sqlParts.push('');
		
		// 3단계: RLS 정책 안내
		if (progressCallback) progressCallback('완료 중...', tables.length * 2, tables.length * 2);
		await backupRLSPolicies(sqlParts);
		
		const backupSQL = sqlParts.join('\n');
		return { data: backupSQL, error: null };
	} catch (err) {
		console.error('백업 생성 중 오류:', err);
		return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
	}
}


/**
 * 테이블 데이터 백업
 * @param {string} tableName
 * @param {string[]} sqlParts
 */
async function backupTableData(tableName, sqlParts) {
	try {
		// 먼저 테이블이 존재하는지 확인하기 위해 데이터 가져오기 시도
		let allData = [];
		let offset = 0;
		const limit = 1000; // 한 번에 1000개씩 가져오기
		let hasMore = true;
		
		while (hasMore) {
			const { data, error } = await supabase
				.from(tableName)
				.select('*')
				.range(offset, offset + limit - 1);
			
			if (error) {
				// 테이블이 없거나 접근 권한이 없는 경우
				if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
					sqlParts.push(`-- Table ${tableName} does not exist or is not accessible`);
					return;
				}
				sqlParts.push(`-- Error backing up ${tableName}: ${error.message}`);
				return;
			}
			
			if (!data || data.length === 0) {
				hasMore = false;
				break;
			}
			
			allData = allData.concat(data);
			
			if (data.length < limit) {
				hasMore = false;
			} else {
				offset += limit;
			}
		}
		
		if (allData.length === 0) {
			sqlParts.push(`-- Table ${tableName} is empty`);
			sqlParts.push('');
			return;
		}
		
		// 컬럼명 추출
		const columns = Object.keys(allData[0]);
		
		// DELETE 문 추가 (기존 데이터 삭제)
		sqlParts.push(`-- Data for table: ${tableName} (${allData.length} rows)`);
		sqlParts.push(`DELETE FROM ${tableName};`);
		sqlParts.push('');
		
		// INSERT 문 생성 (배치로 나누기)
		const batchSize = 100; // 한 번에 100개씩 INSERT
		for (let i = 0; i < allData.length; i += batchSize) {
			const batch = allData.slice(i, i + batchSize);
			sqlParts.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES`);
			
			const values = batch.map((row, index) => {
				const rowValues = columns.map(col => {
					const value = row[col];
					if (value === null) return 'NULL';
					if (typeof value === 'string') {
						// SQL injection 방지를 위해 작은따옴표 이스케이프
						return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
					}
					if (value instanceof Date) {
						return `'${value.toISOString()}'`;
					}
					if (typeof value === 'boolean') {
						return value ? 'true' : 'false';
					}
					if (typeof value === 'object' && value !== null) {
						// JSON 객체는 JSON 문자열로 변환
						return `'${JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'::jsonb`;
					}
					return String(value);
				});
				const comma = index < batch.length - 1 ? ',' : ';';
				return `(${rowValues.join(', ')})${comma}`;
			});
			
			sqlParts.push(...values);
			sqlParts.push('');
		}
	} catch (err) {
		sqlParts.push(`-- Error backing up ${tableName}: ${err.message}`);
		sqlParts.push('');
	}
}

/**
 * RLS 정책 백업
 * @param {string[]} sqlParts
 */
async function backupRLSPolicies(sqlParts) {
	sqlParts.push('-- Row Level Security Policies');
	sqlParts.push('-- Note: RLS policies should be backed up from Supabase Dashboard');
	sqlParts.push('-- or using pg_dump for complete backup');
	sqlParts.push('');
	
	// RLS 정책은 직접 쿼리하기 어려우므로 안내 메시지 추가
	sqlParts.push('-- To backup RLS policies, use the following SQL in Supabase SQL Editor:');
	sqlParts.push('-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check');
	sqlParts.push('-- FROM pg_policies');
	sqlParts.push('-- WHERE schemaname = \'public\';');
	sqlParts.push('');
}

/**
 * SQL 파일 실행 (Restore)
 * @param {string} sqlContent
 * @returns {Promise<{data: any | null, error: Error | null}>}
 */
export async function restoreDatabase(sqlContent) {
	try {
		// SQL을 섹션별로 분리
		const sections = sqlContent.split('-- ============================================');
		
		let schemaSQL = '';
		let dataSQL = '';
		
		// 스키마 섹션과 데이터 섹션 분리
		for (const section of sections) {
			if (section.includes('STEP 1: TABLE SCHEMAS')) {
				schemaSQL = section;
			} else if (section.includes('STEP 2: TABLE DATA')) {
				dataSQL = section;
			}
		}
		
		// 섹션이 없으면 전체를 데이터로 간주
		if (!schemaSQL && !dataSQL) {
			dataSQL = sqlContent;
		}
		
		// 스키마 SQL 파싱
		const schemaStatements = schemaSQL
			.split(';')
			.map(s => s.trim())
			.filter(s => s.length > 0 && !s.startsWith('--') && s.toUpperCase().includes('CREATE'));
		
		// 데이터 SQL 파싱
		const dataStatements = dataSQL
			.split(';')
			.map(s => s.trim())
			.filter(s => s.length > 0 && !s.startsWith('--'));
		
		return {
			data: {
				message: 'SQL 파일을 Supabase Dashboard의 SQL Editor에서 실행해주세요.\n\n실행 순서:\n1. 스키마 섹션 (CREATE TABLE 문)\n2. 데이터 섹션 (INSERT 문)',
				schemaStatements: schemaStatements.length,
				dataStatements: dataStatements.length,
				totalStatements: schemaStatements.length + dataStatements.length
			},
			error: null
		};
	} catch (err) {
		return { data: null, error: err };
	}
}

/**
 * SQL 파일을 파싱하여 실행 가능한 형태로 변환
 * @param {string} sqlContent
 * @returns {string[]}
 */
export function parseSQLFile(sqlContent) {
	return sqlContent
		.split(';')
		.map(s => s.trim())
		.filter(s => s.length > 0 && !s.startsWith('--'));
}

