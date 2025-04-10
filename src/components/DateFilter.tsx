import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';

// 필터 모드 타입
export type DateFilterMode = 'day' | 'month' | 'year' | 'range' | 'all';

interface DateFilterProps {
  onFilterChange: (mode: DateFilterMode, startDate?: Date, endDate?: Date) => void;
  currentMode: DateFilterMode;
  startDate?: Date;
  endDate?: Date;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  onFilterChange,
  currentMode,
  startDate,
  endDate
}) => {
  // 현재 날짜
  const today = new Date();
  
  // 날짜 포맷팅 함수
  const formatDate = (date?: Date): string => {
    if (!date) return '';
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  
  // 모드별 버튼 생성
  const renderFilterButton = (label: string, mode: DateFilterMode, start?: Date, end?: Date) => {
    const isActive = currentMode === mode;
    
    if (mode === 'range' && !startDate && !endDate) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.activeFilterButton]}
        onPress={() => onFilterChange(mode, start, end)}
      >
        <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // 날짜 선택기 열기 (원래는 DatePicker를 사용하겠지만, 여기서는 간단하게 구현)
  const openDatePicker = (isStartDate: boolean) => {
    // 실제 구현시 DatePicker 사용
    // 현재는 간단히 오늘 날짜에서 +/- 7일로 구현
    const newDate = new Date();
    if (isStartDate) {
      newDate.setDate(newDate.getDate() - 7);
      onFilterChange('range', newDate, endDate || today);
    } else {
      onFilterChange('range', startDate || new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7), newDate);
    }
  };
  
  // 필터 모드에 따른 제목 가져오기
  const getFilterTitle = (): string => {
    switch (currentMode) {
      case 'day':
        return '오늘';
      case 'month':
        return `${today.getFullYear()}년 ${today.getMonth() + 1}월`;
      case 'year':
        return `${today.getFullYear()}년`;
      case 'range':
        return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
      default:
        return '전체 기간';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>날짜별 분류</Text>
        <Text style={styles.currentFilter}>{getFilterTitle()}</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        {renderFilterButton('전체', 'all')}
        {renderFilterButton('오늘', 'day', 
          new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
        )}
        {renderFilterButton('이번 달', 'month', 
          new Date(today.getFullYear(), today.getMonth(), 1),
          new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
        )}
        {renderFilterButton('올해', 'year', 
          new Date(today.getFullYear(), 0, 1),
          new Date(today.getFullYear(), 11, 31, 23, 59, 59)
        )}
        {renderFilterButton('사용자 지정', 'range', startDate, endDate)}
      </View>
      
      {currentMode === 'range' && (
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker(true)}>
            <Text style={styles.dateButtonText}>
              {startDate ? formatDate(startDate) : '시작일 선택'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dateRangeSeparator}>~</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker(false)}>
            <Text style={styles.dateButtonText}>
              {endDate ? formatDate(endDate) : '종료일 선택'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentFilter: {
    fontSize: 14,
    color: '#007AFF',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#444',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateButton: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#666',
  },
}); 