import { Dimensions, PixelRatio } from 'react-native';

// 获取设备尺寸
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 设计稿基准尺寸（iPhone 12 Pro）
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// 设备类型枚举
export enum DeviceType {
  PHONE_SMALL = 'phone_small',    // < 375px
  PHONE_MEDIUM = 'phone_medium',  // 375px - 414px
  PHONE_LARGE = 'phone_large',    // 414px - 480px
  TABLET_SMALL = 'tablet_small',  // 480px - 768px
  TABLET_LARGE = 'tablet_large',  // > 768px
}

// 屏幕方向枚举
export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

// 响应式工具类
export class ResponsiveUtils {
  // 获取当前屏幕宽度
  static getScreenWidth(): number {
    return SCREEN_WIDTH;
  }

  // 获取当前屏幕高度
  static getScreenHeight(): number {
    return SCREEN_HEIGHT;
  }

  // 获取设备类型
  static getDeviceType(): DeviceType {
    if (SCREEN_WIDTH < 375) {
      return DeviceType.PHONE_SMALL;
    } else if (SCREEN_WIDTH < 414) {
      return DeviceType.PHONE_MEDIUM;
    } else if (SCREEN_WIDTH < 480) {
      return DeviceType.PHONE_LARGE;
    } else if (SCREEN_WIDTH < 768) {
      return DeviceType.TABLET_SMALL;
    } else {
      return DeviceType.TABLET_LARGE;
    }
  }

  // 获取屏幕方向
  static getOrientation(): Orientation {
    return SCREEN_WIDTH > SCREEN_HEIGHT ? Orientation.LANDSCAPE : Orientation.PORTRAIT;
  }

  // 判断是否为手机
  static isPhone(): boolean {
    const deviceType = this.getDeviceType();
    return [
      DeviceType.PHONE_SMALL,
      DeviceType.PHONE_MEDIUM,
      DeviceType.PHONE_LARGE,
    ].includes(deviceType);
  }

  // 判断是否为平板
  static isTablet(): boolean {
    const deviceType = this.getDeviceType();
    return [
      DeviceType.TABLET_SMALL,
      DeviceType.TABLET_LARGE,
    ].includes(deviceType);
  }

  // 判断是否为小屏设备
  static isSmallDevice(): boolean {
    return this.getDeviceType() === DeviceType.PHONE_SMALL;
  }

  // 判断是否为大屏设备
  static isLargeDevice(): boolean {
    const deviceType = this.getDeviceType();
    return [
      DeviceType.PHONE_LARGE,
      DeviceType.TABLET_SMALL,
      DeviceType.TABLET_LARGE,
    ].includes(deviceType);
  }

  // 宽度适配
  static wp(percentage: number): number {
    return (SCREEN_WIDTH * percentage) / 100;
  }

  // 高度适配
  static hp(percentage: number): number {
    return (SCREEN_HEIGHT * percentage) / 100;
  }

  // 基于设计稿的宽度缩放
  static scaleWidth(size: number): number {
    return (SCREEN_WIDTH / BASE_WIDTH) * size;
  }

  // 基于设计稿的高度缩放
  static scaleHeight(size: number): number {
    return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
  }

  // 字体大小适配
  static scaleFontSize(size: number): number {
    const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }

  // 间距适配
  static scaleSpacing(spacing: number): number {
    return this.scaleWidth(spacing);
  }

  // 响应式值选择器
  static responsiveValue<T>(values: {
    [DeviceType.PHONE_SMALL]?: T;
    [DeviceType.PHONE_MEDIUM]?: T;
    [DeviceType.PHONE_LARGE]?: T;
    [DeviceType.TABLET_SMALL]?: T;
    [DeviceType.TABLET_LARGE]?: T;
    default: T;
  }): T {
    const deviceType = this.getDeviceType();
    return values[deviceType] ?? values.default;
  }

  // 获取安全区域内边距
  static getSafeAreaPadding() {
    const deviceType = ResponsiveUtils.getDeviceType();
    
    switch (deviceType) {
      case DeviceType.PHONE_SMALL:
        return { top: 20, bottom: 10, horizontal: 16 };
      case DeviceType.PHONE_MEDIUM:
        return { top: 24, bottom: 12, horizontal: 20 };
      case DeviceType.PHONE_LARGE:
        return { top: 28, bottom: 16, horizontal: 24 };
      case DeviceType.TABLET_SMALL:
        return { top: 32, bottom: 20, horizontal: 32 };
      case DeviceType.TABLET_LARGE:
        return { top: 40, bottom: 24, horizontal: 40 };
      default:
        return { top: 24, bottom: 12, horizontal: 20 };
    }
  }

  // 获取网格列数
  static getGridColumns(): number {
    return this.responsiveValue({
      [DeviceType.PHONE_SMALL]: 2,
      [DeviceType.PHONE_MEDIUM]: 2,
      [DeviceType.PHONE_LARGE]: 3,
      [DeviceType.TABLET_SMALL]: 3,
      [DeviceType.TABLET_LARGE]: 4,
      default: 2,
    });
  }

  // 获取卡片宽度
  static getCardWidth(margin: number = 16): number {
    const columns = this.getGridColumns();
    const totalMargin = margin * (columns + 1);
    return (SCREEN_WIDTH - totalMargin) / columns;
  }

  // 获取模态框宽度
  static getModalWidth(): number {
    return this.responsiveValue({
      [DeviceType.PHONE_SMALL]: this.wp(90),
      [DeviceType.PHONE_MEDIUM]: this.wp(85),
      [DeviceType.PHONE_LARGE]: this.wp(80),
      [DeviceType.TABLET_SMALL]: this.wp(70),
      [DeviceType.TABLET_LARGE]: this.wp(60),
      default: this.wp(85),
    });
  }
}

// 响应式样式生成器
export const createResponsiveStyles = <T extends Record<string, any>>(
  styleGenerator: (utils: typeof ResponsiveUtils) => T
): T => {
  return styleGenerator(ResponsiveUtils);
};

// 响应式Hook（用于组件中监听屏幕变化）
import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...dimensions,
    deviceType: ResponsiveUtils.getDeviceType(),
    orientation: ResponsiveUtils.getOrientation(),
    isPhone: ResponsiveUtils.isPhone(),
    isTablet: ResponsiveUtils.isTablet(),
    isSmallDevice: ResponsiveUtils.isSmallDevice(),
    isLargeDevice: ResponsiveUtils.isLargeDevice(),
    wp: ResponsiveUtils.wp,
    hp: ResponsiveUtils.hp,
    scaleWidth: ResponsiveUtils.scaleWidth,
    scaleHeight: ResponsiveUtils.scaleHeight,
    scaleFontSize: ResponsiveUtils.scaleFontSize,
    scaleSpacing: ResponsiveUtils.scaleSpacing,
    responsiveValue: ResponsiveUtils.responsiveValue,
    getSafeAreaPadding: ResponsiveUtils.getSafeAreaPadding,
    getGridColumns: ResponsiveUtils.getGridColumns,
    getCardWidth: ResponsiveUtils.getCardWidth,
    getModalWidth: ResponsiveUtils.getModalWidth,
  };
};

// 导出常用的响应式值
export const responsive = {
  // 字体大小
  fontSize: {
    xs: ResponsiveUtils.scaleFontSize(12),
    sm: ResponsiveUtils.scaleFontSize(14),
    md: ResponsiveUtils.scaleFontSize(16),
    lg: ResponsiveUtils.scaleFontSize(18),
    xl: ResponsiveUtils.scaleFontSize(20),
    xxl: ResponsiveUtils.scaleFontSize(24),
    xxxl: ResponsiveUtils.scaleFontSize(28),
  },
  
  // 间距
  spacing: {
    xs: ResponsiveUtils.scaleSpacing(4),
    sm: ResponsiveUtils.scaleSpacing(8),
    md: ResponsiveUtils.scaleSpacing(16),
    lg: ResponsiveUtils.scaleSpacing(24),
    xl: ResponsiveUtils.scaleSpacing(32),
    xxl: ResponsiveUtils.scaleSpacing(40),
  },
  
  // 圆角
  borderRadius: {
    sm: ResponsiveUtils.scaleWidth(4),
    md: ResponsiveUtils.scaleWidth(8),
    lg: ResponsiveUtils.scaleWidth(12),
    xl: ResponsiveUtils.scaleWidth(16),
    full: ResponsiveUtils.scaleWidth(9999),
  },
  
  // 图标大小
  iconSize: {
    xs: ResponsiveUtils.scaleWidth(16),
    sm: ResponsiveUtils.scaleWidth(20),
    md: ResponsiveUtils.scaleWidth(24),
    lg: ResponsiveUtils.scaleWidth(28),
    xl: ResponsiveUtils.scaleWidth(32),
  },
};