#!/bin/bash
# supabase_db_restore.sh

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
            echo "Usage: ./supabase_db_restore.sh -prj <project_name> -file <backup_file>"
            exit 1
            ;;
    esac
done

if [ -z "$PROJECT" ] || [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./supabase_db_restore.sh -prj <project_name> -file <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found"
    exit 1
fi

# DB 설정 로드
get_db_config "$PROJECT" || exit 1

# 복원 정보 출력
echo "================================"
echo "Restore Information"
echo "================================"
echo "Target Project: $PROJECT"
echo "Database Host: $DB_HOST"
echo "Database Name: $DB_NAME"
echo "Backup File: $BACKUP_FILE"
echo "File Size: $(ls -lh $BACKUP_FILE | awk '{print $5}')"
echo "================================"
echo ""
echo "WARNING: This will overwrite the existing database!"
echo ""
read -p "Do you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo "Starting restore..."
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

#           --if-exists \
pg_restore -h "$DB_HOST" \
           -p "$DB_PORT" \
           -U "$DB_USER" \
           -d "$DB_DATABASE" \
           --clean \
           -F c \
           -v \
           "$BACKUP_FILE" > /dev/null 2>&1 &

# PID=$!
# show_spinner $PID
# wait $PID
RESULT=$?

unset PGPASSWORD

echo ""
if [ $RESULT -eq 0 ]; then
    echo "✓ Restore completed successfully"
else
    echo "✗ Restore failed"
    exit 1
fi
