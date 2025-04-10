import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, FlatList, TextInput } from 'react-native';
import { Theme } from '../models/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 검색 히스토리 저장 키
const THEME_FILTER_HISTORY_KEY = 'memo_app_theme_filter_history';

// 저장된, 즐겨찾기 필터 타입
interface SavedFilter {
  id: string;
  name: string;
  themeIds: string[];
  useAndCondition: boolean;
}

interface ThemeFilterProps {
  themes: Theme[];
  selectedThemes: string[];
  onThemeSelect: (themeId: string) => void;
  onClearFilters: () => void;
  useAndCondition: boolean;
  onFilterModeChange: (useAnd: boolean) => void;
}

export const ThemeFilter: React.FC<ThemeFilterProps> = ({
  themes,
  selectedThemes,
  onThemeSelect,
  onClearFilters,
  useAndCondition,
  onFilterModeChange
}) => {
  // 검색 히스토리
  const [filterHistory, setFilterHistory] = useState<SavedFilter[]>([]);
  // 즐겨찾기 필터
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  // 모달 상태
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');

  // 검색 히스토리 로드
  useEffect(() => {
    loadFilterHistory();
  }, []);

  // 디버깅 정보 출력
  useEffect(() => {
    console.log('ThemeFilter - 현재 데이터:');
    console.log('- 사용 가능한 테마:', themes.map(t => ({id: t.id, name: t.name})));
    console.log('- 선택된 테마 IDs:', selectedThemes);
    console.log('- 선택된 테마 이름:', selectedThemes.map(id => 
      themes.find(t => t.id === id)?.name
    ));
  }, [themes, selectedThemes]);

  // 검색 히스토리 저장
  useEffect(() => {
    if (selectedThemes.length > 0) {
      addToHistory();
    }
  }, [selectedThemes, useAndCondition]);

  // 테마 ID로 테마 객체 가져오기
  const getThemeById = (id: string) => themes.find(theme => theme.id === id);

  const loadFilterHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem(THEME_FILTER_HISTORY_KEY);
      const data = historyJson ? JSON.parse(historyJson) : { history: [], saved: [] };
      setFilterHistory(data.history || []);
      setSavedFilters(data.saved || []);
    } catch (error) {
      console.error('필터 히스토리 로드 실패:', error);
    }
  };

  const saveFilterHistory = async () => {
    try {
      const data = {
        history: filterHistory,
        saved: savedFilters
      };
      await AsyncStorage.setItem(THEME_FILTER_HISTORY_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('필터 히스토리 저장 실패:', error);
    }
  };

  const addToHistory = () => {
    if (selectedThemes.length === 0) return;

    // 중복 제거
    const existingIndex = filterHistory.findIndex(filter => 
      filter.themeIds.length === selectedThemes.length && 
      filter.themeIds.every(id => selectedThemes.includes(id)) &&
      filter.useAndCondition === useAndCondition
    );

    if (existingIndex !== -1) {
      // 중복된 항목 삭제
      const updatedHistory = [...filterHistory];
      updatedHistory.splice(existingIndex, 1);
      setFilterHistory([
        {
          id: Date.now().toString(),
          name: `검색 ${new Date().toLocaleString('ko-KR')}`,
          themeIds: [...selectedThemes],
          useAndCondition
        },
        ...updatedHistory
      ]);
    } else {
      // 새 항목 추가 (최대 10개)
      setFilterHistory(prev => [
        {
          id: Date.now().toString(),
          name: `검색 ${new Date().toLocaleString('ko-KR')}`,
          themeIds: [...selectedThemes],
          useAndCondition
        },
        ...prev.slice(0, 9)
      ]);
    }

    saveFilterHistory();
  };

  const applyFilter = (filter: SavedFilter) => {
    onClearFilters();
    onFilterModeChange(filter.useAndCondition);
    filter.themeIds.forEach(themeId => {
      onThemeSelect(themeId);
    });
    setShowHistoryModal(false);
  };

  const saveCurrentFilter = () => {
    if (selectedThemes.length === 0 || !filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      themeIds: [...selectedThemes],
      useAndCondition
    };

    setSavedFilters(prev => [newFilter, ...prev]);
    setFilterName('');
    setShowSaveModal(false);
    saveFilterHistory();
  };

  const deleteFilter = (id: string, isSaved: boolean) => {
    if (isSaved) {
      setSavedFilters(prev => prev.filter(filter => filter.id !== id));
    } else {
      setFilterHistory(prev => prev.filter(filter => filter.id !== id));
    }
    saveFilterHistory();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>테마 필터</Text>
        <View style={styles.headerButtons}>
          {selectedThemes.length > 0 && (
            <>
              <TouchableOpacity 
                onPress={() => setShowSaveModal(true)} 
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>저장</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onClearFilters}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>초기화</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity 
            onPress={() => setShowHistoryModal(true)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>히스토리</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        persistentScrollbar={true}
      >
        <View style={styles.themesContainer}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeTag,
                selectedThemes.includes(theme.id) && styles.selectedThemeTag
              ]}
              onPress={() => onThemeSelect(theme.id)}
            >
              <Text
                style={[
                  styles.themeText,
                  selectedThemes.includes(theme.id) && styles.selectedThemeText
                ]}
                numberOfLines={1}
              >
                {theme.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {selectedThemes.length > 0 && (
        <>
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedLabel}>선택된 테마:</Text>
            <View style={styles.selectedThemes}>
              {selectedThemes.map((id) => (
                <Text key={id} style={styles.selectedThemeItem}>
                  {getThemeById(id)?.name}
                </Text>
              ))}
            </View>
          </View>
          
          <View style={styles.filterModeContainer}>
            <Text style={styles.filterModeLabel}>필터 모드:</Text>
            <View style={styles.filterModeOptions}>
              <TouchableOpacity 
                style={[styles.modeButton, !useAndCondition && styles.activeModeButton]} 
                onPress={() => onFilterModeChange(false)}
              >
                <Text style={[styles.modeButtonText, !useAndCondition && styles.activeModeText]}>OR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, useAndCondition && styles.activeModeButton]} 
                onPress={() => onFilterModeChange(true)}
              >
                <Text style={[styles.modeButtonText, useAndCondition && styles.activeModeText]}>AND</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* 히스토리 모달 */}
      <Modal
        visible={showHistoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>필터 히스토리</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Text style={styles.closeButton}>닫기</Text>
              </TouchableOpacity>
            </View>

            {savedFilters.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>저장된 필터</Text>
                <FlatList
                  data={savedFilters}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.historyItem}
                      onPress={() => applyFilter(item)}
                    >
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle}>{item.name}</Text>
                        <Text style={styles.historyItemDetail}>
                          {item.themeIds.map(id => getThemeById(id)?.name).join(item.useAndCondition ? ' AND ' : ' OR ')}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => deleteFilter(item.id, true)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>삭제</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {filterHistory.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>최근 검색</Text>
                <FlatList
                  data={filterHistory}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.historyItem}
                      onPress={() => applyFilter(item)}
                    >
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle}>{item.name}</Text>
                        <Text style={styles.historyItemDetail}>
                          {item.themeIds.map(id => getThemeById(id)?.name).join(item.useAndCondition ? ' AND ' : ' OR ')}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => deleteFilter(item.id, false)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>삭제</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {filterHistory.length === 0 && savedFilters.length === 0 && (
              <View style={styles.emptyHistoryContainer}>
                <Text style={styles.emptyHistoryText}>저장된 필터가 없습니다.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 필터 저장 모달 */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>필터 저장</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Text style={styles.closeButton}>취소</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>필터 이름</Text>
            <TextInput
              style={styles.input}
              value={filterName}
              onChangeText={setFilterName}
              placeholder="필터 이름 입력"
              placeholderTextColor="#999"
            />

            <Text style={styles.filterPreview}>
              선택된 테마: {selectedThemes.map(id => getThemeById(id)?.name).join(useAndCondition ? ' AND ' : ' OR ')}
            </Text>

            <TouchableOpacity 
              style={[styles.saveButton, !filterName.trim() && styles.disabledButton]} 
              onPress={saveCurrentFilter}
              disabled={!filterName.trim()}
            >
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 10,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  scrollView: {
    width: '100%',
    marginBottom: 5,
  },
  scrollViewContent: {
    paddingRight: 20,
    paddingBottom: 5,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  themeTag: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: 150,
  },
  selectedThemeTag: {
    backgroundColor: '#007AFF',
  },
  themeText: {
    fontSize: 14,
    color: '#333',
  },
  selectedThemeText: {
    color: '#fff',
  },
  selectedContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectedLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  selectedThemes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  selectedThemeItem: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
  },
  filterModeContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterModeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  filterModeOptions: {
    flexDirection: 'row',
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#eaeaea',
    borderRadius: 12,
    marginRight: 8,
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#444',
  },
  activeModeText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  historyItemDetail: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  emptyHistoryContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#999',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  filterPreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
}); 