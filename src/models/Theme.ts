export interface Theme {
  id: string;            // 고유 식별자
  name: string;          // 테마 이름
  createdAt: number;
  updatedAt: number;
  description?: string;  // 테마 설명 (선택 사항)
  icon?: string;         // 테마 아이콘 이름 (선택 사항, 예: 'home', 'book')
  color?: string;
  parentThemes?: string[];
  childThemes?: string[];
  keywords?: string[];
}

// 새 테마 생성을 위한 팩토리 함수
export const createTheme = (
  name: string, 
  keywords: string[] = [], 
  parentTheme: string | null = null, 
  childThemes: string[] = [],
  description: string = '',
  icon: string = 'label' // 기본 아이콘 설정
): Theme => {
  return {
    id: Date.now().toString(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    keywords,
    childThemes,
    description,
    icon,
    color: undefined,
    parentThemes: parentTheme ? [parentTheme] : undefined
  };
}; 