import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
// 移除静态导入，改为动态加载

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface MapViewComponentProps {
  currentLocation?: LocationData | null;
  selectedLocation?: LocationData | null;
  checkedInLocations?: LocationData[];
  onLocationSelect?: (location: LocationData) => void;
  onCurrentLocationUpdate?: (location: LocationData) => void;
  style?: any;
}

// 原生地图组件（仅在非web平台使用）
const NativeMapView: React.FC<MapViewComponentProps> = (props) => {
  // 在Web平台直接返回占位符，避免任何模块导入
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, props.style]}>
        <View style={[styles.webMapPlaceholder, { backgroundColor: '#f5f5f5' }]}>
          <Text style={[styles.webMapText, { color: '#333' }]}>原生地图 (仅移动端)</Text>
          <Text style={[styles.locationText, { color: '#666' }]}>Web平台请使用Web地图组件</Text>
        </View>
      </View>
    );
  }

  // 在非Web平台显示暂不支持的提示
  return (
    <View style={[styles.container, props.style]}>
      <View style={[styles.webMapPlaceholder, { backgroundColor: '#f5f5f5' }]}>
        <Text style={[styles.webMapText, { color: '#333' }]}>原生地图功能</Text>
        <Text style={[styles.locationText, { color: '#666' }]}>暂时不可用</Text>
        <Text style={[styles.clickHint, { color: '#999' }]}>请使用Web地图组件</Text>
      </View>
    </View>
  );
};

// Web Map View Component (内联实现)
const WebMapView: React.FC<MapViewComponentProps> = ({
  currentLocation,
  selectedLocation,
  checkedInLocations = [],
  onLocationSelect,
  onCurrentLocationUpdate,
  style,
}) => {
  const { theme } = useTheme();
  
  const getCurrentLocation = React.useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要位置权限来显示您的当前位置');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const currentLoc: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      onCurrentLocationUpdate?.(currentLoc);
    } catch (error) {
      console.error('获取位置失败:', error);
      Alert.alert('错误', '无法获取当前位置');
    }
  }, [onCurrentLocationUpdate]);

  React.useEffect(() => {
    if (!currentLocation) {
      getCurrentLocation();
    }
  }, [currentLocation, getCurrentLocation]);

  const handleMapClick = React.useCallback(() => {
    if (onLocationSelect) {
      const mockLocation: LocationData = {
        latitude: 39.9042 + (Math.random() - 0.5) * 0.01,
        longitude: 116.4074 + (Math.random() - 0.5) * 0.01,
      };
      onLocationSelect(mockLocation);
    }
  }, [onLocationSelect]);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.webMapPlaceholder, { backgroundColor: theme.colors.surface }]} onTouchEnd={handleMapClick}>
        <Text style={[styles.webMapText, { color: theme.colors.textPrimary }]}>地图视图 (Web)</Text>
        {currentLocation && (
          <Text style={[styles.locationText, { color: theme.colors.textPrimary }]}>
            当前位置: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        )}
        {selectedLocation && (
          <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
            选中位置: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
          </Text>
        )}
        {checkedInLocations.length > 0 && (
          <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
            签到点数量: {checkedInLocations.length}
          </Text>
        )}
        <Text style={[styles.clickHint, { color: theme.colors.primary }]}>点击选择位置</Text>
      </View>
    </View>
  );
};

// 主要的MapView组件
const MapViewComponent: React.FC<MapViewComponentProps> = (props) => {
  // 在web平台使用WebMapView，在移动端使用NativeMapView
  if (Platform.OS === 'web') {
    return <WebMapView {...props} />;
  }
  
  return <NativeMapView {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    margin: 8,
  },
  webMapText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  clickHint: {
    fontSize: 12,
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default MapViewComponent;