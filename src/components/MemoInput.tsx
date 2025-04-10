import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MemoService } from '../services/memo/MemoService';

interface MemoInputProps {
  onSubmit: (memoText: string) => void;
}

export const MemoInput: React.FC<MemoInputProps> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLock, setSubmitLock] = useState(false);

  // 메모 제출 처리 - 간소화
  const handleSubmit = async () => {
    if (text.trim().length === 0 || isSubmitting || submitLock) return;
    
    setIsSubmitting(true);
    setSubmitLock(true);
    
    try {
      // 부모 컴포넌트로 텍스트만 전달
      await onSubmit(text);
      
      // 입력 초기화
      setText('');
    } catch (error) {
      console.error('메모 제출 실패:', error);
    } finally {
      setIsSubmitting(false);
      
      setTimeout(() => {
        setSubmitLock(false);
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="메모를 입력하세요..."
        multiline
      />
      <TouchableOpacity 
        style={[styles.button, (!text.trim() || isSubmitting || submitLock) ? styles.buttonDisabled : {}]} 
        onPress={handleSubmit}
        disabled={!text.trim() || isSubmitting || submitLock}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>저장</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
}); 