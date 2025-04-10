import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { Theme } from '../models/Theme';

interface ThemeRelationshipGraphProps {
  themes: Theme[];
  onThemeSelect?: (themeId: string) => void;
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
  onThemeSelect
}) => {
  const [nodes, setNodes] = useState<ThemeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  const screenWidth = Dimensions.get('window').width - 40;
  const graphHeight = Math.max(500, themes.length * 60);
  
  // 테마 노드 생성 및 위치 설정
  useEffect(() => {
    if (themes.length === 0) return;
    
    // 루트 테마 찾기
    const rootThemes = themes.filter(theme => theme.parentTheme === null);
    
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
        parentId: theme.parentTheme,
        childIds,
        memosCount: 0 // 초기값, 나중에 업데이트 필요
      };
    };
    
    // 노드 생성 (재귀적으로 부모-자식 관계 유지)
    const generateNodes = () => {
      const allNodes: ThemeNode[] = [];
      
      // 루트 테마 배치
      rootThemes.forEach((rootTheme, index) => {
        // 루트 테마 노드 생성
        const rootNode = createNodeStructure(rootTheme, 0, index, rootThemes.length);
        allNodes.push(rootNode);
        
        // 자식 테마 처리를 위한 큐
        const queue: { theme: Theme, depth: number, position: number, totalPositions: number }[] = [];
        
        // 첫 자식들 큐에 추가
        const childThemes = rootTheme.childThemes
          .map(id => themes.find(t => t.id === id))
          .filter(t => t !== undefined) as Theme[];
        
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
          const nextChildThemes = theme.childThemes
            .map(id => themes.find(t => t.id === id))
            .filter(t => t !== undefined) as Theme[];
          
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
    setNodes(generateNodes());
  }, [themes, screenWidth]);
  
  // 노드 선택 처리
  const handleNodePress = (nodeId: string) => {
    setSelectedNode(nodeId);
    if (onThemeSelect) {
      onThemeSelect(nodeId);
    }
  };
  
  // 관계가 없는 고립된 테마들 찾기
  const isolatedThemes = themes.filter(theme => 
    theme.parentTheme === null && theme.childThemes.length === 0
  );
  
  if (themes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>테마가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>테마 관계도</Text>
      
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
          <Text style={styles.isolatedTitle}>연결되지 않은 테마</Text>
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
}); 