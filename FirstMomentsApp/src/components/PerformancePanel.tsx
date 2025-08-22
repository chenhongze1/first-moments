import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { performanceMonitor } from '../utils/performanceMonitor';
import { colors } from '../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PerformancePanelProps {
  visible: boolean;
  onClose: () => void;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  visible,
  onClose,
}) => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      // 立即获取数据
      updatePerformanceData();
      
      // 设置定时刷新
      const interval = setInterval(updatePerformanceData, 2000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [visible]);

  const updatePerformanceData = () => {
    const data = performanceMonitor.getPerformanceReport();
    setPerformanceData(data);
  };

  const clearPerformanceData = () => {
    performanceMonitor.clearData();
    updatePerformanceData();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms.toFixed(1)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, type: string): string => {
    const thresholds = {
      render: { good: 16, warning: 32 },
      api: { good: 1000, warning: 3000 },
      image: { good: 1000, warning: 2000 },
      scroll: { good: 16, warning: 32 },
      memory: { good: 50, warning: 100 },
    };

    const threshold = thresholds[type as keyof typeof thresholds];
    if (!threshold) return colors.textPrimary;

    if (value <= threshold.good) return colors.success;
    if (value <= threshold.warning) return colors.warning;
    return colors.error;
  };

  const renderMetricCard = (title: string, value: number, unit: string, type: string) => {
    const color = getPerformanceColor(value, type);
    
    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={[styles.metricValue, { color }]}>
          {type === 'memory' ? value.toFixed(1) : formatDuration(value)}
          <Text style={styles.metricUnit}> {unit}</Text>
        </Text>
      </View>
    );
  };

  const renderEventList = () => {
    if (!performanceData?.recentEvents?.length) {
      return (
        <Text style={styles.noDataText}>暂无性能事件</Text>
      );
    }

    return performanceData.recentEvents.slice(0, 10).map((event: any, index: number) => {
      const color = getPerformanceColor(event.duration, event.type);
      
      return (
        <View key={index} style={styles.eventItem}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventType}>{event.type.toUpperCase()}</Text>
            <Text style={[styles.eventDuration, { color }]}>
              {formatDuration(event.duration)}
            </Text>
          </View>
          {event.metadata && (
            <Text style={styles.eventMetadata} numberOfLines={1}>
              {JSON.stringify(event.metadata)}
            </Text>
          )}
          <Text style={styles.eventTime}>
            {new Date(event.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      );
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>性能监控面板</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearPerformanceData}
            >
              <Text style={styles.clearButtonText}>清除数据</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {performanceData ? (
            <>
              {/* 性能指标卡片 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>性能指标</Text>
                <View style={styles.metricsGrid}>
                  {renderMetricCard(
                    '渲染时间',
                    performanceData.metrics.renderTime,
                    'ms',
                    'render'
                  )}
                  {renderMetricCard(
                    'API响应',
                    performanceData.metrics.apiResponseTime,
                    'ms',
                    'api'
                  )}
                  {renderMetricCard(
                    '图片加载',
                    performanceData.metrics.imageLoadTime,
                    'ms',
                    'image'
                  )}
                  {renderMetricCard(
                    '滚动性能',
                    performanceData.metrics.listScrollPerformance,
                    'ms',
                    'scroll'
                  )}
                  {renderMetricCard(
                    '内存使用',
                    performanceData.metrics.memoryUsage,
                    'MB',
                    'memory'
                  )}
                </View>
              </View>

              {/* 最近事件 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>最近事件</Text>
                <View style={styles.eventsList}>
                  {renderEventList()}
                </View>
              </View>

              {/* 性能总结 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>性能总结</Text>
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryText}>
                    {performanceData.summary}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>加载性能数据中...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: colors.warning,
  },
  clearButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.primary,
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (screenWidth - 64) / 2 as any,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  eventsList: {
    gap: 8,
  },
  eventItem: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  eventDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventMetadata: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  summaryContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default PerformancePanel;