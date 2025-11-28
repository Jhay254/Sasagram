import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function NetworkGraphScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [graphData, setGraphData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGraphData();
    }, []);

    const fetchGraphData = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const response = await fetch('/api/memory-graph/graph');
            // const data = await response.json();
            // setGraphData(data.data);

            // Mock graph data
            setGraphData({
                nodes: [
                    { id: 'user0', firstName: 'You', lastName: '', type: 'central', x: width / 2, y: height / 3 },
                    { id: 'user1', firstName: 'Sarah', lastName: 'J.', type: 'connection', x: width / 2 - 100, y: height / 3 - 100 },
                    { id: 'user2', firstName: 'Mike', lastName: 'C.', type: 'connection', x: width / 2 + 100, y: height / 3 - 80 },
                    { id: 'user3', firstName: 'Emma', lastName: 'D.', type: 'connection', x: width / 2 - 120, y: height / 3 + 100 },
                ],
                edges: [
                    { source: 'user0', target: 'user1', strength: 85 },
                    { source: 'user0', target: 'user2', strength: 72 },
                    { source: 'user0', target: 'user3', strength: 68 },
                ],
            });
        } catch (error) {
            console.error('Error fetching graph:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStrokeWidth = (strength: number) => {
        return 1 + (strength / 100) * 4; // 1-5px based on strength
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Memory Network
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('ConnectionsList')}>
                    <Ionicons name="list" size={28} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Building your network...
                    </Text>
                </View>
            ) : graphData ? (
                <ScrollView contentContainerStyle={styles.graphContainer}>
                    <Svg width={width} height={height - 100}>
                        {/* Draw edges */}
                        {graphData.edges.map((edge: any, index: number) => {
                            const sourceNode = graphData.nodes.find((n: any) => n.id === edge.source);
                            const targetNode = graphData.nodes.find((n: any) => n.id === edge.target);

                            if (!sourceNode || !targetNode) return null;

                            return (
                                <Line
                                    key={`edge-${index}`}
                                    x1={sourceNode.x}
                                    y1={sourceNode.y}
                                    x2={targetNode.x}
                                    y2={targetNode.y}
                                    stroke={theme.colors.primary}
                                    strokeWidth={getStrokeWidth(edge.strength)}
                                    opacity={0.5}
                                />
                            );
                        })}

                        {/* Draw nodes */}
                        {graphData.nodes.map((node: any) => {
                            const isCentral = node.type === 'central';
                            const radius = isCentral ? 35 : 25;

                            return (
                                <React.Fragment key={node.id}>
                                    <Circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={radius}
                                        fill={isCentral ? theme.colors.primary : theme.colors.surface}
                                        stroke={theme.colors.primary}
                                        strokeWidth={2}
                                    />
                                    <SvgText
                                        x={node.x}
                                        y={node.y + radius + 15}
                                        fill={theme.colors.text}
                                        fontSize="12"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                    >
                                        {node.firstName}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}
                    </Svg>

                    <View style={styles.legend}>
                        <Text style={[styles.legendTitle, { color: theme.colors.text }]}>
                            Connection Strength
                        </Text>
                        <View style={styles.legendItems}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendLine, { borderColor: theme.colors.primary, borderWidth: 5 }]} />
                                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                                    Strong (80-100%)
                                </Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendLine, { borderColor: theme.colors.primary, borderWidth: 3 }]} />
                                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                                    Medium (50-80%)
                                </Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendLine, { borderColor: theme.colors.primary, borderWidth: 1 }]} />
                                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                                    Weak (0-50%)
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="git-network-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        No network data
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        Connect your accounts to build your memory network
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    graphContainer: {
        flex: 1,
        padding: 16,
    },
    legend: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    legendTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    legendItems: {
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    legendLine: {
        width: 40,
        height: 0,
    },
    legendText: {
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
