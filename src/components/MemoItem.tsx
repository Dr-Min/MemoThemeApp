import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Memo } from '../models/Memo';
import { Theme } from '../models/Theme';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../styles/theme';
import { formatRelativeTime } from '../utils/dateUtils';

// 속성 정의
interface MemoItemProps {
  memo: Memo;
  themes?: Theme[];
  onPress: (memo: Memo) => void;
  onLongPress?: (memo: Memo) => void;
  isSelected?: boolean;
  selected?: boolean;
  selectionMode?: boolean;
  viewMode?: 'standard' | 'chat';
}

// 스타일 인터페이스 정의
interface Styles {
  container: ViewStyle;
  selectedContainer: ViewStyle;
  contentContainer: ViewStyle;
  content: TextStyle;
  metaContainer: ViewStyle;
  dateText: TextStyle;
  themeContainer: ViewStyle;
  themeTag: ViewStyle;
  themeText: TextStyle;
  moreThemes: TextStyle;
  chatContainer: ViewStyle;
  chatBubble: ViewStyle;
  chatContent: TextStyle;
  chatMetaContainer: ViewStyle;
}

// 테마 ID에 따른 색상 매핑
const getThemeColor = (themeId: string) => {
  const colors = [
    COLORS.primary.default,
    COLORS.secondary.default,
    COLORS.accent.default,
    COLORS.success.default,
    COLORS.warning.default,
    COLORS.info.default,
  ];
  
  // 테마 ID에서 숫자만 추출하여 색상 배열의 인덱스로 변환
  const numericId = parseInt(themeId.replace(/\D/g, '')) || 0;
  return colors[numericId % colors.length];
};

// 메모 내용 요약 (최대 150자)
const summarizeContent = (content: string): string => {
  if (content.length <= 150) return content;
  return content.substring(0, 147) + '...';
};

// MemoItem 컴포넌트
const MemoItem: React.FC<MemoItemProps> = ({ 
  memo, 
  themes = [], 
  onPress, 
  onLongPress, 
  isSelected, 
  selected = false, 
  selectionMode = false,
  viewMode = 'standard'
}) => {
  // 메모에 첫 번째 테마가 있으면 해당 색상으로, 없으면 기본 색상 사용
  const borderColor = useMemo(() => {
    return memo.themes && memo.themes.length > 0 
      ? getThemeColor(memo.themes[0]) 
      : COLORS.primary.default;
  }, [memo.themes]);
    
  // 메모 콘텐츠 요약
  const contentSummary = useMemo(() => {
    return summarizeContent(memo.content);
  }, [memo.content]);
  
  // 생성 날짜 포맷팅
  const formattedDate = useMemo(() => {
    return formatRelativeTime(new Date(memo.createdAt));
  }, [memo.createdAt]);

  // 선택 상태 확인 (isSelected와 selected prop 모두 고려)
  const isItemSelected = isSelected || selected;

  // 테마 ID로 테마 객체 찾기
  const getThemeNameById = useCallback((themeId: string): string => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.name : themeId;
  }, [themes]);

  // 테마 태그 렌더링 함수
  const renderThemeTags = useCallback(() => (
    <View style={styles.themeContainer}>
      {memo.themes.slice(0, 3).map((themeId, index) => (
        <View 
          key={index} 
          style={[
            styles.themeTag,
            { backgroundColor: `${getThemeColor(themeId)}20` }
          ]}
        >
          <Text 
            style={[
              styles.themeText,
              { color: getThemeColor(themeId) }
            ]}
          >
            {getThemeNameById(themeId)}
          </Text>
        </View>
      ))}
      {memo.themes.length > 3 && (
        <Text style={styles.moreThemes}>+{memo.themes.length - 3}</Text>
      )}
    </View>
  ), [memo.themes, getThemeNameById]);

  // 메모 터치 핸들러
  const handlePress = useCallback(() => {
    onPress(memo);
  }, [memo, onPress]);

  // 메모 롱 터치 핸들러
  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(memo);
    }
  }, [memo, onLongPress]);

  // 채팅 모드 렌더링
  if (viewMode === 'chat') {
    return (
      <TouchableOpacity
        style={[
          styles.chatContainer,
          isItemSelected && styles.selectedContainer,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={[styles.chatBubble, { backgroundColor: `${borderColor}15` }]}>
          <Text style={styles.chatContent} numberOfLines={3}>
            {contentSummary}
          </Text>
        </View>
        <View style={styles.chatMetaContainer}>
          <Text style={styles.dateText}>
            {formattedDate}
          </Text>
          {memo.themes && memo.themes.length > 0 && renderThemeTags()}
        </View>
      </TouchableOpacity>
    );
  }

  // 기본 모드 렌더링 (기존 코드)
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderLeftColor: borderColor },
        isItemSelected && styles.selectedContainer,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.content} numberOfLines={3}>
          {contentSummary}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.dateText}>
            {formattedDate}
          </Text>
          {memo.themes && memo.themes.length > 0 && renderThemeTags()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 스타일 정의
const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginVertical: SPACING.xs,
    borderLeftWidth: 3,
    ...SHADOWS.small,
  },
  selectedContainer: {
    borderLeftColor: COLORS.accent.default,
    backgroundColor: COLORS.background.highlight,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    fontSize: TYPOGRAPHY.body.fontSize,
    lineHeight: TYPOGRAPHY.body.lineHeight,
    fontWeight: 'normal',
    letterSpacing: TYPOGRAPHY.body.letterSpacing,
    marginBottom: SPACING.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  dateText: {
    fontSize: TYPOGRAPHY.caption1.fontSize,
    lineHeight: TYPOGRAPHY.caption1.lineHeight,
    fontWeight: 'normal',
    letterSpacing: TYPOGRAPHY.caption1.letterSpacing,
    color: COLORS.text.tertiary,
  },
  themeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
  },
  themeTag: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.s,
    marginLeft: SPACING.xs,
  },
  themeText: {
    fontSize: TYPOGRAPHY.caption2.fontSize,
    lineHeight: TYPOGRAPHY.caption2.lineHeight,
    fontWeight: 'normal',
    letterSpacing: TYPOGRAPHY.caption2.letterSpacing,
    color: COLORS.primary.default,
  },
  moreThemes: {
    fontSize: TYPOGRAPHY.caption2.fontSize,
    lineHeight: TYPOGRAPHY.caption2.lineHeight,
    fontWeight: 'normal',
    letterSpacing: TYPOGRAPHY.caption2.letterSpacing,
    color: COLORS.text.tertiary,
    marginLeft: SPACING.xs,
  },
  chatContainer: {
    marginVertical: SPACING.xs,
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.s,
  },
  chatBubble: {
    backgroundColor: COLORS.primary.light,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    maxWidth: '85%',
    minWidth: '50%',
    borderTopRightRadius: RADIUS.xs,
    ...SHADOWS.small,
  },
  chatContent: {
    fontSize: TYPOGRAPHY.body.fontSize,
    lineHeight: TYPOGRAPHY.body.lineHeight,
    fontWeight: 'normal',
    color: COLORS.text.primary,
    letterSpacing: TYPOGRAPHY.body.letterSpacing,
  },
  chatMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingRight: SPACING.xs,
    maxWidth: '85%',
  },
});

export default React.memo(MemoItem); 