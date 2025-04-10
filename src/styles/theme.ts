import { Dimensions, Platform, StyleSheet } from 'react-native';

// 화면 치수
const { width, height } = Dimensions.get('window');

/**
 * iOS 스타일의 디자인 시스템 
 * 앱의 모든 색상, 그림자, 모서리, 간격 및 타이포그래피를 일관되게 정의합니다.
 */

// 색상 정의
export const COLORS = {
  // 주요 색상
  primary: {
    light: '#0A84FF80', // iOS 블루 - 연한 버전
    default: '#0A84FF',  // iOS 블루
    dark: '#0066CC',    // 진한 블루
  },
  
  // 보조 색상
  secondary: {
    light: '#5E5CE680',  // iOS 인디고 - 연한 버전
    default: '#5E5CE6',  // iOS 인디고
    dark: '#4040B0',    // 진한 인디고
  },
  
  // 강조 색상
  accent: {
    light: '#FF375F80',  // iOS 핑크 - 연한 버전
    default: '#FF375F',  // iOS 핑크
    dark: '#D30F45',    // 진한 핑크
  },
  
  // 상태 색상
  success: {
    light: '#34C75980',  // iOS 그린 - 연한 버전
    default: '#34C759',  // iOS 그린
    dark: '#248A3D',    // 진한 그린
  },
  warning: {
    light: '#FF9F0A80',  // iOS 오렌지 - 연한 버전
    default: '#FF9F0A',  // iOS 오렌지
    dark: '#C93400',    // 진한 오렌지
  },
  error: {
    light: '#FF453A80',  // iOS 레드 - 연한 버전
    default: '#FF453A',  // iOS 레드
    dark: '#D70015',    // 진한 레드
  },
  info: {
    light: '#32ADE680',  // iOS 틸 - 연한 버전
    default: '#32ADE6',  // iOS 틸
    dark: '#0071A4',    // 진한 틸
  },
  
  // 배경 색상
  background: {
    primary: '#FFFFFF',     // 메인 배경 (라이트 모드)
    secondary: '#F2F2F7',   // 보조 배경 (iOS 그룹 테이블 배경)
    tertiary: '#E5E5EA',    // 세 번째 배경 (경계선, 구분선)
    highlight: '#E5F6FF',   // 하이라이트 배경
  },
  
  // 텍스트 색상
  text: {
    primary: '#000000',     // 기본 텍스트
    secondary: '#3C3C43',   // 보조 텍스트 (60% 불투명도)
    tertiary: '#3C3C4399',  // 세 번째 텍스트 (30% 불투명도)
    quaternary: '#3C3C4366', // 네 번째 텍스트 (18% 불투명도)
    placeholder: '#3C3C434D', // 플레이스홀더 (30% 불투명도)
    disabled: '#3C3C432D',   // 비활성화 텍스트 (18% 불투명도)
  },
  
  // 경계선 색상
  border: {
    default: '#3C3C4349',   // 기본 경계선
    destructive: '#FF453A', // 삭제 관련 경계선
  },
  
  // 그림자 색상
  shadow: '#00000040',      // 모든 그림자 (40% 불투명도)
  
  // 특수 색상
  card: '#FFFFFF',           // 카드 배경색
  overlay: '#0000003D',      // 오버레이 (24% 불투명도)
  separator: '#3C3C4349',    // 구분선
};

// 그림자 정의
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 6,
  }
};

// 모서리 반경
export const RADIUS = {
  xxs: 2,
  xs: 4,
  s: 6,
  m: 8,
  l: 12,
  xl: 16,
  xxl: 22,
  round: 999, // 원형
};

// 간격
export const SPACING = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// 타이포그래피
export const TYPOGRAPHY = {
  // 대형 제목
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  
  // 제목 1 (탐색 바 대형 제목)
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.36,
  },
  
  // 제목 2
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
  
  // 제목 3
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.38,
  },
  
  // 헤드라인
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  
  // 본문
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  
  // 콜아웃
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  
  // 서브헤드라인
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  
  // 각주
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  
  // 캡션 1
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  
  // 캡션 2
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.07,
  }
};

// 레이아웃 도우미
// 각 스타일 그룹을 개별 객체로 정의
export const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    ...SHADOWS.medium,
  },
  flatContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border.default,
  },
});

export const inputStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.s,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border.default,
  },
  focused: {
    borderColor: COLORS.primary.default,
    borderWidth: 2,
  },
  error: {
    borderColor: COLORS.error.default,
    borderWidth: 1,
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: COLORS.primary.default,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: COLORS.background.secondary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border.default,
  },
  text: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
  },
});

// 모든 레이아웃 스타일을 하나의 객체로 내보내기
export const LAYOUT = {
  card: cardStyles,
  input: inputStyles,
  button: buttonStyles,
};

/**
 * 화면 측정 (responsive design)
 */
export const METRICS = {
  screenWidth: width,
  screenHeight: height,
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 414,
  isLargeDevice: width >= 414,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
}; 