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
      
      // 6. 의미적 유사도 제거
      
      // 최종 점수 계산 (원래 가중치로 복원)
      const finalScore = 
          (keywordMatchScore * 0.35) + 
          (userPatternScore * 0.25) + 
          (frequencyBoost * 0.15) +
          (contextRelevance * 0.15) +
          (hierarchyBonus * 0.10);
      
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
      사용자패턴: s.scoreBreakdown.userPattern,
    })));
    
    // 최소 점수 이상인 테마들만 선택 (원래 임계값으로 복원)
    let relevantThemes = themeScores
      .filter((item: ThemeRelevance) => item.score > 0.05) // 임계값 0.05로 복원
      .map((item: ThemeRelevance) => item.themeId);
    
    // 테마가 하나도 없다면 가장 높은 점수의 테마만 선택 (원래 조건)
    if (relevantThemes.length === 0 && themeScores.length > 0 && themeScores[0].score > 0.01) {
      relevantThemes = [themeScores[0].themeId];
    }
    
    // 부모-자식 관계 고려해 최적화된 테마 선택
    const finalThemes = this.optimizeThemeHierarchy(relevantThemes, themes, themeScores);
    
    console.log('최종 선택된 테마:', finalThemes.map(id => 
      themes.find(t => t.id === id)?.name
    ));
    
    return finalThemes;
  }
  
  // 텍스트 토큰화 및 분석 (기존 방식 복원)
  private static async analyzeTextContent(text: string): Promise<TextAnalysisResult> {
    // 텍스트를 소문자로 변환 - 특수문자는 공백으로 변환
    const normalizedText = text.toLowerCase().replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ');
    
    // 단어 분리 (기존)
    const words = normalizedText.split(/\s+/).filter(word => word.trim().length > 0);
    
    // Compromise.js 사용 (기존)
    const doc = nlp(normalizedText);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const adjectives = doc.adjectives().out('array');
    const entities = doc.match('#Noun+').out('array');
    const phrases = doc.clauses().out('array');
    const keyTerms = [...new Set([...words, ...nouns, ...verbs, ...adjectives, ...entities])];
    
    if (text.trim().length > 0) {
      phrases.push(text.trim());
    }
    
    return {
      nouns,
      verbs,
      adjectives,
      entities,
      phrases,
      keyTerms,
    };
  }
  
  // calculateMatchScore (기존 방식 복원)
  private static calculateMatchScore(analysis: TextAnalysisResult, keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0;
    let totalWeight = 0;
    let matchedWeight = 0;
    const originalText = analysis.phrases[analysis.phrases.length - 1] || '';
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase().trim();
      if (keywordLower.length === 0) continue;
      let weight = keywordLower.length > 1 ? 1 + (keywordLower.length * 0.1) : 1;
      totalWeight += weight;
      if (originalText.toLowerCase().includes(keywordLower)) {
        matchedWeight += weight * 1.5; // 가중치 높음
        continue;
      }
      const phraseMatch = analysis.phrases.some(phrase => 
        phrase.toLowerCase().includes(keywordLower)
      );
      if (phraseMatch) {
        matchedWeight += weight * 1.2;
        continue;
      }
      const keyTermMatch = analysis.keyTerms.some(term => 
        term.includes(keywordLower) || keywordLower.includes(term)
      );
      if (keyTermMatch) {
        matchedWeight += weight * 0.6;
        continue;
      }
      const keywordTerms = keywordLower.split(/\s+/).filter(term => term.length > 0);
      if (keywordTerms.length > 1) {
        const matchCount = keywordTerms.filter(term => 
          analysis.keyTerms.some(keyTerm => 
            keyTerm.includes(term) || term.includes(keyTerm)
          )
        ).length;
        if (matchCount > 0) {
          const matchRatio = matchCount / keywordTerms.length;
          const partialMatchWeight = weight * matchRatio * 0.5;
          matchedWeight += partialMatchWeight;
        }
      }
    }
    const finalScore = Math.min(1, totalWeight > 0 ? matchedWeight / totalWeight : 0);
    return finalScore;
  }
  
  // calculateUserPatternScore (기존 방식 유지)
  private static async calculateUserPatternScore(
    terms: string[], 
    themeId: string, 
    userPatterns: WordThemePattern[]
  ): Promise<number> {
    if (terms.length === 0 || userPatterns.length === 0) return 0;
    const themePatterns = userPatterns.filter(p => p.themeId === themeId);
    if (themePatterns.length === 0) return 0;
    const maxCount = Math.max(...themePatterns.map(p => p.count));
    if (maxCount === 0) return 0;
    let totalScore = 0;
    let matchFound = false;
    for (const term of terms) {
      const termLower = term.toLowerCase();
      const matchingPatterns = themePatterns.filter(p => 
        p.word.toLowerCase() === termLower
      );
      if (matchingPatterns.length > 0) {
        matchFound = true;
        const patternScore = Math.min(1, matchingPatterns.reduce((sum, p) => sum + p.count / maxCount, 0));
        totalScore += patternScore;
      }
    }
    if (!matchFound) return 0;
    return Math.min(1, totalScore / terms.length);
  }
  
  // calculateFrequencyBoost (기존 방식 유지)
  private static calculateFrequencyBoost(terms: string[], frequentTerms: FrequentTerm[]): number {
    if (terms.length === 0 || frequentTerms.length === 0) return 0;
    const maxCount = Math.max(...frequentTerms.map(t => t.count));
    if (maxCount === 0) return 0;
    const frequencyMap = new Map<string, number>();
    frequentTerms.forEach(term => {
      frequencyMap.set(term.term, term.count / maxCount);
    });
    let totalBoost = 0;
    let boostCount = 0;
    for (const term of terms) {
      const termLower = term.toLowerCase();
      const normalizedFrequency = frequencyMap.get(termLower);
      if (normalizedFrequency) {
        totalBoost += normalizedFrequency;
        boostCount++;
      }
    }
    if (boostCount === 0) return 0;
    return totalBoost / boostCount;
  }
  
  // calculateContextRelevance (기존 방식 유지)
  private static calculateContextRelevance(analysis: TextAnalysisResult, theme: Theme): number {
    if (!theme.description) return 0;
    const descWords = theme.description.toLowerCase().split(/\s+/);
    const uniqueDescWords = new Set(descWords.filter((word: string) => word.length > 2));
    if (uniqueDescWords.size === 0) return 0;
    const matches = analysis.keyTerms.filter(term => 
      Array.from(uniqueDescWords).some((word: string) => 
        term.includes(word) || word.includes(term)
      )
    );
    return Math.min(1, matches.length / uniqueDescWords.size);
  }
  
  // calculateHierarchyBonus (기존 방식 유지)
  private static calculateHierarchyBonus(theme: Theme, allThemes: Theme[]): number {
    let bonus = 0;
    if (theme.childThemes && theme.childThemes.length > 0) {
      bonus += Math.min(0.3, theme.childThemes.length * 0.05);
    }
    if (theme.parentTheme) {
      bonus += 0.1;
      const parentTheme = allThemes.find(t => t.id === theme.parentTheme);
      if (parentTheme && parentTheme.childThemes) {
        const siblingCount = parentTheme.childThemes.length;
        bonus += Math.min(0.2, siblingCount * 0.02);
      }
    }
    return Math.min(0.5, bonus);
  }
  
  // optimizeThemeHierarchy (기존 방식 유지)
  private static optimizeThemeHierarchy(
    themeIds: string[], 
    allThemes: Theme[],
    scores: ThemeRelevance[]
  ): string[] {
    if (themeIds.length <= 1) return themeIds;
    const result = [...themeIds];
    const themesMap = new Map<string, Theme>();
    const scoresMap = new Map<string, number>();
    allThemes.forEach(theme => themesMap.set(theme.id, theme));
    scores.forEach(score => scoresMap.set(score.themeId, score.score));
    const optimized = new Set<string>();
    const removed = new Set<string>();
    for (const themeId of result) {
      if (removed.has(themeId)) continue;
      const theme = themesMap.get(themeId);
      if (!theme) continue;
      if (theme.parentTheme && result.includes(theme.parentTheme) && !removed.has(theme.parentTheme)) {
        const parentScore = scoresMap.get(theme.parentTheme) || 0;
        const childScore = scoresMap.get(themeId) || 0;
        if (Math.abs(parentScore - childScore) < 0.2) {
          removed.add(theme.parentTheme);
          optimized.add(themeId);
        } else if (childScore < parentScore * 0.7) {
          removed.add(themeId);
          optimized.add(theme.parentTheme);
        } else {
          optimized.add(themeId);
          optimized.add(theme.parentTheme);
        }
      } else {
        optimized.add(themeId);
      }
      if (theme.childThemes && theme.childThemes.length > 0) {
        const includedChildren = theme.childThemes.filter(id => result.includes(id) && !removed.has(id));
        if (includedChildren.length > 1 && includedChildren.length >= theme.childThemes.length * 0.5) {
          includedChildren.forEach(id => removed.add(id));
          optimized.add(themeId);
        }
      }
    }
    return Array.from(optimized).filter(id => !removed.has(id));
  }
  
  // getDateCategory (기존 방식 유지)
  static getDateCategory(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}년 ${month}월`;
  }
  
  // learnFromMemoEdit (기존 방식 유지)
  static async learnFromMemoEdit(content: string, oldThemes: string[], newThemes: string[]): Promise<void> {
    if (!content || (oldThemes.length === newThemes.length && oldThemes.every(t => newThemes.includes(t)))) {
      return;
    }
    const analysis = await this.analyzeTextContent(content);
    const removedThemes = oldThemes.filter(t => !newThemes.includes(t));
    const addedThemes = newThemes.filter(t => !oldThemes.includes(t));
    await UserLearningStore.learnFromUserAction(analysis.keyTerms, removedThemes, addedThemes);
  }
} 