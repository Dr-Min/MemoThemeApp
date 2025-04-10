import nlp from 'compromise';
import { Theme } from '../../models/Theme';
import { UserLearningStore, FrequentTerm, WordThemePattern } from './UserLearningStore';

// 텍스트 토큰화 결과 인터페이스
interface TextAnalysisResult {
  nouns: string[];
  verbs: string[];
  adjectives: string[];
  entities: string[];
  phrases: string[];
  keyTerms: string[];
}

// 테마 관련성 점수 인터페이스
interface ThemeRelevance {
  themeId: string;
  score: number;
  scoreBreakdown: {
    keywordMatch: number;
    userPattern: number;
    frequencyBoost: number;
    contextRelevance: number;
    hierarchyBonus: number;
  };
}

export class ThemeAnalyzer {
  // 텍스트 내용 분석 후 가장 관련성 높은 테마 찾기
  static async analyzeText(text: string, themes: Theme[]): Promise<string[]> {
    if (!text || themes.length === 0) {
      return [];
    }

    // 텍스트 분석 결과 얻기
    const analysis = await this.analyzeTextContent(text);
    
    // 자주 사용되는 단어 가져오기
    const frequentTerms = await UserLearningStore.getFrequentTerms();
    
    // 사용자 패턴 가져오기
    const userPatterns = await UserLearningStore.getUserPatterns();
    
    // 사용자 패턴 학습을 위해 단어 빈도 업데이트
    await UserLearningStore.updateTermFrequency(analysis.keyTerms);
    
    // 각 테마별 관련성 점수 계산
    const themeScores: ThemeRelevance[] = [];
    
    for (const theme of themes) {
      // 1. 기본 키워드 매칭 점수 계산
      const keywordMatchScore = this.calculateMatchScore(analysis, theme.keywords);
      
      // 2. 사용자 패턴 기반 점수 계산
      const userPatternScore = await this.calculateUserPatternScore(analysis.keyTerms, theme.id, userPatterns);
      
      // 3. 자주 사용되는 단어 가중치 적용
      const frequencyBoost = this.calculateFrequencyBoost(analysis.keyTerms, frequentTerms);
      
      // 4. 문맥 관련성 점수 계산 
      const contextRelevance = this.calculateContextRelevance(analysis, theme);
      
      // 5. 계층 구조 보너스 점수
      const hierarchyBonus = this.calculateHierarchyBonus(theme, themes);
      
      // 최종 점수 계산 (각 항목에 가중치 적용)
      const finalScore = (keywordMatchScore * 0.35) + 
                         (userPatternScore * 0.25) + 
                         (frequencyBoost * 0.15) +
                         (contextRelevance * 0.15) +
                         (hierarchyBonus * 0.1);
      
      themeScores.push({
        themeId: theme.id,
        score: finalScore,
        scoreBreakdown: {
          keywordMatch: keywordMatchScore,
          userPattern: userPatternScore,
          frequencyBoost: frequencyBoost,
          contextRelevance: contextRelevance,
          hierarchyBonus: hierarchyBonus
        }
      });
    }
    
    // 점수 기준 내림차순 정렬
    themeScores.sort((a, b) => b.score - a.score);
    
    console.log('테마 점수:', themeScores.map(s => ({
      테마ID: s.themeId,
      테마명: themes.find(t => t.id === s.themeId)?.name,
      점수: s.score,
      키워드매칭: s.scoreBreakdown.keywordMatch,
      사용자패턴: s.scoreBreakdown.userPattern
    })));
    
    // 최소 점수 이상인 테마들만 선택 (더 높은 임계값으로 변경)
    // 매우 높은 관련성이 있는 테마만 자동으로 매칭되도록 임계값 상향
    let relevantThemes = themeScores
      .filter(item => item.score > 0.25)  // 임계값을 0.05에서 0.25로 상향
      .map(item => item.themeId);
    
    // 테마가 하나도 없다면 가장 높은 점수의 테마만 선택 (점수가 0.15 이상인 경우에만)
    if (relevantThemes.length === 0 && themeScores.length > 0 && themeScores[0].score > 0.15) {
      relevantThemes = [themeScores[0].themeId];
    }
    
    // 부모-자식 관계 고려해 최적화된 테마 선택
    const finalThemes = this.optimizeThemeHierarchy(relevantThemes, themes, themeScores);
    
    console.log('최종 선택된 테마:', finalThemes.map(id => 
      themes.find(t => t.id === id)?.name
    ));
    
    return finalThemes;
  }
  
  // 텍스트 토큰화 및 분석
  private static async analyzeTextContent(text: string): Promise<TextAnalysisResult> {
    // 텍스트를 소문자로 변환 - 특수문자는 공백으로 변환 (완전 제거 대신)
    const normalizedText = text.toLowerCase().replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ');
    
    // 더 간단한 단어 분리 로직 추가 (한국어 지원 향상)
    const words = normalizedText.split(/\s+/).filter(word => word.trim().length > 0);
    
    // Compromise.js를 사용하여 텍스트 분석 (영어 텍스트 처리)
    const doc = nlp(normalizedText);
    
    // 명사, 동사, 형용사 추출 (영어 텍스트의 경우)
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const adjectives = doc.adjectives().out('array');
    
    // 고유명사 및 개체(entity) 추출
    const entities = doc.match('#Noun+').out('array');
    
    // 구문(phrase) 추출 - 일반적으로 명사구나 동사구
    const phrases = doc.clauses().out('array');
    
    // 한국어 단어 처리 (compromise.js가 한국어를 제대로 처리하지 못함)
    // 모든 단어를 keyTerms에 추가
    const keyTerms = [...new Set([...words, ...nouns, ...verbs, ...adjectives, ...entities])];
    
    // 전체 원본 텍스트도 phrases에 추가 (원본 텍스트 전체도 매칭 가능)
    if (text.trim().length > 0) {
      phrases.push(text.trim());
    }
    
    return {
      nouns,
      verbs,
      adjectives,
      entities,
      phrases,
      keyTerms
    };
  }
  
  // 키워드 일치 점수 계산 - 한국어 처리 개선
  private static calculateMatchScore(analysis: TextAnalysisResult, keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0;
    
    let totalWeight = 0;
    let matchedWeight = 0;
    
    console.log('분석 결과:', analysis);
    console.log('키워드:', keywords);
    
    // 원본 텍스트
    const originalText = analysis.phrases[analysis.phrases.length - 1] || '';
    
    // 각 키워드에 대해 포함 여부 검사 (한국어 지원 강화)
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase().trim();
      if (keywordLower.length === 0) continue; // 빈 키워드 무시
      
      // 가중치 - 키워드 길이에 따라 증가 (한국어 단어도 처리)
      let weight = keywordLower.length > 1 ? 1 + (keywordLower.length * 0.1) : 1;
      totalWeight += weight;
      
      console.log(`키워드 검사: "${keywordLower}", 가중치: ${weight}`);
      
      // 1. 원본 텍스트에 키워드가 직접 포함되는지 검사 (가장 정확한 매치)
      if (originalText.toLowerCase().includes(keywordLower)) {
        console.log(`- 원본 텍스트에 직접 포함됨: "${keywordLower}" in "${originalText}"`);
        matchedWeight += weight * 1.5; // 가중치 더 높임 (1.2에서 1.5로)
        continue;
      }
      
      // 2. 구문에 키워드가 포함되는지 검사
      const phraseMatch = analysis.phrases.some(phrase => 
        phrase.toLowerCase().includes(keywordLower)
      );
      
      if (phraseMatch) {
        console.log(`- 구문에 포함됨: "${keywordLower}"`);
        matchedWeight += weight * 1.2; // 가중치 높임 (1.0에서 1.2로)
        continue;
      }
      
      // 3. 개별 단어 일치 검사 (부분 매칭) - 가중치 낮춤
      const keyTermMatch = analysis.keyTerms.some(term => 
        term.includes(keywordLower) || keywordLower.includes(term)
      );
      
      if (keyTermMatch) {
        console.log(`- 단어에 부분 포함됨: "${keywordLower}"`);
        matchedWeight += weight * 0.6; // 가중치 낮춤 (0.8에서 0.6으로)
        continue;
      }
      
      // 4. 단어 분리 후 개별 매칭 (공백으로 분리된 복합 키워드 처리) - 가중치 낮춤
      const keywordTerms = keywordLower.split(/\s+/).filter(term => term.length > 0);
      if (keywordTerms.length > 1) {
        const matchCount = keywordTerms.filter(term => 
          analysis.keyTerms.some(keyTerm => 
            keyTerm.includes(term) || term.includes(keyTerm)
          )
        ).length;
        
        if (matchCount > 0) {
          const matchRatio = matchCount / keywordTerms.length;
          const partialMatchWeight = weight * matchRatio * 0.5; // 가중치 낮춤 (0.7에서 0.5로)
          console.log(`- 복합 키워드 부분 일치: ${matchCount}/${keywordTerms.length}, 가중치: ${partialMatchWeight}`);
          matchedWeight += partialMatchWeight;
        }
      }
    }
    
    // 일치 비율 계산 (0~1 사이의 값)
    const finalScore = Math.min(1, totalWeight > 0 ? matchedWeight / totalWeight : 0);
    console.log(`최종 키워드 매칭 점수: ${finalScore}`);
    
    return finalScore;
  }
  
  // 사용자 패턴 기반 점수 계산 - 효율성 개선
  private static async calculateUserPatternScore(
    terms: string[], 
    themeId: string, 
    userPatterns: WordThemePattern[]
  ): Promise<number> {
    if (terms.length === 0 || userPatterns.length === 0) return 0;
    
    // 테마에 관련된 패턴만 필터링 - 효율성 향상
    const themePatterns = userPatterns.filter(p => p.themeId === themeId);
    if (themePatterns.length === 0) return 0;
    
    // 패턴별 최대 출현 횟수 파악
    const maxCount = Math.max(...themePatterns.map(p => p.count));
    if (maxCount === 0) return 0;
    
    let totalScore = 0;
    let matchFound = false;
    
    // 각 단어에 대해 해당 테마와의 관련성 검사
    for (const term of terms) {
      const termLower = term.toLowerCase();
      const matchingPatterns = themePatterns.filter(p => 
        p.word.toLowerCase() === termLower
      );
      
      if (matchingPatterns.length > 0) {
        matchFound = true;
        // 패턴의 출현 빈도에 따라 점수 가중치 부여 (0~1 사이로 정규화)
        const patternScore = Math.min(1, matchingPatterns.reduce((sum, p) => sum + p.count / maxCount, 0));
        totalScore += patternScore;
      }
    }
    
    // 매칭이 전혀 없으면 0 반환
    if (!matchFound) return 0;
    
    // 최종 점수 계산 (0~1 사이의 값)
    return Math.min(1, totalScore / terms.length);
  }
  
  // 자주 사용되는 단어 가중치 계산 - 효율성 개선
  private static calculateFrequencyBoost(terms: string[], frequentTerms: FrequentTerm[]): number {
    if (terms.length === 0 || frequentTerms.length === 0) return 0;
    
    const maxCount = Math.max(...frequentTerms.map(t => t.count));
    if (maxCount === 0) return 0;
    
    // 빠른 조회를 위한 Map 생성
    const frequencyMap = new Map<string, number>();
    frequentTerms.forEach(term => {
      frequencyMap.set(term.term, term.count / maxCount); // 0~1 사이로 정규화
    });
    
    let totalBoost = 0;
    let boostCount = 0;
    
    // 각 단어에 대해 출현 빈도 기반 가중치 부여
    for (const term of terms) {
      const termLower = term.toLowerCase();
      const normalizedFrequency = frequencyMap.get(termLower);
      
      if (normalizedFrequency) {
        totalBoost += normalizedFrequency;
        boostCount++;
      }
    }
    
    // 가중치가 적용된 단어가 없으면 0 반환
    if (boostCount === 0) return 0;
    
    // 평균 가중치 계산
    return totalBoost / boostCount;
  }
  
  // 문맥 관련성 점수 계산 (새 기능)
  private static calculateContextRelevance(analysis: TextAnalysisResult, theme: Theme): number {
    // 테마에 설명이 없으면 관련성을 평가할 수 없음
    if (!theme.description) return 0;
    
    const descWords = theme.description.toLowerCase().split(/\s+/);
    const uniqueDescWords = new Set(descWords.filter((word: string) => word.length > 2));
    
    if (uniqueDescWords.size === 0) return 0;
    
    // 문맥 관련성 - 설명에 포함된 단어들과 메모 내용의 단어들 간의 일치도
    const matches = analysis.keyTerms.filter(term => 
      Array.from(uniqueDescWords).some((word: string) => 
        term.includes(word) || word.includes(term)
      )
    );
    
    return Math.min(1, matches.length / uniqueDescWords.size);
  }
  
  // 계층 구조 보너스 점수 계산 (새 기능)
  private static calculateHierarchyBonus(theme: Theme, allThemes: Theme[]): number {
    let bonus = 0;
    
    // 자식 테마가 많은 경우 더 일반적인 테마일 가능성이 높음 (약간의 보너스)
    if (theme.childThemes && theme.childThemes.length > 0) {
      bonus += Math.min(0.3, theme.childThemes.length * 0.05);
    }
    
    // 부모 테마가 있는 경우 더 구체적인 테마일 가능성이 높음 (약간의 보너스)
    if (theme.parentTheme) {
      bonus += 0.1;
      
      // 형제 테마가 많을수록 더 구체적일 가능성이 높음
      const parentTheme = allThemes.find(t => t.id === theme.parentTheme);
      if (parentTheme && parentTheme.childThemes) {
        const siblingCount = parentTheme.childThemes.length;
        bonus += Math.min(0.2, siblingCount * 0.02);
      }
    }
    
    return Math.min(0.5, bonus); // 최대 0.5점의 보너스
  }
  
  // 테마 계층 구조 최적화 (부모-자식 관계 고려) - 개선된 알고리즘
  private static optimizeThemeHierarchy(
    themeIds: string[], 
    allThemes: Theme[],
    scores: ThemeRelevance[]
  ): string[] {
    if (themeIds.length <= 1) return themeIds;
    
    const result = [...themeIds];
    const themesMap = new Map<string, Theme>();
    const scoresMap = new Map<string, number>();
    
    // 테마 ID를 키로 하는 맵 생성
    allThemes.forEach(theme => themesMap.set(theme.id, theme));
    
    // 점수 맵 생성
    scores.forEach(score => scoresMap.set(score.themeId, score.score));
    
    // 계층 관계 분석 및 최적화
    const optimized = new Set<string>();
    const removed = new Set<string>();
    
    // 1. 부모-자식 관계 최적화
    for (const themeId of result) {
      if (removed.has(themeId)) continue;
      
      const theme = themesMap.get(themeId);
      if (!theme) continue;
      
      // 부모 테마와 자식 테마가 모두 결과에 포함된 경우
      if (theme.parentTheme && result.includes(theme.parentTheme) && !removed.has(theme.parentTheme)) {
        const parentScore = scoresMap.get(theme.parentTheme) || 0;
        const childScore = scoresMap.get(themeId) || 0;
        
        // 점수 차이가 크지 않으면 더 구체적인 자식 테마만 유지
        if (Math.abs(parentScore - childScore) < 0.2) {
          removed.add(theme.parentTheme);
          optimized.add(themeId);
        }
        // 자식 테마 점수가 현저히 낮으면 부모만 유지
        else if (childScore < parentScore * 0.7) {
          removed.add(themeId);
          optimized.add(theme.parentTheme);
        }
        // 그 외에는 둘 다 유지
        else {
          optimized.add(themeId);
          optimized.add(theme.parentTheme);
        }
      } else {
        optimized.add(themeId);
      }
      
      // 자식 테마들이 다수 포함되어 있으면 부모로 대체 고려
      if (theme.childThemes && theme.childThemes.length > 0) {
        const includedChildren = theme.childThemes.filter(id => result.includes(id) && !removed.has(id));
        
        // 자식 테마 중 50% 이상이 포함되어 있으면 부모 테마로 통합
        if (includedChildren.length > 1 && includedChildren.length >= theme.childThemes.length * 0.5) {
          includedChildren.forEach(id => removed.add(id));
          optimized.add(themeId);
        }
      }
    }
    
    // 2. 최종 결과 집합 생성
    return Array.from(optimized).filter(id => !removed.has(id));
  }
  
  // 날짜별 카테고리 이름 생성 (예: "2023년 6월")
  static getDateCategory(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed를 1-indexed로 변환
    
    // 한국어 표현 사용
    return `${year}년 ${month}월`;
  }
  
  // 메모 내용이 수정되었을 때 사용자 학습 진행
  static async learnFromMemoEdit(content: string, oldThemes: string[], newThemes: string[]): Promise<void> {
    // 테마가 변경되지 않았으면 학습할 필요 없음
    if (!content || (oldThemes.length === newThemes.length && oldThemes.every(t => newThemes.includes(t)))) {
      return;
    }
    
    // 텍스트 분석
    const analysis = await this.analyzeTextContent(content);
    
    // 제거된 테마 (이전에는 있었지만 새로운 테마 목록에는 없는 테마)
    const removedThemes = oldThemes.filter(t => !newThemes.includes(t));
    
    // 추가된 테마 (이전에는 없었지만 새로운 테마 목록에 있는 테마)
    const addedThemes = newThemes.filter(t => !oldThemes.includes(t));
    
    // 사용자 학습 로직 강화 - 텍스트와 테마의 관계성 학습
    await UserLearningStore.learnFromUserAction(analysis.keyTerms, removedThemes, addedThemes);
  }
} 