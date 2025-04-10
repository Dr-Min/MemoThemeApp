import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { MemoService } from '../services/memo/MemoService';
import { ThemeService } from '../services/theme/ThemeService';
import { ThemeAnalyzer } from '../services/theme/ThemeAnalyzer';
import { Theme } from '../models/Theme';
import { Memo } from '../models/Memo';

// 상태바 높이 계산 (플랫폼별 처리)
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const ThemeEditScreen = ({ route, navigation }: any) => {
  const { themeId } = route.params;
  const [theme, setTheme] = useState<Theme | null>(null);
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [keywordsList, setKeywordsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [reanalyzing, setReanalyzing] = useState(false);
  
  // 데이터 불러오기
  const loadData = async () => {
    setLoading(true);
    try {
      // 테마 불러오기
      const allThemes = await ThemeService.getAllThemes();
      const currentTheme = allThemes.find(t => t.id === themeId);
      
      if (currentTheme) {
        setTheme(currentTheme);
        setName(currentTheme.name);
        
        const keywordsString = currentTheme.keywords.join(', ');
        setKeywords(keywordsString);
        setKeywordsList(currentTheme.keywords);
      } else {
        Alert.alert('오류', '테마를 찾을 수 없습니다.');
        navigation.goBack();
      }
      
      // 이 테마를 사용하는 메모 불러오기
      const allMemos = await MemoService.getAllMemos();
      const relatedMemos = allMemos.filter(memo => memo.themes.includes(themeId));
      setMemos(relatedMemos);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [themeId]);
  
  // 키워드 입력 처리
  const handleKeywordsChange = (text: string) => {
    setKeywords(text);
    
    // 쉼표로 구분된 키워드 분리
    const newKeywordsList = text
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    setKeywordsList(newKeywordsList);
  };
  
  // 테마 저장
  const handleSave = async () => {
    if (!theme) return;
    
    if (name.trim().length === 0) {
      Alert.alert('오류', '테마 이름을 입력해주세요.');
      return;
    }
    
    setSaving(true);
    
    try {
      // 기존 키워드 저장 (변경 감지용)
      const oldKeywords = [...theme.keywords];
      
      // 테마 업데이트
      const updatedTheme: Theme = {
        ...theme,
        name: name.trim(),
        keywords: keywordsList
      };
      
      await ThemeService.updateTheme(updatedTheme);
      
      // 키워드가 변경되었으면 관련 메모 재분석 제안
      if (JSON.stringify(oldKeywords.sort()) !== JSON.stringify(keywordsList.sort()) && memos.length > 0) {
        Alert.alert(
          '메모 재분석',
          `테마 키워드가 변경되었습니다. ${memos.length}개의 관련 메모를 재분석하시겠습니까?`,
          [
            { 
              text: '아니오', 
              style: 'cancel',
              onPress: () => {
                navigation.goBack();
              }
            },
            { 
              text: '예', 
              onPress: async () => {
                await reanalyzeMemos();
              }
            }
          ]
        );
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('테마 저장 실패:', error);
      Alert.alert('오류', '테마를 저장하는 데 실패했습니다.');
      setSaving(false);
    }
  };
  
  // 테마 삭제
  const handleDelete = async () => {
    if (!theme) return;
    
    // 이 테마를 사용하는 메모가 있는지 확인
    if (memos.length > 0) {
      Alert.alert(
        '테마 삭제 불가',
        `이 테마는 현재 ${memos.length}개의 메모에서 사용 중입니다. 먼저 메모에서 이 테마를 제거해주세요.`
      );
      return;
    }
    
    // 하위 테마가 있는지 확인
    if (theme.childThemes.length > 0) {
      Alert.alert(
        '테마 삭제 불가',
        '이 테마에는 하위 테마가 있습니다. 먼저 하위 테마를 삭제해주세요.'
      );
      return;
    }
    
    Alert.alert(
      '테마 삭제',
      '이 테마를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ThemeService.deleteTheme(theme.id);
              navigation.goBack();
            } catch (error) {
              console.error('테마 삭제 실패:', error);
              Alert.alert('오류', '테마를 삭제하는 데 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  // 메모 재분석 및 테마 업데이트
  const reanalyzeMemos = async () => {
    if (!theme) return;
    
    setReanalyzing(true);
    try {
      const allThemes = await ThemeService.getAllThemes();
      let updatedCount = 0;
      
      for (const memo of memos) {
        // 이전 테마 저장
        const oldThemes = [...memo.themes];
        
        // 메모 내용 분석
        const suggestedThemes = await ThemeAnalyzer.analyzeText(memo.content, allThemes);
        
        // 이 테마를 유지하면서 다른 테마 업데이트
        const updatedThemes = [...new Set([themeId, ...suggestedThemes])];
        
        // 테마가 변경되었을 때만 업데이트
        if (JSON.stringify(oldThemes.sort()) !== JSON.stringify(updatedThemes.sort())) {
          const updatedMemo = {
            ...memo,
            themes: updatedThemes,
            updatedAt: new Date()
          };
          
          await MemoService.updateMemo(updatedMemo);
          
          // 사용자 학습 패턴 업데이트
          await ThemeAnalyzer.learnFromMemoEdit(memo.content, oldThemes, updatedThemes);
          
          updatedCount++;
        }
      }
      
      Alert.alert(
        '재분석 완료',
        `${memos.length}개 중 ${updatedCount}개의 메모가 업데이트되었습니다.`,
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('메모 재분석 실패:', error);
      Alert.alert('오류', '메모를 재분석하는 데 실패했습니다.');
    } finally {
      setReanalyzing(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'← 뒤로'}</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>테마 편집</Text>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving || reanalyzing}
            >
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.content}>
          {(saving || reanalyzing) && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.overlayText}>
                {reanalyzing ? '메모 재분석 중...' : '저장 중...'}
              </Text>
            </View>
          )}
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>테마 이름</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="테마 이름"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>키워드</Text>
            <Text style={styles.description}>
              테마를 자동으로 분류할 때 사용될 키워드를 쉼표(,)로 구분하여 입력하세요.
              메모에 이 키워드가 포함되면 해당 테마로 자동 분류됩니다.
            </Text>
            <TextInput
              style={styles.input}
              value={keywords}
              onChangeText={handleKeywordsChange}
              placeholder="키워드 입력 (예: 일기, 일상, 생각)"
              multiline
            />
          </View>
          
          <View style={styles.keywordsList}>
            <Text style={styles.keywordsListTitle}>현재 키워드 목록:</Text>
            {keywordsList.length > 0 ? (
              <View style={styles.keywordChips}>
                {keywordsList.map((keyword, index) => (
                  <View key={index} style={styles.keywordChip}>
                    <Text style={styles.keywordChipText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyKeywords}>
                입력된 키워드가 없습니다.
              </Text>
            )}
          </View>
          
          <View style={styles.memosSection}>
            <Text style={styles.memosSectionTitle}>관련 메모 ({memos.length})</Text>
            {memos.length > 0 ? (
              memos.map((memo) => (
                <View key={memo.id} style={styles.memoItem}>
                  <Text style={styles.memoContent} numberOfLines={2}>
                    {memo.content}
                  </Text>
                  <Text style={styles.memoDate}>
                    {new Date(memo.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMemos}>
                이 테마를 사용하는 메모가 없습니다.
              </Text>
            )}
          </View>
        </ScrollView>
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
  headerButtons: {
    flexDirection: 'row',
  },
  deleteButton: {
    marginRight: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  keywordsList: {
    marginBottom: 20,
  },
  keywordsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  keywordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordChip: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  keywordChipText: {
    fontSize: 14,
    color: '#333',
  },
  emptyKeywords: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  memosSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  memosSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  memoItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memoContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  memoDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyMemos: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
}); 