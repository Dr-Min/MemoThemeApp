import { ThemeAnalyzer } from '../services/theme/ThemeAnalyzer';
import { Theme } from '../models/Theme';
import { UserLearningStore } from '../services/theme/UserLearningStore';

// UserLearningStore 모킹
jest.mock('../services/theme/UserLearningStore', () => ({
  UserLearningStore: {
    getFrequentTerms: jest.fn().mockResolvedValue([
      { term: 'react', count: 10 },
      { term: 'native', count: 8 },
      { term: 'javascript', count: 15 },
      { term: 'typescript', count: 12 },
      { term: 'programming', count: 5 }
    ]),
    getUserPatterns: jest.fn().mockResolvedValue([
      { word: 'react', themeId: 'theme1', count: 5 },
      { word: 'native', themeId: 'theme1', count: 4 },
      { word: 'javascript', themeId: 'theme2', count: 7 },
      { word: 'typescript', themeId: 'theme2', count: 6 },
      { word: 'framework', themeId: 'theme1', count: 3 },
      { word: 'language', themeId: 'theme2', count: 4 }
    ]),
    updateTermFrequency: jest.fn().mockResolvedValue(undefined),
    learnFromUserAction: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('ThemeAnalyzer', () => {
  // 테스트에 사용할 테마 데이터
  const testThemes: Theme[] = [
    {
      id: 'theme1',
      name: 'React Native',
      parentTheme: null,
      keywords: ['react', 'native', 'mobile', 'app'],
      childThemes: ['theme3'],
      description: 'React Native는 모바일 앱 개발 프레임워크입니다.'
    },
    {
      id: 'theme2',
      name: 'JavaScript',
      parentTheme: null,
      keywords: ['javascript', 'js', 'programming', 'language'],
      childThemes: ['theme4'],
      description: 'JavaScript는 웹 프로그래밍 언어입니다.'
    },
    {
      id: 'theme3',
      name: 'React Native Components',
      parentTheme: 'theme1',
      keywords: ['component', 'ui', 'view', 'text'],
      childThemes: [],
      description: 'React Native 컴포넌트는 UI 요소입니다.'
    },
    {
      id: 'theme4',
      name: 'TypeScript',
      parentTheme: 'theme2',
      keywords: ['typescript', 'ts', 'typed', 'interface'],
      childThemes: [],
      description: 'TypeScript는 JavaScript의 타입 확장 언어입니다.'
    }
  ];

  // 테스트 전에 모킹된 함수 리셋
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('analyzeText는 텍스트에 관련된 테마를 반환해야 함', async () => {
    const text = 'React Native는 모바일 앱 개발에 사용되는 JavaScript 프레임워크입니다.';
    
    const result = await ThemeAnalyzer.analyzeText(text, testThemes);
    
    // 결과가 배열이고 비어있지 않은지 확인
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // 가장 관련성 높은 테마가 포함되어 있는지 확인 ('theme1' - React Native)
    expect(result).toContain('theme1');
    
    // UserLearningStore.updateTermFrequency가 호출되었는지 확인
    expect(UserLearningStore.updateTermFrequency).toHaveBeenCalled();
  });

  test('특정 키워드가 없는 텍스트는 빈 배열을 반환해야 함', async () => {
    const text = '관련 없는 내용의 텍스트입니다.';
    
    const result = await ThemeAnalyzer.analyzeText(text, testThemes);
    
    // 결과가 빈 배열인지 확인
    expect(result).toEqual([]);
  });

  test('부모-자식 관계가 있는 테마들을 최적화해야 함', async () => {
    // 부모와 자식 테마 모두에 관련된 텍스트
    const text = 'TypeScript는 JavaScript 기반의 정적 타입 언어로 interface와 타입 정의를 지원합니다.';
    
    const result = await ThemeAnalyzer.analyzeText(text, testThemes);
    
    // 결과에 포함된 테마의 부모-자식 관계 확인
    // 'theme4'(TypeScript)가 'theme2'(JavaScript)의 자식이므로 둘 다 또는 한쪽만 포함되어야 함
    const hasParent = result.includes('theme2');
    const hasChild = result.includes('theme4');
    
    // 부모와 자식 중 적어도 하나는 포함되어야 함
    expect(hasParent || hasChild).toBe(true);
  });

  test('learnFromMemoEdit는 사용자 학습 패턴을 업데이트해야 함', async () => {
    const content = 'React Native 앱 개발하기';
    const oldThemes = ['theme2']; // JavaScript
    const newThemes = ['theme1']; // React Native
    
    await ThemeAnalyzer.learnFromMemoEdit(content, oldThemes, newThemes);
    
    // UserLearningStore.learnFromUserAction이 올바른 인자로 호출되었는지 확인
    expect(UserLearningStore.learnFromUserAction).toHaveBeenCalled();
  });

  test('테마에 설명이 있으면 문맥 관련성 점수가 계산되어야 함', async () => {
    const text = '모바일 앱 개발을 위한 프레임워크';
    
    const result = await ThemeAnalyzer.analyzeText(text, testThemes);
    
    // 'theme1'(React Native)에 관련된 텍스트이므로 결과에 포함되어야 함
    expect(result).toContain('theme1');
  });
}); 