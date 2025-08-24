import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Dimensions } from 'react-native';

export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  isBlocked: boolean;
  isFavorite: boolean;
}

interface FriendManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

const FriendManagementModal: React.FC<FriendManagementModalProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const theme = {
    background: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#888888' : '#666666',
    border: colorScheme === 'dark' ? '#333333' : '#e0e0e0',
    primary: '#007AFF',
  };
  const { width } = Dimensions.get('window');
  
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'blocked'>('all');
  
  // 模拟好友数据
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: '1',
      name: '张小明',
      avatar: 'https://via.placeholder.com/50',
      status: 'online',
      isBlocked: false,
      isFavorite: true,
    },
    {
      id: '2',
      name: '李小红',
      avatar: 'https://via.placeholder.com/50',
      status: 'offline',
      lastSeen: '2小时前',
      isBlocked: false,
      isFavorite: false,
    },
    {
      id: '3',
      name: '王小刚',
      avatar: 'https://via.placeholder.com/50',
      status: 'away',
      isBlocked: true,
      isFavorite: false,
    },
  ]);

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchText.toLowerCase());
    
    switch (activeTab) {
      case 'favorites':
        return matchesSearch && friend.isFavorite;
      case 'blocked':
        return matchesSearch && friend.isBlocked;
      default:
        return matchesSearch;
    }
  });

  const handleToggleFavorite = (friendId: string) => {
    setFriends(prev => prev.map(friend => 
      friend.id === friendId 
        ? { ...friend, isFavorite: !friend.isFavorite }
        : friend
    ));
  };

  const handleToggleBlock = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;

    Alert.alert(
      friend.isBlocked ? '解除屏蔽' : '屏蔽好友',
      friend.isBlocked 
        ? `确定要解除屏蔽 ${friend.name} 吗？`
        : `确定要屏蔽 ${friend.name} 吗？屏蔽后将无法收到对方的消息。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: friend.isBlocked ? 'default' : 'destructive',
          onPress: () => {
            setFriends(prev => prev.map(f => 
              f.id === friendId 
                ? { ...f, isBlocked: !f.isBlocked }
                : f
            ));
          },
        },
      ]
    );
  };

  const handleDeleteFriend = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;

    Alert.alert(
      '删除好友',
      `确定要删除好友 ${friend.name} 吗？删除后将无法恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setFriends(prev => prev.filter(f => f.id !== friendId));
          },
        },
      ]
    );
  };

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return '#4CAF50';
      case 'away':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (friend: Friend) => {
    if (friend.isBlocked) return '已屏蔽';
    
    switch (friend.status) {
      case 'online':
        return '在线';
      case 'away':
        return '离开';
      case 'offline':
        return friend.lastSeen || '离线';
      default:
        return '未知';
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.avatar || 'https://via.placeholder.com/50' }} 
            style={styles.avatar} 
          />
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(item.status) }
            ]} 
          />
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={[styles.friendName, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>
            {getStatusText(item)}
          </Text>
        </View>
      </View>
      
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleFavorite(item.id)}
        >
          <Ionicons 
            name={item.isFavorite ? 'heart' : 'heart-outline'} 
            size={20} 
            color={item.isFavorite ? '#FF5722' : theme.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleBlock(item.id)}
        >
          <Ionicons 
            name={item.isBlocked ? 'checkmark-circle' : 'ban'} 
            size={20} 
            color={item.isBlocked ? '#4CAF50' : '#FF9800'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteFriend(item.id)}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const tabs = [
    { key: 'all', label: '全部', count: friends.length },
    { key: 'favorites', label: '特别关心', count: friends.filter(f => f.isFavorite).length },
    { key: 'blocked', label: '已屏蔽', count: friends.filter(f => f.isBlocked).length },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: 20,
      width: width * 0.95,
      height: '85%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeButton: {
      padding: 5,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      marginLeft: 10,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginHorizontal: 2,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    inactiveTab: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    activeTabText: {
      color: '#fff',
    },
    inactiveTabText: {
      color: theme.text,
    },
    tabCount: {
      fontSize: 12,
      marginTop: 2,
    },
    friendItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    friendInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 15,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    statusIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.background,
    },
    friendDetails: {
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    friendStatus: {
      fontSize: 14,
    },
    friendActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      marginLeft: 5,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>好友管理</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* 搜索框 */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索好友..."
              placeholderTextColor={theme.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* 标签页 */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key ? styles.activeTab : styles.inactiveTab,
                ]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key ? styles.activeTabText : styles.inactiveTabText,
                  ]}
                >
                  {tab.label}
                </Text>
                <Text
                  style={[
                    styles.tabCount,
                    activeTab === tab.key ? styles.activeTabText : styles.inactiveTabText,
                  ]}
                >
                  {tab.count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 好友列表 */}
          {filteredFriends.length > 0 ? (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="people-outline" 
                size={64} 
                color={theme.textSecondary} 
              />
              <Text style={styles.emptyText}>
                {searchText ? '没有找到匹配的好友' : '暂无好友'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default FriendManagementModal;