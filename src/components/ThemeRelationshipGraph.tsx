import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, TouchableOpacity, Animated, PanResponder } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { Theme } from '../models/Theme';
import { Memo } from '../models/Memo';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

interface ThemeRelationshipGraphProps {
  themes: Theme[];
  memos: Memo[];
  onThemeSelect: (themeId: string) => void;
  selectedTheme?: string;
}

interface ThemeNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  parentId: string | null;
  childIds: string[];
  memosCount: number;
}

export const ThemeRelationshipGraph: React.FC<ThemeRelationshipGraphProps> = ({
  themes,
  memos,
  onThemeSelect,
  selectedTheme
}) => {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState<ThemeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [relatedThemes, setRelatedThemes] = useState<Theme[]>([]);
  const [themeMemos, setThemeMemos] = useState<Memo[]>([]);
  
  const screenWidth = Dimensions.get('window').width - 40;
  const graphHeight = Math.max(500, themes.length * 60);
  
  // 테마 노드 생성 및 위치 설정
  useEffect(() => {
    if (themes.length === 0) return;
    
    // 루트 테마 찾기
    const rootThemes = themes.filter(
      (theme) => !theme.parentThemes || theme.parentThemes.length === 0
    );
    
    // 테마 배치를 위한 헬퍼 함수
    const createNodeStructure = (
      theme: Theme, 
      depth: number = 0, 
      position: number = 0, 
      maxPositions: number = 1
    ): ThemeNode => {
      // 자식 테마 ID 찾기
      const childIds = theme.childThemes || [];
      
      // 가로 위치 (X) - 화면 너비 내에서 분배
      const xPosition = (position + 0.5) * (screenWidth / maxPositions);
      
      // 세로 위치 (Y) - 깊이에 따라 아래로
      const yPosition = 60 + (depth * 120);
      
      return {
        id: theme.id,
        name: theme.name,
        x: xPosition,
        y: yPosition,
        radius: 30, // 원의 크기
        parentId: theme.parentThemes ? theme.parentThemes[0] : null,
        childIds,
        memosCount: 0 // 초기값, 나중에 업데이트 필요
      };
    };
    
    // 노드 생성 (재귀적으로 부모-자식 관계 유지)
    const generateNodes = (themes: Theme[]) => {
      const allNodes: ThemeNode[] = [];
      
      // 루트 테마 배치
      rootThemes.forEach((rootTheme, index) => {
        // 루트 테마 노드 생성
        const rootNode = createNodeStructure(rootTheme, 0, index, rootThemes.length);
        allNodes.push(rootNode);
        
        // 자식 테마 처리를 위한 큐
        const queue: { theme: Theme, depth: number, position: number, totalPositions: number }[] = [];
        
        // 첫 자식들 큐에 추가
        const childThemes = rootTheme.childThemes?.map(id => themes.find(t => t.id === id))
          .filter(t => t !== undefined) as Theme[] || [];
        
        childThemes.forEach((child, childIndex) => {
          queue.push({
            theme: child,
            depth: 1,
            position: childIndex,
            totalPositions: childThemes.length
          });
        });
        
        // 큐를 처리하며 모든 자식 노드 생성
        while (queue.length > 0) {
          const { theme, depth, position, totalPositions } = queue.shift()!;
          
          // 노드 생성
          const node = createNodeStructure(theme, depth, position, totalPositions);
          allNodes.push(node);
          
          // 자식 테마들 큐에 추가
          const nextChildThemes = theme.childThemes?.map(id => themes.find(t => t.id === id))
            .filter(t => t !== undefined) as Theme[] || [];
          
          nextChildThemes.forEach((child, childIndex) => {
            queue.push({
              theme: child,
              depth: depth + 1,
              position: childIndex,
              totalPositions: nextChildThemes.length
            });
          });
        }
      });
      
      // 노드에 연결된 메모 개수 추가하는 로직 추가 예정
      
      return allNodes;
    };
    
    // 노드 설정
    setNodes(generateNodes(themes));
  }, [themes, screenWidth]);
  
  // 선택된 테마와 관련된 테마와 메모 찾기
  useEffect(() => {
    if (!selectedNode) {
      setRelatedThemes([]);
      setThemeMemos([]);
      return;
    }

    // 선택된 노드 객체 찾기
    const node = nodes.find(n => n.id === selectedNode);
    if (!node) return;

    // 선택된 테마 객체 찾기
    const selectedThemeObj = themes.find(t => t.id === selectedNode);
    if (!selectedThemeObj) return;

    // 관련 테마 찾기 (부모 및 자식 테마)
    const parentTheme = selectedThemeObj.parentThemes
      ? selectedThemeObj.parentThemes.map(id => themes.find(t => t.id === id)).filter(t => t !== undefined) as Theme[]
      : null;
    
    const childThemes = selectedThemeObj.childThemes?.map(id => themes.find(t => t.id === id))
      .filter(t => t !== undefined) as Theme[] || [];
    
    const related = [...(parentTheme ? parentTheme : []), ...childThemes];
    setRelatedThemes(related);

    // 관련 메모 찾기
    const relatedMemos = memos.filter(memo => 
      memo.themes.includes(selectedNode)
    );
    setThemeMemos(relatedMemos);
  }, [selectedNode, nodes, themes, memos]);
  
  // 노드 선택 처리
  const handleNodePress = (nodeId: string) => {
    setSelectedNode(nodeId);
    if (onThemeSelect) {
      onThemeSelect(nodeId);
    }
  };
  
  // 관계가 없는 고립된 테마들 찾기
  const isolatedThemes = themes.filter(theme => 
    (!theme.parentThemes || theme.parentThemes.length === 0) && (!theme.childThemes || theme.childThemes.length === 0)
  );
  
  if (themes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcon name="bubble-chart" size={50} color="#ddd" />
        <Text style={styles.emptyText}>{t('themeVisualization.noThemes')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Info text */}
      <View style={styles.infoContainer}>
        <MaterialIcon name="info-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{t('themeVisualization.graphInstructions')}</Text>
      </View>
      
      <Text style={styles.title}>{t('themeVisualization.relationshipGraph')}</Text>
      
      <ScrollView 
        horizontal 
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={true}
      >
        <ScrollView 
          contentContainerStyle={[styles.graphContainer, { height: graphHeight }]}
          showsVerticalScrollIndicator={true}
        >
          <Svg width={screenWidth} height={graphHeight}>
            {/* 연결선 그리기 */}
            {nodes.map(node => 
              node.parentId && (
                <Line
                  key={`line-${node.id}-${node.parentId}`}
                  x1={node.x}
                  y1={node.y}
                  x2={nodes.find(n => n.id === node.parentId)?.x || 0}
                  y2={nodes.find(n => n.id === node.parentId)?.y || 0}
                  stroke="#aaa"
                  strokeWidth="2"
                />
              )
            )}
            
            {/* 테마 노드 그리기 */}
            {nodes.map(node => (
              <React.Fragment key={`node-${node.id}`}>
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={selectedNode === node.id ? '#007AFF' : '#e1edf7'}
                  stroke="#007AFF"
                  strokeWidth="2"
                  onPress={() => handleNodePress(node.id)}
                />
                <SvgText
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fill={selectedNode === node.id ? '#fff' : '#333'}
                  fontSize="12"
                  fontWeight="bold"
                  onPress={() => handleNodePress(node.id)}
                >
                  {node.name.length > 10 ? node.name.substring(0, 8) + '...' : node.name}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </ScrollView>
      </ScrollView>
      
      {/* 고립된 테마 목록 */}
      {isolatedThemes.length > 0 && (
        <View style={styles.isolatedContainer}>
          <Text style={styles.isolatedTitle}>{t('themeVisualization.isolatedThemesTitle')}</Text>
          <View style={styles.isolatedList}>
            {isolatedThemes.map(theme => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.isolatedItem,
                  selectedNode === theme.id && styles.isolatedItemSelected
                ]}
                onPress={() => handleNodePress(theme.id)}
              >
                <Text 
                  style={[
                    styles.isolatedItemText,
                    selectedNode === theme.id && styles.isolatedItemTextSelected
                  ]}
                >
                  {theme.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: '#3498db' }]} />
          <Text style={styles.legendText}>{t('common.theme')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#95a5a6' }]} />
          <Text style={styles.legendText}>{t('themeVisualization.relationship')}</Text>
        </View>
      </View>
      
      {/* Selected theme info */}
      {selectedNode && (
        <View style={styles.selectedNodeInfo}>
          <Text style={styles.selectedNodeTitle}>
            {t('themeVisualization.selectedTheme')}: {themes.find(t => t.id === selectedNode)?.name || ''}
          </Text>
          
          {/* Related themes */}
          {relatedThemes.length > 0 && (
            <>
              <Text style={styles.relatedTitle}>{t('themeVisualization.relatedThemes')}</Text>
              <View style={styles.relatedThemesList}>
                {relatedThemes.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.relatedThemeItem,
                      {
                        backgroundColor: '#e1edf7',
                        borderColor: theme.id === selectedTheme ? '#007bff' : 'transparent',
                      },
                    ]}
                    onPress={() => onThemeSelect(theme.id)}
                  >
                    <MaterialIcon name={theme.icon || 'label'} size={16} color="#007AFF" style={styles.relatedThemeIcon} />
                    <Text style={styles.relatedThemeName}>{theme.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          
          {/* Memos with this theme */}
          {themeMemos.length > 0 && (
            <>
              <Text style={styles.relatedTitle}>
                {t('themeVisualization.relatedMemos')}: {themeMemos.length}{t('common.countUnit')}
              </Text>
            </>
          )}
        </View>
      )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  scrollContent: {
    flexGrow: 1,
  },
  graphContainer: {
    width: '100%',
    minHeight: 300,
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
  isolatedContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  isolatedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  isolatedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  isolatedItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  isolatedItemSelected: {
    backgroundColor: '#007AFF',
  },
  isolatedItemText: {
    fontSize: 14,
    color: '#333',
  },
  isolatedItemTextSelected: {
    color: '#fff',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendLine: {
    width: 16,
    height: 2,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  selectedNodeInfo: {
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedNodeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  relatedThemesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  relatedThemeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  relatedThemeIcon: {
    marginRight: 8,
  },
  relatedThemeName: {
    fontSize: 14,
    color: '#333',
  },
}); 