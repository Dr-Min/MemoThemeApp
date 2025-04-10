import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, FlatList, TextInput } from 'react-native';
import { Theme } from '../models/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  // 검색 히스토리
  const [filterHistory, setFilterHistory] = useState<SavedFilter[]>([]);
  // 즐겨찾기 필터
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  // 모달 상태
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredThemes, setFilteredThemes] = useState<Theme[]>(themes);

  // 검색 히스토리 로드
  useEffect(() => {
    loadFilterHistory();
  }, []);

  // 디버깅 정보 출력
  useEffect(() => {
    console.log('ThemeFilter - Current data:');
    console.log('- Available themes:', themes.map(t => ({id: t.id, name: t.name})));
    console.log('- Selected theme IDs:', selectedThemes);
    console.log('- Selected theme names:', selectedThemes.map(id => 
      themes.find(t => t.id === id)?.name
    ));
  }, [themes, selectedThemes]);

  // 검색 히스토리 저장
  useEffect(() => {
    if (selectedThemes.length > 0) {
      addToHistory();
    }
  }, [selectedThemes, useAndCondition]);

  useEffect(() => {
    setFilteredThemes(themes);
  }, [themes]);

  useEffect(() => {
    if (searchText) {
      const filtered = themes.filter(theme => 
        theme.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredThemes(filtered);
    } else {
      setFilteredThemes(themes);
    }
  }, [searchText, themes]);

  // 테마 ID로 테마 객체 가져오기
  const getThemeById = (id: string) => themes.find(theme => theme.id === id);

  const loadFilterHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem(THEME_FILTER_HISTORY_KEY);
      const data = historyJson ? JSON.parse(historyJson) : { history: [], saved: [] };
      setFilterHistory(data.history || []);
      setSavedFilters(data.saved || []);
    } catch (error) {
      console.error(`${t('error')}: ${t('themeFilter.failedToLoadHistory')}`, error);
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
      console.error(`${t('error')}: ${t('themeFilter.failedToSaveHistory')}`, error);
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
          name: `${t('common.search')} ${new Date().toLocaleString('ko-KR')}`,
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
          name: `${t('common.search')} ${new Date().toLocaleString('ko-KR')}`,
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

  const toggleModal = () => {
    setModalVisible(!modalVisible);
    setSearchText('');
  };

  const renderThemeItem = ({ item }: { item: Theme }) => {
    const isSelected = selectedThemes.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.themeItem, isSelected && styles.themeItemSelected]}
        onPress={() => onThemeSelect(item.id)}
      >
        <Text style={[styles.themeItemText, isSelected && styles.selectedThemeItemText]}>
          {item.name}
        </Text>
        {isSelected && (
          <AntDesign name="check" size={16} color="#fff" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const getSelectedThemesText = () => {
    if (selectedThemes.length === 0) {
      return t('themeFilter.allThemes');
    }
    
    const selectedThemeNames = themes
      .filter(theme => selectedThemes.includes(theme.id))
      .map(theme => theme.name);
    
    if (selectedThemeNames.length <= 2) {
      return selectedThemeNames.join(', ');
    }
    
    return t('themeFilter.multipleSelected', { count: selectedThemes.length });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('themeFilter.title')}</Text>
        <TouchableOpacity onPress={toggleModal} style={styles.button}>
          <Text style={styles.buttonText}>{getSelectedThemesText()}</Text>
          <AntDesign name="down" size={12} color="#666" style={styles.icon} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        persistentScrollbar={true}
      >
        <View style={styles.themesContainer}>
          {filteredThemes.map((theme) => (
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
            <Text style={styles.selectedLabel}>{t('themeFilter.selectedThemes')}:</Text>
            <View style={styles.selectedThemes}>
              {selectedThemes.map((id) => (
                <Text key={id} style={styles.selectedThemeItem}>
                  {getThemeById(id)?.name}
                </Text>
              ))}
            </View>
          </View>
          
          <View style={styles.filterModeContainer}>
            <Text style={styles.filterModeLabel}>{t('themeFilter.filterMode')}:</Text>
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
              <Text style={styles.modalTitle}>{t('themeFilter.filterHistory')}</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Text style={styles.closeButton}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>

            {savedFilters.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('themeFilter.savedFilters')}</Text>
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
                        <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {filterHistory.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('themeFilter.recentSearches')}</Text>
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
                        <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {filterHistory.length === 0 && savedFilters.length === 0 && (
              <View style={styles.emptyHistoryContainer}>
                <Text style={styles.emptyHistoryText}>{t('themeFilter.noSavedFilters')}</Text>
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
              <Text style={styles.modalTitle}>{t('themeFilter.saveFilter')}</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Text style={styles.closeButton}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('themeFilter.filterName')}</Text>
            <TextInput
              style={styles.input}
              value={filterName}
              onChangeText={setFilterName}
              placeholder={t('themeFilter.enterFilterName')}
              placeholderTextColor="#999"
            />

            <Text style={styles.filterPreview}>
              {t('themeFilter.selectedThemes')}: {selectedThemes.map(id => getThemeById(id)?.name).join(useAndCondition ? ' AND ' : ' OR ')}
            </Text>

            <TouchableOpacity 
              style={[styles.saveButton, !filterName.trim() && styles.disabledButton]} 
              onPress={saveCurrentFilter}
              disabled={!filterName.trim()}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('themeFilter.selectThemes')}</Text>
              <TouchableOpacity onPress={toggleModal} style={styles.closeButtonContainer}>
                <AntDesign name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <AntDesign name="search1" size={16} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('themeFilter.searchPlaceholder')}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <FlatList
              data={filteredThemes}
              renderItem={renderThemeItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.themeList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{t('themeFilter.noThemes')}</Text>
              }
            />

            <TouchableOpacity style={styles.doneButton} onPress={toggleModal}>
              <Text style={styles.doneButtonText}>{t('common.done')}</Text>
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  icon: {
    marginLeft: 2,
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
    backgroundColor: '#007AFF',
    padding: 4,
    borderRadius: 4,
    margin: 2,
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
  closeButtonContainer: {
    padding: 5,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  themeList: {
    paddingHorizontal: 20,
  },
  themeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  themeItemSelected: {
    backgroundColor: '#007AFF',
  },
  themeItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedThemeItemText: {
    color: '#fff',
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    paddingVertical: 20,
  },
  doneButton: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 