import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  SafeAreaView,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { ThemeItem } from '../components/ThemeItem';
import { ThemeService } from '../services/theme/ThemeService';
import { Theme } from '../models/Theme';

// 상태바 높이 계산 (플랫폼별 처리)
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const ThemeManagementScreen = ({ navigation, route }: any) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [parentTheme, setParentTheme] = useState<Theme | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 현재 표시할 테마 목록 결정 (최상위 테마 또는 하위 테마)
  const parentId = route.params?.parentThemeId || null;
  
  // 데이터 불러오기
  const loadThemes = async () => {
    setLoading(true);
    try {
      if (parentId) {
        // 특정 테마의 하위 테마 로드
        const childThemes = await ThemeService.getChildThemes(parentId);
        const allThemes = await ThemeService.getAllThemes();
        const parent = allThemes.find(t => t.id === parentId) || null;
        
        setThemes(childThemes);
        setParentTheme(parent);
      } else {
        // 최상위 테마 로드
        const rootThemes = await ThemeService.getRootThemes();
        setThemes(rootThemes);
        setParentTheme(null);
      }
    } catch (error) {
      console.error('테마 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadThemes();
  }, [parentId]);
  
  // 새 테마 추가
  const handleAddTheme = async () => {
    if (themeName.trim().length === 0) {
      Alert.alert('오류', '테마 이름을 입력해주세요.');
      return;
    }
    
    try {
      // 쉼표로 구분된 키워드 분리
      const keywordList = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      await ThemeService.addTheme(
        themeName.trim(),
        keywordList,
        parentId
      );
      
      // 입력 필드 초기화 및 모달 닫기
      setThemeName('');
      setKeywords('');
      setModalVisible(false);
      
      // 데이터 다시 로드
      loadThemes();
    } catch (error) {
      console.error('테마 추가 실패:', error);
      Alert.alert('오류', '테마를 추가하는 데 실패했습니다.');
    }
  };
  
  // 테마 선택 시 하위 테마 화면으로 이동
  const handleThemePress = (theme: Theme) => {
    if (theme.childThemes.length > 0) {
      // 하위 테마가 있으면 하위 테마 화면으로 이동
      navigation.push('ThemeManagement', { parentThemeId: theme.id });
    } else {
      // 하위 테마가 없으면 테마 편집 화면으로 이동
      navigation.navigate('ThemeEdit', { themeId: theme.id });
    }
  };
  
  // 상위 테마로 돌아가기
  const goBack = () => {
    navigation.goBack();
  };
  
  // 테마 관리 화면으로 이동
  const goToThemeVisualization = () => {
    navigation.navigate('ThemeVisualization');
  };
  
  // 테마 채팅 목록 화면으로 이동
  const goToThemeChatList = () => {
    navigation.navigate('ThemeChatList');
  };
  
  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {parentTheme ? (
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>{'← 뒤로'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={goBack}>
              <Text style={styles.backButtonText}>{'← 메모로'}</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.title}>
            {parentTheme ? parentTheme.name : '테마 관리'}
          </Text>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={goToThemeChatList} style={styles.visualizeButton}>
              <Text style={styles.visualizeButtonText}>채팅</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToThemeVisualization} style={styles.visualizeButton}>
              <Text style={styles.visualizeButtonText}>통계</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.addButton}>+ 추가</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          style={styles.list}
          data={themes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemeItem 
              theme={item} 
              onPress={handleThemePress} 
              hasChildThemes={item.childThemes.length > 0}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {parentTheme 
                    ? '하위 테마가 없습니다. 새 테마를 추가해보세요!' 
                    : '테마가 없습니다. 새 테마를 추가해보세요!'}
                </Text>
              </View>
            ) : null
          }
        />
        
        {/* 새 테마 추가 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {parentTheme ? `${parentTheme.name}의 하위 테마 추가` : '새 테마 추가'}
              </Text>
              
              <TextInput
                style={styles.input}
                value={themeName}
                onChangeText={setThemeName}
                placeholder="테마 이름"
              />
              
              <TextInput
                style={styles.input}
                value={keywords}
                onChangeText={setKeywords}
                placeholder="키워드 (쉼표로 구분)"
                multiline
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setThemeName('');
                    setKeywords('');
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    themeName.trim().length === 0 ? styles.saveButtonDisabled : {}
                  ]} 
                  onPress={handleAddTheme}
                  disabled={themeName.trim().length === 0}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  addButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visualizeButton: {
    paddingRight: 16,
  },
  visualizeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
}); 