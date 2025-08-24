import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useResponsive } from '../src/utils/responsive';

interface StorageItem {
  id: string;
  name: string;
  size: number;
  type: 'photos' | 'videos' | 'messages' | 'cache' | 'documents' | 'other';
  icon: string;
  color: string;
  deletable: boolean;
}

interface StorageManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

const StorageManagementModal: React.FC<StorageManagementModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const responsiveUtils = useResponsive();
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [totalUsed, setTotalUsed] = useState(0);
  const [totalAvailable] = useState(64 * 1024 * 1024 * 1024); // 64GB 模拟总容量

  useEffect(() => {
    if (visible) {
      loadStorageData();
    }
  }, [visible]);

  const loadStorageData = async () => {
    setIsLoading(true);
    try {
      // 模拟加载存储数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: StorageItem[] = [
        {
          id: 'photos',
          name: '照片',
          size: 2.5 * 1024 * 1024 * 1024, // 2.5GB
          type: 'photos',
          icon: 'image-outline',
          color: '#4CAF50',
          deletable: false,
        },
        {
          id: 'videos',
          name: '视频',
          size: 1.8 * 1024 * 1024 * 1024, // 1.8GB
          type: 'videos',
          icon: 'videocam-outline',
          color: '#2196F3',
          deletable: false,
        },
        {
          id: 'messages',
          name: '消息记录',
          size: 150 * 1024 * 1024, // 150MB
          type: 'messages',
          icon: 'chatbubble-outline',
          color: '#FF9800',
          deletable: false,
        },
        {
          id: 'cache',
          name: '缓存文件',
          size: 320 * 1024 * 1024, // 320MB
          type: 'cache',
          icon: 'folder-outline',
          color: '#9C27B0',
          deletable: true,
        },
        {
          id: 'documents',
          name: '文档',
          size: 45 * 1024 * 1024, // 45MB
          type: 'documents',
          icon: 'document-outline',
          color: '#607D8B',
          deletable: false,
        },
        {
          id: 'other',
          name: '其他',
          size: 85 * 1024 * 1024, // 85MB
          type: 'other',
          icon: 'ellipsis-horizontal-outline',
          color: '#795548',
          deletable: true,
        },
      ];
      
      setStorageItems(mockData);
      const total = mockData.reduce((sum, item) => sum + item.size, 0);
      setTotalUsed(total);
    } catch (error) {
      Alert.alert('错误', '加载存储数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsagePercentage = (): number => {
    return (totalUsed / totalAvailable) * 100;
  };

  const handleClearCache = async () => {
    Alert.alert(
      '清理缓存',
      '确定要清理所有缓存文件吗？这将释放存储空间，但可能会影响应用性能。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              // 模拟清理过程
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // 更新缓存大小
              const updatedItems = storageItems.map(item => 
                item.type === 'cache' ? { ...item, size: 0 } : item
              );
              setStorageItems(updatedItems);
              
              const newTotal = updatedItems.reduce((sum, item) => sum + item.size, 0);
              setTotalUsed(newTotal);
              
              Alert.alert('清理完成', '缓存文件已清理完成');
            } catch (error) {
              Alert.alert('清理失败', '清理过程中出现错误');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = (item: StorageItem) => {
    if (!item.deletable) {
      Alert.alert('提示', '此项目无法删除');
      return;
    }

    Alert.alert(
      '删除确认',
      `确定要删除 ${item.name} 吗？这将释放 ${formatSize(item.size)} 的存储空间。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const updatedItems = storageItems.map(storageItem => 
              storageItem.id === item.id ? { ...storageItem, size: 0 } : storageItem
            );
            setStorageItems(updatedItems);
            
            const newTotal = updatedItems.reduce((sum, storageItem) => sum + storageItem.size, 0);
            setTotalUsed(newTotal);
            
            Alert.alert('删除成功', `${item.name} 已删除`);
          },
        },
      ]
    );
  };

  const styles = createStyles(theme, responsiveUtils);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>存储管理</Text>
          <TouchableOpacity onPress={loadStorageData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>正在加载存储信息...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 存储概览 */}
            <View style={styles.overviewCard}>
              <Text style={styles.overviewTitle}>存储概览</Text>
              
              <View style={styles.usageContainer}>
                <View style={styles.usageBar}>
                  <View 
                    style={[
                      styles.usageProgress, 
                      { width: `${getUsagePercentage()}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.usageText}>
                  已使用 {formatSize(totalUsed)} / {formatSize(totalAvailable)}
                </Text>
                <Text style={styles.usagePercentage}>
                  {getUsagePercentage().toFixed(1)}% 已使用
                </Text>
              </View>
            </View>

            {/* 快速操作 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>快速操作</Text>
              <TouchableOpacity 
                style={[styles.actionButton, isClearing && styles.actionButtonDisabled]} 
                onPress={handleClearCache}
                disabled={isClearing}
              >
                {isClearing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>
                  {isClearing ? '清理中...' : '清理缓存'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 存储详情 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>存储详情</Text>
              {storageItems.map((item) => (
                <View key={item.id} style={styles.storageItem}>
                  <View style={styles.itemInfo}>
                    <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemSize}>{formatSize(item.size)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.itemActions}>
                    {item.deletable && item.size > 0 && (
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteItem(item)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 存储建议 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>存储建议</Text>
              <View style={styles.suggestionCard}>
                <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.suggestionText}>
                  定期清理缓存文件可以释放存储空间。建议每月清理一次。
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, responsiveUtils: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    closeButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme.colors.textPrimary,
    },
    refreshButton: {
      padding: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    overviewCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      marginVertical: 16,
    },
    overviewTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    usageContainer: {
      gap: 8,
    },
    usageBar: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      overflow: 'hidden' as const,
    },
    usageProgress: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    usageText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: theme.colors.textPrimary,
    },
    usagePercentage: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    section: {
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    actionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      gap: 8,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    storageItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    itemInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
      gap: 12,
    },
    itemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: theme.colors.textPrimary,
    },
    itemSize: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    itemActions: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: '#FF6B6B20',
    },
    suggestionCard: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: theme.surface,
      borderRadius: 8,
      padding: 16,
      gap: 12,
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
  });

export default StorageManagementModal;