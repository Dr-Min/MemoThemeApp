import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, createTheme } from '../../models/Theme';

// AsyncStorage 키
const THEME_STORAGE_KEY = 'memo_app_themes';

export class ThemeService {
  // 모든 테마 가져오기
  static async getAllThemes(): Promise<Theme[]> {
    try {
      const themesJson = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (!themesJson) return [];
      
      // JSON 파싱
      const parsedThemes = JSON.parse(themesJson);
      
      // 필드 정확히 처리 (icon 필드 추가)
      return parsedThemes.map((theme: any) => ({
        ...theme,
        // keywords가 undefined인 경우 빈 배열로 초기화
        keywords: Array.isArray(theme.keywords) ? theme.keywords : [],
        // childThemes가 undefined인 경우 빈 배열로 초기화
        childThemes: Array.isArray(theme.childThemes) ? theme.childThemes : [],
        // description이 없는 경우 빈 문자열로 초기화
        description: theme.description || '',
        // icon이 없는 경우 기본 아이콘 'label' 설정
        icon: theme.icon || 'label' 
      }));
    } catch (error) {
      console.error('테마 불러오기 실패:', error);
      return [];
    }
  }

  // 테마 저장하기
  static async saveThemes(themes: Theme[]): Promise<void> {
    try {
      const themesJson = JSON.stringify(themes);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themesJson);
    } catch (error) {
      console.error('테마 저장 실패:', error);
    }
  }

  // 새 테마 추가 (icon 추가)
  static async addTheme(
    name: string, 
    keywords: string[] = [], 
    parentTheme: string | null = null,
    icon: string = 'label' // icon 매개변수 추가
  ): Promise<Theme> {
    const themes = await this.getAllThemes();
    // createTheme 호출 시 icon 전달
    const newTheme = createTheme(name, keywords, parentTheme, [], '', icon);
    
    // 상위 테마가 있으면 해당 테마의 하위 테마 목록에 새 테마 추가
    if (parentTheme) {
      const updatedThemes = themes.map(theme => 
        theme.id === parentTheme
          ? { ...theme, childThemes: [...theme.childThemes, newTheme.id] }
          : theme
      );
      await this.saveThemes([...updatedThemes, newTheme]);
    } else {
      await this.saveThemes([...themes, newTheme]);
    }
    
    return newTheme;
  }

  // 테마 업데이트
  static async updateTheme(updatedTheme: Theme): Promise<void> {
    const themes = await this.getAllThemes();
    
    // 키워드 처리 - 빈 문자열 필터링
    if (updatedTheme.keywords) {
      updatedTheme.keywords = updatedTheme.keywords
        .filter(k => typeof k === 'string' && k.trim().length > 0)
        .map(k => k.trim());
    }
    
    const updatedThemes = themes.map(theme => 
      theme.id === updatedTheme.id ? updatedTheme : theme
    );
    
    await this.saveThemes(updatedThemes);
  }

  // 테마 삭제
  static async deleteTheme(themeId: string): Promise<void> {
    const themes = await this.getAllThemes();
    
    // 삭제할 테마 찾기
    const themeToDelete = themes.find(theme => theme.id === themeId);
    
    if (!themeToDelete) return;
    
    let updatedThemes = themes.filter(theme => theme.id !== themeId);
    
    // 상위 테마가 있으면 상위 테마의 하위 테마 목록에서 제거
    if (themeToDelete.parentTheme) {
      updatedThemes = updatedThemes.map(theme => 
        theme.id === themeToDelete.parentTheme
          ? { ...theme, childThemes: theme.childThemes.filter(id => id !== themeId) }
          : theme
      );
    }
    
    // 하위 테마들의 상위 테마 참조 제거
    if (themeToDelete.childThemes.length > 0) {
      updatedThemes = updatedThemes.map(theme => 
        themeToDelete.childThemes.includes(theme.id)
          ? { ...theme, parentTheme: null }
          : theme
      );
    }
    
    await this.saveThemes(updatedThemes);
  }

  // 최상위 테마만 가져오기
  static async getRootThemes(): Promise<Theme[]> {
    const themes = await this.getAllThemes();
    return themes.filter(theme => theme.parentTheme === null);
  }

  // 특정 테마의 하위 테마 가져오기
  static async getChildThemes(themeId: string): Promise<Theme[]> {
    const themes = await this.getAllThemes();
    const parentTheme = themes.find(theme => theme.id === themeId);
    
    if (!parentTheme) return [];
    
    return themes.filter(theme => parentTheme.childThemes.includes(theme.id));
  }
} 