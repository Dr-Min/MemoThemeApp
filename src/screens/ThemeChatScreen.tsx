import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { MemoService } from '../services/memo/MemoService';
import { ThemeService } from '../services/theme/ThemeService';
import { Memo, createMemo } from '../models/Memo';
import { Theme } from '../models/Theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { IconPickerModal } from '../components/IconPickerModal';
import { useTranslation } from 'react-i18next';

// 상태바 높이 계산
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const ThemeChatScreen = ({ route, navigation }: any) => {
  const { t } = useTranslation();
  const { themeId } = route.params;
  const [theme, setTheme] = useState<Theme | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [iconModalVisible, setIconModalVisible] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      // 테마 정보 가져오기
      const allThemes = await ThemeService.getAllThemes();
      const currentTheme = allThemes.find(t => t.id === themeId);
      setTheme(currentTheme || null);
      
      // 모든 메모 가져오기
      const allMemos = await MemoService.getAllMemos();
      
      // 해당 테마의 메모만 필터링
      const themeMemos = allMemos.filter(memo => memo.themes.includes(themeId));
      
      // 날짜순 정렬 (오래된 순)
      const sortedMemos = themeMemos.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setMemos(sortedMemos);
    } catch (error) {
      console.error('테마 정보 또는 메모 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
    
    // 화면에 포커스가 오면 데이터 새로고침
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation, themeId]);

  // 메모 로드 후 스크롤을 가장 아래로
  useEffect(() => {
    if (memos.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [memos, loading]);

  // 새 메모 전송
  const sendMessage = async () => {
    if (newMessage.trim() === '' || sending) return;
    
    setSending(true);
    try {
      const themeIds = [themeId];
      const newMemo = createMemo(newMessage, themeIds);
      const memos = await MemoService.getAllMemos();
      await MemoService.saveMemos([...memos, newMemo]);
      
      setNewMessage('');
      await loadData();
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setSending(false);
    }
  };

  // 메모 상세 화면으로 이동
  const goToMemoDetail = (memoId: string) => {
    navigation.navigate('MemoDetail', { memoId });
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const dateObj = new Date(date);
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    
    return `${ampm} ${formattedHours}:${minutes.toString().padStart(2, '0')}`;
  };

  // 날짜 변경 확인 (날짜가 바뀌었는지)
  const shouldShowDateHeader = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    
    const currentDate = new Date(memos[currentIndex].createdAt);
    const prevDate = new Date(memos[currentIndex - 1].createdAt);
    
    return (
      currentDate.getFullYear() !== prevDate.getFullYear() ||
      currentDate.getMonth() !== prevDate.getMonth() ||
      currentDate.getDate() !== prevDate.getDate()
    );
  };

  // 날짜 헤더 포맷
  const formatDateHeader = (date: Date) => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate()
    ) {
      return t('common.today');
    }
    
    if (
      dateObj.getFullYear() === yesterday.getFullYear() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getDate() === yesterday.getDate()
    ) {
      return t('common.yesterday');
    }
    
    return `${dateObj.getFullYear()}${t('common.year')} ${dateObj.getMonth() + 1}${t('common.month')} ${dateObj.getDate()}${t('common.day')}`;
  };

  // 메모 렌더링
  const renderMemoItem = ({ item, index }: { item: Memo; index: number }) => (
    <View>
      {shouldShowDateHeader(index) && (
        <View style={styles.dateHeaderContainer}>
          <Text style={styles.dateHeaderText}>
            {formatDateHeader(new Date(item.createdAt))}
          </Text>
        </View>
      )}
      <TouchableOpacity 
        style={styles.messageWrapper}
        onPress={() => goToMemoDetail(item.id)}
      >
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timeText}>{formatDate(new Date(item.createdAt))}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
  
  // 아이콘 변경 처리 함수
  const handleIconSelect = async (iconName: string) => {
    if (!theme) return;
    
    try {
      const updatedTheme = { ...theme, icon: iconName };
      await ThemeService.updateTheme(updatedTheme);
      setTheme(updatedTheme); // 상태 업데이트
    } catch (error) {
      console.error('테마 아이콘 업데이트 실패:', error);
    }
  };

  // 로딩 중이거나 테마 정보가 없을 경우 기본 헤더 표시
  if (loading || !theme) {
    return (
      <View style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer} />
            <View style={styles.headerRight} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
          
          {/* 헤더 중앙 컨텐츠 (아이콘 + 테마 이름) */}
          <TouchableOpacity 
            style={styles.headerTitleContainer} 
            onPress={() => setIconModalVisible(true)}
          >
            <Icon name={theme.icon || 'label'} size={24} color="#1C1C1E" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>{theme.name}</Text>
          </TouchableOpacity>
          
          {/* 오른쪽 공간 확보 */}
          <View style={styles.headerRight} /> 
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={memos}
            renderItem={renderMemoItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t('themeChat.noMemos')}
                </Text>
                <Text style={styles.emptySubText}>
                  {t('themeChat.addNewMemo')}
                </Text>
              </View>
            }
          />
        )}
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
          style={styles.inputContainer}
        >
          <TextInput
            style={[styles.input, { maxHeight: 100 }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={t('themeChat.enterMessage')}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>{t('common.send')}</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
        
        {/* 아이콘 선택 모달 */}
        <IconPickerModal 
          visible={iconModalVisible}
          onClose={() => setIconModalVisible(false)}
          onSelectIcon={handleIconSelect}
          currentIcon={theme.icon || 'label'}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#E9F0FD',
    paddingTop: STATUSBAR_HEIGHT
  },
  container: {
    flex: 1,
    backgroundColor: '#E9F0FD'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitleContainer: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  messageWrapper: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 5,
    textAlign: 'right',
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#6E7191',
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F5',
    borderRadius: 20,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6E7191',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
}); 