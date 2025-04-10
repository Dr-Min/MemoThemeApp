# 메모 앱 프로젝트 다음 단계

## 프로젝트 개요

이 프로젝트는 사용자가 작성한 텍스트를 자동으로 분석하여 적절한 테마(주제)로 분류해주는 메모 앱입니다. 현재 기본적인 구조와 UI가 구현되어 있습니다.

## 현재 구현된 기능

1. 기본 데이터 모델 (Memo, Theme)
2. CRUD 서비스 (MemoService, ThemeService)
3. 텍스트 분석 서비스 (ThemeAnalyzer)
4. 기본 UI 컴포넌트 (MemoItem, ThemeItem, MemoInput)
5. 주요 화면 (HomeScreen, MemoDetailScreen, ThemeManagementScreen, ThemeEditScreen)
6. 기본 네비게이션 구조

## 다음 개발 단계를 위한 LLM 프롬프트

메모 앱의 개발을 계속하기 위해 다음 프롬프트를 사용하여 추가 기능을 구현하세요:

---

저는 자동 테마 분류 기능이 있는 메모 앱을 개발 중입니다. 기본적인 구조와 UI는 이미 구현되어 있으며, 이제 다음 기능을 추가하고 싶습니다.

### 현재 프로젝트 구조

- `src/models/`: Memo, Theme 인터페이스
- `src/services/`: MemoService, ThemeService, ThemeAnalyzer
- `src/components/`: UI 컴포넌트 (MemoItem, ThemeItem, MemoInput)
- `src/screens/`: 화면 (HomeScreen, MemoDetailScreen, ThemeManagementScreen, ThemeEditScreen)
- `src/navigation/`: 앱 네비게이션

### 추가할 기능

1. **테마 기반 메모 필터링**
   - 특정 테마에 속한 메모만 볼 수 있는 필터 옵션
   - 여러 테마를 조합해서 검색할 수 있는 기능

2. **날짜별 메모 분류**
   - 일/월/년 단위로 메모를 그룹화하는 기능
   - 날짜 범위로 메모를 필터링하는 기능

3. **고급 텍스트 분석 개선**
   - 현재 compromise.js를 사용한 분석 로직 개선
   - 사용자 패턴 학습을 통한 정확도 향상 (예: 사용자가 수동으로 변경한 테마를 기억)

4. **테마 시각화**
   - 테마 간의 관계를 시각적으로 표현 (계층 구조)
   - 테마별 메모 통계 대시보드

5. **성능 최적화**
   - 대용량 메모 처리를 위한 최적화
   - AsyncStorage 대신 SQLite 도입 고려

6. **테스트 추가**
   - 단위 테스트 및 통합 테스트 작성
   - 자동화된 UI 테스트

### 기술적 요구사항

- React Native와 TypeScript 사용
- 함수형 컴포넌트와 React Hooks 활용
- 모듈화와 확장성을 고려한 설계
- 퍼포먼스 최적화

### 개발 우선순위

1. 테마 기반 메모 필터링
2. 날짜별 메모 분류
3. 고급 텍스트 분석 개선
4. 테마 시각화
5. 성능 최적화
6. 테스트 추가

위 기능 중 하나 또는 여러 개를 구현하는 방법에 대한 지침과 코드를 제공해주세요.

---

## 실행 방법

```bash
cd MemoThemeApp
npm install
npm start
```

Expo 개발 서버가 시작되면 QR 코드를 스캔하거나 iOS/Android 시뮬레이터에서 앱을 열 수 있습니다. 