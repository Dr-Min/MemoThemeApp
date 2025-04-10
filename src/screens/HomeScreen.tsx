import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, SafeAreaView, TouchableOpacity, Switch, StatusBar, Platform } from 'react-native';
import { MemoItem } from '../components/MemoItem';
import { MemoInput } from '../components/MemoInput';
import { ThemeFilter } from '../components/ThemeFilter';
import { DateFilter, DateFilterMode } from '../components/DateFilter';
import { DateGroupedMemos } from '../components/DateGroupedMemos';
import { MemoService, DateGroup } from '../services/memo/MemoService';
import { ThemeService } from '../services/theme/ThemeService';
import { Memo, createMemo } from '../models/Memo';
import { Theme } from '../models/Theme';
import { ThemeAnalyzer } from '../services/theme/ThemeAnalyzer';

// 상태바 높이 계산 (플랫폼별 처리)
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const HomeScreen = ({ navigation }: any) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThemes, setSelectedThemes] = useState<Theme[]>([]);
  const [showThemeFilter, setShowThemeFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [useAndCondition, setUseAndCondition] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({ start: undefined, end: undefined });
  const [groupByDate, setGroupByDate] = useState(false);
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [groupMode, setGroupMode] = useState<'day' | 'month' | 'year'>('day');
  const [showDateGroups, setShowDateGroups] = useState(false);
  const [dateGroupingMode, setDateGroupingMode] = useState<DateFilterMode>('all');
  const [groupedMemos, setGroupedMemos] = useState<DateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 데이터 불러오기
  const loadData = async () => {
    setLoading(true);
    try {
      const allMemos = await MemoService.getAllMemos();
      const allThemes = await ThemeService.getAllThemes();
      
      // 시간순 정렬 (최신 메모가 하단에 표시되도록 오래된순 정렬)
      const sortedMemos = MemoService.sortMemosByDate(allMemos);
      
      setMemos(sortedMemos);
      setFilteredMemos(sortedMemos);
      setThemes(allThemes);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 필터링된 메모 목록 계산
  const getFilteredMemos = () => {
    console.log('필터링 수행:');
    console.log('- 전체 메모 수:', memos.length);
    console.log('- 선택된 테마:', selectedThemes.map(theme => theme.id));
    console.log('- 필터 모드:', useAndCondition ? 'AND' : 'OR');
    
    let filtered = [...memos];
    
    // 테마 필터 적용
    if (selectedThemes.length > 0) {
      filtered = MemoService.filterMemosByThemes(filtered, selectedThemes.map(theme => theme.id), useAndCondition);
      console.log('- 테마 필터 후 메모 수:', filtered.length);
    }
    
    // 날짜 필터 적용
    if (dateRange.start && dateRange.end) {
      filtered = MemoService.filterMemosByDateRange(
        filtered, 
        dateRange.start, 
        dateRange.end
      );
      console.log('- 날짜 필터 후 메모 수:', filtered.length);
    }
    
    // 결과 반환
    console.log('- 최종 필터링된 메모 수:', filtered.length);
    return filtered;
  };
  
  // 필터링 적용
  useEffect(() => {
    // getFilteredMemos 함수 사용
    const filteredResults = getFilteredMemos();
    
    // 날짜 그룹화 모드에 따라 처리
    if (groupByDate) {
      let groupedResult;
      
      switch(groupMode) {
        case 'day':
          groupedResult = MemoService.groupMemosByDay(filteredResults);
          break;
        case 'month':
          groupedResult = MemoService.groupMemosByMonth(filteredResults);
          break;
        case 'year':
          groupedResult = MemoService.groupMemosByYear(filteredResults);
          break;
        default:
          groupedResult = MemoService.groupMemosByDay(filteredResults);
      }
      
      setDateGroups(groupedResult);
    } else {
      setFilteredMemos(filteredResults);
    }
  }, [memos, selectedThemes, useAndCondition, dateFilterMode, dateRange, groupByDate, groupMode]);
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
    
    // 화면에 포커스 올 때마다 데이터 새로고침
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // 테마 필터 토글
  const toggleThemeFilter = () => {
    console.log('테마 필터 토글:', !showThemeFilter);
    setShowThemeFilter(!showThemeFilter);
  };

  // 테마 선택 처리
  const handleThemeSelect = (themeId: string) => {
    console.log('테마 선택:', themeId);
    setSelectedThemes(prev => {
      if (prev.some(theme => theme.id === themeId)) {
        return prev.filter(theme => theme.id !== themeId);
      } else {
        const themeToAdd = themes.find(theme => theme.id === themeId);
        if (themeToAdd) {
          return [...prev, themeToAdd];
        }
        return prev;
      }
    });
  };

  // 테마 필터 초기화
  const clearThemeFilters = () => {
    console.log('테마 필터 초기화');
    setSelectedThemes([]);
  };
  
  // 날짜 필터 표시/숨김 전환
  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
  };
  
  // 날짜 그룹화 토글
  const toggleDateGrouping = () => {
    setGroupByDate(!groupByDate);
  };
  
  // 날짜 필터 변경 처리
  const handleDateFilterChange = (mode: DateFilterMode, startDate?: Date, endDate?: Date) => {
    setDateFilterMode(mode);
    setDateRange({ start: startDate, end: endDate });
    
    // 날짜 필터링 모드에 따라 그룹화 모드도 설정
    if (mode === 'day') {
      setGroupMode('day');
    } else if (mode === 'month') {
      setGroupMode('month');
    } else if (mode === 'year') {
      setGroupMode('year');
    }
  };
  
  // 메모 추가 처리
  const handleAddMemo = async (text: string, themeIds: string[] = []) => {
    if (text.trim().length === 0 || isSubmitting) return;
    
    try {
      console.log(`메모 추가 시작: ${text}`);
      setIsLoading(true);
      setIsSubmitting(true); // 중복 제출 방지
      
      let finalThemeIds = themeIds;
      
      // themeIds가 비어있으면 테마 자동 분석 및 현재 필터 테마 사용
      if (themeIds.length === 0) {
        // 1. 테마 자동 분석 수행
        const suggestedThemes = await ThemeAnalyzer.analyzeText(text, themes);
        console.log('추천된 테마:', suggestedThemes);
        
        // 2. 현재 필터로 선택된 테마 사용
        const selectedThemeIds = selectedThemes.map(theme => theme.id);
        
        // 3. 두 결과 병합 (중복 제거)
        finalThemeIds = [...new Set([...suggestedThemes, ...selectedThemeIds])];
      }
      
      await MemoService.addMemo(text, finalThemeIds);
      await loadData();
      
      console.log('메모 추가 완료');
    } catch (error) {
      console.error('메모 추가 실패:', error);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false); // 제출 상태 초기화
    }
  };

  // MemoInput의 onSubmit 핸들러
  const handleMemoSubmit = async (text: string) => {
    // 선택된 테마들의 ID만 추출
    const themeIds = selectedThemes.map(theme => theme.id);
    await handleAddMemo(text, themeIds);
  };
  
  // 메모 선택 시 상세 화면으로 이동
  const handleMemoPress = (memo: Memo) => {
    navigation.navigate('MemoDetail', { memoId: memo.id });
  };
  
  // 테마 관리 화면으로 이동
  const goToThemes = () => {
    navigation.navigate('ThemeManagement');
  };

  // 테마 시각화 화면으로 이동
  const goToThemeVisualization = () => {
    navigation.navigate('ThemeVisualization');
  };

  // 테마 채팅 목록 화면으로 이동
  const goToThemeChatList = () => {
    navigation.navigate('ThemeChatList');
  };
  
  // 그룹화 모드 변경
  const changeGroupMode = (mode: 'day' | 'month' | 'year') => {
    setGroupMode(mode);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>메모</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={toggleThemeFilter} style={styles.filterButton}>
              <Text style={styles.filterButtonText}>
                테마 필터 {showThemeFilter ? '숨기기' : '표시'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleDateFilter} style={styles.filterButton}>
              <Text style={styles.filterButtonText}>
                날짜 필터 {showDateFilter ? '숨기기' : '표시'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToThemeVisualization} style={styles.filterButton}>
              <Text style={styles.filterButtonText}>통계</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToThemeChatList} style={styles.filterButton}>
              <Text style={styles.filterButtonText}>테마 채팅</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToThemes}>
              <Text style={styles.themesButton}>테마 관리</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {showThemeFilter && (
          <View>
            <ThemeFilter
              themes={themes}
              selectedThemes={selectedThemes.map(theme => theme.id)}
              onThemeSelect={handleThemeSelect}
              onClearFilters={clearThemeFilters}
              useAndCondition={useAndCondition}
              onFilterModeChange={setUseAndCondition}
            />
            
            <View style={styles.filterOptions}>
              <Text style={styles.filterModeText}>날짜 그룹화 모드:</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>그룹화</Text>
                <Switch
                  value={groupByDate}
                  onValueChange={toggleDateGrouping}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={groupByDate ? '#007AFF' : '#f4f3f4'}
                />
              </View>
            </View>
          </View>
        )}
        
        {showDateFilter && (
          <View>
            <DateFilter
              currentMode={dateFilterMode}
              startDate={dateRange.start}
              endDate={dateRange.end}
              onFilterChange={handleDateFilterChange}
            />
            
            <View style={styles.filterOptions}>
              <Text style={styles.filterModeText}>날짜별 그룹화:</Text>
              <Switch
                value={groupByDate}
                onValueChange={toggleDateGrouping}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={groupByDate ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            
            {groupByDate && (
              <View style={styles.groupModeContainer}>
                <TouchableOpacity
                  style={[styles.groupModeButton, groupMode === 'day' && styles.activeGroupModeButton]}
                  onPress={() => changeGroupMode('day')}
                >
                  <Text style={[styles.groupModeText, groupMode === 'day' && styles.activeGroupModeText]}>일별</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.groupModeButton, groupMode === 'month' && styles.activeGroupModeButton]}
                  onPress={() => changeGroupMode('month')}
                >
                  <Text style={[styles.groupModeText, groupMode === 'month' && styles.activeGroupModeText]}>월별</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.groupModeButton, groupMode === 'year' && styles.activeGroupModeButton]}
                  onPress={() => changeGroupMode('year')}
                >
                  <Text style={[styles.groupModeText, groupMode === 'year' && styles.activeGroupModeText]}>연도별</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.contentContainer}>
          {groupByDate ? (
            <DateGroupedMemos
              dateGroups={dateGroups}
              themes={themes}
              onMemoPress={handleMemoPress}
            />
          ) : (
            <FlatList
              style={styles.list}
              data={filteredMemos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MemoItem memo={item} themes={themes} onPress={handleMemoPress} />
              )}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {(selectedThemes.length > 0 || dateFilterMode !== 'all')
                        ? '선택한 필터 조건에 해당하는 메모가 없습니다.' 
                        : '메모가 없습니다.'}
                    </Text>
                    {(selectedThemes.length > 0 || dateFilterMode !== 'all') ? (
                      <View style={styles.emptyActions}>
                        {selectedThemes.length > 0 && (
                          <TouchableOpacity onPress={clearThemeFilters}>
                            <Text style={styles.clearFilterText}>테마 필터 초기화</Text>
                          </TouchableOpacity>
                        )}
                        {dateFilterMode !== 'all' && (
                          <TouchableOpacity onPress={() => handleDateFilterChange('all')}>
                            <Text style={styles.clearFilterText}>날짜 필터 초기화</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.emptySubText}>새 메모를 추가해보세요!</Text>
                    )}
                  </View>
                ) : null
              }
            />
          )}
        </View>
        
        <View style={styles.inputContainer}>
          <MemoInput onSubmit={handleMemoSubmit} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: STATUSBAR_HEIGHT,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themesButton: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  filterButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  filterOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterModeText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  emptyActions: {
    alignItems: 'center',
    marginTop: 8,
  },
  groupModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  groupModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eaeaea',
    marginHorizontal: 4,
  },
  activeGroupModeButton: {
    backgroundColor: '#007AFF',
  },
  groupModeText: {
    fontSize: 14,
    color: '#444',
  },
  activeGroupModeText: {
    color: '#fff',
  },
  inputContainer: {
    padding: 16,
  },
}); 