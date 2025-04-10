import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Memo } from '../models/Memo';
import { Theme } from '../models/Theme';

interface MemoItemProps {
  memo: Memo;
  themes: Theme[];
  onPress: (memo: Memo) => void;
}

export const MemoItem: React.FC<MemoItemProps> = ({ memo, themes, onPress }) => {
  // 메모에 연결된 테마 이름들 가져오기
  const themeNames = memo.themes
    .map(themeId => themes.find(t => t.id === themeId)?.name)
    .filter(name => name !== undefined);

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(memo)}
    >
      <Text style={styles.content} numberOfLines={3}>
        {memo.content}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.date}>
          {formatDate(memo.createdAt)}
        </Text>
        
        <View style={styles.themesContainer}>
          {themeNames.map((name, index) => (
            <View key={index} style={styles.themeTag}>
              <Text style={styles.themeText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  themeTag: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  themeText: {
    fontSize: 12,
    color: '#444',
  },
}); 