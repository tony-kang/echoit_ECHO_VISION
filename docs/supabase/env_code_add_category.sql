-- ============================================================================
-- env_code 테이블에 category 컬럼 추가 및 데이터 업데이트
-- ============================================================================
-- 목적: env_code 테이블에 category 컬럼을 추가하고 기존 데이터를 업데이트
-- 특징:
--   - category 컬럼 추가 (VARCHAR 타입)
--   - 기존 모든 데이터의 category를 'organization'으로 설정
--   - 컬럼 코멘트 추가
-- ============================================================================

-- category 컬럼 추가 (이미 존재하는 경우 무시)
ALTER TABLE public.env_code ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- 기존 모든 데이터의 category를 'organization'으로 업데이트
UPDATE public.env_code SET category = 'organization' WHERE category IS NULL;

-- category 컬럼에 기본값 설정 (향후 INSERT 시 자동으로 'organization' 설정)
ALTER TABLE public.env_code ALTER COLUMN category SET DEFAULT 'organization';

-- category 컬럼 코멘트 추가
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'env_code' 
        AND column_name = 'category'
    ) THEN
        COMMENT ON COLUMN public.env_code.category IS '카테고리. 코드의 분류를 나타냅니다 (예: organization, system 등).';
    END IF;
END $$;

-- category 인덱스 생성 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_env_code_category ON public.env_code(category);

-- 인덱스 코멘트 추가
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'env_code' 
        AND indexname = 'idx_env_code_category'
    ) THEN
        COMMENT ON INDEX idx_env_code_category IS '카테고리 인덱스. category 필드로 필터링 및 정렬 성능을 향상시킵니다.';
    END IF;
END $$;
