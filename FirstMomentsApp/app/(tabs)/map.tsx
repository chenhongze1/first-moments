import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView, SlideInView, AnimatedButton } from '../../src/components/animations/AnimatedComponents';
import MapViewComponent from '../../src/components/map/MapView';
import CheckInModal from '../../src/components/map/CheckInModal';
import MapStats from '../../src/components/map/MapStats';
import * as Location from 'expo-location';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useResponsive, responsive } from '../../src/utils/responsive';
import { spacing } from '../../src/styles';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

const MapScreen = () => {
  const { theme } = useTheme();
  const responsiveUtils = useResponsive();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkedInLocations, setCheckedInLocations] = useState<LocationData[]>([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const colors = theme.colors;
  const styles = createStyles(colors, responsiveUtils);

  // 模拟的热门地点数据
  const popularLocations = [
    {
      id: 1,
      name: '天安门广场',
      address: '北京市东城区天安门广场',
      latitude: 39.9042,
      longitude: 116.4074,
      category: '景点',
      checkInCount: 1234,
    },
    {
      id: 2,
      name: '故宫博物院',
      address: '北京市东城区景山前街4号',
      latitude: 39.9163,
      longitude: 116.3972,
      category: '景点',
      checkInCount: 987,
    },
    {
      id: 3,
      name: '三里屯太古里',
      address: '北京市朝阳区三里屯路19号',
      latitude: 39.9368,
      longitude: 116.4472,
      category: '购物',
      checkInCount: 756,
    },
    {
      id: 4,
      name: '颐和园',
      address: '北京市海淀区新建宫门路19号',
      latitude: 39.9999,
      longitude: 116.2755,
      category: '景点',
      checkInCount: 654,
    },
    {
      id: 5,
      name: '北京大学',
      address: '北京市海淀区颐和园路5号',
      latitude: 39.9990,
      longitude: 116.3059,
      category: '学校',
      checkInCount: 432,
    },
    {
      id: 6,
      name: '清华大学',
      address: '北京市海淀区清华园1号',
      latitude: 40.0031,
      longitude: 116.3262,
      category: '学校',
      checkInCount: 521,
    },
    {
      id: 7,
      name: '鸟巢',
      address: '北京市朝阳区国家体育场南路1号',
      latitude: 39.9928,
      longitude: 116.3975,
      category: '体育场馆',
      checkInCount: 789,
    },
    {
      id: 8,
      name: '水立方',
      address: '北京市朝阳区天辰东路11号',
      latitude: 39.9934,
      longitude: 116.3890,
      category: '体育场馆',
      checkInCount: 456,
    },
    {
      id: 9,
      name: '王府井大街',
      address: '北京市东城区王府井大街',
      latitude: 39.9097,
      longitude: 116.4180,
      category: '商业街',
      checkInCount: 678,
    },
    {
      id: 10,
      name: '什刹海',
      address: '北京市西城区什刹海',
      latitude: 39.9389,
      longitude: 116.3831,
      category: '景点',
      checkInCount: 345,
    },
    {
      id: 11,
      name: '南锣鼓巷',
      address: '北京市东城区南锣鼓巷',
      latitude: 39.9361,
      longitude: 116.4014,
      category: '胡同',
      checkInCount: 567,
    },
    {
      id: 12,
      name: '798艺术区',
      address: '北京市朝阳区酒仙桥路4号',
      latitude: 39.9842,
      longitude: 116.4951,
      category: '艺术区',
      checkInCount: 234,
    },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要位置权限来获取当前位置');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // 模拟地址解析
      const address = await reverseGeocode(latitude, longitude);
      
      const locationData = {
        latitude,
        longitude,
        address,
        name: '当前位置',
      };
      
      setCurrentLocation(locationData);
      setSelectedLocation(locationData);
    } catch (error) {
      Alert.alert('错误', '无法获取当前位置');
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const addr = result[0];
        return `${addr.city || ''} ${addr.district || ''} ${addr.street || ''}`;
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };



  const selectLocation = (location: any) => {
    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      name: location.name,
    });
  };

  const handleCheckIn = async (checkInData: any) => {
    try {
      // 这里可以调用API保存打卡数据
      console.log('打卡数据:', checkInData);
      
      // 添加到已打卡位置列表
      setCheckedInLocations(prev => [...prev, checkInData.location]);
      
      Alert.alert('打卡成功', '已成功记录您的足迹！');
    } catch (error) {
      console.error('打卡失败:', error);
      throw error;
    }
  };

  const openCheckInModal = () => {
    if (!selectedLocation) {
      Alert.alert('提示', '请先选择一个地点');
      return;
    }
    setShowCheckInModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <FadeInView>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>地图打卡</Text>
          <Text style={styles.headerSubtitle}>发现身边的精彩地点</Text>
        </LinearGradient>
      </FadeInView>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 统计信息 */}
        <FadeInView delay={100}>
          <MapStats 
            checkedInLocations={checkedInLocations}
            onViewHistory={() => {
              // 这里可以导航到历史记录页面
              console.log('查看打卡历史');
            }}
          />
        </FadeInView>

        {/* 搜索栏 */}
          <FadeInView delay={200}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="搜索地点..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="options" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </FadeInView>

        {/* 地图区域 */}
        <View style={styles.mapContainer}>
          <MapViewComponent
            currentLocation={currentLocation}
            selectedLocation={selectedLocation}
            checkedInLocations={checkedInLocations}
            onLocationSelect={selectLocation}
            onCurrentLocationUpdate={setCurrentLocation}
            style={styles.map}
          />
          {/* 当前位置信息 */}
          {currentLocation && (
            <View style={styles.currentLocationCard}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {currentLocation.address}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 选中位置信息 */}
        {selectedLocation && (
          <View style={styles.selectedLocationCard}>
            <View style={styles.selectedLocationInfo}>
              <Ionicons name="pin" size={24} color={colors.primary} />
              <View style={styles.selectedLocationDetails}>
                <Text style={styles.selectedLocationName}>
                  {selectedLocation.name || '选中位置'}
                </Text>
                <Text style={styles.selectedLocationAddress}>
                  {selectedLocation.address}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.checkInButton} onPress={openCheckInModal}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.checkInButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.checkInButtonText}>打卡</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* 热门地点 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>热门地点</Text>
          {popularLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.locationItem}
              onPress={() => selectLocation(location)}
            >
              <View style={styles.locationItemContent}>
                <View style={styles.locationItemInfo}>
                  <Text style={styles.locationItemName}>{location.name}</Text>
                  <Text style={styles.locationItemAddress}>{location.address}</Text>
                  <View style={styles.locationItemMeta}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{location.category}</Text>
                    </View>
                    <Text style={styles.checkInCount}>
                      {location.checkInCount} 人打卡
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 打卡历史 */}
        {checkedInLocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近打卡</Text>
            {checkedInLocations.slice(-3).reverse().map((location, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyItemContent}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <View style={styles.historyItemInfo}>
                    <Text style={styles.historyItemName}>
                      {location.name || '未知位置'}
                    </Text>
                    <Text style={styles.historyItemAddress}>
                      {location.address}
                    </Text>
                  </View>
                  <Text style={styles.historyItemTime}>刚刚</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
        
      {/* 打卡弹窗 */}
      <CheckInModal
        visible={showCheckInModal}
        location={selectedLocation}
        onClose={() => setShowCheckInModal(false)}
        onCheckIn={handleCheckIn}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any, responsiveUtils: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'web' ? 120 : spacing.xl * 2, // 为底部导航栏留出空间
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    padding: responsiveUtils.isTablet ? responsive.spacing.lg : responsive.spacing.md,
    marginBottom: responsive.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: responsive.fontSize.md,
    color: colors.textPrimary,
    marginLeft: responsive.spacing.sm,
  },
  filterButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  locationButton: {
    padding: spacing.xs,
  },
  mapContainer: {
    height: responsiveUtils.isTablet ? 400 : 300,
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    marginBottom: responsive.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    borderRadius: responsive.borderRadius.lg,
  },
  currentLocationCard: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  selectedLocationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectedLocationDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  selectedLocationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkInButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  checkInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  locationItem: {
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    marginBottom: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveUtils.isTablet ? responsive.spacing.xl : responsive.spacing.lg,
  },
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.lg : responsive.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: responsive.spacing.xs,
  },
  locationItemAddress: {
    fontSize: responsive.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: responsive.spacing.sm,
  },
  locationItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: responsive.spacing.sm,
    paddingVertical: responsive.spacing.xs,
    borderRadius: responsive.borderRadius.md,
    marginRight: responsive.spacing.sm,
  },
  categoryTagText: {
    fontSize: responsive.fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  checkInCount: {
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    marginBottom: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveUtils.isTablet ? responsive.spacing.xl : responsive.spacing.lg,
  },
  historyItemInfo: {
    flex: 1,
    marginLeft: responsive.spacing.md,
  },
  historyItemName: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.lg : responsive.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: responsive.spacing.xs,
  },
  historyItemAddress: {
    fontSize: responsive.fontSize.sm,
    color: colors.textSecondary,
  },
  historyItemTime: {
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
  },
});

export default MapScreen;