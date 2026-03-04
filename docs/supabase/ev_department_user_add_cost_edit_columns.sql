-- ============================================================================
-- ev_department_user에 계획/예상 비용 수정 권한 컬럼 추가
-- ============================================================================
-- can_edit_plan_cost: 계획 비용 수정 권한
-- can_edit_expected_cost: 예상 비용 수정 권한
-- default false
-- ============================================================================

ALTER TABLE public.ev_department_user ADD COLUMN IF NOT EXISTS can_edit_plan_cost BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ev_department_user ADD COLUMN IF NOT EXISTS can_edit_expected_cost BOOLEAN NOT NULL DEFAULT false;
