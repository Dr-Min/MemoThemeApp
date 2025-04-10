import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // 사용할 아이콘 팩 임포트

// 아이콘 선택 모달 Props 정의
interface IconPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  currentIcon: string;
}

// 사용 가능한 아이콘 목록 (MaterialIcons 기준)
const AVAILABLE_ICONS = [
  'label', 'home', 'work', 'book', 'shopping-cart', 'favorite', 'star', 
  'lightbulb', 'event', 'movie', 'music-note', 'directions-run', 'local-cafe',
  'local-dining', 'local-hospital', 'flight', 'train', 'directions-car',
  'build', 'code', 'attach-money', 'account-balance', 'pets', 'fitness-center',
  'palette', 'brush', 'extension', 'gamepad', 'headset', 'phone', 'email',
  'person', 'people', 'group', 'school', 'science', 'eco', 'public',
  'thumb-up', 'thumb-down', 'sentiment-satisfied', 'sentiment-dissatisfied',
  'mood', 'mood-bad', 'cake', 'celebration', 'nightlife', 'forest'
];

// 화면 너비 계산
const SCREEN_WIDTH = Dimensions.get('window').width;
const ICON_SIZE = 40;
const ICON_COLUMNS = 5;
const ICON_MARGIN = (SCREEN_WIDTH - (ICON_SIZE * ICON_COLUMNS)) / (ICON_COLUMNS * 2);

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ 
  visible, 
  onClose, 
  onSelectIcon, 
  currentIcon 
}) => {
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);

  // 아이콘 렌더링 함수
  const renderIconItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.iconButton,
        item === selectedIcon && styles.selectedIconButton
      ]}
      onPress={() => setSelectedIcon(item)}
    >
      <Icon name={item} size={ICON_SIZE * 0.7} color={item === selectedIcon ? '#fff' : '#333'} />
    </TouchableOpacity>
  );
  
  // 아이콘 선택 및 모달 닫기
  const handleSelectAndClose = () => {
    onSelectIcon(selectedIcon);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>아이콘 선택</Text>
          
          <FlatList
            data={AVAILABLE_ICONS}
            renderItem={renderIconItem}
            keyExtractor={(item) => item}
            numColumns={ICON_COLUMNS}
            contentContainerStyle={styles.iconListContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleSelectAndClose}>
              <Text style={styles.buttonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  iconListContainer: {
    paddingBottom: 10,
  },
  iconButton: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: ICON_MARGIN,
  },
  selectedIconButton: {
    backgroundColor: '#007AFF', // 선택된 아이콘 배경색
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
}); 