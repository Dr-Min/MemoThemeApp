import i18next from 'i18next';
import { I18nManager, NativeModules, Platform } from 'react-native';
import { initReactI18next } from 'react-i18next';

// 번역 파일 가져오기
import ko from './translations/ko.json';
import en from './translations/en.json';
import ja from './translations/ja.json';
import zh from './translations/zh.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import de from './translations/de.json';
import ru from './translations/ru.json';

// 번역 리소스 구성
const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ru: { translation: ru }
};

// 사용 가능한 언어 목록
export const availableLanguages = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' }
];

// 기기 언어 감지 (네이티브 모듈 직접 사용)
let deviceLanguage = 'ko'; // 기본 언어

try {
  if (Platform.OS === 'ios') {
    const locale = 
      NativeModules.SettingsManager?.settings?.AppleLocale || 
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 
      'ko';
    deviceLanguage = locale.substring(0, 2);
  } else if (Platform.OS === 'android') {
    const locale = 
      NativeModules.I18nManager?.localeIdentifier || 
      'ko';
    deviceLanguage = locale.substring(0, 2);
  }
  
  // 지원 언어 확인
  if (!Object.keys(resources).includes(deviceLanguage)) {
    deviceLanguage = 'ko';
  }
} catch (error) {
  console.warn('언어 감지 오류:', error);
  deviceLanguage = 'ko';
}

// RTL 지원 설정 단순화
const isRTL = I18nManager.isRTL;
I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en', // 번역이 없을 경우 영어 사용
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// 언어 변경 함수
export const changeLanguage = (language: string) => {
  i18next.changeLanguage(language);
};

// 현재 언어 가져오기
export const getCurrentLanguage = () => {
  return i18next.language;
};

export default i18next; 