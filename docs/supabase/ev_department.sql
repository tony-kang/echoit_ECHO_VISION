-- ============================================================================
-- 부서 테이블 (ev_department)
-- ============================================================================
-- 목적: 부서 정보 관리 (env_code department 대체)
-- - code: DEPARTMENT_001 형식 자동 생성
-- - title: 부서명
-- - param: organization 코드 배열 (jsonb)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ev_department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    param JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ev_department_code ON public.ev_department(code);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.ev_department_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ev_department_updated_at ON public.ev_department;
CREATE TRIGGER ev_department_updated_at
    BEFORE UPDATE ON public.ev_department
    FOR EACH ROW EXECUTE FUNCTION public.ev_department_updated_at();

-- ============================================================================
-- 부서 담당자 및 권한 (ev_department_user)
-- ============================================================================
-- 목적: 부서별 관리 가능 사용자 2명 이상 연결, 권한 설정
-- - can_edit_business_plan: 경영 계획 수정권한
-- - can_edit_expected_sales: 예상 매출 수정권한
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ev_department_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.ev_department(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    can_edit_business_plan BOOLEAN NOT NULL DEFAULT false,
    can_edit_expected_sales BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ev_department_user_department ON public.ev_department_user(department_id);
CREATE INDEX IF NOT EXISTS idx_ev_department_user_user ON public.ev_department_user(user_id);

CREATE OR REPLACE FUNCTION public.ev_department_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ev_department_user_updated_at ON public.ev_department_user;
CREATE TRIGGER ev_department_user_updated_at
    BEFORE UPDATE ON public.ev_department_user
    FOR EACH ROW EXECUTE FUNCTION public.ev_department_user_updated_at();

-- RLS (필요 시 프로젝트 정책에 맞게 추가)
ALTER TABLE public.ev_department ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ev_department_user ENABLE ROW LEVEL SECURITY;

-- 예: 인증된 사용자 읽기/쓰기 (실제로는 관리자만 수정 등 정책 적용 권장)
CREATE POLICY "ev_department_select" ON public.ev_department FOR SELECT TO authenticated USING (true);
CREATE POLICY "ev_department_insert" ON public.ev_department FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ev_department_update" ON public.ev_department FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ev_department_delete" ON public.ev_department FOR DELETE TO authenticated USING (true);

CREATE POLICY "ev_department_user_select" ON public.ev_department_user FOR SELECT TO authenticated USING (true);
CREATE POLICY "ev_department_user_insert" ON public.ev_department_user FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ev_department_user_update" ON public.ev_department_user FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ev_department_user_delete" ON public.ev_department_user FOR DELETE TO authenticated USING (true);
