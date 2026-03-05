-- ============================================================================
-- 가결산 실적 테이블 (ev_provisional_sales)
-- ============================================================================
-- 목적: 회사코드 + 부서(ev_department.id) + 년도 + 월 별 가결산 항목 입력/수정
-- 항목: 매출액, 매출원가, 매출총손실, 판매관리비, 영업손실, 영업외 수익, 영업외 비용,
--       법인세비용 차감전 순손실, 법인세 비용, 당기 순 손실,
--       매출 총 이익, 영업 이익, 법인세비용 차감전 순이익, 당기 순 이익
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ev_provisional_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES public.ev_department(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    -- 항목별 금액 (NUMERIC)
    sales_amount NUMERIC(18, 2) DEFAULT 0,
    cost_of_sales NUMERIC(18, 2) DEFAULT 0,
    gross_loss_sales NUMERIC(18, 2) DEFAULT 0,
    selling_admin_expenses NUMERIC(18, 2) DEFAULT 0,
    operating_loss NUMERIC(18, 2) DEFAULT 0,
    non_operating_income NUMERIC(18, 2) DEFAULT 0,
    non_operating_expenses NUMERIC(18, 2) DEFAULT 0,
    net_loss_before_tax NUMERIC(18, 2) DEFAULT 0,
    income_tax_expense NUMERIC(18, 2) DEFAULT 0,
    net_loss_period NUMERIC(18, 2) DEFAULT 0,
    gross_profit NUMERIC(18, 2) DEFAULT 0,
    operating_profit NUMERIC(18, 2) DEFAULT 0,
    net_profit_before_tax NUMERIC(18, 2) DEFAULT 0,
    net_profit_period NUMERIC(18, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_code, department_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_ev_provisional_sales_company_year ON public.ev_provisional_sales(company_code, year);
CREATE INDEX IF NOT EXISTS idx_ev_provisional_sales_department ON public.ev_provisional_sales(department_id);

CREATE OR REPLACE FUNCTION public.ev_provisional_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ev_provisional_sales_updated_at ON public.ev_provisional_sales;
CREATE TRIGGER ev_provisional_sales_updated_at
    BEFORE UPDATE ON public.ev_provisional_sales
    FOR EACH ROW EXECUTE FUNCTION public.ev_provisional_sales_updated_at();

ALTER TABLE public.ev_provisional_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ev_provisional_sales_select" ON public.ev_provisional_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "ev_provisional_sales_insert" ON public.ev_provisional_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ev_provisional_sales_update" ON public.ev_provisional_sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ev_provisional_sales_delete" ON public.ev_provisional_sales FOR DELETE TO authenticated USING (true);
