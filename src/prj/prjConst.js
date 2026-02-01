const ___prjConst = {
    NAME: 'ECHO VISION',
    VERSION: '1.0.1',
    company: {
        name: '㈜에코아이티',
        ceo: '홍성호',
        address: '서울특별시 강남구 강남대로146길 25(에코스페이스) 4층',
        tel: '02.6342.8021',
        email: 'echoplan@echoit.co.kr',
        website: 'https://www.echoit.co.kr',
    },
    app: {
        name: '㈜에코아이티',
    },
    copyright: 'Copyright © ECHOIT. All rights reserved.',

    production: {
        domain: 'https://vision.echoit.co.kr',
    },
    dev: {
        // 개발 도메인 목록 (localhost 외에 등록된 개발 도메인이 있는 경우 추가)
        domains: [
            'localhost',
            '127.0.0.1',
            'vision.echoit.co.kr',
        ],
    },

    login: {
        description: '경영지표 관리 시스템',
    },

    oAuth: {
        appName: 'ECHOIT',  // https://console.cloud.google.com/auth/branding 에서의 앱 이름과 같아야 함.
    },

    privacy: {
        company: 'ECHOIT',
        department: '개인정보보호팀',
        name: 'XXXXXX (개인정보보호책임자)',
        phone: '010-1234-5678',
        email: 'XXXXXX@echoit.co.kr',
        address: 'XXXXXX',
        website: 'https://echoit.co.kr',
    },
};

export default ___prjConst;