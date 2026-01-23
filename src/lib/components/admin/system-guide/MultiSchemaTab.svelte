<script>
	/**
	 * 클립보드에 텍스트 복사
	 * @param {string} text - 복사할 텍스트
	 */
	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			alert('클립보드에 복사되었습니다.');
		});
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold text-gray-900 mb-4">Supabase 멀티 스키마 운영 및 관리</h2>
		<p class="text-gray-600 mb-6">
			기본적으로 Supabase API(PostgREST)는 `public` 스키마만 외부로 노출합니다. 하지만 대규모 프로젝트나 여러 마이크로서비스를 운영할 경우, 스키마를 분리하면 데이터 구조가 섞이지 않고 보안 관리가 용이해집니다.
		</p>
	</div>

	<!-- 1. 개요 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">1️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">멀티 스키마를 사용하는 이유</h3>
			</div>
		</div>

		<div class="space-y-3">
			<ul class="text-sm text-gray-700 space-y-2 list-disc list-inside">
				<li><strong>논리적 데이터 분리:</strong> 서비스별로 데이터를 명확하게 구분</li>
				<li><strong>보안 강화:</strong> 스키마별 권한 관리로 접근 제어 용이</li>
				<li><strong>비용 절감:</strong> 여러 프로젝트를 만들지 않고도 무료 티어 범위 내에서 논리적으로 데이터를 완벽히 격리</li>
				<li><strong>관리 효율:</strong> 하나의 연결(Connection) 정보로 여러 서비스의 데이터를 관리</li>
			</ul>
		</div>
	</div>

	<!-- 2. 스키마 생성 및 권한 설정 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">2️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">신규 스키마 생성 및 권한 설정</h3>
				<p class="text-sm text-gray-600 mb-3">
					Supabase SQL Editor에서 아래 명령어를 실행하여 새로운 서비스 전용 영역을 생성합니다.
				</p>
			</div>
		</div>

		<div class="space-y-4">
			<!-- 2.1 스키마 생성 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">2.1 스키마 생성</h4>
				<div class="bg-gray-900 rounded-lg p-4 mb-3">
					<code class="text-sm text-green-400">
						-- 1. 신규 스키마 생성 (예: 서비스 A 전용)<br/>
						CREATE SCHEMA service_a;
					</code>
				</div>
				<button
					onclick={() => copyToClipboard('CREATE SCHEMA service_a;')}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					📋 복사
				</button>
			</div>

			<!-- 2.2 테이블 생성 예시 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">2.2 테이블 생성 예시</h4>
				<div class="bg-gray-900 rounded-lg p-4 mb-3">
					<code class="text-sm text-green-400">
						-- 2. 새 스키마에 테이블 생성 예시<br/>
						CREATE TABLE service_a.users (<br/>
						&nbsp;&nbsp;id uuid PRIMARY KEY DEFAULT gen_random_uuid(),<br/>
						&nbsp;&nbsp;username text NOT NULL,<br/>
						&nbsp;&nbsp;created_at timestamptz DEFAULT now()<br/>
						);
					</code>
				</div>
				<button
					onclick={() => copyToClipboard(`CREATE TABLE service_a.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);`)}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					📋 복사
				</button>
			</div>

			<!-- 2.3 권한 부여 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">2.3 권한 부여</h4>
				<div class="bg-gray-900 rounded-lg p-4 mb-3">
					<code class="text-sm text-green-400">
						-- 3. API 역할을 하는 anon 및 authenticated 역할에 스키마 접근 권한 부여<br/>
						GRANT USAGE ON SCHEMA service_a TO anon, authenticated;<br/><br/>
						-- 4. 해당 스키마 내의 모든 테이블에 대한 기본 권한 부여 (필요에 따라 조정)<br/>
						GRANT ALL ON ALL TABLES IN SCHEMA service_a TO anon, authenticated;<br/>
						GRANT ALL ON ALL SEQUENCES IN SCHEMA service_a TO anon, authenticated;<br/>
						GRANT ALL ON ALL FUNCTIONS IN SCHEMA service_a TO anon, authenticated;
					</code>
				</div>
				<button
					onclick={() => copyToClipboard(`GRANT USAGE ON SCHEMA service_a TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA service_a TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA service_a TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA service_a TO anon, authenticated;`)}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					📋 복사
				</button>
				<div class="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
					<p class="text-sm text-yellow-800">
						⚠️ <strong>주의:</strong> 권한 설정은 보안에 매우 중요합니다. 프로덕션 환경에서는 필요한 최소 권한만 부여하세요.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- 3. Dashboard 설정 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">3️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Supabase Dashboard 설정 (필수)</h3>
				<p class="text-sm text-gray-600 mb-3">
					SQL로 스키마만 만든다고 API로 바로 접근할 수 있는 것은 아닙니다. 대시보드에서 API 노출 설정을 직접 변경해야 합니다.
				</p>
			</div>
		</div>

		<div class="space-y-3">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">설정 단계</h4>
				<ol class="text-sm text-gray-700 space-y-2 list-decimal list-inside">
					<li>Supabase Dashboard에 로그인합니다.</li>
					<li><strong>[Settings]</strong> → <strong>[API]</strong> 메뉴로 이동합니다.</li>
					<li><strong>"Exposed schemas"</strong> 항목을 찾습니다.</li>
					<li>기본값인 <code class="bg-gray-100 px-1 rounded">public</code> 옆에 새로 만든 스키마 이름(예: <code class="bg-gray-100 px-1 rounded">service_a</code>)을 추가합니다.</li>
					<li><strong>Save</strong>를 눌러 저장합니다.</li>
				</ol>
			</div>
			<div class="bg-blue-50 border border-blue-200 rounded p-3">
				<p class="text-sm text-blue-800">
					✅ 이제 이 스키마는 외부 클라이언트 SDK에서 접근 가능한 상태가 됩니다.
				</p>
			</div>
		</div>
	</div>

	<!-- 4. 클라이언트 SDK 사용법 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">4️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">클라이언트 SDK(JavaScript/TypeScript) 사용법</h3>
			</div>
		</div>

		<div class="space-y-4">
			<!-- 4.1 스키마 지정 클라이언트 생성 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">4.1 스키마 지정 클라이언트 생성</h4>
				<div class="bg-gray-900 rounded-lg p-4 mb-3">
					<code class="text-sm text-green-400">
						import {'{'} createClient {'}'} from '@supabase/supabase-js'<br/><br/>
						const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {'{'}<br/>
						&nbsp;&nbsp;db: {'{'} schema: 'service_a' {'}'} // 접속할 스키마를 명시적으로 지정<br/>
						{'}'})<br/><br/>
						// 이제 모든 호출은 service_a 스키마를 대상으로 동작합니다.<br/>
						const {'{'} data, error {'}'} = await supabase<br/>
						&nbsp;&nbsp;.from('users')<br/>
						&nbsp;&nbsp;.select('*')
					</code>
				</div>
				<button
					onclick={() => copyToClipboard(`import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'service_a' } // 접속할 스키마를 명시적으로 지정
})

// 이제 모든 호출은 service_a 스키마를 대상으로 동작합니다.
const { data, error } = await supabase
  .from('users')
  .select('*')`)}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					📋 복사
				</button>
			</div>

			<!-- 4.2 여러 스키마 동시 사용 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">4.2 여러 스키마 동시 사용</h4>
				<div class="bg-gray-900 rounded-lg p-4 mb-3">
					<code class="text-sm text-green-400">
						// public 스키마용 클라이언트<br/>
						const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {'{'}<br/>
						&nbsp;&nbsp;db: {'{'} schema: 'public' {'}'}<br/>
						{'}'})<br/><br/>
						// service_a 스키마용 클라이언트<br/>
						const serviceAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {'{'}<br/>
						&nbsp;&nbsp;db: {'{'} schema: 'service_a' {'}'}<br/>
						{'}'})<br/><br/>
						// 각각의 클라이언트로 해당 스키마의 데이터에 접근<br/>
						const {'{'} data: publicData {'}'} = await publicClient.from('posts').select('*')<br/>
						const {'{'} data: serviceAData {'}'} = await serviceAClient.from('users').select('*')
					</code>
				</div>
				<button
					onclick={() => copyToClipboard(`// public 스키마용 클라이언트
const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' }
})

// service_a 스키마용 클라이언트
const serviceAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'service_a' }
})

// 각각의 클라이언트로 해당 스키마의 데이터에 접근
const { data: publicData } = await publicClient.from('posts').select('*')
const { data: serviceAData } = await serviceAClient.from('users').select('*')`)}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					📋 복사
				</button>
			</div>
		</div>
	</div>

	<!-- 5. 운영 시 고려사항 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">5️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">운영 시 고려사항</h3>
			</div>
		</div>

		<div class="space-y-4">
			<!-- 장점 -->
			<div class="bg-green-50 border border-green-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">✅ 장점</h4>
				<ul class="text-sm text-gray-700 space-y-2 list-disc list-inside">
					<li><strong>비용 절감:</strong> 여러 프로젝트를 만들지 않고도 무료 티어 범위 내에서 논리적으로 데이터를 완벽히 격리할 수 있습니다.</li>
					<li><strong>관리 효율:</strong> 하나의 연결(Connection) 정보로 여러 서비스의 데이터를 관리할 수 있습니다.</li>
					<li><strong>보안:</strong> 서비스 A의 API 키가 유출되더라도, 스키마 권한 설정을 통해 다른 스키마(service_b) 접근을 차단할 수 있습니다.</li>
					<li><strong>확장성:</strong> 새로운 서비스를 추가할 때 새로운 프로젝트를 만들 필요 없이 스키마만 추가하면 됩니다.</li>
				</ul>
			</div>

			<!-- 단점 및 주의사항 -->
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">⚠️ 단점 및 주의사항</h4>
				<ul class="text-sm text-gray-700 space-y-2 list-disc list-inside">
					<li><strong>공유 리소스:</strong> CPU, RAM, 저장 용량을 모든 스키마가 공유하므로, 한 서비스의 트래픽이 폭주하면 전체 서비스가 느려질 수 있습니다.</li>
					<li><strong>백업 단위:</strong> 데이터베이스 전체 단위로 백업되므로, 특정 스키마만 따로 복구하기가 까다롭습니다.</li>
					<li><strong>RLS 설정:</strong> 각 스키마 내의 테이블마다 Row Level Security(RLS) 정책을 각각 다시 설정해주어야 합니다.</li>
					<li><strong>마이그레이션 복잡도:</strong> 스키마 간 데이터 이동이나 조인 쿼리가 복잡해질 수 있습니다.</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- 6. 실제 사용 예시 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">6️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">실제 사용 예시</h3>
			</div>
		</div>

		<div class="space-y-4">
			<!-- 6.1 스키마별 서비스 분리 예시 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">6.1 스키마별 서비스 분리 예시</h4>
				<div class="bg-gray-900 rounded-lg p-4 mb-3">
					<code class="text-sm text-green-400">
						// 서비스별 클라이언트 생성<br/>
						const ecommerceClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {'{'}<br/>
						&nbsp;&nbsp;db: {'{'} schema: 'ecommerce' {'}'}<br/>
						{'}'})<br/><br/>
						const analyticsClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {'{'}<br/>
						&nbsp;&nbsp;db: {'{'} schema: 'analytics' {'}'}<br/>
						{'}'})<br/><br/>
						const cmsClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {'{'}<br/>
						&nbsp;&nbsp;db: {'{'} schema: 'cms' {'}'}<br/>
						{'}'})<br/><br/>
						// 각 서비스별로 독립적으로 데이터 관리<br/>
						const {'{'} data: products {'}'} = await ecommerceClient.from('products').select('*')<br/>
						const {'{'} data: events {'}'} = await analyticsClient.from('events').select('*')<br/>
						const {'{'} data: articles {'}'} = await cmsClient.from('articles').select('*')
					</code>
				</div>
				<button
					onclick={() => copyToClipboard(`// 서비스별 클라이언트 생성
const ecommerceClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'ecommerce' }
})

const analyticsClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'analytics' }
})

const cmsClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'cms' }
})

// 각 서비스별로 독립적으로 데이터 관리
const { data: products } = await ecommerceClient.from('products').select('*')
const { data: events } = await analyticsClient.from('events').select('*')
const { data: articles } = await cmsClient.from('articles').select('*')`)}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					📋 복사
				</button>
			</div>

			<!-- 6.2 RLS 정책 설정 예시 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">6.2 RLS 정책 설정 예시</h4>
				<div class="bg-gray-900 rounded-lg p-4 mb-3">
					<code class="text-sm text-green-400">
						-- service_a 스키마의 users 테이블에 RLS 활성화<br/>
						ALTER TABLE service_a.users ENABLE ROW LEVEL SECURITY;<br/><br/>
						-- 인증된 사용자만 조회 가능<br/>
						CREATE POLICY "Users are viewable by authenticated users"<br/>
						ON service_a.users FOR SELECT<br/>
						TO authenticated<br/>
						USING (true);<br/><br/>
						-- 사용자는 자신의 데이터만 수정 가능<br/>
						CREATE POLICY "Users can update own data"<br/>
						ON service_a.users FOR UPDATE<br/>
						TO authenticated<br/>
						USING (auth.uid() = id);
					</code>
				</div>
				<button
					onclick={() => copyToClipboard(`ALTER TABLE service_a.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by authenticated users"
ON service_a.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own data"
ON service_a.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);`)}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					📋 복사
				</button>
			</div>
		</div>
	</div>

	<!-- 7. 요약 -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">📋</span>
			요약
		</h3>
		
		<div class="space-y-3">
			<p class="text-sm text-gray-700 mb-4">
				멀티 스키마 운영을 위한 핵심 단계:
			</p>
			<ol class="text-sm text-gray-700 space-y-2 list-decimal list-inside">
				<li><strong>SQL Editor:</strong> <code class="bg-white px-1 rounded">CREATE SCHEMA</code> 실행 및 권한 부여</li>
				<li><strong>Dashboard Settings:</strong> Exposed schemas에 해당 스키마 등록</li>
				<li><strong>Client Code:</strong> <code class="bg-white px-1 rounded">createClient</code> 호출 시 <code class="bg-white px-1 rounded">db: {'{'} schema: '...' {'}'}</code> 옵션 추가</li>
				<li><strong>RLS 정책:</strong> 각 스키마의 테이블마다 RLS 정책 설정</li>
			</ol>
			<div class="mt-4 bg-white border border-blue-200 rounded p-4">
				<p class="text-sm text-gray-700">
					이 방식을 활용하면 Supabase 무료 프로젝트 하나를 마치 여러 개의 데이터베이스처럼 효율적으로 사용할 수 있습니다.
				</p>
			</div>
		</div>
	</div>

	<!-- 참고 자료 -->
	<div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">📚 참고 자료</h3>
		<ul class="text-sm text-gray-700 space-y-2">
			<li>
				<a href="https://supabase.com/docs/guides/database/tables#schemas" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">
					Supabase 공식 문서 - Schema 관리
				</a>
			</li>
			<li>
				<a href="https://www.postgresql.org/docs/current/ddl-schemas.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">
					PostgreSQL Schema 문서
				</a>
			</li>
			<li>
				<a href="https://postgrest.org/en/stable/schema_cache.html" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">
					PostgREST Schema 문서
				</a>
			</li>
		</ul>
	</div>
</div>

