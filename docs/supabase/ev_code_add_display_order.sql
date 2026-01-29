-- ============================================================================
-- ev_code 테이블에 출력순서 컬럼 추가
-- ============================================================================
-- 목적: ev_code 테이블에 출력순서(display_order) 컬럼 추가
-- 특징:
--   - 출력순서는 화면에 표시되는 순서를 결정
--   - 작은 값이 먼저 표시됨
--   - 기본값은 0
-- ============================================================================

-- 출력순서 컬럼 추가
ALTER TABLE public.ev_code 
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.ev_code.display_order IS '출력순서 - 화면에 표시되는 순서를 결정하는 값 (작은 값이 먼저 표시됨)';

-- 출력순서 인덱스 생성 (정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ev_code_display_order ON public.ev_code(display_order);

-- 카테고리별 출력순서 인덱스 생성 (카테고리별 정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ev_code_category_display_order ON public.ev_code(category, display_order);
