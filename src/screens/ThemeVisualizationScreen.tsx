import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeRelationshipGraph } from '../components/ThemeRelationshipGraph';
import { ThemeStatisticsChart } from '../components/ThemeStatisticsChart';
import { MemoService } from '../services/memo/MemoService';
import { ThemeService } from '../services/theme/ThemeService';
import { Theme } from '../models/Theme';
import { Memo } from '../models/Memo';

// 상태바 높이 계산 (플랫폼별 처리)
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const ThemeVisualizationScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'relationship' | 'statistics'>('relationship');
  
  // 데이터 불러오기
  const loadData = async () => {
    setLoading(true);
    try {
      const allThemes = await ThemeService.getAllThemes();
      const allMemos = await MemoService.getAllMemos();
      
      setThemes(allThemes);
      setMemos(allMemos);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
    
    // 화면 포커스 시 데이터 다시 로드
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // 테마 선택 처리
  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(prevSelected => 
      prevSelected === themeId ? null : themeId
    );
  };
  
  // 선택된 테마 정보
  const selectedThemeInfo = selectedTheme 
    ? themes.find(theme => theme.id === selectedTheme) 
    : null;
  
  // 선택된 테마의 메모 목록
  const selectedThemeMemos = selectedTheme 
    ? memos.filter(memo => memo.themes.includes(selectedTheme))
    : [];
  
  // 테마 편집 화면으로 이동
  const goToThemeEdit = (themeId: string) => {
    navigation.navigate('ThemeEdit', { themeId });
  };
  
  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('themeVisualization.title')}</Text>
          <View style={{ width: 50 }} />
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'relationship' && styles.activeTabButton]} 
            onPress={() => setActiveTab('relationship')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'relationship' && styles.activeTabText]}>
              {t('themeVisualization.relationshipTab')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'statistics' && styles.activeTabButton]} 
            onPress={() => setActiveTab('statistics')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'statistics' && styles.activeTabText]}>
              {t('themeVisualization.statisticsTab')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{t('common.loading', '데이터 로드 중...')}</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {activeTab === 'relationship' ? (
              <ThemeRelationshipGraph 
                themes={themes}
                onThemeSelect={handleThemeSelect}
              />
            ) : (
              <ThemeStatisticsChart 
                themes={themes}
                memos={memos}
                onThemeSelect={handleThemeSelect}
              />
            )}
            
            {selectedThemeInfo && (
              <View style={styles.selectedThemeContainer}>
                <View style={styles.selectedThemeHeader}>
                  <Text style={styles.selectedThemeTitle}>{t('themeVisualization.selectedTheme')}: {selectedThemeInfo.name}</Text>
                  <TouchableOpacity onPress={() => goToThemeEdit(selectedThemeInfo.id)}>
                    <Text style={styles.editButton}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.themeDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('themeEdit.keywordPlaceholder')}:</Text>
                    <Text style={styles.detailValue}>
                      {selectedThemeInfo.keywords.length > 0 
                        ? selectedThemeInfo.keywords.join(', ') 
                        : t('common.none', '없음')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('themeVisualization.parentThemes')}:</Text>
                    <Text style={styles.detailValue}>
                      {selectedThemeInfo.parentTheme 
                        ? themes.find(t => t.id === selectedThemeInfo.parentTheme)?.name || t('common.unknown', '알 수 없음')
                        : t('common.none', '없음')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('themeVisualization.childThemes')}:</Text>
                    <Text style={styles.detailValue}>
                      {selectedThemeInfo.childThemes.length > 0 
                        ? selectedThemeInfo.childThemes
                            .map(id => themes.find(t => t.id === id)?.name)
                            .filter(Boolean)
                            .join(', ')
                        : t('common.none', '없음')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('themeVisualization.memoCount')}:</Text>
                    <Text style={styles.detailValue}>{selectedThemeMemos.length}{t('common.countUnit', '개')}</Text>
                  </View>
                </View>
                
                {selectedThemeMemos.length > 0 && (
                  <View style={styles.memosList}>
                    <Text style={styles.memosListTitle}>{t('themeVisualization.relatedMemos')}</Text>
                    {selectedThemeMemos.slice(0, 3).map(memo => (
                      <View key={memo.id} style={styles.memoPreview}>
                        <Text style={styles.memoContent} numberOfLines={2}>
                          {memo.content}
                        </Text>
                        <Text style={styles.memoDate}>
                          {new Date(memo.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                    {selectedThemeMemos.length > 3 && (
                      <Text style={styles.moreMemosText}>
                        ...{t('common.andMore', '외')} {selectedThemeMemos.length - 3}{t('common.countMore', '개 더 있음')}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  selectedThemeContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  selectedThemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedThemeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  themeDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  memosList: {
    marginTop: 8,
  },
  memosListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  memoPreview: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memoContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  memoDate: {
    fontSize: 12,
    color: '#666',
  },
  moreMemosText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
}); 