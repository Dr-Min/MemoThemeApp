import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { ThemeService } from '../services/theme/ThemeService';
import { MemoService } from '../services/memo/MemoService';
import { Theme } from '../models/Theme';
import { Memo } from '../models/Memo';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

// 상태바 높이 계산
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

// 테마별 최근 메모 정보 인터페이스
interface ThemeChatInfo {
  theme: Theme;
  latestMemo?: Memo;
  memoCount: number;
}

type ThemeChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ThemeChatList'>;

export const ThemeChatListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ThemeChatListScreenNavigationProp>();
  const [themeChats, setThemeChats] = useState<ThemeChatInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  const loadThemeChats = async () => {
    setLoading(true);
    try {
      // 모든 테마와 메모 로드
      const themes = await ThemeService.getAllThemes();
      const memos = await MemoService.getAllMemos();

      // 각 테마별 정보 구성
      const themeChatInfos: ThemeChatInfo[] = await Promise.all(
        themes.map(async (theme) => {
          // 해당 테마의 메모들 필터링
          const themeMemos = memos.filter(memo => memo.themes.includes(theme.id));
          
          // 가장 최근 메모 찾기 (최신순 정렬)
          const sortedMemos = themeMemos.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          const latestMemo = sortedMemos.length > 0 ? sortedMemos[0] : undefined;
          
          return {
            theme,
            latestMemo,
            memoCount: themeMemos.length
          };
        })
      );
      
      // 메모가 있는 테마가 위에 오도록 정렬
      themeChatInfos.sort((a, b) => {
        // 메모 있는 테마 우선
        if (a.memoCount > 0 && b.memoCount === 0) return -1;
        if (a.memoCount === 0 && b.memoCount > 0) return 1;
        
        // 둘 다 메모가 있으면 최신 메모 기준 정렬
        if (a.latestMemo && b.latestMemo) {
          return new Date(b.latestMemo.createdAt).getTime() - 
                 new Date(a.latestMemo.createdAt).getTime();
        }
        
        // 이름 기준 알파벳 순 정렬
        return a.theme.name.localeCompare(b.theme.name);
      });
      
      setThemeChats(themeChatInfos);
    } catch (error) {
      console.error('테마 채팅 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 화면이 포커스 될 때마다 데이터 리로드
  useFocusEffect(
    useCallback(() => {
      loadThemeChats();
    }, [])
  );

  // 테마 채팅방으로 이동
  const goToThemeChat = (themeId: string, themeName: string) => {
    navigation.navigate('ThemeChat', { themeId, themeName });
  };

  // 테마 관리 화면으로 이동
  const goToThemeManagement = () => {
    navigation.navigate('ThemeManagement');
  };

  // 홈 화면으로 이동
  const goToHome = () => {
    navigation.navigate('Home');
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // 오늘인 경우 시간만
      return format(date, 'a h:mm', { locale: ko });
    } else if (diffDays < 7) {
      // 일주일 이내인 경우 요일
      return format(date, 'EEEE', { locale: ko });
    } else {
      // 그 외 날짜 표시
      return format(date, 'yyyy.MM.dd', { locale: ko });
    }
  };

  // 메모 내용 요약 (최대 30자)
  const summarizeContent = (content: string) => {
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  };

  // 테마 채팅방 아이템 렌더링
  const renderThemeChatItem = ({ item }: { item: ThemeChatInfo }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => goToThemeChat(item.theme.id, item.theme.name)}
    >
      <View style={styles.chatItemLeft}>
        <View style={styles.iconContainer}>
          <MaterialIcon 
            name={item.theme.icon || 'label'} 
            size={26} 
            color="#5e6472"
          />
        </View>
      </View>
      
      <View style={styles.chatItemCenter}>
        <Text style={styles.themeName}>{item.theme.name}</Text>
        {item.latestMemo ? (
          <Text style={styles.previewText}>
            {summarizeContent(item.latestMemo.content)}
          </Text>
        ) : (
          <Text style={styles.emptyPreviewText}>
            {t('themeChatList.writeNewMemo')}
          </Text>
        )}
      </View>
      
      <View style={styles.chatItemRight}>
        {item.latestMemo && (
          <Text style={styles.timeText}>
            {formatDate(item.latestMemo.createdAt.toString())}
          </Text>
        )}
        {item.memoCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.memoCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goToHome}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('themeChatList.title')}</Text>
          <TouchableOpacity style={styles.manageButton} onPress={goToThemeManagement}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#5e6472" />
          </View>
        ) : (
          <FlatList
            data={themeChats}
            renderItem={renderThemeChatItem}
            keyExtractor={item => item.theme.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t('themeChatList.emptyMessage')}
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={goToThemeManagement}
                >
                  <Text style={styles.emptyButtonText}>{t('themeManagement.title')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  manageButton: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  chatItemLeft: {
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9f0fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555'
  },
  chatItemCenter: {
    flex: 1,
    marginRight: 10,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
  },
  emptyPreviewText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  chatItemRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  badgeContainer: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#fff'
  }
}); 