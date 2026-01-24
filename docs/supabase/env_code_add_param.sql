-- ============================================================================
-- env_code 테이블에 param 컬럼 추가 및 데이터 업데이트
-- ============================================================================
-- 목적: env_code 테이블에 param 컬럼을 추가하고 기존 데이터를 업데이트
-- 특징:
--   - param 컬럼 추가 (TEXT[] 타입, 배열)
--   - 엑셀 칼럼 이름과 매칭하기 위한 파라미터 배열
--   - 기존 모든 데이터의 title을 param 배열의 첫 번째 요소로 설정
--   - 배열 검색을 위한 GIN 인덱스 생성
-- ============================================================================

-- param 컬럼 추가 (이미 존재하는 경우 무시)
ALTER TABLE public.env_code ADD COLUMN IF NOT EXISTS param TEXT[];

-- 기존 모든 데이터의 title을 param 배열의 첫 번째 요소로 업데이트
-- param이 NULL이거나 빈 배열인 경우에만 업데이트
UPDATE public.env_code 
SET param = ARRAY[title] 
WHERE param IS NULL OR array_length(param, 1) IS NULL;

-- param 컬럼 코멘트 추가
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'env_code' 
        AND column_name = 'param'
    ) THEN
        COMMENT ON COLUMN public.env_code.param IS '파라미터 배열. 엑셀 칼럼 이름과 매칭하기 위한 파라미터 목록입니다. 배열에 포함된 칼럼 이름 중 하나라도 일치하면 해당 코드를 찾을 수 있습니다.';
    END IF;
END $$;

-- param 배열 검색을 위한 GIN 인덱스 생성 (배열 내 요소 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_env_code_param_gin ON public.env_code USING GIN (param);

-- 인덱스 코멘트 추가
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'env_code' 
        AND indexname = 'idx_env_code_param_gin'
    ) THEN
        COMMENT ON INDEX idx_env_code_param_gin IS '파라미터 배열 GIN 인덱스. param 배열 내 요소 검색 성능을 향상시킵니다. @> 연산자(포함) 및 && 연산자(교집합) 검색에 최적화되어 있습니다.';
    END IF;
END $$;
