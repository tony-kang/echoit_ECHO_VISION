-- user_profiles 테이블에 top_level_codes 필드 추가
-- 사용자가 접근 가능한 최상위 환경설정 코드 목록을 저장

-- 기존 컬럼이 있으면 제거 (재실행 시)
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS top_level_codes;

-- top_level_codes 컬럼 추가 (TEXT 배열)
ALTER TABLE public.user_profiles 
ADD COLUMN top_level_codes TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.user_profiles.top_level_codes IS '사용자가 접근 가능한 최상위 환경설정 코드 목록 (env_code.code 배열). 빈 배열이면 모든 코드에 접근 가능 (관리자/마스터만 해당).';

-- 인덱스 추가 (배열 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_profiles_top_level_codes 
ON public.user_profiles USING GIN (top_level_codes);
