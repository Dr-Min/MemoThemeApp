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
  StatusBar,
  Platform
} from 'react-native';
import { MemoService } from '../services/memo/MemoService';
import { ThemeService } from '../services/theme/ThemeService';
import { ThemeAnalyzer } from '../services/theme/ThemeAnalyzer';
import { Memo } from '../models/Memo';
import { Theme } from '../models/Theme';

// 상태바 높이 계산 (플랫폼별 처리)
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const MemoDetailScreen = ({ route, navigation }: any) => {
  const { memoId } = route.params;
  const [memo, setMemo] = useState<Memo | null>(null);
  const [content, setContent] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // 데이터 불러오기
  const loadData = async () => {
    try {
      // 모든 메모 불러오기
      const memos = await MemoService.getAllMemos();
      const currentMemo = memos.find(m => m.id === memoId);
      
      if (currentMemo) {
        setMemo(currentMemo);
        setContent(currentMemo.content);
        setSelectedThemes(currentMemo.themes);
      } else {
        Alert.alert('오류', '메모를 찾을 수 없습니다.');
        navigation.goBack();
      }
      
      // 모든 테마 불러오기
      const allThemes = await ThemeService.getAllThemes();
      setThemes(allThemes);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [memoId]);
  
  // 메모 저장
  const handleSave = async () => {
    if (!memo) return;
    
    try {
      // 이전 테마 저장
      const oldThemes = [...memo.themes];
      
      // 텍스트 내용이 변경되었으면 텍스트 분석으로 테마 제안
      if (content !== memo.content) {
        const suggestedThemes = await ThemeAnalyzer.analyzeText(content, themes);
        
        // 기존 테마와 제안된 테마 합치기 (중복 제거)
        const newThemes = [...new Set([...selectedThemes, ...suggestedThemes])];
        setSelectedThemes(newThemes);
        
        const updatedMemo: Memo = {
          ...memo,
          content,
          themes: newThemes,
          updatedAt: new Date()
        };
        
        await MemoService.updateMemo(updatedMemo);
        
        // 사용자가 테마를 수동으로 변경한 경우 학습 실행
        if (JSON.stringify(oldThemes.sort()) !== JSON.stringify(newThemes.sort())) {
          await ThemeAnalyzer.learnFromMemoEdit(content, oldThemes, newThemes);
        }
      } else {
        // 내용은 그대로이고 테마만 변경된 경우
        const updatedMemo: Memo = {
          ...memo,
          themes: selectedThemes,
          updatedAt: new Date()
        };
        
        await MemoService.updateMemo(updatedMemo);
        
        // 테마가 변경되었으면 학습 실행
        if (JSON.stringify(oldThemes.sort()) !== JSON.stringify(selectedThemes.sort())) {
          await ThemeAnalyzer.learnFromMemoEdit(memo.content, oldThemes, selectedThemes);
        }
      }
      
      setIsEditing(false);
      loadData(); // 저장 후 데이터 새로고침
    } catch (error) {
      console.error('메모 저장 실패:', error);
      Alert.alert('오류', '메모를 저장하는 데 실패했습니다.');
    }
  };
  
  // 메모 삭제
  const handleDelete = async () => {
    Alert.alert(
      '메모 삭제',
      '이 메모를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!memo) return;
              await MemoService.deleteMemo(memo.id);
              navigation.goBack();
            } catch (error) {
              console.error('메모 삭제 실패:', error);
              Alert.alert('오류', '메모를 삭제하는 데 실패했습니다.');
            }
          }
        }
      ]
    );
  };
  
  // 테마 토글 (선택/해제)
  const toggleTheme = (themeId: string) => {
    setSelectedThemes(prev => 
      prev.includes(themeId)
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    );
  };
  
  // 날짜 포맷팅
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '날짜 정보 없음';
    
    try {
      const d = date instanceof Date ? date : new Date(date);
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('날짜 포맷팅 실패:', error);
      return '날짜 형식 오류';
    }
  };
  
  if (!memo) {
    return (
      <View style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <SafeAreaView style={styles.container}>
          <Text>로딩 중...</Text>
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
          
          <View style={styles.headerButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setContent(memo.content);
                    setSelectedThemes(memo.themes);
                    setIsEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>편집</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>작성일:</Text>
            <Text style={styles.dateValue}>{formatDate(memo.createdAt)}</Text>
          </View>
          
          {memo.updatedAt && memo.createdAt && 
            ((memo.updatedAt instanceof Date && memo.createdAt instanceof Date && 
              memo.updatedAt.getTime() !== memo.createdAt.getTime()) || 
             (!(memo.updatedAt instanceof Date) && !(memo.createdAt instanceof Date) && 
              new Date(memo.updatedAt).getTime() !== new Date(memo.createdAt).getTime())) && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>수정일:</Text>
              <Text style={styles.dateValue}>{formatDate(memo.updatedAt)}</Text>
            </View>
          )}
          
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
            />
          ) : (
            <Text style={styles.textContent}>{memo.content}</Text>
          )}
          
          <View style={styles.themesSection}>
            <Text style={styles.themesTitle}>테마</Text>
            
            <View style={styles.themesList}>
              {themes.map(theme => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeChip,
                    selectedThemes.includes(theme.id) ? styles.themeChipSelected : {}
                  ]}
                  onPress={() => isEditing && toggleTheme(theme.id)}
                  disabled={!isEditing}
                >
                  <Text 
                    style={[
                      styles.themeChipText,
                      selectedThemes.includes(theme.id) ? styles.themeChipTextSelected : {}
                    ]}
                  >
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {themes.length === 0 && (
                <Text style={styles.noThemesText}>
                  생성된 테마가 없습니다. 테마 관리 화면에서 테마를 추가해보세요.
                </Text>
              )}
            </View>
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
  headerButtons: {
    flexDirection: 'row',
  },
  editButton: {
    marginRight: 16,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  deleteButton: {},
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  cancelButton: {
    marginRight: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {},
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    height: 200,
    textAlignVertical: 'top',
  },
  themesSection: {
    marginTop: 16,
  },
  themesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  themesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  themeChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  themeChipSelected: {
    backgroundColor: '#007AFF',
  },
  themeChipText: {
    fontSize: 14,
    color: '#333',
  },
  themeChipTextSelected: {
    color: '#fff',
  },
  noThemesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
}); 