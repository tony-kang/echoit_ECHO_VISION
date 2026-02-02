<script>
	import { createDatabaseBackup, restoreDatabase } from '$lib/databaseService';

	/** @type {boolean} 백업 진행 중 상태 */
	let isBackingUp = $state(false);
	
	/** @type {boolean} 복원 진행 중 상태 */
	let isRestoring = $state(false);
	
	/** @type {string | null} 에러 메시지 */
	let error = $state(null);
	
	/** @type {string | null} 성공 메시지 */
	let successMessage = $state(null);
	
	/** @type {File | null} 선택된 SQL 파일 */
	let selectedFile = $state(null);
	
	/** @type {string | null} 백업 진행 상황 메시지 */
	let backupProgress = $state(null);

	/**
	 * 데이터베이스 백업 생성 및 다운로드
	 */
	async function handleBackup() {
		if (isBackingUp) return;
		
		if (!confirm('데이터베이스 백업을 생성하시겠습니까?\n\n주의: 대용량 데이터베이스의 경우 시간이 오래 걸릴 수 있습니다.')) {
			return;
		}
		
		isBackingUp = true;
		error = null;
		successMessage = null;
		backupProgress = '백업을 시작합니다...';
		
		try {
			/**
			 * 백업 진행 상황 콜백
			 * @param {string} message - 진행 상황 메시지
			 * @param {number} current - 현재 진행 단계
			 * @param {number} total - 전체 단계
			 */
			const progressCallback = (message, current, total) => {
				if (total > 0) {
					const percent = Math.round((current / total) * 100);
					backupProgress = `${message} (${percent}%)`;
				} else {
					backupProgress = message;
				}
			};
			
			const { data, error: backupError } = await createDatabaseBackup(progressCallback);
			
			if (backupError) {
				error = `백업 생성 실패: ${backupError.message}`;
				backupProgress = null;
				return;
			}
			
			if (!data) {
				error = '백업 데이터를 생성할 수 없습니다.';
				backupProgress = null;
				return;
			}
			
			backupProgress = '파일 다운로드 중...';
			
			// SQL 파일로 다운로드
			downloadSQLFile(data, `database_backup_${new Date().toISOString().split('T')[0]}.sql`);
			
			backupProgress = null;
			successMessage = '백업이 완료되었습니다. SQL 파일이 다운로드되었습니다.';
			
			// 3초 후 메시지 제거
			setTimeout(() => {
				successMessage = null;
			}, 3000);
		} catch (err) {
			error = `백업 중 오류 발생: ${err.message}`;
			backupProgress = null;
			console.error('백업 오류:', err);
		} finally {
			isBackingUp = false;
		}
	}

	/**
	 * SQL 파일 선택 핸들러
	 * @param {Event} e
	 */
	function handleFileSelect(e) {
		const file = e.target.files?.[0];
		if (!file) {
			selectedFile = null;
			return;
		}
		
		// SQL 파일인지 확인
		if (!file.name.endsWith('.sql')) {
			error = 'SQL 파일만 선택할 수 있습니다.';
			selectedFile = null;
			return;
		}
		
		selectedFile = file;
		error = null;
	}

	/**
	 * 데이터베이스 복원 실행
	 */
	async function handleRestore() {
		if (!selectedFile) {
			error = '복원할 SQL 파일을 선택해주세요.';
			return;
		}
		
		if (!confirm('⚠️ 경고: 데이터베이스를 복원하면 기존 데이터가 완전히 덮어씌워집니다.\n\n이 작업은 되돌릴 수 없습니다. 정말 진행하시겠습니까?')) {
			return;
		}
		
		if (!confirm('마지막 확인: 모든 데이터가 삭제되고 백업 파일의 내용으로 대체됩니다.\n\n계속하시겠습니까?')) {
			return;
		}
		
		isRestoring = true;
		error = null;
		successMessage = null;
		
		try {
			// 파일 읽기
			const fileContent = await readFileAsText(selectedFile);
			
			// 복원 실행
			const { data, error: restoreError } = await restoreDatabase(fileContent);
			
			if (restoreError) {
				error = `복원 실패: ${restoreError.message}`;
				return;
			}
			
			if (data?.message) {
				successMessage = data.message;
			} else {
				successMessage = '복원이 완료되었습니다.';
			}
			
			// 파일 선택 초기화
			selectedFile = null;
			const fileInput = document.getElementById('sql-file-input');
			if (fileInput) {
				fileInput.value = '';
			}
			
			// 5초 후 메시지 제거
			setTimeout(() => {
				successMessage = null;
			}, 5000);
		} catch (err) {
			error = `복원 중 오류 발생: ${err.message}`;
		} finally {
			isRestoring = false;
		}
	}

	/**
	 * 파일을 텍스트로 읽기
	 * @param {File} file
	 * @returns {Promise<string>}
	 */
	function readFileAsText(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				resolve(e.target?.result || '');
			};
			reader.onerror = (e) => {
				reject(new Error('파일 읽기 실패'));
			};
			reader.readAsText(file);
		});
	}

	/**
	 * SQL 파일 다운로드
	 * @param {string} content
	 * @param {string} filename
	 */
	function downloadSQLFile(content, filename) {
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="database-tab">
	<div class="tab-header">
		<h2>🗄️ Database 관리</h2>
		<p>데이터베이스 백업 및 복원 관리</p>
	</div>

	<div class="tab-content">
		<!-- 에러 메시지 -->
		{#if error}
			<div class="alert alert-error">
				<strong>오류:</strong> {error}
			</div>
		{/if}

		<!-- 성공 메시지 -->
		{#if successMessage}
			<div class="alert alert-success">
				<strong>성공:</strong> {successMessage}
			</div>
		{/if}

		<!-- 백업 진행 상황 -->
		{#if backupProgress}
			<div class="alert alert-info">
				<strong>진행 중:</strong> {backupProgress}
			</div>
		{/if}

		<!-- 백업 섹션 -->
		<div class="section">
			<div class="section-header">
				<h3>📦 데이터베이스 백업</h3>
				<p>모든 테이블 데이터와 구조를 SQL 파일로 백업합니다.</p>
			</div>

			<div class="section-content">
				<div class="info-box">
					<p><strong>백업 내용:</strong></p>
					<ul>
						<li>모든 테이블의 스키마 (CREATE TABLE 문) - 먼저 백업</li>
						<li>모든 테이블의 데이터 (INSERT 문)</li>
						<li>RLS 정책 정보 (참고용)</li>
					</ul>
					<p class="note">
						<strong>중요:</strong> 완전한 백업 기능을 사용하려면 Supabase SQL Editor에서 
						<code>docs/supabase/database_backup_rpc_functions.sql</code> 파일의 RPC 함수를 먼저 실행해야 합니다.
						이 함수들이 없으면 알려진 테이블 목록만 백업됩니다.
					</p>
					<p class="note">
						<strong>참고:</strong> 완전한 백업(제약조건, 인덱스 등 포함)을 위해서는 
						Supabase Dashboard의 SQL Editor에서 <code>pg_dump</code> 명령을 사용하거나 
						Supabase의 자동 백업 기능을 활용하세요.
					</p>
				</div>

				<button
					class="btn btn-primary"
					onclick={handleBackup}
					disabled={isBackingUp}
				>
					{#if isBackingUp}
						<span class="spinner-small"></span>
						백업 중...
					{:else}
						💾 백업 생성 및 다운로드
					{/if}
				</button>
			</div>
		</div>

		<!-- 복원 섹션 -->
		<div class="section">
			<div class="section-header">
				<h3>🔄 데이터베이스 복원</h3>
				<p>백업된 SQL 파일을 사용하여 데이터베이스를 복원합니다.</p>
			</div>

			<div class="section-content">
				<div class="warning-box">
					<p><strong>⚠️ 주의사항:</strong></p>
					<ul>
						<li>복원 작업은 기존 데이터를 <strong>완전히 덮어씁니다</strong></li>
						<li>이 작업은 <strong>되돌릴 수 없습니다</strong></li>
						<li>복원 전에 반드시 현재 데이터를 백업하세요</li>
						<li>대용량 데이터베이스의 경우 시간이 오래 걸릴 수 있습니다</li>
					</ul>
				</div>

				<div class="file-input-wrapper">
					<label for="sql-file-input" class="file-label">
						📄 SQL 파일 선택
					</label>
					<input
						id="sql-file-input"
						type="file"
						accept=".sql"
						onchange={handleFileSelect}
						class="file-input"
					/>
					{#if selectedFile}
						<div class="file-info">
							<span class="file-name">✓ {selectedFile.name}</span>
							<span class="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
						</div>
					{/if}
				</div>

				<button
					class="btn btn-danger"
					onclick={handleRestore}
					disabled={isRestoring || !selectedFile}
				>
					{#if isRestoring}
						<span class="spinner-small"></span>
						복원 중...
					{:else}
						🔄 데이터베이스 복원 실행
					{/if}
				</button>

				<div class="info-box">
					<p class="note">
						<strong>복원 순서:</strong>
					</p>
					<ol style="margin: 8px 0; padding-left: 24px; color: #666; font-size: 0.9em;">
						<li>백업 파일의 STEP 1 (스키마 섹션)을 먼저 실행하여 테이블을 생성합니다.</li>
						<li>그 다음 STEP 2 (데이터 섹션)을 실행하여 데이터를 복원합니다.</li>
					</ol>
					<p class="note">
						<strong>참고:</strong> 보안상의 이유로 복잡한 DDL 문(테이블 생성, 인덱스 등)은 
						Supabase Dashboard의 SQL Editor에서 직접 실행해야 합니다.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.database-tab {
		background: white;
		border-radius: 8px;
		padding: 24px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.tab-header {
		margin-bottom: 32px;
		padding-bottom: 16px;
		border-bottom: 2px solid #e0e0e0;
	}

	.tab-header h2 {
		font-size: 1.8em;
		color: #333;
		margin-bottom: 8px;
	}

	.tab-header p {
		color: #666;
		font-size: 0.95em;
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.section {
		background: #f8f9fa;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 24px;
	}

	.section-header {
		margin-bottom: 16px;
	}

	.section-header h3 {
		font-size: 1.4em;
		color: #333;
		margin-bottom: 8px;
	}

	.section-header p {
		color: #666;
		font-size: 0.9em;
	}

	.section-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.info-box {
		background: white;
		border: 1px solid #d0d7de;
		border-radius: 6px;
		padding: 16px;
	}

	.info-box ul {
		margin: 8px 0;
		padding-left: 24px;
	}

	.info-box li {
		margin: 4px 0;
		color: #666;
		font-size: 0.9em;
	}

	.info-box code {
		background: #f6f8fa;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 0.85em;
		color: #d73a49;
	}

	.note {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #e0e0e0;
		color: #666;
		font-size: 0.85em;
	}

	.warning-box {
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 6px;
		padding: 16px;
	}

	.warning-box ul {
		margin: 8px 0;
		padding-left: 24px;
	}

	.warning-box li {
		margin: 4px 0;
		color: #856404;
		font-size: 0.9em;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 6px;
		font-size: 1em;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		justify-content: center;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #5568d3;
	}

	.btn-danger {
		background: #dc3545;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #c82333;
	}

	.file-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.file-label {
		font-weight: 500;
		color: #333;
		cursor: pointer;
	}

	.file-input {
		padding: 8px;
		border: 1px solid #d0d7de;
		border-radius: 6px;
		font-size: 0.9em;
		cursor: pointer;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: #e7f3ff;
		border: 1px solid #b3d9ff;
		border-radius: 6px;
		font-size: 0.9em;
	}

	.file-name {
		color: #0066cc;
		font-weight: 500;
	}

	.file-size {
		color: #666;
	}

	.alert {
		padding: 16px;
		border-radius: 6px;
		margin-bottom: 16px;
	}

	.alert-error {
		background: #fee;
		border: 1px solid #fcc;
		color: #c33;
	}

	.alert-success {
		background: #efe;
		border: 1px solid #cfc;
		color: #3c3;
	}

	.alert-info {
		background: #e7f3ff;
		border: 1px solid #b3d9ff;
		color: #0066cc;
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 1024px) {
		.database-tab {
			padding: 16px;
		}

		.section {
			padding: 16px;
		}

		.btn {
			width: 100%;
		}
	}
</style>
