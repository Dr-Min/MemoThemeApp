import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

// DateTimePicker 타입 선언
interface DateTimePickerEvent {
  type: string;
  nativeEvent: {
    timestamp?: number;
  };
}

// 필터 모드 타입
export type DateFilterMode = 'day' | 'month' | 'year' | 'range' | 'all';

interface DateFilterProps {
  onFilterChange: (mode: DateFilterMode, startDate?: Date, endDate?: Date) => void;
  currentMode: DateFilterMode;
  startDate?: Date;
  endDate?: Date;
  style?: any;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  onFilterChange,
  currentMode,
  startDate,
  endDate,
  style
}) => {
  const { t } = useTranslation();
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
  const [tempMode, setTempMode] = useState<DateFilterMode>(currentMode);
  
  // 필터 모드에 따른 제목 가져오기
  const getFilterTitle = () => {
    switch (currentMode) {
      case 'all':
        return t('dateFilter.all');
      case 'day':
        return t('dateFilter.today');
      case 'month':
        return t('dateFilter.thisMonth');
      case 'year':
        return t('dateFilter.thisYear');
      case 'range':
        if (startDate && endDate) {
          return `${format(startDate, 'yyyy.MM.dd')} - ${format(endDate, 'yyyy.MM.dd')}`;
        }
        return t('dateFilter.selectRange');
      default:
        return t('dateFilter.all');
    }
  };

  const filterOptions: { key: DateFilterMode; label: string }[] = [
    { key: 'all', label: t('dateFilter.all') },
    { key: 'day', label: t('dateFilter.today') },
    { key: 'month', label: t('dateFilter.thisMonth') },
    { key: 'year', label: t('dateFilter.thisYear') },
    { key: 'range', label: t('dateFilter.customRange') }
  ];

  const handleOpenModal = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempMode(currentMode);
    setShowFilterModal(true);
  };

  const handleApplyFilter = () => {
    onFilterChange(tempMode, tempStartDate, tempEndDate);
    setShowFilterModal(false);
  };

  const handleDateChange = (isStartDate: boolean, date?: Date) => {
    if (!date) return;

    if (isStartDate) {
      setTempStartDate(date);
      // 만약 시작일이 종료일보다 나중이면 종료일을 시작일로 설정
      if (tempEndDate && date > tempEndDate) {
        setTempEndDate(date);
      }
    } else {
      // 만약 종료일이 시작일보다 이르면 시작일을 유지
      if (tempStartDate && date < tempStartDate) {
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(date);
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleOpenModal}
      >
        <Text style={styles.title}>{t('dateFilter.filterByDate')}</Text>
        <View style={styles.currentFilter}>
          <Text style={styles.currentFilterText}>{getFilterTitle()}</Text>
          <FontAwesome name="angle-down" size={16} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('dateFilter.filterByDate')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.closeButton}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttons}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.button, tempMode === option.key && styles.selectedButton]}
                  onPress={() => setTempMode(option.key)}
                >
                  <Text style={[styles.buttonText, tempMode === option.key && styles.selectedButtonText]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tempMode === 'range' && (
              <View style={styles.dateRangeSelection}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>{t('dateFilter.startDate')}</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {tempStartDate ? format(tempStartDate, 'yyyy.MM.dd') : t('dateFilter.startDate')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>{t('dateFilter.endDate')}</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {tempEndDate ? format(tempEndDate, 'yyyy.MM.dd') : t('dateFilter.endDate')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilter}
            >
              <Text style={styles.applyButtonText}>{t('common.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {Platform.OS === 'ios' && showStartPicker && (
        <DatePickerIOS
          date={tempStartDate || new Date()}
          onDateChange={date => handleDateChange(true, date)}
          mode="date"
        />
      )}

      {Platform.OS === 'ios' && showEndPicker && (
        <DatePickerIOS
          date={tempEndDate || new Date()}
          onDateChange={date => handleDateChange(false, date)}
          mode="date"
        />
      )}

      {Platform.OS === 'android' && showStartPicker && (
        <DatePickerDialog 
          date={tempStartDate || new Date()} 
          onConfirm={(date) => {
            setShowStartPicker(false);
            handleDateChange(true, date);
          }}
          onCancel={() => setShowStartPicker(false)}
        />
      )}

      {Platform.OS === 'android' && showEndPicker && (
        <DatePickerDialog 
          date={tempEndDate || new Date()} 
          onConfirm={(date) => {
            setShowEndPicker(false);
            handleDateChange(false, date);
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      )}
    </View>
  );
};

// 날짜 선택기 대체용 컴포넌트
const DatePickerIOS: React.FC<{
  date: Date;
  onDateChange: (date: Date) => void;
  mode: string;
}> = ({ date, onDateChange }) => {
  // 임시로 비워두고, 실제 사용 시 react-native-community/datetimepicker 구현
  return null;
};

// 안드로이드 날짜 선택 다이얼로그 대체용 컴포넌트
const DatePickerDialog: React.FC<{
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}> = ({ date, onConfirm, onCancel }) => {
  // 임시로 비워두고, 실제 사용 시 react-native-community/datetimepicker 구현
  return null;
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentFilterText: {
    fontSize: 14,
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 14,
    color: '#007AFF',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    color: '#444',
  },
  selectedButtonText: {
    color: '#fff',
  },
  rangeContainer: {
    marginBottom: 12,
  },
  rangeButton: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectedRangeButton: {
    backgroundColor: '#007AFF',
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#444',
  },
  selectedRangeButtonText: {
    color: '#fff',
  },
  dateRangeSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  datePickerButton: {
    backgroundColor: '#eaeaea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#444',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
}); 