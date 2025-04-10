import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Theme } from '../models/Theme';
import { Memo } from '../models/Memo';
import { useTranslation } from 'react-i18next';

interface ThemeStatistics {
  themeId: string;
  themeName: string;
  count: number;
  icon: string;
  color: string; // 차트 색상용 (icon과는 별개)
}

interface ThemeStatisticsChartProps {
  themes: Theme[];
  memos: Memo[];
  onThemeSelect?: (themeId: string) => void;
}

export const ThemeStatisticsChart: React.FC<ThemeStatisticsChartProps> = ({
  themes,
  memos,
  onThemeSelect
}) => {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<ThemeStatistics[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  
  const screenWidth = Dimensions.get('window').width - 40;
  
  // 통계 데이터 계산
  useEffect(() => {
    if (themes.length === 0 || memos.length === 0) return;
    
    // 색상 배열 (차트에 사용)
    const colors = [
      '#007AFF', '#4CD964', '#FF9500', '#FF3B30', '#5856D6', 
      '#FF2D55', '#34C759', '#AF52DE', '#FF9500', '#007AFF'
    ];
    
    // 각 테마별 메모 개수 계산
    const themeStats = themes.map((theme, index) => {
      // 이 테마를 사용하는 메모 개수
      const count = memos.filter(memo => memo.themes.includes(theme.id)).length;
      
      return {
        themeId: theme.id,
        themeName: theme.name,
        count,
        icon: theme.icon || 'label', // 테마의 icon 속성 사용
        color: colors[index % colors.length] // 차트 색상용
      };
    });
    
    // 메모 수 기준 내림차순 정렬
    themeStats.sort((a, b) => b.count - a.count);
    
    // 상위 10개만 선택
    const topStats = themeStats.slice(0, 10);
    setStatistics(topStats);
  }, [themes, memos]);
  
  // 테마 선택 처리
  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    if (onThemeSelect) {
      onThemeSelect(themeId);
    }
  };
  
  // 차트 데이터 포맷팅 (막대 차트용)
  const barChartData = {
    labels: statistics.map(stat => 
      stat.themeName.length > 8 ? stat.themeName.substring(0, 6) + '..' : stat.themeName
    ),
    datasets: [
      {
        data: statistics.map(stat => stat.count),
        colors: statistics.map(stat => 
          (opacity = 1) => selectedTheme === stat.themeId ? '#FF9500' : stat.color
        )
      }
    ]
  };
  
  // 차트 데이터 포맷팅 (파이 차트용)
  const pieChartData = statistics.map(stat => ({
    name: stat.themeName.length > 8 ? stat.themeName.substring(0, 6) + '..' : stat.themeName,
    count: stat.count,
    color: selectedTheme === stat.themeId ? '#FF9500' : stat.color,
    legendFontColor: '#7F7F7F',
    legendFontSize: 12
  }));
  
  // 차트 설정
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.8,
    decimalPlaces: 0
  };
  
  if (themes.length === 0 || memos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {themes.length === 0 ? t('themeVisualization.noThemes') : t('themeVisualization.noMemos')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('themeVisualization.statisticsTitle')}</Text>
        <View style={styles.chartTypeSwitcher}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === 'bar' && styles.chartTypeButtonActive
            ]}
            onPress={() => setChartType('bar')}
          >
            <Text style={[
              styles.chartTypeText,
              chartType === 'bar' && styles.chartTypeTextActive
            ]}>
              {t('themeVisualization.barChart')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === 'pie' && styles.chartTypeButtonActive
            ]}
            onPress={() => setChartType('pie')}
          >
            <Text style={[
              styles.chartTypeText,
              chartType === 'pie' && styles.chartTypeTextActive
            ]}>
              {t('themeVisualization.pieChart')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        horizontal
        contentContainerStyle={styles.chartContainer}
        showsHorizontalScrollIndicator={true}
      >
        {chartType === 'bar' ? (
          <BarChart
            data={barChartData}
            width={Math.max(screenWidth, statistics.length * 50)}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
          />
        ) : (
          <PieChart
            data={pieChartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        )}
      </ScrollView>
      
      <ScrollView style={styles.statsListContainer}>
        <Text style={styles.statsListTitle}>{t('themeVisualization.detailedStatistics')}</Text>
        {statistics.map(stat => (
          <TouchableOpacity
            key={stat.themeId}
            style={[
              styles.statItem,
              selectedTheme === stat.themeId && styles.statItemSelected
            ]}
            onPress={() => handleThemeSelect(stat.themeId)}
          >
            <View style={[styles.statColorIndicator, { backgroundColor: stat.color }]} />
            <Text style={styles.statName}>{stat.themeName}</Text>
            <Text style={styles.statCount}>{stat.count}{t('common.countUnit')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartTypeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  chartTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chartTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  chartTypeText: {
    fontSize: 14,
    color: '#333',
  },
  chartTypeTextActive: {
    color: '#fff',
  },
  chartContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  statsListContainer: {
    maxHeight: 200,
    marginTop: 8,
  },
  statsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  statItemSelected: {
    backgroundColor: '#f0f0f0',
  },
  statColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  statCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
}); 