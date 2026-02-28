-- user_profiles 테이블에 메뉴별 접근 권한 컬럼 추가
-- 대시보드, 실적현황, 손익현황 접근 허용 여부

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS can_dashboard BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS can_performance BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS can_profit_loss BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_profiles.can_dashboard IS '대시보드 메뉴 접근 권한';
COMMENT ON COLUMN public.user_profiles.can_performance IS '실적현황 메뉴 접근 권한';
COMMENT ON COLUMN public.user_profiles.can_profit_loss IS '손익현황 메뉴 접근 권한';
