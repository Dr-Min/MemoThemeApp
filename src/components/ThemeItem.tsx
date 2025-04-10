import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Theme } from '../models/Theme';

interface ThemeItemProps {
  theme: Theme;
  onPress: (theme: Theme) => void;
  hasChildThemes?: boolean;
}

export const ThemeItem: React.FC<ThemeItemProps> = ({ 
  theme, 
  onPress, 
  hasChildThemes = false 
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(theme)}
    >
      <View style={styles.nameContainer}>
        <Text style={styles.name}>{theme.name}</Text>
        {hasChildThemes && (
          <Text style={styles.childIndicator}>›</Text>
        )}
      </View>
      
      <View style={styles.keywordsContainer}>
        {theme.keywords.slice(0, 3).map((keyword, index) => (
          <View key={index} style={styles.keywordTag}>
            <Text style={styles.keywordText}>{keyword}</Text>
          </View>
        ))}
        {theme.keywords.length > 3 && (
          <Text style={styles.moreKeywords}>+{theme.keywords.length - 3}</Text>
        )}
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
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  childIndicator: {
    fontSize: 24,
    color: '#666',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  keywordText: {
    fontSize: 12,
    color: '#555',
  },
  moreKeywords: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'center',
  },
}); 