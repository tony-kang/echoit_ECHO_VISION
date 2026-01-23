-- ============================================================================
-- 원가 테이블 (ev_cost)
-- ============================================================================
-- 목적: 경영지표 관리 시스템의 원가 관련 데이터를 관리하는 테이블
-- 특징:
--   - 연도/월별 원가 데이터 관리
--   - 각 원가 항목별 금액 저장
--   - RLS를 통한 보안 관리
-- ============================================================================

-- 기존 테이블 삭제 (데이터도 함께 삭제됨, CASCADE로 제약조건도 함께 삭제됨)
DROP TABLE IF EXISTS public.ev_cost CASCADE;

CREATE TABLE public.ev_cost (
    -- 고유 ID (Primary Key)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 환경설정 코드 (env_code 참조)
    -- 원가 데이터가 속한 환경설정 코드
    code VARCHAR(16) NOT NULL,
    
    -- 연도
    -- 원가 데이터의 연도 (예: 2024)
    year INTEGER NOT NULL,
    
    -- 월
    -- 원가 데이터의 월 (1~12, NULL이면 연간 합계)
    month INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
    
    -- 목표 원가
    -- 해당 기간의 목표 원가
    target_cost NUMERIC(15, 2) DEFAULT 0,
    
    -- 원재료비
    -- 원재료 구매에 소요된 비용
    material_cost NUMERIC(15, 2) DEFAULT 0,
    
    -- 노무비
    -- 인건비 및 노동력에 소요된 비용
    labor_cost NUMERIC(15, 2) DEFAULT 0,
    
    -- 외주비
    -- 외주 업체에 지급한 비용
    subcontract_cost NUMERIC(15, 2) DEFAULT 0,
    
    -- 경비
    -- 기타 경비
    expenses NUMERIC(15, 2) DEFAULT 0,
    
    -- 당기 총공사 비용
    -- 당기에 발생한 총 공사 비용
    total_construction_cost NUMERIC(15, 2) DEFAULT 0,
    
    -- 공사손실 충당금 전입
    -- 공사 손실에 대비하여 충당금으로 전입한 금액
    construction_loss_provision_transfer NUMERIC(15, 2) DEFAULT 0,
    
    -- 공사손실 충당금 환입
    -- 공사 손실 충당금에서 환입한 금액
    construction_loss_provision_reversal NUMERIC(15, 2) DEFAULT 0,
    
    -- 기초 미완성 공사액
    -- 기초 시점의 미완성 공사 금액
    opening_unfinished_construction NUMERIC(15, 2) DEFAULT 0,
    
    -- 타계정에서 대체액
    -- 다른 계정에서 대체된 금액
    transfer_from_other_accounts NUMERIC(15, 2) DEFAULT 0,
    
    -- 합계
    -- 위 항목들의 합계
    total_amount NUMERIC(15, 2) DEFAULT 0,
    
    -- 기말 미완성 공사액
    -- 기말 시점의 미완성 공사 금액
    closing_unfinished_construction NUMERIC(15, 2) DEFAULT 0,
    
    -- 타계정으로 대체액
    -- 다른 계정으로 대체된 금액
    transfer_to_other_accounts NUMERIC(15, 2) DEFAULT 0,
    
    -- 당기 공사 원가
    -- 당기에 실제 발생한 공사 원가
    current_period_construction_cost NUMERIC(15, 2) DEFAULT 0,
    
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
    CONSTRAINT fk_ev_cost_code 
        FOREIGN KEY (code) 
        REFERENCES public.env_code(code) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- 연도, 월, 코드의 고유성 제약 (동일 연도/월/코드에 중복 데이터 방지)
-- 제약조건 추가 (이미 존재하면 에러 무시)
DO $$
BEGIN
    -- 제약조건이 존재하면 삭제 (에러 무시)
    BEGIN
        ALTER TABLE public.ev_cost DROP CONSTRAINT IF EXISTS unique_year_month_code;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- 제약조건 추가 시도
    BEGIN
        ALTER TABLE public.ev_cost ADD CONSTRAINT unique_year_month_code UNIQUE (year, month, code);
    EXCEPTION
        WHEN duplicate_object THEN
            -- 이미 존재하는 경우 무시
            NULL;
        WHEN OTHERS THEN
            -- 다른 에러는 다시 발생시킴
            RAISE;
    END;
END $$;

-- 인덱스 생성
-- 코드 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_ev_cost_code ON public.ev_cost(code);
-- 연도/월 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_ev_cost_year ON public.ev_cost(year);
CREATE INDEX IF NOT EXISTS idx_ev_cost_year_month ON public.ev_cost(year, month);
-- 코드별 연도/월 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_ev_cost_code_year_month ON public.ev_cost(code, year, month);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.ev_cost ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 존재하는 경우를 대비)
DROP POLICY IF EXISTS "ev_cost_select_policy" ON public.ev_cost;
DROP POLICY IF EXISTS "ev_cost_insert_policy" ON public.ev_cost;
DROP POLICY IF EXISTS "ev_cost_update_policy" ON public.ev_cost;
DROP POLICY IF EXISTS "ev_cost_delete_policy" ON public.ev_cost;

-- RLS 정책: 인증된 사용자만 조회 가능
CREATE POLICY "ev_cost_select_policy" ON public.ev_cost
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "ev_cost_insert_policy" ON public.ev_cost
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 수정 가능
CREATE POLICY "ev_cost_update_policy" ON public.ev_cost
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "ev_cost_delete_policy" ON public.ev_cost
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- updated_at 자동 갱신 트리거 함수 (이미 존재하는 경우를 대비)
CREATE OR REPLACE FUNCTION update_ev_cost_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 존재하는 경우를 대비)
DROP TRIGGER IF EXISTS trigger_update_ev_cost_updated_at ON public.ev_cost;
CREATE TRIGGER trigger_update_ev_cost_updated_at
    BEFORE UPDATE ON public.ev_cost
    FOR EACH ROW
    EXECUTE FUNCTION update_ev_cost_updated_at();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.ev_cost IS '원가 관련 데이터를 관리하는 테이블';
COMMENT ON COLUMN public.ev_cost.id IS '고유 ID';
COMMENT ON COLUMN public.ev_cost.code IS '환경설정 코드 (env_code.code 참조)';
COMMENT ON COLUMN public.ev_cost.year IS '연도';
COMMENT ON COLUMN public.ev_cost.month IS '월 (1~12, NULL이면 연간 합계)';
COMMENT ON COLUMN public.ev_cost.target_cost IS '목표 원가';
COMMENT ON COLUMN public.ev_cost.material_cost IS '원재료비';
COMMENT ON COLUMN public.ev_cost.labor_cost IS '노무비';
COMMENT ON COLUMN public.ev_cost.subcontract_cost IS '외주비';
COMMENT ON COLUMN public.ev_cost.expenses IS '경비';
COMMENT ON COLUMN public.ev_cost.total_construction_cost IS '당기 총공사 비용';
COMMENT ON COLUMN public.ev_cost.construction_loss_provision_transfer IS '공사손실 충당금 전입';
COMMENT ON COLUMN public.ev_cost.construction_loss_provision_reversal IS '공사손실 충당금 환입';
COMMENT ON COLUMN public.ev_cost.opening_unfinished_construction IS '기초 미완성 공사액';
COMMENT ON COLUMN public.ev_cost.transfer_from_other_accounts IS '타계정에서 대체액';
COMMENT ON COLUMN public.ev_cost.total_amount IS '합계';
COMMENT ON COLUMN public.ev_cost.closing_unfinished_construction IS '기말 미완성 공사액';
COMMENT ON COLUMN public.ev_cost.transfer_to_other_accounts IS '타계정으로 대체액';
COMMENT ON COLUMN public.ev_cost.current_period_construction_cost IS '당기 공사 원가';
COMMENT ON COLUMN public.ev_cost.notes IS '메모/비고';
COMMENT ON COLUMN public.ev_cost.created_at IS '생성일시';
COMMENT ON COLUMN public.ev_cost.updated_at IS '수정일시';
