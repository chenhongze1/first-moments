import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { colors, borderRadius } from '../styles';
import { ImageCacheManager } from '../utils/memoryManager';
import { performanceMonitor } from '../utils/performanceMonitor';

const { width: screenWidth } = Dimensions.get('window');

interface LazyImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  fadeDuration?: number;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  blurRadius?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  style,
  placeholder,
  errorComponent,
  fadeDuration = 300,
  threshold = 100,
  onLoad,
  onError,
  resizeMode = 'cover',
  blurRadius,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewRef = useRef<View>(null);
  // 移除实例化，直接使用静态方法

  // 检查图片是否在视口内
  const checkIfInView = () => {
    if (viewRef.current) {
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        const screenHeight = Dimensions.get('window').height;
        const isVisible = pageY + height >= -threshold && pageY <= screenHeight + threshold;
        setIsInView(isVisible);
      });
    }
  };

  useEffect(() => {
    checkIfInView();
    
    // 检查缓存
     const loadCachedImage = () => {
        if (typeof source === 'object' && source.uri && typeof source.uri === 'string') {
          const cached = ImageCacheManager.getImage(source.uri);
          if (cached) {
            setCachedUri(cached);
          }
        }
      };
    
    loadCachedImage();
  }, [source]);

  const handleImageLoad = async () => {
    setIsLoaded(true);
    onLoad?.();
    
    // 性能监控
    if (typeof source === 'object' && source.uri) {
      performanceMonitor.monitorImageLoad(source.uri).onLoadEnd();
    }
    
    // 缓存图片
     if (typeof source === 'object' && source.uri) {
       // 这里可以在实际加载完成后缓存base64数据
       // ImageCacheManager.setImage(source.uri, base64Data);
     }
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: fadeDuration,
      useNativeDriver: true,
    }).start();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
    
    // 性能监控
    if (typeof source === 'object' && source.uri) {
      performanceMonitor.monitorImageLoad(source.uri).onError();
    }
  };

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }
    
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }
    
    return (
      <View style={[styles.errorContainer, style]}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorText}>📷</Text>
        </View>
      </View>
    );
  };

  return (
    <View ref={viewRef} style={style}>
      {hasError ? (
        renderError()
      ) : (
        <>
          {!isLoaded && renderPlaceholder()}
          {isInView && (
            <Animated.Image
              source={cachedUri ? { uri: cachedUri } : source}
              style={[
                style,
                {
                  opacity: fadeAnim,
                  position: isLoaded ? 'relative' : 'absolute',
                },
              ]}
              resizeMode={resizeMode}
              blurRadius={blurRadius}
              onLoadStart={() => {
                if (typeof source === 'object' && source.uri) {
                  performanceMonitor.monitorImageLoad(source.uri).onLoadStart();
                }
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </>
      )}
    </View>
  );
};

// 优化的图片网格组件
interface ImageGridProps {
  images: Array<{ uri: string; id: string }>;
  numColumns?: number;
  spacing?: number;
  onImagePress?: (image: any, index: number) => void;
  style?: any;
}

export const LazyImageGrid: React.FC<ImageGridProps> = ({
  images,
  numColumns = 2,
  spacing = 8,
  onImagePress,
  style,
}) => {
  const imageSize = (screenWidth - spacing * (numColumns + 1)) / numColumns;

  const renderImage = (image: any, index: number) => {
    return (
      <TouchableOpacity
        key={image.id}
        style={[
          styles.gridItem,
          {
            width: imageSize as any,
            height: imageSize as any,
            marginLeft: spacing,
            marginBottom: spacing,
          },
        ]}
        onPress={() => onImagePress?.(image, index)}
        activeOpacity={0.8}
      >
        <LazyImage
          source={{ uri: image.uri }}
          style={styles.gridImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.grid, style]}>
      {images.map(renderImage)}
    </View>
  );
};

// 缓存管理
class ImageCache {
  private cache = new Map<string, string>();
  private maxSize = 50; // 最大缓存数量

  set(key: string, value: string) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();

// 预加载图片
export const preloadImages = async (urls: string[]): Promise<void> => {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      if (imageCache.has(url)) {
        resolve();
        return;
      }

      Image.prefetch(url)
        .then((result: boolean) => {
          if (result) {
            imageCache.set(url, url);
          }
          resolve();
        })
        .catch((error: any) => reject(error));
    });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.warn('预加载图片失败:', error);
  }
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  errorContainer: {
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  errorIcon: {
    padding: 16,
  },
  errorText: {
    fontSize: 24,
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
  gridItem: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});

export default LazyImage;