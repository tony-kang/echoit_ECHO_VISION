-- 환경설정 테이블 생성
-- 환경설정 코드 및 값을 관리하는 테이블

CREATE TABLE IF NOT EXISTS public.env_code (
    -- 코드 (Primary Key, 최대 16자리)
    code VARCHAR(16) PRIMARY KEY,
    
    -- 부모 코드 (종속성 관리, 자기 참조)
    parent_code VARCHAR(16),
    
    -- 표시 순서
    "order" INTEGER NOT NULL DEFAULT 0,
    
    -- 값 (Number, 1~N)
    value INTEGER NOT NULL CHECK (value >= 1),
    
    -- 제목
    title TEXT NOT NULL,
    
    -- 생성일시
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수정일시
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 외래키 제약조건: 자기 참조
    CONSTRAINT fk_env_code_parent 
        FOREIGN KEY (parent_code) 
        REFERENCES public.env_code(code) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_env_code_order ON public.env_code("order");
CREATE INDEX IF NOT EXISTS idx_env_code_value ON public.env_code(value);
CREATE INDEX IF NOT EXISTS idx_env_code_parent_code ON public.env_code(parent_code);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.env_code ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 조회 가능
CREATE POLICY "env_code_select_policy" ON public.env_code
    FOR SELECT
    USING (true);

-- RLS 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "env_code_insert_policy" ON public.env_code
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 수정 가능
CREATE POLICY "env_code_update_policy" ON public.env_code
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "env_code_delete_policy" ON public.env_code
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_env_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_env_code_updated_at
    BEFORE UPDATE ON public.env_code
    FOR EACH ROW
    EXECUTE FUNCTION update_env_code_updated_at();

-- 테이블 코멘트
COMMENT ON TABLE public.env_code IS '환경설정 코드 및 값을 관리하는 테이블';
COMMENT ON COLUMN public.env_code.code IS '환경설정 코드 (Primary Key, 최대 16자리)';
COMMENT ON COLUMN public.env_code.parent_code IS '부모 코드 (종속성 관리, 자기 참조)';
COMMENT ON COLUMN public.env_code."order" IS '표시 순서';
COMMENT ON COLUMN public.env_code.value IS '값 (Number, 1~N)';
COMMENT ON COLUMN public.env_code.title IS '제목';
COMMENT ON COLUMN public.env_code.created_at IS '생성일시';
COMMENT ON COLUMN public.env_code.updated_at IS '수정일시';
