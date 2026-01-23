-- ============================================================================
-- 환경설정 코드 테이블 (env_code)
-- ============================================================================
-- 목적: 경영지표 관리 시스템의 환경설정 코드 및 값을 관리하는 테이블
-- 특징:
--   - 계층 구조 지원 (parent_code를 통한 자기 참조)
--   - 코드 기반 키 관리 (최대 16자리)
--   - 표시 순서 및 값 관리
--   - RLS를 통한 보안 관리
-- ============================================================================

-- 기존 테이블 삭제 (데이터도 함께 삭제됨)
DROP TABLE IF EXISTS public.env_code CASCADE;

CREATE TABLE public.env_code (
    -- 코드 (Primary Key, 최대 16자리)
    -- 고유 식별자로 사용되며, 수정 불가
    code VARCHAR(16) PRIMARY KEY,
    
    -- 상위 코드 (종속성 관리, 자기 참조)
    -- NULL인 경우 최상위 항목, 값이 있으면 해당 코드의 자식 항목
    -- 외래키로 자기 자신을 참조하여 계층 구조 형성
    parent_code VARCHAR(16),
    
    -- 표시 순서
    -- 동일 부모 하위 항목들의 정렬 순서를 결정 (작은 값이 먼저 표시)
    "order" INTEGER NOT NULL DEFAULT 0,
    
    -- 값 (Number, 1~N)
    -- 환경설정의 실제 값으로 사용되며, 1 이상이어야 함
    value INTEGER NOT NULL CHECK (value >= 1),
    
    -- 제목
    -- 환경설정 코드의 설명 또는 이름
    title TEXT NOT NULL,
    
    -- 설명
    -- 환경설정 코드에 대한 추가 설명 또는 주석
    comment TEXT,
    
    -- 생성일시
    -- 레코드가 생성된 시간 (자동 설정)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수정일시
    -- 레코드가 마지막으로 수정된 시간 (트리거로 자동 갱신)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 외래키 제약조건: 자기 참조
    -- parent_code가 자신의 code를 참조하여 계층 구조 형성
    -- 부모가 삭제되면 자식의 parent_code는 NULL로 설정 (ON DELETE SET NULL)
    -- 부모의 code가 변경되면 자식의 parent_code도 자동 변경 (ON UPDATE CASCADE)
    CONSTRAINT fk_env_code_parent 
        FOREIGN KEY (parent_code) 
        REFERENCES public.env_code(code) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- 인덱스 생성
-- 표시 순서 인덱스: order 필드로 정렬된 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_env_code_order ON public.env_code("order");

-- 값 인덱스: value 필드로 필터링 및 정렬 성능 향상
CREATE INDEX IF NOT EXISTS idx_env_code_value ON public.env_code(value);

-- 상위 코드 인덱스: parent_code로 자식 항목 조회 성능 향상 및 외래키 참조 성능 최적화
CREATE INDEX IF NOT EXISTS idx_env_code_parent_code ON public.env_code(parent_code);

-- RLS (Row Level Security) 활성화
-- 행 수준 보안을 활성화하여 데이터 접근 제어
ALTER TABLE public.env_code ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 존재하는 경우를 대비)
DROP POLICY IF EXISTS "env_code_select_policy" ON public.env_code;
DROP POLICY IF EXISTS "env_code_insert_policy" ON public.env_code;
DROP POLICY IF EXISTS "env_code_update_policy" ON public.env_code;
DROP POLICY IF EXISTS "env_code_delete_policy" ON public.env_code;

-- RLS 정책: 모든 사용자가 조회 가능
-- 환경설정 코드는 공개 정보이므로 모든 사용자가 조회 가능
CREATE POLICY "env_code_select_policy" ON public.env_code
    FOR SELECT
    USING (true);

-- RLS 정책: 인증된 사용자만 삽입 가능
-- 환경설정 코드 생성은 인증된 사용자만 가능
CREATE POLICY "env_code_insert_policy" ON public.env_code
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 수정 가능
-- 환경설정 코드 수정은 인증된 사용자만 가능
CREATE POLICY "env_code_update_policy" ON public.env_code
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삭제 가능
-- 환경설정 코드 삭제는 인증된 사용자만 가능
CREATE POLICY "env_code_delete_policy" ON public.env_code
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- updated_at 자동 업데이트 트리거 함수
-- 레코드가 업데이트될 때 updated_at 필드를 현재 시간으로 자동 설정하는 함수
CREATE OR REPLACE FUNCTION update_env_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
-- 기존 트리거 삭제 (이미 존재하는 경우를 대비)
DROP TRIGGER IF EXISTS trigger_update_env_code_updated_at ON public.env_code;

-- env_code 테이블의 레코드가 업데이트되기 전에 updated_at 필드를 자동으로 갱신
CREATE TRIGGER trigger_update_env_code_updated_at
    BEFORE UPDATE ON public.env_code
    FOR EACH ROW
    EXECUTE FUNCTION update_env_code_updated_at();

-- ============================================================================
-- 테이블 및 컬럼 코멘트
-- ============================================================================

-- 테이블 코멘트
COMMENT ON TABLE public.env_code IS '환경설정 코드 및 값을 관리하는 테이블. 계층 구조를 지원하며 경영지표 관리 시스템의 환경설정을 저장합니다.';

-- 컬럼 코멘트
COMMENT ON COLUMN public.env_code.code IS '환경설정 코드 (Primary Key, 최대 16자리). 고유 식별자로 사용되며 수정 불가능합니다.';
COMMENT ON COLUMN public.env_code.parent_code IS '상위 코드 (종속성 관리, 자기 참조). NULL인 경우 최상위 항목이며, 값이 있으면 해당 코드의 자식 항목입니다.';
COMMENT ON COLUMN public.env_code."order" IS '표시 순서. 동일 부모 하위 항목들의 정렬 순서를 결정하며, 작은 값이 먼저 표시됩니다.';
COMMENT ON COLUMN public.env_code.value IS '값 (Number, 1~N). 환경설정의 실제 값으로 사용되며, 1 이상이어야 합니다.';
COMMENT ON COLUMN public.env_code.title IS '제목. 환경설정 코드의 설명 또는 이름입니다.';
COMMENT ON COLUMN public.env_code.comment IS '설명. 환경설정 코드에 대한 추가 설명 또는 주석입니다.';
COMMENT ON COLUMN public.env_code.created_at IS '생성일시. 레코드가 생성된 시간으로 자동 설정됩니다.';
COMMENT ON COLUMN public.env_code.updated_at IS '수정일시. 레코드가 마지막으로 수정된 시간으로 트리거에 의해 자동 갱신됩니다.';

-- 인덱스 코멘트
COMMENT ON INDEX idx_env_code_order IS '표시 순서 인덱스. order 필드로 정렬된 조회 성능을 향상시킵니다.';
COMMENT ON INDEX idx_env_code_value IS '값 인덱스. value 필드로 필터링 및 정렬 성능을 향상시킵니다.';
COMMENT ON INDEX idx_env_code_parent_code IS '상위 코드 인덱스. parent_code로 자식 항목 조회 성능을 향상시키고 외래키 참조 성능을 최적화합니다.';

-- 정책 코멘트
COMMENT ON POLICY env_code_select_policy ON public.env_code IS '모든 사용자가 환경설정 코드를 조회할 수 있는 정책';
COMMENT ON POLICY env_code_insert_policy ON public.env_code IS '인증된 사용자만 환경설정 코드를 생성할 수 있는 정책';
COMMENT ON POLICY env_code_update_policy ON public.env_code IS '인증된 사용자만 환경설정 코드를 수정할 수 있는 정책';
COMMENT ON POLICY env_code_delete_policy ON public.env_code IS '인증된 사용자만 환경설정 코드를 삭제할 수 있는 정책';

-- 함수 코멘트
COMMENT ON FUNCTION update_env_code_updated_at() IS 'env_code 테이블의 레코드가 업데이트될 때 updated_at 필드를 현재 시간으로 자동 설정하는 트리거 함수';

-- 트리거 코멘트
COMMENT ON TRIGGER trigger_update_env_code_updated_at ON public.env_code IS 'env_code 테이블의 레코드가 업데이트되기 전에 updated_at 필드를 자동으로 갱신하는 트리거';

-- ============================================================================
-- comment 컬럼 추가 (기존 테이블 호환성)
-- ============================================================================
-- 기존에 생성된 테이블에 comment 컬럼이 없는 경우를 대비하여 추가합니다.
-- CREATE TABLE에 이미 포함되어 있지만, 기존 테이블에는 없을 수 있습니다.
-- ============================================================================

-- comment 컬럼 추가 (이미 존재하는 경우 무시)
ALTER TABLE public.env_code ADD COLUMN IF NOT EXISTS comment TEXT;

-- comment 컬럼 코멘트 추가 (이미 코멘트가 있어도 에러 없이 실행됨)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'env_code' 
        AND column_name = 'comment'
    ) THEN
        COMMENT ON COLUMN public.env_code.comment IS '설명. 환경설정 코드에 대한 추가 설명 또는 주석입니다.';
    END IF;
END $$;

-- ============================================================================
-- 조직도 데이터 INSERT
-- ============================================================================
-- CSV 파일: 에코아이티_더존 조직도.xlsx - 조직도 데이터.csv
-- 생성일: 2026-01-24
-- 
-- 주의사항:
--   - 중복된 code가 발견된 경우 주석 처리되어 있습니다.
--   - value는 code에서 숫자 부분을 추출하여 생성되었습니다.
--   - order는 같은 parent_code를 가진 항목들의 순서입니다.
--   - comment 필드가 포함되어 있습니다.
-- ============================================================================

-- ============================================================================
-- 조직도 데이터 INSERT 시작
-- ============================================================================

-- 경고: 중복된 code가 발견되었습니다. 아래 항목들을 확인하세요:
--   라인 50: code='A00100', title='AX 수행사업부'

INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('101200', NULL, 1, 101200, 'CEO', '홍성호 의장');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('C00001', '101200', 1, 1, 'ECHOIT', '(주)에코아이티');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('C00002', '101200', 2, 2, 'SITC', '(주)에스아이시티');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('101400', 'C00001', 1, 101400, 'CBO', '이승한 부대표');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('101300', 'C00001', 2, 101300, 'COO', '최재섭 대표');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('101700', 'C00001', 3, 101700, 'CAIO', '한상기 박사');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('101800', 'C00001', 4, 101800, 'CFO', '황승희 전무');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('102000', 'C00001', 5, 102000, '영업고문', '(*)');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('109100', 'C00001', 6, 109100, 'COO', '최병영');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('151000', '101800', 1, 151000, '경영', '부문');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('151100', '151000', 1, 151100, '재무회계팀', '팀');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('151200', '151000', 2, 151200, '피플팀', '팀');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('159901', '151000', 3, 159901, 'C&P본부', '팀');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('201000', '101400', 1, 201000, 'SAP사업부문', '부문');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('209100', '201000', 1, 209100, 'SAP GTM실', '실');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('201100', '201000', 2, 201100, 'SAP 전략사업부', '사업부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('201101', '201100', 1, 201101, 'SAP 영업전략본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('201102', '201100', 2, 201102, 'SAP 사업전략본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('201191', '201100', 3, 201191, 'SAP ITO SI', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('201192', '201100', 4, 201192, 'SAP ITO SM', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('201193', '201100', 5, 201193, 'SAP 전략 SI', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202100', '201000', 3, 202100, 'SAP DS사업부', '사업부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202101', '202100', 1, 202101, 'SAP 개발1본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202102', '202100', 2, 202102, 'SAP 개발2본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202103', '202100', 3, 202103, 'SAP 개발3본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202104', '202100', 4, 202104, 'SAP 개발4본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202121', '202100', 5, 202121, 'SAP 운영1본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202122', '202100', 6, 202122, 'SAP 운영2본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('202191', '202100', 7, 202191, 'SAP DS ITO', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('203100', '201000', 4, 203100, 'SAP AT 사업부', '사업부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('203101', '203100', 1, 203101, 'AT사업본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('204100', '203100', 2, 204100, 'TCS 사업부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('204101', '203100', 3, 204101, 'TC본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('204102', '203100', 4, 204102, 'CS사업본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('204191', '203100', 5, 204191, 'TCS ITO', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('401000', '101300', 1, 401000, 'IT사업부문', '부문');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('401100', '401000', 1, 401100, 'IT 전략사업부', '사업부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('401101', '401100', 1, 401101, 'IT 전략사업본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('401191', '401100', 2, 401191, 'IT 전략 ITO', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('403100', '401000', 2, 403100, 'IT 혁신사업부', '사업부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('403101', '403100', 1, 403101, 'SA 사업본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('403102', '403100', 2, 403102, 'IT 혁신사업본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('403191', '403100', 3, 403191, 'SA사업 ITO', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('403904', '403100', 4, 403904, 'Sales 사업본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('403907', '403100', 5, 403907, 'AI 사업본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('403908', '403100', 6, 403908, 'SA 사업팀', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00000', '101300', 2, 1, 'AX 사업부문', '부문');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00100', 'A00000', 1, 100, 'AX 전략사업부', '부');
-- 중복 code 경고: INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00100', 'A00000', 2, 100, 'AX 수행사업부', '부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00101', 'A00100', 1, 101, '수행 1본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00102', 'A00100', 2, 102, '수행 2본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00103', 'A00100', 3, 103, '수행 3본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00104', 'A00100', 4, 104, '수행 4본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('A00001', 'A00100', 5, 1, 'Sales혁신본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('601000', '101700', 1, 601000, '한컴사업부문', '부문');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('601100', '601000', 1, 601100, '한컴전략사업부', '사업부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('601101', '601100', 1, 601101, '한컴컨설팅본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('601102', '601100', 2, 601102, '한컴영업전략본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('601103', '601100', 3, 601103, '한컴기술지원본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('601104', '601100', 4, 601104, '한컴사업지원본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('602100', '601000', 2, 602100, '한컴수행사업부', '사업부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('609901', '602100', 1, 609901, '한컴Growth TF', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('951100', '101700', 2, 951100, 'AI전략실', '실');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('951101', '101700', 3, 951101, 'AI기획팀(구.사업기획본부)', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('951102', '951100', 1, 951102, 'AI서비스팀', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('951901', '951100', 2, 951901, '경영기획본부', '본부');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('981100', 'C00002', 1, 981100, 'IT 혁신사업팀', '본부(*)');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('981103', 'C00002', 2, 981103, 'Mendix사업본부', '본부(*)');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('981104', 'C00002', 3, 981104, '대외사업ITO', '본부(*)');
INSERT INTO public.env_code (code, parent_code, "order", value, title, comment) VALUES ('991000', '101200', 3, 991000, '공통', '사업부(*)');
