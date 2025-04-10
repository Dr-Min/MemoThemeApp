import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 키
const USER_PATTERNS_KEY = 'memo_app_user_patterns';
const FREQUENT_TERMS_KEY = 'memo_app_frequent_terms';

// 단어-테마 연결 패턴 타입
export interface WordThemePattern {
  word: string;
  themeId: string;
  count: number;
}

// 자주 사용되는 단어 타입
export interface FrequentTerm {
  term: string;
  count: number;
}

export class UserLearningStore {
  // 사용자 단어-테마 패턴 가져오기
  static async getUserPatterns(): Promise<WordThemePattern[]> {
    try {
      const patternsJson = await AsyncStorage.getItem(USER_PATTERNS_KEY);
      return patternsJson ? JSON.parse(patternsJson) : [];
    } catch (error) {
      console.error('사용자 패턴 로드 실패:', error);
      return [];
    }
  }
  
  // 사용자 단어-테마 패턴 저장하기
  static async saveUserPatterns(patterns: WordThemePattern[]): Promise<void> {
    try {
      const patternsJson = JSON.stringify(patterns);
      await AsyncStorage.setItem(USER_PATTERNS_KEY, patternsJson);
    } catch (error) {
      console.error('사용자 패턴 저장 실패:', error);
    }
  }
  
  // 자주 사용되는 단어 가져오기
  static async getFrequentTerms(): Promise<FrequentTerm[]> {
    try {
      const termsJson = await AsyncStorage.getItem(FREQUENT_TERMS_KEY);
      return termsJson ? JSON.parse(termsJson) : [];
    } catch (error) {
      console.error('자주 사용 단어 로드 실패:', error);
      return [];
    }
  }
  
  // 자주 사용되는 단어 저장하기
  static async saveFrequentTerms(terms: FrequentTerm[]): Promise<void> {
    try {
      const termsJson = JSON.stringify(terms);
      await AsyncStorage.setItem(FREQUENT_TERMS_KEY, termsJson);
    } catch (error) {
      console.error('자주 사용 단어 저장 실패:', error);
    }
  }
  
  // 새로운 단어-테마 연결 추가/업데이트
  static async updateWordThemePattern(word: string, themeId: string): Promise<void> {
    const patterns = await this.getUserPatterns();
    const existingPattern = patterns.find(p => p.word === word && p.themeId === themeId);
    
    if (existingPattern) {
      // 기존 패턴 업데이트
      existingPattern.count += 1;
    } else {
      // 새 패턴 추가
      patterns.push({ word, themeId, count: 1 });
    }
    
    await this.saveUserPatterns(patterns);
  }
  
  // 단어 빈도 업데이트
  static async updateTermFrequency(terms: string[]): Promise<void> {
    const frequentTerms = await this.getFrequentTerms();
    
    for (const term of terms) {
      const normalizedTerm = term.toLowerCase().trim();
      if (normalizedTerm.length < 2) continue; // 너무 짧은 단어는 무시
      
      const existingTerm = frequentTerms.find(t => t.term === normalizedTerm);
      
      if (existingTerm) {
        existingTerm.count += 1;
      } else {
        frequentTerms.push({ term: normalizedTerm, count: 1 });
      }
    }
    
    // 출현 빈도 순으로 정렬
    frequentTerms.sort((a, b) => b.count - a.count);
    
    // 너무 많아지지 않도록 상위 100개만 유지
    const trimmedTerms = frequentTerms.slice(0, 100);
    
    await this.saveFrequentTerms(trimmedTerms);
  }
  
  // 특정 단어에 대한 가장 관련성 높은 테마 ID 가져오기
  static async getMostRelevantThemeForWord(word: string): Promise<string | null> {
    const patterns = await this.getUserPatterns();
    const wordPatterns = patterns.filter(p => p.word === word);
    
    if (wordPatterns.length === 0) return null;
    
    // 출현 빈도 기준 정렬
    wordPatterns.sort((a, b) => b.count - a.count);
    
    // 가장 많이 매핑된 테마 반환
    return wordPatterns[0].themeId;
  }
  
  // 메모 내용 변경 시 학습 (사용자가 수동으로 테마 변경했을 때)
  static async learnFromUserAction(terms: string[] | string, oldThemes: string[], newThemes: string[]): Promise<void> {
    // 입력이 문자열인 경우 처리
    let processedTerms: string[] = [];
    
    if (typeof terms === 'string') {
      // 텍스트 정규화
      const normalizedText = terms.toLowerCase().replace(/[^\w\s]/g, ' ');
      
      // 단어 추출 - 더 짧은 단어도 포함 (2글자 이상)
      processedTerms = normalizedText.split(/\s+/).filter(word => word.length >= 2);
    } else {
      processedTerms = terms.filter(term => term.length >= 2);
    }
    
    // 자주 사용되는 단어 업데이트
    await this.updateTermFrequency(processedTerms);
    
    // 제거된 테마 (이전에는 있었지만 새로운 테마 목록에는 없는 테마)
    const removedThemes = oldThemes.filter(t => !newThemes.includes(t));
    
    // 추가된 테마 (이전에는 없었지만 새로운 테마 목록에 있는 테마)
    const addedThemes = newThemes.filter(t => !oldThemes.includes(t));
    
    // 빈 배열이면 학습할 필요 없음
    if (addedThemes.length === 0 && removedThemes.length === 0) return;
    
    // 단어-테마 패턴 업데이트 - 학습 강화
    for (const word of processedTerms) {
      // 새로 추가된 테마에 대한 긍정적 학습
      for (const themeId of addedThemes) {
        await this.updateWordThemePattern(word, themeId);
      }
      
      // 제거된 테마에 대한 부정적 학습 (카운트 감소)
      // 구현을 위해서는 updateWordThemePattern을 수정해야 함
    }
    
    // 구문 분석: 2-3개 단어 구문 추출 및 학습
    if (processedTerms.length >= 2) {
      for (let i = 0; i < processedTerms.length - 1; i++) {
        // 2단어 구문
        const phrase = `${processedTerms[i]} ${processedTerms[i+1]}`;
        
        for (const themeId of addedThemes) {
          await this.updateWordThemePattern(phrase, themeId);
        }
        
        // 3단어 구문
        if (i < processedTerms.length - 2) {
          const phrase3 = `${processedTerms[i]} ${processedTerms[i+1]} ${processedTerms[i+2]}`;
          
          for (const themeId of addedThemes) {
            await this.updateWordThemePattern(phrase3, themeId);
          }
        }
      }
    }
  }
  
  // 모든 데이터 초기화
  static async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_PATTERNS_KEY);
      await AsyncStorage.removeItem(FREQUENT_TERMS_KEY);
    } catch (error) {
      console.error('데이터 초기화 실패:', error);
    }
  }
} 