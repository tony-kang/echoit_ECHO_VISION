-- ============================================================================
-- 매출 테이블 (ev_sales)
-- ============================================================================
-- 목적: 경영지표 관리 시스템의 매출 관련 데이터를 관리하는 테이블
-- 특징:
--   - 연도/월별 매출 데이터 관리
--   - 각 매출 항목별 금액 저장
--   - RLS를 통한 보안 관리
-- ============================================================================

-- 기존 테이블 삭제 (데이터도 함께 삭제됨, CASCADE로 제약조건도 함께 삭제됨)
DROP TABLE IF EXISTS public.ev_sales CASCADE;

CREATE TABLE public.ev_sales (
    -- 고유 ID (Primary Key)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 환경설정 코드 (env_code 참조)
    -- 매출 데이터가 속한 환경설정 코드
    code VARCHAR(16) NOT NULL,
    
    -- 연도
    -- 매출 데이터의 연도 (예: 2024)
    year INTEGER NOT NULL,
    
    -- 월
    -- 매출 데이터의 월 (1~12, NULL이면 연간 합계)
    month INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
    
    -- 목표 매출액
    -- 해당 기간의 목표 매출액
    target_sales_amount NUMERIC(15, 2) DEFAULT 0,
    
    -- 매출액
    -- 실제 매출액
    sales_amount NUMERIC(15, 2) DEFAULT 0,
    
    -- 매출 원가
    -- 매출에 대한 원가
    sales_cost NUMERIC(15, 2) DEFAULT 0,
    
    -- 매출 총손실
    -- 매출액에서 매출 원가를 뺀 값 (매출 총이익의 반대)
    sales_gross_loss NUMERIC(15, 2) DEFAULT 0,
    
    -- 판매 관리비
    -- 판매 및 관리에 소요된 비용
    selling_admin_expenses NUMERIC(15, 2) DEFAULT 0,
    
    -- 영업 손실
    -- 영업 활동에서 발생한 손실
    operating_loss NUMERIC(15, 2) DEFAULT 0,
    
    -- 영업외 수익
    -- 영업 외 활동에서 발생한 수익
    non_operating_income NUMERIC(15, 2) DEFAULT 0,
    
    -- 영업외 비용
    -- 영업 외 활동에서 발생한 비용
    non_operating_expenses NUMERIC(15, 2) DEFAULT 0,
    
    -- 법인세 비용 차감전 순손실
    -- 법인세를 차감하기 전의 순손실
    loss_before_tax NUMERIC(15, 2) DEFAULT 0,
    
    -- 법인세 비용
    -- 법인세로 납부한 비용
    corporate_tax_expenses NUMERIC(15, 2) DEFAULT 0,
    
    -- 당기 순손실
    -- 최종 순손실
    net_loss NUMERIC(15, 2) DEFAULT 0,
    
    -- 메모/비고
    -- 추가 설명 또는 비고 사항
    notes TEXT,
    
    -- 생성일시
    -- 레코드가 생성된 시간 (자동 설정)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수정일시
    -- 레코드가 마지막으로 수정된 시간 (트리거로 자동 갱신)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 환경설정 코드 외래키 제약조건
    CONSTRAINT fk_ev_sales_code 
        FOREIGN KEY (code) 
        REFERENCES public.env_code(code) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- 연도, 월, 코드의 고유성 제약 (동일 연도/월/코드에 중복 데이터 방지)
-- 제약조건 추가 (이미 존재하면 에러 무시)
DO $$
BEGIN
    -- 제약조건이 존재하면 삭제
    ALTER TABLE IF EXISTS public.ev_sales DROP CONSTRAINT IF EXISTS unique_year_month_code;
    
    -- 제약조건 추가 시도
    ALTER TABLE public.ev_sales ADD CONSTRAINT unique_year_month_code UNIQUE (year, month, code);
EXCEPTION
    WHEN duplicate_object THEN
        -- 이미 존재하는 경우 무시 (에러 코드 42710)
        NULL;
    WHEN SQLSTATE '42P07' THEN
        -- relation이 이미 존재하는 경우 무시 (에러 코드 42P07)
        NULL;
    WHEN OTHERS THEN
        -- 다른 에러는 다시 발생시킴
        RAISE;
END $$;

-- 인덱스 생성
-- 코드 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_ev_sales_code ON public.ev_sales(code);
-- 연도/월 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_ev_sales_year ON public.ev_sales(year);
CREATE INDEX IF NOT EXISTS idx_ev_sales_year_month ON public.ev_sales(year, month);
-- 코드별 연도/월 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_ev_sales_code_year_month ON public.ev_sales(code, year, month);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.ev_sales ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 존재하는 경우를 대비)
DROP POLICY IF EXISTS "ev_sales_select_policy" ON public.ev_sales;
DROP POLICY IF EXISTS "ev_sales_insert_policy" ON public.ev_sales;
DROP POLICY IF EXISTS "ev_sales_update_policy" ON public.ev_sales;
DROP POLICY IF EXISTS "ev_sales_delete_policy" ON public.ev_sales;

-- RLS 정책: 인증된 사용자만 조회 가능
CREATE POLICY "ev_sales_select_policy" ON public.ev_sales
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "ev_sales_insert_policy" ON public.ev_sales
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 수정 가능
CREATE POLICY "ev_sales_update_policy" ON public.ev_sales
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "ev_sales_delete_policy" ON public.ev_sales
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- updated_at 자동 갱신 트리거 함수 (이미 존재하는 경우를 대비)
CREATE OR REPLACE FUNCTION update_ev_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 존재하는 경우를 대비)
DROP TRIGGER IF EXISTS trigger_update_ev_sales_updated_at ON public.ev_sales;
CREATE TRIGGER trigger_update_ev_sales_updated_at
    BEFORE UPDATE ON public.ev_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_ev_sales_updated_at();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.ev_sales IS '매출 관련 데이터를 관리하는 테이블';
COMMENT ON COLUMN public.ev_sales.id IS '고유 ID';
COMMENT ON COLUMN public.ev_sales.code IS '환경설정 코드 (env_code.code 참조)';
COMMENT ON COLUMN public.ev_sales.year IS '연도';
COMMENT ON COLUMN public.ev_sales.month IS '월 (1~12, NULL이면 연간 합계)';
COMMENT ON COLUMN public.ev_sales.target_sales_amount IS '목표 매출액';
COMMENT ON COLUMN public.ev_sales.sales_amount IS '매출액';
COMMENT ON COLUMN public.ev_sales.sales_cost IS '매출 원가';
COMMENT ON COLUMN public.ev_sales.sales_gross_loss IS '매출 총손실';
COMMENT ON COLUMN public.ev_sales.selling_admin_expenses IS '판매 관리비';
COMMENT ON COLUMN public.ev_sales.operating_loss IS '영업 손실';
COMMENT ON COLUMN public.ev_sales.non_operating_income IS '영업외 수익';
COMMENT ON COLUMN public.ev_sales.non_operating_expenses IS '영업외 비용';
COMMENT ON COLUMN public.ev_sales.loss_before_tax IS '법인세 비용 차감전 순손실';
COMMENT ON COLUMN public.ev_sales.corporate_tax_expenses IS '법인세 비용';
COMMENT ON COLUMN public.ev_sales.net_loss IS '당기 순손실';
COMMENT ON COLUMN public.ev_sales.notes IS '메모/비고';
COMMENT ON COLUMN public.ev_sales.created_at IS '생성일시';
COMMENT ON COLUMN public.ev_sales.updated_at IS '수정일시';
