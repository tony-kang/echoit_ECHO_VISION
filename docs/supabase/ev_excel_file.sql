-- ============================================================================
-- 엑셀 파일 정보 테이블 (ev_excel_file)
-- ============================================================================
-- 목적: excel-files 버킷에 저장된 엑셀 파일의 메타데이터를 관리
-- 특징:
--   - Storage 파일과 자동 동기화 (Trigger 사용)
--   - 원본 파일명, 저장 파일명, 파일 크기 등 정보 저장
--   - 매출/비용 파일 구분
-- ============================================================================

-- 기존 테이블 삭제 (데이터도 함께 삭제됨)
DROP TABLE IF EXISTS public.ev_excel_file CASCADE;

CREATE TABLE public.ev_excel_file (
    -- 고유 ID (Primary Key)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Storage에 저장된 파일 경로 (excel-files/cost/1234567890_abc123.xlsx)
    storage_path VARCHAR(500) NOT NULL UNIQUE,
    
    -- 저장 파일명 (Storage에 실제 저장된 파일명)
    stored_file_name VARCHAR(255) NOT NULL,
    
    -- 원본 파일명 (사용자가 업로드한 파일명)
    original_file_name VARCHAR(255) NOT NULL,
    
    -- 엑셀 타입 (sales 또는 cost)
    excel_type VARCHAR(50) NOT NULL CHECK (excel_type IN ('sales', 'cost')),
    
    -- 파일 크기 (bytes)
    file_size BIGINT NOT NULL,
    
    -- 파일 확장자 (.xlsx, .xls, .csv)
    file_extension VARCHAR(10) NOT NULL,
    
    -- 파일 경로 (폴더 경로, 예: cost/)
    file_path VARCHAR(255) NOT NULL,
    
    -- 업로드한 사용자 ID
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- 생성일시
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수정일시
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ev_excel_file_storage_path ON public.ev_excel_file(storage_path);
CREATE INDEX IF NOT EXISTS idx_ev_excel_file_excel_type ON public.ev_excel_file(excel_type);
CREATE INDEX IF NOT EXISTS idx_ev_excel_file_uploaded_by ON public.ev_excel_file(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_ev_excel_file_file_path ON public.ev_excel_file(file_path);

-- 컬럼 코멘트
COMMENT ON TABLE public.ev_excel_file IS '엑셀 파일 정보 테이블 (Storage 파일과 자동 동기화)';
COMMENT ON COLUMN public.ev_excel_file.storage_path IS 'Storage에 저장된 전체 파일 경로 (excel-files/cost/...)';
COMMENT ON COLUMN public.ev_excel_file.stored_file_name IS 'Storage에 저장된 파일명';
COMMENT ON COLUMN public.ev_excel_file.original_file_name IS '원본 파일명 (사용자가 업로드한 파일명)';
COMMENT ON COLUMN public.ev_excel_file.excel_type IS '엑셀 타입 (sales 또는 cost)';
COMMENT ON COLUMN public.ev_excel_file.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN public.ev_excel_file.file_extension IS '파일 확장자';
COMMENT ON COLUMN public.ev_excel_file.file_path IS '파일 경로 (폴더 경로)';

-- RLS 활성화
ALTER TABLE public.ev_excel_file ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자는 모든 파일 조회 가능
CREATE POLICY "ev_excel_file_select_policy" ON public.ev_excel_file
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자는 파일 정보 생성 가능
CREATE POLICY "ev_excel_file_insert_policy" ON public.ev_excel_file
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자는 파일 정보 수정 가능
CREATE POLICY "ev_excel_file_update_policy" ON public.ev_excel_file
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자는 파일 정보 삭제 가능
CREATE POLICY "ev_excel_file_delete_policy" ON public.ev_excel_file
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_ev_excel_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ev_excel_file_updated_at_trigger
BEFORE UPDATE ON public.ev_excel_file
FOR EACH ROW
EXECUTE FUNCTION update_ev_excel_file_updated_at();

-- ============================================================================
-- Storage 파일 생성/삭제 시 ev_excel_file 테이블 자동 동기화 Trigger
-- ============================================================================

-- Storage 파일 생성 시 ev_excel_file에 자동 추가하는 함수
CREATE OR REPLACE FUNCTION sync_excel_file_on_storage_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_excel_type VARCHAR(50);
    v_file_path VARCHAR(255);
    v_stored_file_name VARCHAR(255);
    v_file_extension VARCHAR(10);
    v_metadata JSONB;
BEGIN
    -- excel-files 버킷의 파일만 처리
    IF NEW.bucket_id != 'excel-files' THEN
        RETURN NEW;
    END IF;
    
    -- 파일 경로에서 excel_type 추출 (예: cost/1234567890_abc123.xlsx -> cost)
    v_file_path := split_part(NEW.name, '/', 1);
    v_stored_file_name := split_part(NEW.name, '/', 2);
    
    -- excel_type 확인 (sales 또는 cost)
    IF v_file_path IN ('sales', 'cost') THEN
        v_excel_type := v_file_path;
    ELSE
        -- 알 수 없는 경로면 기본값 사용
        v_excel_type := 'cost';
    END IF;
    
    -- 파일 확장자 추출
    v_file_extension := LOWER(COALESCE(
        CASE 
            WHEN v_stored_file_name LIKE '%.xlsx' THEN '.xlsx'
            WHEN v_stored_file_name LIKE '%.xls' THEN '.xls'
            WHEN v_stored_file_name LIKE '%.csv' THEN '.csv'
            ELSE ''
        END,
        ''
    ));
    
    -- 메타데이터에서 원본 파일명 추출 시도
    v_metadata := NEW.metadata;
    
    -- ev_excel_file 테이블에 삽입
    INSERT INTO public.ev_excel_file (
        storage_path,
        stored_file_name,
        original_file_name,
        excel_type,
        file_size,
        file_extension,
        file_path,
        uploaded_by,
        created_at
    ) VALUES (
        'excel-files/' || NEW.name,
        v_stored_file_name,
        COALESCE(v_metadata->>'originalFileName', v_stored_file_name),
        v_excel_type,
        COALESCE((v_metadata->>'size')::BIGINT, 0),
        v_file_extension,
        v_file_path || '/',
        COALESCE(NEW.owner_id::UUID, NULL),
        NEW.created_at
    )
    ON CONFLICT (storage_path) DO UPDATE SET
        stored_file_name = EXCLUDED.stored_file_name,
        file_size = EXCLUDED.file_size,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러 발생 시 로그 출력 (실제 운영 환경에서는 로그 테이블에 기록)
        RAISE WARNING 'sync_excel_file_on_storage_insert 에러: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage 파일 삭제 시 ev_excel_file에서 자동 삭제하는 함수
CREATE OR REPLACE FUNCTION sync_excel_file_on_storage_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- excel-files 버킷의 파일만 처리
    IF OLD.bucket_id != 'excel-files' THEN
        RETURN OLD;
    END IF;
    
    -- ev_excel_file 테이블에서 삭제
    DELETE FROM public.ev_excel_file
    WHERE storage_path = 'excel-files/' || OLD.name;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러 발생 시 로그 출력
        RAISE WARNING 'sync_excel_file_on_storage_delete 에러: %', SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 생성: Storage 파일 생성 시
DROP TRIGGER IF EXISTS trigger_sync_excel_file_on_storage_insert ON storage.objects;
CREATE TRIGGER trigger_sync_excel_file_on_storage_insert
AFTER INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'excel-files')
EXECUTE FUNCTION sync_excel_file_on_storage_insert();

-- Trigger 생성: Storage 파일 삭제 시
DROP TRIGGER IF EXISTS trigger_sync_excel_file_on_storage_delete ON storage.objects;
CREATE TRIGGER trigger_sync_excel_file_on_storage_delete
AFTER DELETE ON storage.objects
FOR EACH ROW
WHEN (OLD.bucket_id = 'excel-files')
EXECUTE FUNCTION sync_excel_file_on_storage_delete();

-- 기존 파일들에 대한 초기 데이터 동기화 (선택사항)
-- 이미 업로드된 파일이 있다면 수동으로 동기화해야 할 수 있습니다.
-- 아래 쿼리로 기존 파일들을 동기화할 수 있습니다:
/*
INSERT INTO public.ev_excel_file (
    storage_path,
    stored_file_name,
    original_file_name,
    excel_type,
    file_size,
    file_extension,
    file_path,
    uploaded_by,
    created_at
)
SELECT 
    'excel-files/' || name as storage_path,
    split_part(name, '/', 2) as stored_file_name,
    COALESCE(metadata->>'originalFileName', split_part(name, '/', 2)) as original_file_name,
    split_part(name, '/', 1) as excel_type,
    COALESCE((metadata->>'size')::BIGINT, 0) as file_size,
    LOWER(COALESCE(
        CASE 
            WHEN name LIKE '%.xlsx' THEN '.xlsx'
            WHEN name LIKE '%.xls' THEN '.xls'
            WHEN name LIKE '%.csv' THEN '.csv'
            ELSE ''
        END,
        ''
    )) as file_extension,
    split_part(name, '/', 1) || '/' as file_path,
    owner_id::UUID as uploaded_by,
    created_at
FROM storage.objects
WHERE bucket_id = 'excel-files'
  AND id IS NOT NULL
ON CONFLICT (storage_path) DO NOTHING;
*/
