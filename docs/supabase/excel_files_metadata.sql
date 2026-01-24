-- ============================================================================
-- 엑셀 파일 메타데이터 테이블 생성
-- ============================================================================
-- 목적: Storage에 저장된 엑셀 파일의 원본 파일명 등 메타데이터를 저장
-- 특징:
--   - Storage 경로와 원본 파일명 매핑
--   - 업로드 일시 및 사용자 정보 저장
--   - RLS를 통한 보안 관리
-- ============================================================================

-- 기존 테이블 삭제 (데이터도 함께 삭제됨)
DROP TABLE IF EXISTS public.excel_files_metadata CASCADE;

CREATE TABLE public.excel_files_metadata (
    -- 고유 ID (Primary Key)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Storage에 저장된 파일 경로 (excel-files/cost/1234567890_abc123.xlsx)
    storage_path VARCHAR(500) NOT NULL UNIQUE,
    
    -- 원본 파일명 (사용자가 업로드한 파일명)
    original_file_name VARCHAR(255) NOT NULL,
    
    -- 엑셀 타입 (sales 또는 cost)
    excel_type VARCHAR(50) NOT NULL,
    
    -- 파일 크기 (bytes)
    file_size BIGINT,
    
    -- 업로드한 사용자 ID
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- 생성일시
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수정일시
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_excel_files_metadata_storage_path ON public.excel_files_metadata(storage_path);
CREATE INDEX IF NOT EXISTS idx_excel_files_metadata_excel_type ON public.excel_files_metadata(excel_type);
CREATE INDEX IF NOT EXISTS idx_excel_files_metadata_uploaded_by ON public.excel_files_metadata(uploaded_by);

-- 컬럼 코멘트
COMMENT ON TABLE public.excel_files_metadata IS '엑셀 파일 메타데이터 테이블 (원본 파일명 등)';
COMMENT ON COLUMN public.excel_files_metadata.storage_path IS 'Storage에 저장된 파일 경로';
COMMENT ON COLUMN public.excel_files_metadata.original_file_name IS '원본 파일명 (사용자가 업로드한 파일명)';
COMMENT ON COLUMN public.excel_files_metadata.excel_type IS '엑셀 타입 (sales 또는 cost)';

-- RLS 활성화
ALTER TABLE public.excel_files_metadata ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자는 자신이 업로드한 파일 조회 가능
CREATE POLICY "excel_files_metadata_select_policy" ON public.excel_files_metadata
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자는 파일 메타데이터 생성 가능
CREATE POLICY "excel_files_metadata_insert_policy" ON public.excel_files_metadata
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자는 자신이 업로드한 파일 메타데이터 수정 가능
CREATE POLICY "excel_files_metadata_update_policy" ON public.excel_files_metadata
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자는 자신이 업로드한 파일 메타데이터 삭제 가능
CREATE POLICY "excel_files_metadata_delete_policy" ON public.excel_files_metadata
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_excel_files_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER excel_files_metadata_updated_at_trigger
BEFORE UPDATE ON public.excel_files_metadata
FOR EACH ROW
EXECUTE FUNCTION update_excel_files_metadata_updated_at();
