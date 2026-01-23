#!/bin/bash
# Production 프로젝트에서 백업한 데이터를 Development 프로젝트로 복원하는 스크립트
# chmod +x db_restore.sh
# PostgreSQL 데이터베이스 복원 스크립트
# 사용법: ./pg_restore.sh [dump_file]

# =============================================================================
# 설정 변수
# =============================================================================

# 데이터베이스 연결 정보 (development)
DB_HOST="aws-1-ap-south-1.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.ozvkandsyfmvjxwcxwkn"
DB_PASSWORD="DizJdJYJZze3kfea"
DB_DATABASE="postgres"

# 덤프 파일 경로 (기본값 또는 첫 번째 인자)
DUMP_FILE="${1:-prj_a_backup.dump}"

# 복원 옵션
VERBOSE="-v"                    # 상세 출력
CLEAN="--clean"                 # 기존 객체 삭제
IF_EXISTS="--if-exists"         # 객체가 존재할 때만 삭제
NO_OWNER="--no-owner"           # 소유자 복원 안 함
NO_ACL="--no-acl"               # 권한 복원 안 함

# =============================================================================
# 함수 정의
# =============================================================================

# 에러 메시지 출력 및 종료
error_exit() {
    echo "❌ 에러: $1" >&2
    exit 1
}

# 정보 메시지 출력
info_msg() {
    echo "ℹ️  $1"
}

# =============================================================================
# 사전 검증
# =============================================================================

# pg_restore 명령어 존재 확인
if ! command -v pg_restore &> /dev/null; then
    error_exit "pg_restore 명령어를 찾을 수 없습니다. PostgreSQL 클라이언트를 설치해주세요."
fi

# 덤프 파일 존재 확인
if [ ! -f "$DUMP_FILE" ]; then
    error_exit "덤프 파일을 찾을 수 없습니다: $DUMP_FILE"
fi

# =============================================================================
# 복원 실행
# =============================================================================

info_msg "PostgreSQL 데이터베이스 복원 시작"
info_msg "호스트: $DB_HOST"
info_msg "포트: $DB_PORT"
info_msg "데이터베이스: $DB_NAME"
info_msg "사용자: $DB_USER"
info_msg "덤프 파일: $DUMP_FILE"
echo "----------------------------------------"

# 환경 변수로 비밀번호 설정
export PGPASSWORD="$DB_PASSWORD"

# pg_restore 실행
pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  $CLEAN \
  $IF_EXISTS \
  $NO_OWNER \
  $NO_ACL \
  $VERBOSE \
  "$DUMP_FILE"

# 복원 결과 확인
RESTORE_STATUS=$?

# 비밀번호 환경 변수 제거 (보안)
unset PGPASSWORD

# =============================================================================
# 결과 출력
# =============================================================================

echo "----------------------------------------"
if [ $RESTORE_STATUS -eq 0 ]; then
    info_msg "✅ 데이터베이스 복원이 성공적으로 완료되었습니다."
    exit 0
else
    error_exit "데이터베이스 복원 중 오류가 발생했습니다. (종료 코드: $RESTORE_STATUS)"
fi