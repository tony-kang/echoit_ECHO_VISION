#!/bin/bash
# Production 프로젝트에서 데이터를 백업하는 스크립트
# chmod +x db_backup.sh
# 백업되는 항목:
#   테이블 스키마 (CREATE TABLE 구문)
#   테이블 데이터 (모든 행)
#   권한 부여 (RLS 정책 = CREATE POLICY 구문)
#   인덱스 (Indexes)
#   시퀀스 (Sequences)
#   뷰 (Views)
#   함수 (Functions)
#   트리거 (Triggers)
#   제약조건 (Constraints: PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE)
#   기본값 (DEFAULT values)
# ----------------------------------------
#   주의사항:
#   소유자 정보는 백업되지 않습니다
#   RLS 정책 자체는 백업되지만, 정책과 연결된 ROLE 정보는 주의 필요
# ========================================
# Supabase Database Backup Script
# ========================================

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# 설정: 여기에 실제 값을 입력하세요
# ========================================

# 소스 프로젝트 (백업할 프로젝트 = production)
DB_HOST="aws-1-ap-northeast-2.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.czgtexdgawrnrelvjqur"
DB_NAME="postgres"
DB_PASSWORD="PSSMTKvLZ5xZefQG"


# 백업 파일 설정
BACKUP_FILE="prj_a_backup.dump"
BACKUP_DIR="$(pwd)"

# ========================================
# 함수 정의
# ========================================

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_separator() {
    echo "========================================"
}

# ========================================
# 메인 스크립트
# ========================================

echo ""
print_separator
echo "🚀 Supabase Database 백업 시작"
print_separator
echo ""

# 1. PostgreSQL 클라이언트 확인
print_info "PostgreSQL 클라이언트 확인 중..."
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump를 찾을 수 없습니다."
    print_info "설치 방법: brew install postgresql@17"
    exit 1
fi

PG_VERSION=$(pg_dump --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
print_success "PostgreSQL 버전: $PG_VERSION"
echo ""

# 2. 백업 디렉토리 확인
print_info "백업 디렉토리: $BACKUP_DIR"
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "백업 디렉토리가 존재하지 않습니다."
    exit 1
fi
echo ""

# 3. 기존 백업 파일 확인
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    print_info "기존 백업 파일이 존재합니다: $BACKUP_FILE"
    read -p "덮어쓰시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "백업 취소됨"
        exit 1
    fi
    rm "$BACKUP_DIR/$BACKUP_FILE"
fi

# 4. 백업 실행
print_separator
print_info "데이터베이스 백업 중..."
print_separator
echo ""

export PGPASSWORD="$DB_PASSWORD"

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_DATABASE" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -F c \
  -f "$BACKUP_DIR/$BACKUP_FILE"

BACKUP_EXIT_CODE=$?
unset PGPASSWORD

echo ""

# 5. 백업 결과 확인
if [ $BACKUP_EXIT_CODE -eq 0 ]; then
    print_separator
    print_success "백업 완료!"
    print_separator
    
    # 파일 크기 확인
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        FILE_SIZE=$(ls -lh "$BACKUP_DIR/$BACKUP_FILE" | awk '{print $5}')
        print_success "백업 파일: $BACKUP_FILE"
        print_success "파일 크기: $FILE_SIZE"
        echo ""
        print_info "백업 위치: $BACKUP_DIR/$BACKUP_FILE"
    else
        print_error "백업 파일이 생성되지 않았습니다."
        exit 1
    fi
else
    print_separator
    print_error "백업 실패 (종료 코드: $BACKUP_EXIT_CODE)"
    print_separator
    exit 1
fi

echo ""
print_separator
print_success "모든 작업 완료!"
print_separator
echo ""