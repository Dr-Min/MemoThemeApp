# 메모 테마 앱 (MemoThemeApp)

자동 테마 분류 기능을 갖춘 메모 앱입니다. 사용자가 작성한 텍스트를 분석하여 적절한 테마(주제)로 자동으로 분류해줍니다.

## 주요 기능

- **메모 작성 및 관리**: 메모 생성, 수정, 삭제
- **자동 테마 분류**: 텍스트 내용 분석 후 적절한 테마 할당
- **계층형 테마 구조**: 상위/하위 테마 관계 설정 및 관리
- **시간별 자동 분류**: 작성 날짜 기반의 자동 분류

## 기술 스택

- React Native / Expo
- TypeScript
- Compromise.js (텍스트 분석)
- AsyncStorage (데이터 저장)
- React Navigation

## 설치 방법

```bash
# 저장소 복제
git clone https://github.com/yourusername/MemoThemeApp.git

# 프로젝트 폴더로 이동
cd MemoThemeApp

# 의존성 설치
npm install
```

## 실행 방법

```bash
# 개발 서버 시작
npm start
```

Expo 개발 서버가 시작되면 QR 코드를 스캔하거나 iOS/Android 시뮬레이터에서 앱을 열 수 있습니다.

## 폴더 구조

```
MemoThemeApp/
├── src/
│   ├── models/        # 데이터 모델
│   ├── services/      # 비즈니스 로직 및 데이터 처리
│   ├── components/    # 재사용 가능한 UI 컴포넌트
│   ├── screens/       # 앱 화면
│   ├── navigation/    # 네비게이션 설정
│   └── utils/         # 유틸리티 함수
├── assets/            # 이미지, 폰트 등 정적 리소스
└── ...                # 기타 설정 파일
```

## 다음 개발 단계

더 자세한 개발 계획은 [NEXT_STEPS.md](./NEXT_STEPS.md) 파일을 참조하세요.

## 라이선스

MIT
