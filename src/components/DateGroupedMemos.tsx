import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import MemoItem from './MemoItem';
import { DateGroup } from '../services/memo/MemoService';
import { Memo } from '../models/Memo';
import { Theme } from '../models/Theme';

interface DateGroupedMemosProps {
  dateGroups: DateGroup[];
  themes: Theme[];
  onMemoPress: (memo: Memo) => void;
  onMemoLongPress?: (memo: Memo) => void;
  selectedMemos?: string[];
  selectionMode?: boolean;
  viewMode?: 'standard' | 'chat';
}

export const DateGroupedMemos: React.FC<DateGroupedMemosProps> = ({
  dateGroups,
  themes,
  onMemoPress,
  onMemoLongPress,
  selectedMemos = [],
  selectionMode = false,
  viewMode = 'standard'
}) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  // 그룹 펼침/접기 토글
  const toggleGroup = useCallback((groupLabel: string) => {
    setExpandedGroups(prev => {
      if (prev.includes(groupLabel)) {
        return prev.filter(label => label !== groupLabel);
      } else {
        return [...prev, groupLabel];
      }
    });
  }, []);
  
  // 그룹이 펼쳐져 있는지 확인
  const isGroupExpanded = useCallback((groupLabel: string) => {
    return expandedGroups.includes(groupLabel);
  }, [expandedGroups]);
  
  // 단일 그룹 렌더링 함수
  const renderGroup = useCallback(({ item }: { item: DateGroup }) => {
    return (
      <View style={styles.groupContainer}>
        <TouchableOpacity 
          style={styles.groupHeader}
          onPress={() => toggleGroup(item.label)}
        >
          <Text style={styles.groupLabel}>{item.label}</Text>
          <View style={styles.groupInfo}>
            <Text style={styles.groupCount}>{item.memos.length}개</Text>
            <Text style={styles.expandIcon}>
              {isGroupExpanded(item.label) ? '▼' : '▶'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {isGroupExpanded(item.label) && (
          <View style={styles.memosContainer}>
            {item.memos.map(memo => (
              <MemoItem 
                key={memo.id}
                memo={memo}
                themes={themes}
                onPress={onMemoPress}
                onLongPress={onMemoLongPress}
                selected={selectedMemos.includes(memo.id)}
                selectionMode={selectionMode}
                viewMode={viewMode}
              />
            ))}
          </View>
        )}
      </View>
    );
  }, [toggleGroup, isGroupExpanded, themes, onMemoPress, onMemoLongPress, selectedMemos, selectionMode, viewMode]);
  
  // keyExtractor 함수 메모이제이션
  const keyExtractor = useCallback((item: DateGroup) => item.label, []);
  
  if (dateGroups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>해당 기간에 메모가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={dateGroups}
      keyExtractor={keyExtractor}
      renderItem={renderGroup}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
};

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e1edf7',
    borderRadius: 8,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  memosContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 