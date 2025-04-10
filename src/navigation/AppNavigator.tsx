import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { HomeScreen } from '../screens/HomeScreen';
import { MemoDetailScreen } from '../screens/MemoDetailScreen';
import { ThemeManagementScreen } from '../screens/ThemeManagementScreen';
import { ThemeEditScreen } from '../screens/ThemeEditScreen';
import { ThemeVisualizationScreen } from '../screens/ThemeVisualizationScreen';
import { ThemeChatListScreen } from '../screens/ThemeChatListScreen';
import { ThemeChatScreen } from '../screens/ThemeChatScreen';

// 네비게이션 스택 타입 정의
export type RootStackParamList = {
  Home: undefined;
  MemoDetail: { memoId: string };
  ThemeManagement: { parentThemeId?: string };
  ThemeEdit: { themeId: string };
  ThemeVisualization: undefined;
  ThemeChatList: undefined;
  ThemeChat: { themeId: string, themeName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MemoDetail" component={MemoDetailScreen} />
        <Stack.Screen name="ThemeManagement" component={ThemeManagementScreen} />
        <Stack.Screen name="ThemeEdit" component={ThemeEditScreen} />
        <Stack.Screen name="ThemeVisualization" component={ThemeVisualizationScreen} />
        <Stack.Screen name="ThemeChatList" component={ThemeChatListScreen} />
        <Stack.Screen name="ThemeChat" component={ThemeChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 