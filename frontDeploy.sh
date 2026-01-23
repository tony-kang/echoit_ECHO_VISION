#!/bin/bash

# 목표 서버 설정 : dev, service
TARGET_NAME="vision.echoit.co.kr"

# 개발서버 설정
USER="telepasi"
TARGET="dev"
DEV_SERVER="49.254.84.171"
WEB_PATH="/var/www/dev.telepasi.co.kr/web"

# 입력 파라미터가 제공되면 TARGET 값을 변경
if [ "$1" == "service" ]; then
    USER="telepasi"
    TARGET="service"
    SERVICES_SERVER="49.254.84.152"
    WEB_PATH="/var/www/telepasi.co.kr/web"
fi

########################################################
########################################################
DEV_SERVER_PATH="$USER@$DEV_SERVER:$WEB_PATH"
SERVICE_SERVER_PATH="$USER@$SERVICES_SERVER:$WEB_PATH"

SSHPORT="ssh -p 2233"
# --------------------------------
LOCAL_BUILD_PATH="build"

# 개발서버 및 서비스서버 에는 각각
# 1. rsync를 설치해야 합니다.
# ------------------------------
#   sudo apt update
#   sudo apt install rsync
# ------------------------------
# 2. SSH 공개키 인증설정 : MAC 등의 로컬환경에서 개발서버 및 서비스 서버에
#   배포파일을 복사하기 위해서는 비밀번호 없이 SSH 접속을 할 수 있어야 합니다.
#   즉, rsync를 사용하여 SSH 접속없이 파일을 동기화 할 수 있음.
#   ssh-keygen -t rsa -b 4096                   #이미 만들어 진 경우 생략
#   ssh-copy-id -p 2233 pris@49.254.84.171      #키 복사
#   ssh-copy-id -p 2233 root@49.254.84.171      #키 복사
#   ssh-copy-id -p 2233 telepasi@49.254.84.171  #키 복사

# __________________________
# 로컬 빌드 폴더를 개발 서버로 전송
if [ "$TARGET" == "service" ]; then 
    rsync -avz --delete --exclude='node_modules' -e "$SSHPORT" "$LOCAL_BUILD_PATH/" "$SERVICE_SERVER_PATH"  
    echo -e "$SSHPORT $SERVICE_SERVER_PATH"
else
    rsync -avz --delete --exclude='node_modules' -e "$SSHPORT" "$LOCAL_BUILD_PATH/" "$DEV_SERVER_PATH"
    echo -e "$SSHPORT $DEV_SERVER_PATH"
fi

echo "$TARGET_NAME($TARGET) Deploy OK"
