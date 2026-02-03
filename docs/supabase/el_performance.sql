-- ============================================================================
-- 경영실적 테이블 (el_performance)
-- ============================================================================
-- 목적: 경영실적 관리 시스템의 계획/예상/실제 매출 및 비용 데이터를 관리하는 테이블
-- 특징:
--   - 연도/월별 경영실적 데이터 관리
--   - 조직별 계획/예상/실제 매출 및 비용 저장
--   - RLS를 통한 보안 관리
-- ============================================================================

-- 기존 테이블 삭제 (데이터도 함께 삭제됨, CASCADE로 제약조건도 함께 삭제됨)
DROP TABLE IF EXISTS public.el_performance CASCADE;

CREATE TABLE public.el_performance (
    -- 고유 ID (Primary Key)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 연도
    -- 경영실적 데이터의 연도 (예: 2024)
    year INTEGER NOT NULL,
    
    -- 월
    -- 경영실적 데이터의 월 (1~12)
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- 조직 ID
    -- 조직 별칭 ID (예: 'sap', 'erp')
    org_alias_id VARCHAR(50) NOT NULL,
    
    -- 계획 매출 (planned_revenue)
    -- 해당 기간의 계획된 매출액
    p_revenue NUMERIC(15, 2) DEFAULT 0,
    
    -- 예상 매출 (forecast_revenue)
    -- 해당 기간의 예상 매출액
    f_revenue NUMERIC(15, 2) DEFAULT 0,
    
    -- 실제 매출 (actual_revenue)
    -- 해당 기간의 실제 매출액
    a_revenue NUMERIC(15, 2) DEFAULT 0,
    
    -- 계획 비용 (planned_expenses)
    -- 해당 기간의 계획된 비용
    p_expenses NUMERIC(15, 2) DEFAULT 0,
    
    -- 예상 비용 (forecast_expenses)
    -- 해당 기간의 예상 비용
    f_expenses NUMERIC(15, 2) DEFAULT 0,
    
    -- 실제 비용 (actual_expenses)
    -- 해당 기간의 실제 비용
    a_expenses NUMERIC(15, 2) DEFAULT 0,
    
    -- 메모/비고
    -- 추가 설명 또는 비고 사항
    notes TEXT,
    
    -- 생성일시
    -- 레코드가 생성된 시간 (자동 설정)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수정일시
    -- 레코드가 마지막으로 수정된 시간 (트리거로 자동 갱신)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 연도, 월, 조직 ID의 고유성 제약 (동일 연도/월/조직에 중복 데이터 방지)
DO $$
BEGIN
    -- 제약조건이 존재하면 삭제
    ALTER TABLE IF EXISTS public.el_performance DROP CONSTRAINT IF EXISTS unique_year_month_org_alias;
    
    -- 제약조건 추가 시도
    ALTER TABLE public.el_performance ADD CONSTRAINT unique_year_month_org_alias UNIQUE (year, month, org_alias_id);
EXCEPTION
    WHEN duplicate_object THEN
        -- 이미 존재하는 경우 무시
        NULL;
    WHEN SQLSTATE '42P07' THEN
        -- relation이 이미 존재하는 경우 무시
        NULL;
    WHEN OTHERS THEN
        -- 다른 에러는 다시 발생시킴
        RAISE;
END $$;

-- 인덱스 생성
-- 연도 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_el_performance_year ON public.el_performance(year);
-- 월 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_el_performance_month ON public.el_performance(month);
-- 연도/월 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_el_performance_year_month ON public.el_performance(year, month);
-- 조직 ID 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_el_performance_org_alias_id ON public.el_performance(org_alias_id);
-- 조직별 연도/월 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_el_performance_org_year_month ON public.el_performance(org_alias_id, year, month);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.el_performance ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 존재하는 경우를 대비)
DROP POLICY IF EXISTS "el_performance_select_policy" ON public.el_performance;
DROP POLICY IF EXISTS "el_performance_insert_policy" ON public.el_performance;
DROP POLICY IF EXISTS "el_performance_update_policy" ON public.el_performance;
DROP POLICY IF EXISTS "el_performance_delete_policy" ON public.el_performance;

-- RLS 정책: 인증된 사용자만 조회 가능
CREATE POLICY "el_performance_select_policy" ON public.el_performance
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "el_performance_insert_policy" ON public.el_performance
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 수정 가능
CREATE POLICY "el_performance_update_policy" ON public.el_performance
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "el_performance_delete_policy" ON public.el_performance
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_el_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_el_performance_updated_at ON public.el_performance;
CREATE TRIGGER trigger_update_el_performance_updated_at
    BEFORE UPDATE ON public.el_performance
    FOR EACH ROW
    EXECUTE FUNCTION update_el_performance_updated_at();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.el_performance IS '경영실적 관련 데이터를 관리하는 테이블 (계획/예상/실제 매출 및 비용)';
COMMENT ON COLUMN public.el_performance.id IS '고유 ID';
COMMENT ON COLUMN public.el_performance.year IS '연도';
COMMENT ON COLUMN public.el_performance.month IS '월 (1~12)';
COMMENT ON COLUMN public.el_performance.org_alias_id IS '조직 별칭 ID';
COMMENT ON COLUMN public.el_performance.p_revenue IS '계획 매출 (planned_revenue)';
COMMENT ON COLUMN public.el_performance.f_revenue IS '예상 매출 (forecast_revenue)';
COMMENT ON COLUMN public.el_performance.a_revenue IS '실제 매출 (actual_revenue)';
COMMENT ON COLUMN public.el_performance.p_expenses IS '계획 비용 (planned_expenses)';
COMMENT ON COLUMN public.el_performance.f_expenses IS '예상 비용 (forecast_expenses)';
COMMENT ON COLUMN public.el_performance.a_expenses IS '실제 비용 (actual_expenses)';
COMMENT ON COLUMN public.el_performance.notes IS '메모/비고';
COMMENT ON COLUMN public.el_performance.created_at IS '생성일시';
COMMENT ON COLUMN public.el_performance.updated_at IS '수정일시';
