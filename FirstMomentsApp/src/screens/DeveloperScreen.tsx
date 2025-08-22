import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { PerformancePanel } from '../components/PerformancePanel';
import { performanceMonitor } from '../utils/performanceMonitor';
import { colors, spacing, textStyles, fontWeight } from '../styles';

export const DeveloperScreen: React.FC = () => {
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);

  const handleClearPerformanceData = () => {
    Alert.alert(
      '清除性能数据',
      '确定要清除所有性能监控数据吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            performanceMonitor.clearData();
            Alert.alert('成功', '性能数据已清除');
          },
        },
      ]
    );
  };

  const handleGenerateTestData = () => {
    // 生成一些测试性能数据
    for (let i = 0; i < 10; i++) {
      performanceMonitor.recordEvent({
        type: 'render',
        duration: Math.random() * 100 + 50, // 50-150ms
        timestamp: Date.now(),
        metadata: { component: `TestComponent${i}` },
      });
    }

    for (let i = 0; i < 5; i++) {
      performanceMonitor.recordEvent({
        type: 'api',
        duration: Math.random() * 1000 + 200, // 200-1200ms
        timestamp: Date.now(),
        metadata: { url: `/api/test${i}`, method: 'GET' },
      });
    }

    Alert.alert('成功', '测试数据已生成');
  };

  const handleExportPerformanceData = () => {
    const report = performanceMonitor.getPerformanceReport();
    console.log('Performance Report:', JSON.stringify(report, null, 2));
    Alert.alert('导出成功', '性能报告已输出到控制台');
  };

  return (
    <Screen safeArea={true} scrollable={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>开发者工具</Text>
          <Text style={styles.subtitle}>性能监控和调试工具</Text>
        </View>

        {/* 性能监控工具 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>性能监控</Text>
          
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => setShowPerformancePanel(true)}
          >
            <View style={styles.toolIcon}>
              <Text style={styles.toolIconText}>📊</Text>
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>性能面板</Text>
              <Text style={styles.toolDescription}>查看实时性能指标和历史数据</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={handleGenerateTestData}>
            <View style={styles.toolIcon}>
              <Text style={styles.toolIconText}>🧪</Text>
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>生成测试数据</Text>
              <Text style={styles.toolDescription}>生成模拟性能数据用于测试</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={handleExportPerformanceData}>
            <View style={styles.toolIcon}>
              <Text style={styles.toolIconText}>📤</Text>
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>导出性能报告</Text>
              <Text style={styles.toolDescription}>将性能数据导出到控制台</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={handleClearPerformanceData}>
            <View style={styles.toolIcon}>
              <Text style={styles.toolIconText}>🗑️</Text>
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>清除性能数据</Text>
              <Text style={styles.toolDescription}>清除所有已收集的性能数据</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 调试工具 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>调试工具</Text>
          
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => Alert.alert('提示', '调试工具功能即将开放')}
          >
            <View style={styles.toolIcon}>
              <Text style={styles.toolIconText}>🐛</Text>
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>日志查看器</Text>
              <Text style={styles.toolDescription}>查看应用日志和错误信息</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => Alert.alert('提示', '网络监控功能即将开放')}
          >
            <View style={styles.toolIcon}>
              <Text style={styles.toolIconText}>🌐</Text>
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>网络监控</Text>
              <Text style={styles.toolDescription}>监控网络请求和响应</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 警告信息 */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ 开发者模式</Text>
          <Text style={styles.warningText}>
            这些工具仅用于开发和调试目的。在生产环境中，请确保禁用或移除这些功能。
          </Text>
        </View>
      </View>

      {/* 性能监控面板 */}
      <Modal
        visible={showPerformancePanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPerformancePanel(false)}
      >
        <PerformancePanel 
          visible={showPerformancePanel}
          onClose={() => setShowPerformancePanel(false)} 
        />
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  header: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.lg,
  },

  title: {
    ...textStyles.h1,
    marginBottom: spacing.xs,
  },

  subtitle: {
    ...textStyles.bodySecondary,
    textAlign: 'center',
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing.md,
    color: colors.primary,
  },

  toolCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  toolIconText: {
    fontSize: 24,
  },

  toolContent: {
    flex: 1,
  },

  toolTitle: {
    ...textStyles.body,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },

  toolDescription: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },

  warningCard: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginTop: spacing.lg,
  },

  warningTitle: {
    ...textStyles.body,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },

  warningText: {
    ...textStyles.caption,
    color: colors.warning,
    lineHeight: 18,
  },
});