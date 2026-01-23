#!/bin/bash
# supabase_db_backup.sh

# 설정 파일 로드
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/supabase_db_config.sh"

PROJECT=""
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -prj)
            PROJECT="$2"
            shift 2
            ;;
        -file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./supabase_db_backup.sh -prj <project_name> [-file <backup_file>]"
            exit 1
            ;;
    esac
done

if [ -z "$PROJECT" ]; then
    echo "Usage: ./supabase_db_backup.sh -prj <project_name> [-file <backup_file>]"
    exit 1
fi

# DB 설정 로드
get_db_config "$PROJECT" || exit 1

# 파일명이 지정되지 않은 경우 자동 생성
if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE="${PROJECT}_$(date +%Y%m%d_%H%M).sql"
fi

echo "Backing up project $PROJECT..."
echo "Backup file: $BACKUP_FILE"
echo ""

# 로딩 애니메이션 함수
show_spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    echo -n "Progress: "
    while ps -p $pid > /dev/null 2>&1; do
        local temp=${spinstr#?}
        printf "[%c] " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

export PGPASSWORD="$DB_PASS"

pg_dump -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_DATABASE" \
        -F c \
        -f "$BACKUP_FILE"
        
#        > /dev/null 2>&1 &

PID=$!
show_spinner $PID
wait $PID
RESULT=$?

unset PGPASSWORD

echo ""
if [ $RESULT -eq 0 ]; then
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✓ Backup completed: $BACKUP_FILE ($FILE_SIZE)"
else
    echo "✗ Backup failed"
    exit 1
fi
