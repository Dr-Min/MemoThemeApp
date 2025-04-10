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

// 상태바 높이 계산
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

export const ThemeChatScreen = ({ route, navigation }: any) => {
  const { themeId, themeName } = route.params;
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
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
      console.error('테마 메모 로드 실패:', error);
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
      // 현재 테마에만 메모 추가 (테마 분석 완전히 제거)
      const themeIds = [themeId];
      
      // 새 메모를 추가하되, 추가 분석 없이 현재 테마만 사용
      const newMemo = createMemo(newMessage, themeIds);
      const memos = await MemoService.getAllMemos();
      await MemoService.saveMemos([...memos, newMemo]);
      
      // 입력 초기화 및 데이터 새로고침
      setNewMessage('');
      await loadData();
      
      // 스크롤을 가장 아래로
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
      return '오늘';
    }
    
    if (
      dateObj.getFullYear() === yesterday.getFullYear() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getDate() === yesterday.getDate()
    ) {
      return '어제';
    }
    
    return `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
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
        style={styles.messageContainer}
        onPress={() => goToMemoDetail(item.id)}
      >
        <View style={styles.messageContent}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timeText}>{formatDate(new Date(item.createdAt))}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'< 뒤로'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{themeName}</Text>
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
                  이 테마에 메모가 없습니다.
                </Text>
                <Text style={styles.emptySubText}>
                  새 메모를 추가해보세요!
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
            placeholder="메시지 입력..."
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
              <Text style={styles.sendButtonText}>전송</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: STATUSBAR_HEIGHT
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff'
  },
  backButton: {
    padding: 4
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  headerRight: {
    width: 40
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 16
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 8
  },
  dateHeaderText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: 'rgba(230, 230, 230, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    alignSelf: 'flex-end',
    maxWidth: '80%'
  },
  messageContent: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    minWidth: 80
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    alignSelf: 'flex-end'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8
  },
  emptySubText: {
    fontSize: 14,
    color: '#999'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  sendButtonDisabled: {
    backgroundColor: '#b0c4de'
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
}); 