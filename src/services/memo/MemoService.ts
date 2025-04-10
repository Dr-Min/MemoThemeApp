import AsyncStorage from '@react-native-async-storage/async-storage';
import { Memo, createMemo } from '../../models/Memo';

// AsyncStorage 키
const MEMO_STORAGE_KEY = 'memo_app_memos';

// 날짜 그룹 타입 정의
export interface DateGroup {
  label: string;
  memos: Memo[];
  date: Date;
}

export class MemoService {
  // 모든 메모 가져오기
  static async getAllMemos(): Promise<Memo[]> {
    try {
      const memosJson = await AsyncStorage.getItem(MEMO_STORAGE_KEY);
      
      if (!memosJson) return [];
      
      // JSON 파싱
      const parsedMemos = JSON.parse(memosJson);
      
      // 날짜와 테마 필드 올바르게 변환
      return parsedMemos.map((memo: any) => ({
        ...memo,
        // 날짜 문자열을 Date 객체로 변환
        createdAt: new Date(memo.createdAt),
        updatedAt: new Date(memo.updatedAt),
        // themes가 undefined인 경우 빈 배열로 초기화
        themes: Array.isArray(memo.themes) ? memo.themes : []
      }));
    } catch (error) {
      console.error('메모 불러오기 실패:', error);
      return [];
    }
  }

  // 메모 저장하기
  static async saveMemos(memos: Memo[]): Promise<void> {
    try {
      const memosJson = JSON.stringify(memos);
      await AsyncStorage.setItem(MEMO_STORAGE_KEY, memosJson);
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  }

  // 새 메모 추가
  static async addMemo(content: string, themes: string[] = []): Promise<Memo> {
    const memos = await this.getAllMemos();
    const newMemo = createMemo(content, themes);
    await this.saveMemos([...memos, newMemo]);
    return newMemo;
  }

  // 메모 업데이트
  static async updateMemo(updatedMemo: Memo): Promise<void> {
    const memos = await this.getAllMemos();
    const now = new Date();
    
    const updatedMemos = memos.map(memo => {
      if (memo.id === updatedMemo.id) {
        return {
          ...updatedMemo,
          // Date 객체가 문자열로 변환되는 문제 방지를 위해 명시적으로 new Date() 사용
          createdAt: updatedMemo.createdAt instanceof Date ? updatedMemo.createdAt : new Date(updatedMemo.createdAt),
          updatedAt: now
        };
      }
      return memo;
    });
    
    await this.saveMemos(updatedMemos);
  }

  // 메모 삭제
  static async deleteMemo(memoId: string): Promise<void> {
    const memos = await this.getAllMemos();
    const filteredMemos = memos.filter(memo => memo.id !== memoId);
    await this.saveMemos(filteredMemos);
  }

  // 시간 순으로 메모 정렬 (최신순)
  static sortMemosByDate(memos: Memo[]): Memo[] {
    return [...memos].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // 특정 테마에 속한 메모들 찾기
  static filterMemosByTheme(memos: Memo[], themeId: string): Memo[] {
    return memos.filter(memo => memo.themes.includes(themeId));
  }
  
  // 여러 테마에 속한 메모들 찾기 (AND 조건: 모든 선택된 테마를 포함해야 함)
  static filterMemosByThemes(memos: Memo[], themeIds: string[], useAndCondition: boolean = true): Memo[] {
    if (themeIds.length === 0) {
      return memos;
    }
    
    if (useAndCondition) {
      // AND 조건: 모든 선택된 테마를 포함해야 함
      return memos.filter(memo => 
        themeIds.every(themeId => memo.themes.includes(themeId))
      );
    } else {
      // OR 조건: 선택된 테마 중 하나라도 포함되면 됨
      return memos.filter(memo => 
        memo.themes.some(themeId => themeIds.includes(themeId))
      );
    }
  }
  
  // 날짜 범위로 메모 필터링
  static filterMemosByDateRange(memos: Memo[], startDate: Date | undefined, endDate: Date | undefined): Memo[] {
    if (!startDate || !endDate) return memos;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return memos.filter(memo => {
      const memoDate = new Date(memo.createdAt);
      return memoDate >= start && memoDate <= end;
    });
  }
  
  // 일별로 메모 그룹화
  static groupMemosByDay(memos: Memo[]): DateGroup[] {
    const groups: { [key: string]: Memo[] } = {};
    
    memos.forEach(memo => {
      const date = new Date(memo.createdAt);
      const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(memo);
    });
    
    return Object.entries(groups).map(([dateKey, memos]) => {
      const [year, month, day] = dateKey.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day);
      
      return {
        label: `${year}년 ${month}월 ${day}일`,
        memos,
        date
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // 최신 날짜부터 정렬
  }
  
  // 월별로 메모 그룹화
  static groupMemosByMonth(memos: Memo[]): DateGroup[] {
    const groups: { [key: string]: Memo[] } = {};
    
    memos.forEach(memo => {
      const date = new Date(memo.createdAt);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      
      groups[monthKey].push(memo);
    });
    
    return Object.entries(groups).map(([monthKey, memos]) => {
      const [year, month] = monthKey.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, 1);
      
      return {
        label: `${year}년 ${month}월`,
        memos,
        date
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // 최신 월부터 정렬
  }
  
  // 년별로 메모 그룹화
  static groupMemosByYear(memos: Memo[]): DateGroup[] {
    const groups: { [key: string]: Memo[] } = {};
    
    memos.forEach(memo => {
      const date = new Date(memo.createdAt);
      const yearKey = `${date.getFullYear()}`;
      
      if (!groups[yearKey]) {
        groups[yearKey] = [];
      }
      
      groups[yearKey].push(memo);
    });
    
    return Object.entries(groups).map(([yearKey, memos]) => {
      const year = parseInt(yearKey, 10);
      const date = new Date(year, 0, 1);
      
      return {
        label: `${year}년`,
        memos,
        date
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // 최신 연도부터 정렬
  }
} 