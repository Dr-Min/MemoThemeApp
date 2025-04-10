import { MemoService, DateGroup } from '../services/memo/MemoService';
import { Memo } from '../models/Memo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 모킹
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('MemoService', () => {
  // 테스트에 사용할 메모 데이터
  const testMemos: Memo[] = [
    {
      id: 'memo1',
      content: '첫 번째 메모입니다.',
      themes: ['theme1', 'theme2'],
      createdAt: new Date('2023-01-15T10:00:00Z'),
      updatedAt: new Date('2023-01-15T10:00:00Z')
    },
    {
      id: 'memo2',
      content: '두 번째 메모입니다.',
      themes: ['theme2'],
      createdAt: new Date('2023-02-20T14:30:00Z'),
      updatedAt: new Date('2023-02-20T15:00:00Z')
    },
    {
      id: 'memo3',
      content: '세 번째 메모입니다.',
      themes: ['theme3'],
      createdAt: new Date('2023-03-10T09:15:00Z'),
      updatedAt: new Date('2023-03-10T09:15:00Z')
    },
    {
      id: 'memo4',
      content: '네 번째 메모입니다.',
      themes: ['theme1', 'theme3'],
      createdAt: new Date('2023-03-15T16:45:00Z'),
      updatedAt: new Date('2023-03-15T16:45:00Z')
    }
  ];

  // 테스트 전에 모킹된 함수 리셋
  beforeEach(() => {
    jest.clearAllMocks();
    // AsyncStorage.getItem 모킹하여 테스트 메모 반환
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(testMemos));
  });

  test('getAllMemos는 모든 메모를 반환해야 함', async () => {
    const memos = await MemoService.getAllMemos();
    
    expect(memos).toHaveLength(testMemos.length);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('memo_app_memos');
  });

  test('addMemo는 새 메모를 추가하고 저장해야 함', async () => {
    const content = '새로운 메모 내용';
    const themes = ['theme1'];
    
    const newMemo = await MemoService.addMemo(content, themes);
    
    expect(newMemo.content).toBe(content);
    expect(newMemo.themes).toEqual(themes);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  test('updateMemo는 메모를 업데이트하고 저장해야 함', async () => {
    const updatedMemo = {
      ...testMemos[0],
      content: '수정된 메모 내용',
      themes: ['theme1', 'theme3']
    };
    
    await MemoService.updateMemo(updatedMemo);
    
    // AsyncStorage.setItem이 호출되었는지 확인
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    
    // setItem의 호출 인자를 확인
    const setItemArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const savedMemosJson = setItemArgs[1];
    const savedMemos = JSON.parse(savedMemosJson);
    
    // 업데이트된 메모가 있는지 확인
    const savedUpdatedMemo = savedMemos.find((memo: Memo) => memo.id === updatedMemo.id);
    expect(savedUpdatedMemo).toBeTruthy();
    expect(savedUpdatedMemo.content).toBe(updatedMemo.content);
    expect(savedUpdatedMemo.themes).toEqual(updatedMemo.themes);
  });

  test('deleteMemo는 메모를 삭제하고 저장해야 함', async () => {
    const memoIdToDelete = testMemos[2].id;
    
    await MemoService.deleteMemo(memoIdToDelete);
    
    // AsyncStorage.setItem이 호출되었는지 확인
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    
    // setItem의 호출 인자를 확인
    const setItemArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const savedMemosJson = setItemArgs[1];
    const savedMemos = JSON.parse(savedMemosJson);
    
    // 삭제된 메모가 없는지 확인
    const deletedMemoExists = savedMemos.some((memo: Memo) => memo.id === memoIdToDelete);
    expect(deletedMemoExists).toBe(false);
    // 다른 메모들은 남아있는지 확인
    expect(savedMemos.length).toBe(testMemos.length - 1);
  });

  test('sortMemosByDate는 메모를 날짜별로 정렬해야 함', () => {
    const sortedMemos = MemoService.sortMemosByDate(testMemos);
    
    // 날짜순으로 정렬되었는지 확인 (오래된 순)
    expect(sortedMemos[0].id).toBe('memo1'); // 가장 오래된 메모
    expect(sortedMemos[sortedMemos.length - 1].id).toBe('memo4'); // 가장 최근 메모
  });

  test('filterMemosByThemes는 AND 조건으로 테마를 필터링해야 함', () => {
    // 'theme1'과 'theme3' 모두 포함된 메모만 필터링
    const filteredMemos = MemoService.filterMemosByThemes(testMemos, ['theme1', 'theme3'], true);
    
    expect(filteredMemos).toHaveLength(1);
    expect(filteredMemos[0].id).toBe('memo4');
  });

  test('filterMemosByThemes는 OR 조건으로 테마를 필터링해야 함', () => {
    // 'theme1' 또는 'theme3'를 포함한 메모 필터링
    const filteredMemos = MemoService.filterMemosByThemes(testMemos, ['theme1', 'theme3'], false);
    
    expect(filteredMemos).toHaveLength(3); // memo1, memo3, memo4
    expect(filteredMemos.map(memo => memo.id).sort()).toEqual(['memo1', 'memo3', 'memo4'].sort());
  });

  test('filterMemosByDateRange는 날짜 범위로 메모를 필터링해야 함', () => {
    const startDate = new Date('2023-02-01');
    const endDate = new Date('2023-03-12');
    
    const filteredMemos = MemoService.filterMemosByDateRange(testMemos, startDate, endDate);
    
    expect(filteredMemos).toHaveLength(2); // memo2, memo3
    expect(filteredMemos.map(memo => memo.id).sort()).toEqual(['memo2', 'memo3'].sort());
  });

  test('groupMemosByDay는 메모를 일별로 그룹화해야 함', () => {
    const groupedMemos = MemoService.groupMemosByDay(testMemos);
    
    expect(groupedMemos).toHaveLength(4); // 4개의 다른 날짜
    
    // 각 그룹에 올바른 메모가 포함되어 있는지 확인
    const march15Group = groupedMemos.find(group => 
      group.date.getFullYear() === 2023 && 
      group.date.getMonth() === 2 && // 0-indexed, 3월은 2
      group.date.getDate() === 15
    );
    
    expect(march15Group).toBeTruthy();
    expect(march15Group!.memos).toHaveLength(1);
    expect(march15Group!.memos[0].id).toBe('memo4');
  });

  test('groupMemosByMonth는 메모를 월별로 그룹화해야 함', () => {
    const groupedMemos = MemoService.groupMemosByMonth(testMemos);
    
    expect(groupedMemos).toHaveLength(3); // 1월, 2월, 3월
    
    // 각 그룹에 올바른 메모가 포함되어 있는지 확인
    const marchGroup = groupedMemos.find(group => 
      group.date.getFullYear() === 2023 && 
      group.date.getMonth() === 2 // 0-indexed, 3월은 2
    );
    
    expect(marchGroup).toBeTruthy();
    expect(marchGroup!.memos).toHaveLength(2); // memo3, memo4
    expect(marchGroup!.memos.map(memo => memo.id).sort()).toEqual(['memo3', 'memo4'].sort());
  });

  test('groupMemosByYear는 메모를 연도별로 그룹화해야 함', () => {
    const groupedMemos = MemoService.groupMemosByYear(testMemos);
    
    expect(groupedMemos).toHaveLength(1); // 2023년만 있음
    expect(groupedMemos[0].label).toBe('2023년');
    expect(groupedMemos[0].memos).toHaveLength(testMemos.length);
  });
}); 