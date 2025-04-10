import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Switch, 
  StatusBar, 
  Platform, 
  Modal, 
  ScrollView, 
  Dimensions, 
  Alert,
  Animated,
  Easing
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { availableLanguages, changeLanguage, getCurrentLanguage } from '../i18n/i18n';
import MemoItem from '../components/MemoItem';
import { MemoInput } from '../components/MemoInput';
import { ThemeFilter } from '../components/ThemeFilter';
import { DateFilter, DateFilterMode } from '../components/DateFilter';
import { DateGroupedMemos } from '../components/DateGroupedMemos';
import { MemoService, DateGroup } from '../services/memo/MemoService';
import { ThemeService } from '../services/theme/ThemeService';
import { Memo, createMemo } from '../models/Memo';
import { Theme } from '../models/Theme';
import { ThemeAnalyzer } from '../services/theme/ThemeAnalyzer';
import { LinearGradient } from 'expo-linear-gradient';

// 상태바 높이 계산 (플랫폼별 처리)
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;
// 화면 너비 가져오기
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// 앱 색상 테마
const COLORS = {
  primary: '#4A6FFF',
  primaryDark: '#3D5CCC',
  primaryLight: '#EEF2FF',
  secondary: '#FF6B6B',
  accent: '#53D769',
  background: '#F9FAFC',
  card: '#FFFFFF',
  text: '#2C2E43',
  textSecondary: '#6E7191',
  border: '#E4E8F0',
  success: '#53D769',
  error: '#FF6B6B',
  warning: '#FFBC42',
  info: '#4799EB'
};

// 메모 아이템 렌더링 함수 제거
// const renderMemoItem = useCallback(({ item, index }: { item: Memo; index: number }) => {
//   return (
//     <MemoItem
//       memo={item}
//       themes={themes}
//       onPress={handleMemoPress}
//       onLongPress={handleMemoLongPress}
//       isSelected={selectedMemos.includes(item.id)}
//       selectionMode={selectionMode}
//       viewMode={viewMode}
//     />
//   );
// }, [themes, handleMemoPress, handleMemoLongPress, selectedMemos, selectionMode, viewMode]);

export const HomeScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMemos, setSelectedMemos] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [themeSelectionModalVisible, setThemeSelectionModalVisible] = useState(false);
  // 보기 모드 상태 추가 (standard 또는 chat)
  const [viewMode, setViewMode] = useState<'standard' | 'chat'>('chat');
  // 언어 선택 모달 상태 추가
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  // 현재 언어 상태
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  
  // FlatList 참조 추가
  const flatListRef = useRef<FlatList>(null);
  
  // 애니메이션 관련 코드 제거
  
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
    // 기존 데이터 로드 로직
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
  
  // 메모 추가 핸들러
  const handleAddMemo = async (text: string, initialThemes: string[] = []) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 새 메모 생성
      const newMemo = createMemo(text, initialThemes);
      
      let addedMemo;
      
      // 초기 테마가 없으면 테마 분석 수행
      if (initialThemes.length === 0) {
        console.log('메모 분석 시작...');
        addedMemo = await MemoService.analyzeMemoThemes(newMemo, themes);
        console.log('메모 분석 완료:', addedMemo.themes);
      } else {
        // 초기 테마가 있으면 그대로 추가
        addedMemo = await MemoService.saveMemoObject(newMemo);
      }
      
      // 메모 목록 업데이트
      setMemos(prevMemos => {
        const updatedMemos = [...prevMemos, addedMemo];
        return MemoService.sortMemosByDate(updatedMemos);
      });
    } catch (error) {
      console.error('메모 추가 실패:', error);
      Alert.alert(t('error'), t('errorAddingMemo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // MemoInput의 onSubmit 핸들러
  const handleMemoSubmit = async (text: string) => {
    // 선택된 테마들의 ID만 추출
    const themeIds = selectedThemes.map(theme => theme.id);
    await handleAddMemo(text, themeIds);
  };
  
  // 메모 선택 시 상세 화면으로 이동 또는 선택 처리
  const handleMemoPress = (memo: Memo) => {
    if (selectionMode) {
      toggleMemoSelection(memo.id);
    } else {
      navigation.navigate('MemoDetail', { memoId: memo.id });
    }
  };
  
  // 메모 길게 누르기 처리 - 선택 모드 활성화
  const handleMemoLongPress = (memo: Memo) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedMemos([memo.id]);
    }
  };
  
  // 메모 선택 토글
  const toggleMemoSelection = (memoId: string) => {
    setSelectedMemos(prev => {
      if (prev.includes(memoId)) {
        const newSelected = prev.filter(id => id !== memoId);
        // 선택된 메모가 없으면 선택 모드 비활성화
        if (newSelected.length === 0) {
          setSelectionMode(false);
        }
        return newSelected;
      } else {
        return [...prev, memoId];
      }
    });
  };
  
  // 전체 메모 선택
  const selectAllMemos = () => {
    setSelectedMemos(filteredMemos.map(memo => memo.id));
  };
  
  // 선택된 메모 삭제
  const deleteSelectedMemos = async () => {
    if (selectedMemos.length === 0) return;
    
    Alert.alert(
      '메모 삭제',
      `${selectedMemos.length}개의 메모를 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // 선택된 메모 삭제
              for (const memoId of selectedMemos) {
                await MemoService.deleteMemo(memoId);
              }
              
              // 데이터 다시 로드
              await loadData();
              
              // 선택 모드 초기화
              setSelectionMode(false);
              setSelectedMemos([]);
              
            } catch (error) {
              console.error('메모 삭제 실패:', error);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // 선택 모드 종료
  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedMemos([]);
  };
  
  // 선택된 메모에 테마 추가 모달 표시
  const showThemeSelectionModal = () => {
    if (selectedMemos.length === 0) return;
    setThemeSelectionModalVisible(true);
  };
  
  // 선택된 메모에 선택한 테마 추가
  const addThemeToSelectedMemos = async (themeId: string) => {
    try {
      setIsLoading(true);
      
      // 모든 메모 가져오기
      const allMemos = await MemoService.getAllMemos();
      
      // 선택된 메모들에 테마 추가
      for (const memoId of selectedMemos) {
        const memo = allMemos.find(m => m.id === memoId);
        if (memo) {
          // 이미 테마가 있으면 추가하지 않음
          if (!memo.themes.includes(themeId)) {
            memo.themes.push(themeId);
            await MemoService.updateMemo(memo);
          }
        }
      }
      
      // 데이터 다시 로드
      await loadData();
      
      // 테마 선택 모달 닫기
      setThemeSelectionModalVisible(false);
      
    } catch (error) {
      console.error('테마 추가 실패:', error);
    } finally {
      setIsLoading(false);
    }
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

  // 햄버거 메뉴 표시/숨김 전환
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // 보기 모드 전환 함수
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'standard' ? 'chat' : 'standard');
  };

  // 언어 변경 함수
  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setCurrentLanguage(langCode);
    setLanguageModalVisible(false);
  };

  // 컴포넌트 내부로 메모 아이템 렌더링 함수 이동
  const renderMemoItem = useCallback(({ item, index }: { item: Memo; index: number }) => {
    return (
      <MemoItem
        memo={item}
        themes={themes}
        onPress={handleMemoPress}
        onLongPress={handleMemoLongPress}
        isSelected={selectedMemos.includes(item.id)}
        selectionMode={selectionMode}
        viewMode={viewMode}
      />
    );
  }, [themes, handleMemoPress, handleMemoLongPress, selectedMemos, selectionMode, viewMode]);

  // useAndCondition 필터 상태 토글 함수
  const toggleUseAndCondition = () => {
    setUseAndCondition(!useAndCondition);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.title')}</Text>
          <View style={styles.headerButtons}>
            {selectionMode ? (
              <>
                <TouchableOpacity onPress={selectAllMemos} style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>{t('home.selectAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={showThemeSelectionModal} style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>{t('home.addTheme')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={deleteSelectedMemos} 
                  style={[styles.filterButton, styles.deleteButton]}
                >
                  <Text style={styles.deleteButtonText}>{t('home.deleteSelected')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelSelection} style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={toggleThemeFilter} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>
                    {showThemeFilter ? t('home.filterHide') : t('home.filterShow')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleViewMode} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>
                    {viewMode === 'standard' ? t('home.chatMode') : t('home.standardMode')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={goToThemeChatList} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{t('home.themeChat')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                  <Text style={styles.menuButtonText}>☰</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        {/* 햄버거 메뉴 모달 */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setMenuVisible(false);
                  goToThemes();
                }}
              >
                <Text style={styles.menuItemText}>{t('themeManagement.title')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setMenuVisible(false);
                  goToThemeVisualization();
                }}
              >
                <Text style={styles.menuItemText}>{t('themeVisualization.title')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setMenuVisible(false);
                  toggleDateFilter();
                }}
              >
                <Text style={styles.menuItemText}>
                  {showDateFilter ? t('home.filterHide') : t('home.filterShow')}
                </Text>
              </TouchableOpacity>
              
              {/* 언어 선택 메뉴 항목 추가 */}
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setMenuVisible(false);
                  setLanguageModalVisible(true);
                }}
              >
                <Text style={styles.menuItemText}>{t('settings.languageChange')}</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setMenuVisible(false);
                }}
              >
                <Text style={styles.menuCloseText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* 언어 선택 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={languageModalVisible}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setLanguageModalVisible(false)}
          >
            <View style={styles.languageSelectionContainer}>
              <Text style={styles.languageSelectionTitle}>{t('settings.languageChange')}</Text>
              <ScrollView style={styles.languageSelectionList}>
                {availableLanguages.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageSelectionItem,
                      currentLanguage === language.code && styles.activeLanguageItem
                    ]}
                    onPress={() => handleLanguageChange(language.code)}
                  >
                    <Text 
                      style={[
                        styles.languageSelectionItemText,
                        currentLanguage === language.code && styles.activeLanguageText
                      ]}
                    >
                      {language.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.languageSelectionCloseButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={styles.languageSelectionCloseButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* 테마 선택 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={themeSelectionModalVisible}
          onRequestClose={() => setThemeSelectionModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setThemeSelectionModalVisible(false)}
          >
            <View style={styles.themeSelectionContainer}>
              <Text style={styles.themeSelectionTitle}>{t('home.addTheme')}</Text>
              <ScrollView style={styles.themeSelectionList}>
                {themes.map(theme => (
                  <TouchableOpacity
                    key={theme.id}
                    style={styles.themeSelectionItem}
                    onPress={() => addThemeToSelectedMemos(theme.id)}
                  >
                    <Text style={styles.themeSelectionItemText}>{theme.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.themeSelectionCloseButton}
                onPress={() => setThemeSelectionModalVisible(false)}
              >
                <Text style={styles.themeSelectionCloseButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {showThemeFilter && (
          <View style={styles.filterContainer}>
            <ThemeFilter
              themes={themes}
              selectedThemes={selectedThemes.map(theme => theme.id)}
              onThemeSelect={handleThemeSelect}
              onClearFilters={clearThemeFilters}
              useAndCondition={useAndCondition}
              onFilterModeChange={setUseAndCondition}
            />
            
            <View style={styles.filterOptions}>
              <Text style={styles.filterModeText}>{t('filter.dateGrouping')}:</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>{t('filter.grouping')}</Text>
                <Switch
                  value={groupByDate}
                  onValueChange={toggleDateGrouping}
                  trackColor={{ false: '#CCD0DF', true: COLORS.primaryLight }}
                  thumbColor={groupByDate ? COLORS.primary : '#F4F4F5'}
                  ios_backgroundColor="#CCD0DF"
                />
              </View>
            </View>
          </View>
        )}
        
        {showDateFilter && (
          <View style={styles.filterContainer}>
            <DateFilter
              currentMode={dateFilterMode}
              startDate={dateRange.start}
              endDate={dateRange.end}
              onFilterChange={handleDateFilterChange}
            />
            
            <View style={styles.filterOptions}>
              <Text style={styles.filterModeText}>{t('filter.dateGrouping')}:</Text>
              <Switch
                value={groupByDate}
                onValueChange={toggleDateGrouping}
                trackColor={{ false: '#CCD0DF', true: COLORS.primaryLight }}
                thumbColor={groupByDate ? COLORS.primary : '#F4F4F5'}
                ios_backgroundColor="#CCD0DF"
              />
            </View>
            
            {groupByDate && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                style={styles.groupModeScroll}
                contentContainerStyle={styles.groupModeContainer}
              >
                <TouchableOpacity
                  style={[styles.groupModeButton, groupMode === 'day' && styles.activeGroupModeButton]}
                  onPress={() => changeGroupMode('day')}
                >
                  <Text style={[styles.groupModeText, groupMode === 'day' && styles.activeGroupModeText]}>{t('filter.day')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.groupModeButton, groupMode === 'month' && styles.activeGroupModeButton]}
                  onPress={() => changeGroupMode('month')}
                >
                  <Text style={[styles.groupModeText, groupMode === 'month' && styles.activeGroupModeText]}>{t('filter.month')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.groupModeButton, groupMode === 'year' && styles.activeGroupModeButton]}
                  onPress={() => changeGroupMode('year')}
                >
                  <Text style={[styles.groupModeText, groupMode === 'year' && styles.activeGroupModeText]}>{t('filter.year')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        )}
        
        <View style={styles.contentContainer}>
          {groupByDate ? (
            <DateGroupedMemos
              dateGroups={dateGroups}
              themes={themes}
              onMemoPress={handleMemoPress}
              onMemoLongPress={handleMemoLongPress}
              selectedMemos={selectedMemos}
              selectionMode={selectionMode}
              viewMode={viewMode}
            />
          ) : (
            <FlatList
              ref={flatListRef}
              style={styles.list}
              data={filteredMemos}
              keyExtractor={(item) => item.id}
              renderItem={renderMemoItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              initialNumToRender={10}
              windowSize={5}
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {(selectedThemes.length > 0 || dateFilterMode !== 'all')
                        ? t('home.noFilteredMemosMessage')
                        : t('home.noMemosMessage')}
                    </Text>
                    {(selectedThemes.length > 0 || dateFilterMode !== 'all') ? (
                      <View style={styles.emptyActions}>
                        {selectedThemes.length > 0 && (
                          <TouchableOpacity onPress={clearThemeFilters}>
                            <Text style={styles.clearFilterText}>{t('home.resetThemeFilter')}</Text>
                          </TouchableOpacity>
                        )}
                        {dateFilterMode !== 'all' && (
                          <TouchableOpacity onPress={() => handleDateFilterChange('all')}>
                            <Text style={styles.clearFilterText}>{t('home.resetDateFilter')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.emptySubText}>{t('home.addNewMemoMessage')}</Text>
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
    backgroundColor: COLORS.background,
    paddingTop: STATUSBAR_HEIGHT,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: -0.5,
    flexShrink: 1,
    marginRight: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    flex: 1,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 6,
    marginBottom: 4, 
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 6,
    marginBottom: 4, 
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FFEEEE',
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: '500',
    fontSize: 14,
  },
  menuButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: SCREEN_WIDTH * 0.65,
    maxWidth: 280,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginTop: 60,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
    height: SCREEN_HEIGHT - 120,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
    marginHorizontal: 8,
  },
  menuCloseText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  themeSelectionContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_WIDTH * 1.2,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    alignSelf: 'center',
    marginTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  themeSelectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  themeSelectionList: {
    maxHeight: SCREEN_WIDTH * 0.8,
  },
  themeSelectionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: 8,
  },
  themeSelectionItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  themeSelectionCloseButton: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  themeSelectionCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 6,
  },
  filterModeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginHorizontal: 4,
  },
  groupModeScroll: {
    maxWidth: '100%',
  },
  groupModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  groupModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeGroupModeButton: {
    backgroundColor: COLORS.primary,
  },
  groupModeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeGroupModeText: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  clearFilterText: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 8,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  emptyActions: {
    alignItems: 'center',
    marginTop: 8,
  },
  inputContainer: {
    padding: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  // 언어 선택 모달 스타일
  languageSelectionContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_WIDTH * 1.2,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    alignSelf: 'center',
    marginTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  languageSelectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  languageSelectionList: {
    maxHeight: SCREEN_WIDTH * 0.8,
  },
  languageSelectionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: 8,
  },
  activeLanguageItem: {
    backgroundColor: `${COLORS.primary}15`,
  },
  languageSelectionItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  activeLanguageText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  languageSelectionCloseButton: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  languageSelectionCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 