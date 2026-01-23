# supabase_db_config.sh
# 프로젝트별 연결 정보 공용 설정 파일

get_db_config() {
    local PROJECT=$1
    
    case $PROJECT in
        "vision.echoit.co.kr")
            DB_HOST="aws-1-ap-northeast-2.pooler.supabase.com"
            DB_PORT="5432"  # ← Session pooler
            DB_DATABASE="postgres"
            DB_USER="postgres.fivsbshaikmfjbbxkzsw"
            DB_PASS="fluAGocL20YYJ7CW"
            DB_POOLMODE="session"
            ;;
        "www.telepasi.com")
            DB_HOST=""
            DB_PORT="5432"  # ← Session pooler
            DB_DATABASE="postgres"
            DB_USER="postgres.xxxxxxxxxxxxxxxxxxxx"
            DB_PASS="xxxxxxxxxx"
            DB_POOLMODE="session"
            ;;
        *)
            echo "Unknown project: $PROJECT"
            return 1
            ;;
    esac
    
    return 0
}
