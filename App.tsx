import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import './src/i18n/i18n'; // i18n 설정 가져오기
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n/i18n';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </I18nextProvider>
  );
} 