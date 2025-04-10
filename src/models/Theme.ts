export interface Theme {
  id: string;            // 고유 식별자
  name: string;          // 테마 이름
  parentTheme: string | null;  // 상위 테마 ID (없으면 null)
  keywords: string[];    // 관련 키워드 배열
  childThemes: string[]; // 하위 테마 ID 배열
  description?: string;  // 테마 설명 (선택 사항)
}

// 새 테마 생성을 위한 팩토리 함수
export const createTheme = (
  name: string, 
  keywords: string[] = [], 
  parentTheme: string | null = null, 
  childThemes: string[] = [],
  description: string = ''
): Theme => {
  return {
    id: Date.now().toString(),
    name,
    parentTheme,
    keywords,
    childThemes,
    description
  };
}; 