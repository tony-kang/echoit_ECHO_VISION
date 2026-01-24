-- ============================================================================
-- 엑셀 파일 저장을 위한 Storage 버킷 생성
-- ============================================================================

-- Storage 버킷 생성 (이미 존재하면 에러 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'excel-files',
    'excel-files',
    false, -- 비공개 버킷 (인증된 사용자만 접근)
    52428800, -- 50MB 제한
    ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- 기존 정책 삭제 (이미 존재하는 경우를 대비)
DROP POLICY IF EXISTS "excel_files_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "excel_files_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "excel_files_delete_policy" ON storage.objects;

-- Storage 정책: 인증된 사용자만 파일 업로드 가능
CREATE POLICY "excel_files_upload_policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'excel-files' AND
    auth.role() = 'authenticated'
);

-- Storage 정책: 인증된 사용자만 파일 조회 가능
CREATE POLICY "excel_files_select_policy" ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'excel-files' AND
    auth.role() = 'authenticated'
);

-- Storage 정책: 인증된 사용자만 파일 삭제 가능
CREATE POLICY "excel_files_delete_policy" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'excel-files' AND
    auth.role() = 'authenticated'
);
