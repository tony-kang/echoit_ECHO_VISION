<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-semibold text-gray-900 mb-4">게시판 스타일 가이드</h2>
		<p class="text-gray-600 mb-6">
			게시판(Board)의 스타일은 사용 목적과 콘텐츠의 성격에 따라 크게 5가지 정도로 구분할 수 있습니다. 
			각 스타일은 사용자 경험(UX)과 정보 전달 방식에 뚜렷한 차이가 있습니다.
		</p>
	</div>

	<!-- 1. 목록형 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">1️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">목록형 (List Style)</h3>
				<p class="text-sm text-gray-600 mb-3">
					가장 전통적이고 표준적인 형태입니다. 공지사항, 사내 게시판, 커뮤니티(커뮤니티 사이트 등)에서 주로 사용됩니다.
				</p>
			</div>
		</div>

		<div class="space-y-3">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">특징</h4>
				<p class="text-sm text-gray-600">제목, 작성자, 날짜, 조회수가 한 줄씩 정렬됨.</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">장점</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>좁은 공간에 많은 양의 텍스트 정보를 노출하기 좋음</li>
					<li>가독성이 높고 정보 검색이 빠름</li>
				</ul>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">적합한 곳</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>텍스트 위주의 정보 전달</li>
					<li>공지사항</li>
					<li>일반적인 Q&A</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- 2. 카드형 / 갤러리형 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">2️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">카드형 / 갤러리형 (Card / Gallery Style)</h3>
				<p class="text-sm text-gray-600 mb-3">
					카드형 게시판은 정보를 시각적으로 그룹화하여 보여주기 때문에, 콘텐츠의 성격에 따라 디자인 디테일이 크게 달라집니다. 크게 다음 4가지 소그룹으로 나눌 수 있습니다.
				</p>
			</div>
		</div>

		<!-- 카드형 소그룹 -->
		<div class="space-y-6 mt-6">
			<!-- 2-1. 이미지 강조형 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">1. 이미지 강조형 (Image-Heavy / Gallery)</h4>
				<p class="text-sm text-gray-700 mb-3">
					이미지가 콘텐츠의 핵심인 경우입니다. 텍스트 정보는 최소화하고 시각적 임팩트를 강조합니다.
				</p>
				<div class="space-y-2">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">레이아웃:</p>
						<p class="text-sm text-gray-600">카드 전체를 이미지가 차지하거나, 하단에 아주 짧은 제목만 배치.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">특징:</p>
						<p class="text-sm text-gray-600">이미지 비율을 일정하게 맞추거나(정사각형), 인스타그램처럼 자유로운 높이(Masonry)를 사용함.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">적합한 콘텐츠:</p>
						<p class="text-sm text-gray-600">포트폴리오, 인테리어 사진, 패션 화보, 음식 사진.</p>
					</div>
				</div>
			</div>

			<!-- 2-2. 뉴스/기사형 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">2. 뉴스/기사형 (Editorial / News)</h4>
				<p class="text-sm text-gray-700 mb-3">
					이미지와 함께 제목, 요약문이 조화를 이루는 형태입니다. 독자가 클릭 전 내용을 충분히 짐작할 수 있게 합니다.
				</p>
				<div class="space-y-2">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">레이아웃:</p>
						<p class="text-sm text-gray-600">상단 썸네일(16:9 비율), 중단 제목(Bold), 하단 본문 요약 및 카테고리/날짜 정보.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">특징:</p>
						<p class="text-sm text-gray-600">가독성을 위해 폰트 크기와 행간이 중요하며, 카드의 여백(Padding)이 넉넉함.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">적합한 콘텐츠:</p>
						<p class="text-sm text-gray-600">블로그 포스트, 신문 기사, 전문 칼럼, 기업 소식.</p>
					</div>
				</div>
			</div>

			<!-- 2-3. 상품/커머스형 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">3. 상품/커머스형 (Product / Commerce)</h4>
				<p class="text-sm text-gray-700 mb-3">
					구매 결정에 필요한 정보(가격, 리뷰, 할인율)를 카드 안에 밀도 있게 담습니다.
				</p>
				<div class="space-y-2">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">레이아웃:</p>
						<p class="text-sm text-gray-600">상품 사진, 브랜드명, 상품명, 가격(할인가), 별점(리뷰 수), 장바구니 버튼.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">특징:</p>
						<p class="text-sm text-gray-600">가격 정보가 눈에 띄게 강조되며, 찜하기(Heart) 같은 인터랙션 아이콘이 카드 위에 겹쳐짐.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">적합한 콘텐츠:</p>
						<p class="text-sm text-gray-600">쇼핑몰 상품 리스트, 부동산 매물 정보, 배달 음식 메뉴.</p>
					</div>
				</div>
			</div>

			<!-- 2-4. 프로필/인물형 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-5">
				<h4 class="text-lg font-semibold text-gray-900 mb-3">4. 프로필/인물형 (Profile / Identity)</h4>
				<p class="text-sm text-gray-700 mb-3">
					사람이나 특정 개체의 신원 정보를 보여주는 데 집중합니다.
				</p>
				<div class="space-y-2">
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">레이아웃:</p>
						<p class="text-sm text-gray-600">원형 썸네일(아바타), 이름, 직함, 주요 해시태그나 기술 스택.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">특징:</p>
						<p class="text-sm text-gray-600">인물을 강조하기 위해 배경색을 넣거나 이미지를 둥글게 처리하는 경우가 많음.</p>
					</div>
					<div>
						<p class="text-sm font-medium text-gray-800 mb-1">적합한 콘텐츠:</p>
						<p class="text-sm text-gray-600">팀원 소개, 강사 목록, SNS 친구 추천, 연락처 리스트.</p>
					</div>
				</div>
			</div>
		</div>

		<!-- 기획 팁 -->
		<div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
			<h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
				<span class="mr-2">💡</span>
				기획 팁
			</h4>
			<p class="text-sm text-gray-700 mb-3">
				사용 중이신 Svelte와 Tailwind CSS로 구현하신다면, 각 소그룹에 따라 다음과 같은 전략을 취해보세요.
			</p>
			<ul class="text-sm text-gray-700 space-y-2 list-disc list-inside">
				<li><strong>이미지 강조형:</strong> <code class="bg-white px-1 rounded">aspect-video</code>나 <code class="bg-white px-1 rounded">aspect-square</code> 클래스로 이미지 비율을 고정하세요.</li>
				<li><strong>뉴스형:</strong> 텍스트가 넘칠 경우를 대비해 <code class="bg-white px-1 rounded">line-clamp-2</code> (2줄만 보이기) 클래스를 사용해 카드 높이를 일정하게 유지하세요.</li>
				<li><strong>공통:</strong> 마우스를 올렸을 때 카드가 살짝 위로 올라가는 <code class="bg-white px-1 rounded">hover:-translate-y-1 transition-transform</code> 효과를 넣으면 훨씬 고급스러워 보입니다.</li>
			</ul>
		</div>
	</div>

	<!-- 3. 웹진형 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">3️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">웹진형 (Webzine Style)</h3>
				<p class="text-sm text-gray-600 mb-3">
					목록형과 카드형의 장점을 합친 형태입니다.
				</p>
			</div>
		</div>

		<div class="space-y-3">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">특징</h4>
				<p class="text-sm text-gray-600">왼쪽에 중간 크기의 썸네일 이미지가 있고, 오른쪽에 제목과 본문 요약문이 나열됨.</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">장점</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>이미지로 시선을 끌면서도, 본문 내용을 미리 읽게 하여 클릭 효율을 높임</li>
				</ul>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">적합한 곳</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>블로그 포스트 리스트</li>
					<li>뉴스 사이트</li>
					<li>전문 칼럼 게시판</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- 4. 타임라인형 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">4️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">타임라인형 (Timeline Style)</h3>
				<p class="text-sm text-gray-600 mb-3">
					시간 순서에 따라 수직으로 흐르는 형태입니다.
				</p>
			</div>
		</div>

		<div class="space-y-3">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">특징</h4>
				<p class="text-sm text-gray-600">좌측 혹은 중앙의 선을 중심으로 시간대별 사건이나 게시물이 나열됨.</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">장점</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>정보의 '흐름'과 '역사'를 파악하기 매우 용이함</li>
				</ul>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">적합한 곳</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>프로젝트 진행 상황 업데이트</li>
					<li>브랜드 히스토리</li>
					<li>개인 일기나 로그 기록</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- 5. 피드형 -->
	<div class="bg-white border border-gray-300 rounded-lg p-6 mb-6">
		<div class="flex items-start mb-4">
			<span class="text-3xl mr-4">5️⃣</span>
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">피드형 (Social Feed Style)</h3>
				<p class="text-sm text-gray-600 mb-3">
					클릭해서 상세 페이지로 들어가지 않고, 메인 페이지에서 바로 내용을 확인하고 댓글을 다는 형태입니다.
				</p>
			</div>
		</div>

		<div class="space-y-3">
			<div>
				<h4 class="font-medium text-gray-800 mb-2">특징</h4>
				<p class="text-sm text-gray-600">페이스북이나 스레드처럼 무한 스크롤 방식이 주로 적용됨.</p>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">장점</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>페이지 전환이 없어 사용자 체류 시간이 길어지고 상호작용이 빠름</li>
				</ul>
			</div>

			<div>
				<h4 class="font-medium text-gray-800 mb-2">적합한 곳</h4>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>실시간 커뮤니티</li>
					<li>소셜 미디어</li>
					<li>팀 내 메신저형 협업 도구</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- 선택 팁 -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
			<span class="mr-2">💡</span>
			선택 팁
		</h3>
		
		<div class="space-y-3">
			<div class="bg-white border border-blue-200 rounded p-4">
				<p class="text-sm font-medium text-gray-800 mb-2">정보 밀도가 중요하다면:</p>
				<p class="text-sm text-gray-700 font-semibold">→ 목록형</p>
			</div>

			<div class="bg-white border border-blue-200 rounded p-4">
				<p class="text-sm font-medium text-gray-800 mb-2">시각적 이미지가 중요하다면:</p>
				<p class="text-sm text-gray-700 font-semibold">→ 카드형</p>
			</div>

			<div class="bg-white border border-blue-200 rounded p-4">
				<p class="text-sm font-medium text-gray-800 mb-2">풍부한 설명이 중요하다면:</p>
				<p class="text-sm text-gray-700 font-semibold">→ 웹진형</p>
			</div>

			<div class="bg-white border border-blue-200 rounded p-4">
				<p class="text-sm font-medium text-gray-800 mb-2">소통의 속도가 중요하다면:</p>
				<p class="text-sm text-gray-700 font-semibold">→ 피드형</p>
			</div>
		</div>
	</div>
</div>

