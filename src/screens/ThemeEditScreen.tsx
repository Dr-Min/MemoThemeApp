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
import { ThemeService } from '../services/theme/ThemeService';
import { MemoService } from '../services/memo/MemoService';
import { Theme } from '../models/Theme';
import { Memo } from '../models/Memo';
import ColorPicker from '../components/ColorPicker';
import { ThemeAnalyzer } from '../services/theme/ThemeAnalyzer';
import { useTranslation } from 'react-i18next';

// 상태바 높이 계산 (플랫폼별 처리)
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const ThemeEditScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const { themeId } = route.params;
  
  // 테마 정보 상태
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('label'); // color 대신 icon으로 변경
  const [selectedColor, setSelectedColor] = useState('#4A6FFF'); // UI 선택용 색상 상태
  const [parentTheme, setParentTheme] = useState<string | null>(null);
  const [parentThemes, setParentThemes] = useState<Theme[]>([]);
  const [keywordsList, setKeywordsList] = useState<string[]>([]);
  const [keywordsText, setKeywordsText] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  
  // 데이터 불러오기
  const loadData = async () => {
    setLoading(true);
    try {
      // 모든 테마 및 메모 로드
      const allThemes = await ThemeService.getAllThemes();
      const allMemos = await MemoService.getAllMemos();
      
      // 현재 테마 검색
      const currentTheme = allThemes.find(t => t.id === themeId);
      
      if (currentTheme) {
        // 현재 테마가 있으면 상태 업데이트
        setName(currentTheme.name);
        setDescription(currentTheme.description || '');
        setIcon(currentTheme.icon || 'label'); // color 대신 icon 사용
        setSelectedColor('#4A6FFF'); // 기본 색상 설정 (UI용)
        setParentTheme(currentTheme.parentTheme || null);
        setKeywordsList(currentTheme.keywords);
        setKeywordsText(currentTheme.keywords.join(', '));
        
        // 부모 테마 목록 설정 (자기 자신과 자식 테마 제외)
        const possibleParents = allThemes.filter(
          theme => theme.id !== currentTheme.id && !isDescendant(theme.id, currentTheme.id, allThemes)
        );
        setParentThemes(possibleParents);
        
        // 이 테마와 관련된 메모 필터링
        const themeMemos = allMemos.filter(memo => memo.themes.includes(themeId));
        setMemos(themeMemos);
        
        setIsNew(false);
      } else {
        // 새 테마 생성 모드
        setParentThemes(allThemes);
        setIsNew(true);
      }
    } catch (error) {
      console.error(t('themeEdit.loadErrorLog'), error);
      Alert.alert(t('common.error'), t('themeEdit.loadError'));
    } finally {
      setLoading(false);
    }
  };
  
  // 테마가 다른 테마의 하위 테마인지 확인
  const isDescendant = (themeId: string, potentialParentId: string, themes: Theme[]): boolean => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || !theme.parentTheme) return false;
    if (theme.parentTheme === potentialParentId) return true;
    return isDescendant(theme.parentTheme, potentialParentId, themes);
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [themeId]);
  
  // 키워드 텍스트 변경 시 배열 업데이트
  useEffect(() => {
    if (keywordsText.trim() === '') {
      setKeywordsList([]);
      return;
    }
    
    const newKeywordsList = keywordsText
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);
    
    setKeywordsList(newKeywordsList);
  }, [keywordsText]);
  
  // 테마 저장 처리
  const handleSave = async () => {
    if (name.trim().length === 0) {
      Alert.alert(t('common.error'), t('themeEdit.nameRequired'));
      return;
    }
    
    setSaving(true);
    try {
      const allThemes = await ThemeService.getAllThemes();
      // 이전 키워드 저장 (학습 용도)
      const oldTheme = isNew ? null : allThemes.find(t => t.id === themeId);
      const oldKeywords = oldTheme ? oldTheme.keywords : [];
      
      // 테마 업데이트 또는 생성
      if (isNew) {
        // 새 테마 생성
        await ThemeService.addTheme(
          name.trim(),
          keywordsList,
          parentTheme,
          icon
        );
      } else {
        // 기존 테마 업데이트
        const updatedTheme: Theme = {
          id: themeId,
          name: name.trim(),
          description: description.trim(),
          icon: icon, // color 대신 icon 사용
          keywords: keywordsList,
          parentTheme,
          childThemes: oldTheme ? oldTheme.childThemes : []
        };
        
        await ThemeService.updateTheme(updatedTheme);
      }
      
      // 키워드가 변경되었고 관련 메모가 있는 경우 사용자에게 메모 재분석 확인
      if (!isNew && JSON.stringify(oldKeywords.sort()) !== JSON.stringify(keywordsList.sort()) && memos.length > 0) {
        Alert.alert(
          t('themeEdit.keywordsChangedTitle'),
          t('themeEdit.keywordsChangedMessage'),
          [
            {
              text: t('common.yes'),
              onPress: () => reanalyzeAllMemos(),
            },
            {
              text: t('common.no'),
              style: 'cancel',
              onPress: () => navigation.goBack()
            },
          ]
        );
      } else {
        // 변경 사항이 없거나 관련 메모가 없으면 바로 뒤로 이동
        navigation.goBack();
      }
    } catch (error) {
      console.error(t('themeEdit.saveErrorLog'), error);
      Alert.alert(t('common.error'), t('themeEdit.saveError'));
    } finally {
      setSaving(false);
    }
  };
  
  // 테마 삭제 처리
  const handleDelete = async () => {
    Alert.alert(
      t('themeManagement.deleteTheme'),
      t('themeManagement.deleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await ThemeService.deleteTheme(themeId);
              navigation.goBack();
            } catch (error) {
              console.error(t('themeEdit.deleteErrorLog'), error);
              Alert.alert(t('common.error'), t('themeEdit.deleteError'));
            }
          },
        },
      ]
    );
  };
  
  // 메모 테마 다시 분석
  const reanalyzeAllMemos = async () => {
    try {
      const allThemes = await ThemeService.getAllThemes();
      
      for (const memo of memos) {
        // 이전 테마 목록 저장
        const oldThemes = [...memo.themes];
        
        // 텍스트 분석을 통해 추천 테마 가져오기
        const suggestedThemes = await ThemeAnalyzer.analyzeText(memo.content, allThemes);
        
        // 현재 테마 ID를 포함하여 추천 테마 병합
        const updatedThemes = [...new Set([themeId, ...suggestedThemes])];
        
        // 테마가 변경되었는지 확인 (순서 무시)
        if (JSON.stringify(oldThemes.sort()) !== JSON.stringify(updatedThemes.sort())) {
          // 메모 업데이트
          const updatedMemo = {
            ...memo,
            themes: updatedThemes
          };
          
          // 메모 저장
          await MemoService.updateMemo(updatedMemo);
          
          // 사용자 학습 업데이트
          await ThemeAnalyzer.learnFromMemoEdit(memo.content, oldThemes, updatedThemes);
        }
      }
      
      Alert.alert(
        t('themeEdit.reanalyzeCompleteTitle'),
        t('themeEdit.reanalyzeCompleteMessage'),
        [{ text: t('common.confirm'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(t('themeEdit.reanalyzeErrorLog'), error);
      Alert.alert(t('common.error'), t('themeEdit.reanalyzeError'));
    }
  };
  
  // 부모 테마 변경 처리
  const handleParentChange = (parentId: string | null) => {
    setParentTheme(parentId);
  };
  
  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isNew ? t('themeManagement.addTheme') : t('themeEdit.title')}</Text>
          <View style={styles.headerRight}>
            {!isNew && (
              <TouchableOpacity onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('themeEdit.nameLabel')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('themeEdit.nameLabel')}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('themeEdit.descriptionLabel')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('themeEdit.descriptionLabel')}
              multiline
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('themeEdit.colorLabel')}</Text>
            <ColorPicker 
              selectedColor={selectedColor} 
              onSelectColor={(color) => {
                setSelectedColor(color);
                setIcon('label'); // 임시로 아이콘 업데이트 - 실제로는 색상에 따른 아이콘 매핑이 필요할 수 있음
              }} 
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('themeEdit.addKeywords')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={keywordsText}
              onChangeText={setKeywordsText}
              placeholder={t('themeEdit.keywordPlaceholder')}
              multiline
            />
            <Text style={styles.helperText}>
              {keywordsList.length > 0 
                ? t('themeEdit.keywordsPreview', { count: keywordsList.length })
                : t('themeEdit.noKeywords')}
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('themeEdit.parentThemeLabel')}</Text>
            <View style={styles.parentThemeSelector}>
              <TouchableOpacity
                style={[
                  styles.parentThemeOption,
                  parentTheme === null && styles.parentThemeOptionSelected,
                ]}
                onPress={() => handleParentChange(null)}
              >
                <Text 
                  style={[
                    styles.parentThemeOptionText,
                    parentTheme === null && styles.parentThemeOptionSelectedText,
                  ]}
                >
                  {t('themeEdit.noParent')}
                </Text>
              </TouchableOpacity>
              
              {parentThemes.map(theme => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.parentThemeOption,
                    parentTheme === theme.id && styles.parentThemeOptionSelected,
                  ]}
                  onPress={() => handleParentChange(theme.id)}
                >
                  <Text 
                    style={[
                      styles.parentThemeOptionText,
                      parentTheme === theme.id && styles.parentThemeOptionSelectedText,
                    ]}
                  >
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, name.trim().length === 0 && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving || name.trim().length === 0}
            >
              <Text style={styles.saveButtonText}>
                {saving ? t('themeEdit.saving') : t('common.save')}
              </Text>
            </TouchableOpacity>
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
  headerRight: {
    flexDirection: 'row',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 40,
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
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  parentThemeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  parentThemeOption: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  parentThemeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  parentThemeOptionText: {
    fontSize: 14,
    color: '#333',
  },
  parentThemeOptionSelectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 48,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
}); 