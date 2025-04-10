import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList
} from 'react-native';
import { useTranslation } from 'react-i18next';

// 테마 색상 옵션
const COLOR_OPTIONS = [
  { id: 'blue', value: '#007AFF', name: 'Blue' },
  { id: 'red', value: '#FF3B30', name: 'Red' },
  { id: 'green', value: '#34C759', name: 'Green' },
  { id: 'orange', value: '#FF9500', name: 'Orange' },
  { id: 'purple', value: '#AF52DE', name: 'Purple' },
  { id: 'yellow', value: '#FFCC00', name: 'Yellow' },
  { id: 'pink', value: '#FF2D55', name: 'Pink' },
  { id: 'teal', value: '#5AC8FA', name: 'Teal' },
  { id: 'indigo', value: '#5856D6', name: 'Indigo' },
  { id: 'brown', value: '#A2845E', name: 'Brown' },
  { id: 'gray', value: '#8E8E93', name: 'Gray' },
];

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  selectedColor, 
  onSelectColor 
}) => {
  const { t } = useTranslation();
  
  // 색상 항목 렌더링
  const renderColorItem = ({ item }: { item: { id: string, value: string, name: string } }) => (
    <TouchableOpacity
      style={[
        styles.colorItem,
        { backgroundColor: item.value },
        selectedColor === item.value && styles.selectedColorItem
      ]}
      onPress={() => onSelectColor(item.value)}
    >
      {selectedColor === item.value && (
        <View style={styles.selectedCheck}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('themeEdit.colorLabel', '색상')}</Text>
      <FlatList
        data={COLOR_OPTIONS}
        renderItem={renderColorItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  colorList: {
    paddingVertical: 8,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedColorItem: {
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default ColorPicker; 