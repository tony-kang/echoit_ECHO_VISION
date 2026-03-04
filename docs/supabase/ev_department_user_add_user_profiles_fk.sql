-- ============================================================================
-- ev_department_user.user_id → user_profiles(id) FK 추가
-- ============================================================================
-- 목적: 부서 담당자 조회 시 user_profiles와 조인(embed) 사용을 위함
-- Supabase PostgREST에서 ev_department → ev_department_user → user_profiles
-- 중첩 조회가 가능해짐
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ev_department_user_user_id_fkey'
    ) THEN
        ALTER TABLE public.ev_department_user
        ADD CONSTRAINT ev_department_user_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
