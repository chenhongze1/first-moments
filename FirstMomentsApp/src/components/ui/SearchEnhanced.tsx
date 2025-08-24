import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
  Animated,
  Keyboard,
  ScrollView,
} from 'react-native';
import { TouchableEnhanced } from './TouchableEnhanced';
import { HapticFeedback } from '../../utils/haptics';
import { AnimationUtils } from '../../utils/animations';

const { width: screenWidth } = Dimensions.get('window');

// 搜索建议项
export interface SearchSuggestion {
  id: string;
  text: string;
  type?: 'history' | 'suggestion' | 'recent';
  icon?: string;
  category?: string;
  metadata?: any;
}

// 搜索过滤器
export interface SearchFilter {
  id: string;
  label: string;
  value: any;
  active: boolean;
  icon?: string;
}

// 搜索配置
export interface SearchConfig {
  // 基础配置
  placeholder?: string;
  maxLength?: number;
  debounceMs?: number;
  minQueryLength?: number;
  
  // 功能开关
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  enableFilters?: boolean;
  enableVoiceSearch?: boolean;
  enableBarcode?: boolean;
  enableHapticFeedback?: boolean;
  
  // 历史记录
  maxHistoryItems?: number;
  persistHistory?: boolean;
  
  // 样式配置
  showClearButton?: boolean;
  showSearchIcon?: boolean;
  showCancelButton?: boolean;
  animationDuration?: number;
}

// 搜索增强组件属性
export interface SearchEnhancedProps {
  // 基础属性
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (query: string, filters?: SearchFilter[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onCancel?: () => void;
  
  // 配置
  config?: SearchConfig;
  
  // 数据
  suggestions?: SearchSuggestion[];
  filters?: SearchFilter[];
  loading?: boolean;
  
  // 回调
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  onFilterChange?: (filters: SearchFilter[]) => void;
  onHistoryItemPress?: (item: SearchSuggestion) => void;
  onClearHistory?: () => void;
  
  // 样式
  style?: ViewStyle;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  
  // 自定义组件
  renderSuggestion?: (suggestion: SearchSuggestion, index: number) => React.ReactNode;
  renderFilter?: (filter: SearchFilter, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
}

// 默认配置
const defaultConfig: Required<SearchConfig> = {
  placeholder: '搜索...',
  maxLength: 100,
  debounceMs: 300,
  minQueryLength: 1,
  enableHistory: true,
  enableSuggestions: true,
  enableFilters: false,
  enableVoiceSearch: false,
  enableBarcode: false,
  enableHapticFeedback: true,
  maxHistoryItems: 10,
  persistHistory: true,
  showClearButton: true,
  showSearchIcon: true,
  showCancelButton: true,
  animationDuration: 200,
};

export function SearchEnhanced({
  value = '',
  onChangeText,
  onSearch,
  onFocus,
  onBlur,
  onCancel,
  config = {},
  suggestions = [],
  filters = [],
  loading = false,
  onSuggestionPress,
  onFilterChange,
  onHistoryItemPress,
  onClearHistory,
  style,
  inputStyle,
  containerStyle,
  renderSuggestion,
  renderFilter,
  renderEmpty,
  renderLoading,
}: SearchEnhancedProps) {
  const mergedConfig = { ...defaultConfig, ...config };
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const animationValue = useRef(new Animated.Value(0)).current;
  
  // 状态
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>(filters);
  const [searchHistory, setSearchHistory] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 防抖搜索
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (searchQuery.length >= mergedConfig.minQueryLength) {
        onSearch?.(searchQuery, activeFilters);
      }
    }, mergedConfig.debounceMs);
  }, [onSearch, activeFilters, mergedConfig.debounceMs, mergedConfig.minQueryLength]);
  
  // 处理文本变化
  const handleTextChange = useCallback((text: string) => {
    setQuery(text);
    onChangeText?.(text);
    
    if (text.length > 0) {
      setShowSuggestions(true);
      debouncedSearch(text);
    } else {
      setShowSuggestions(false);
    }
  }, [onChangeText, debouncedSearch]);
  
  // 处理焦点
  const handleFocus = useCallback(() => {
    setFocused(true);
    setShowSuggestions(query.length > 0 || mergedConfig.enableHistory);
    
    if (mergedConfig.enableHapticFeedback) {
      HapticFeedback.light();
    }
    
    Animated.timing(animationValue, {
      toValue: 1,
      duration: mergedConfig.animationDuration,
      useNativeDriver: false,
    }).start();
    
    onFocus?.();
  }, [query.length, mergedConfig.enableHistory, mergedConfig.enableHapticFeedback, mergedConfig.animationDuration, animationValue, onFocus]);
  
  // 处理失焦
  const handleBlur = useCallback(() => {
    setFocused(false);
    
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
    
    Animated.timing(animationValue, {
      toValue: 0,
      duration: mergedConfig.animationDuration,
      useNativeDriver: false,
    }).start();
    
    onBlur?.();
  }, [mergedConfig.animationDuration, animationValue, onBlur]);
  
  // 处理搜索
  const handleSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    
    if (finalQuery.length >= mergedConfig.minQueryLength) {
      // 添加到历史记录
      if (mergedConfig.enableHistory) {
        const historyItem: SearchSuggestion = {
          id: Date.now().toString(),
          text: finalQuery,
          type: 'history',
        };
        
        setSearchHistory(prev => {
          const filtered = prev.filter(item => item.text !== finalQuery);
          return [historyItem, ...filtered].slice(0, mergedConfig.maxHistoryItems);
        });
      }
      
      if (mergedConfig.enableHapticFeedback) {
        HapticFeedback.medium();
      }
      
      onSearch?.(finalQuery, activeFilters);
      Keyboard.dismiss();
      setShowSuggestions(false);
    }
  }, [query, mergedConfig.minQueryLength, mergedConfig.enableHistory, mergedConfig.maxHistoryItems, mergedConfig.enableHapticFeedback, onSearch, activeFilters]);
  
  // 处理清除
  const handleClear = useCallback(() => {
    setQuery('');
    onChangeText?.('');
    setShowSuggestions(false);
    inputRef.current?.focus();
    
    if (mergedConfig.enableHapticFeedback) {
      HapticFeedback.light();
    }
  }, [onChangeText, mergedConfig.enableHapticFeedback]);
  
  // 处理取消
  const handleCancel = useCallback(() => {
    setQuery('');
    onChangeText?.('');
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    if (mergedConfig.enableHapticFeedback) {
      HapticFeedback.light();
    }
    
    onCancel?.();
  }, [onChangeText, mergedConfig.enableHapticFeedback, onCancel]);
  
  // 处理建议点击
  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onChangeText?.(suggestion.text);
    
    if (suggestion.type === 'history') {
      onHistoryItemPress?.(suggestion);
    } else {
      onSuggestionPress?.(suggestion);
    }
    
    handleSearch(suggestion.text);
  }, [onChangeText, onHistoryItemPress, onSuggestionPress, handleSearch]);
  
  // 处理过滤器变化
  const handleFilterPress = useCallback((filter: SearchFilter) => {
    const updatedFilters = activeFilters.map(f => 
      f.id === filter.id ? { ...f, active: !f.active } : f
    );
    
    setActiveFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
    
    if (mergedConfig.enableHapticFeedback) {
      HapticFeedback.light();
    }
  }, [activeFilters, onFilterChange, mergedConfig.enableHapticFeedback]);
  
  // 渲染搜索图标
  const renderSearchIcon = () => {
    if (!mergedConfig.showSearchIcon) return null;
    
    return (
      <View style={styles.iconContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
      </View>
    );
  };
  
  // 渲染清除按钮
  const renderClearButton = () => {
    if (!mergedConfig.showClearButton || query.length === 0) return null;
    
    return (
      <TouchableEnhanced
        style={styles.clearButton}
        onPress={handleClear}
      >
        <Text style={styles.clearIcon}>✕</Text>
      </TouchableEnhanced>
    );
  };
  
  // 渲染取消按钮
  const renderCancelButton = () => {
    if (!mergedConfig.showCancelButton || !focused) return null;
    
    return (
      <TouchableEnhanced
        style={styles.cancelButton}
        onPress={handleCancel}
      >
        <Text style={styles.cancelText}>取消</Text>
      </TouchableEnhanced>
    );
  };
  
  // 渲染过滤器
  const renderFilters = () => {
    if (!mergedConfig.enableFilters || activeFilters.length === 0) return null;
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {activeFilters.map((filter, index) => {
          if (renderFilter) {
            return renderFilter(filter, index);
          }
          
          return (
            <TouchableEnhanced
              key={filter.id}
              style={StyleSheet.flatten([
                styles.filterChip,
                filter.active && styles.filterChipActive,
              ])}
              onPress={() => handleFilterPress(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter.active && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableEnhanced>
          );
        })}
      </ScrollView>
    );
  };
  
  // 渲染建议列表
  const renderSuggestionsList = () => {
    if (!showSuggestions) return null;
    
    const displaySuggestions = query.length > 0 ? suggestions : searchHistory;
    
    if (loading && renderLoading) {
      return (
        <View style={styles.suggestionsContainer}>
          {renderLoading()}
        </View>
      );
    }
    
    if (displaySuggestions.length === 0) {
      if (renderEmpty) {
        return (
          <View style={styles.suggestionsContainer}>
            {renderEmpty()}
          </View>
        );
      }
      
      if (query.length === 0 && mergedConfig.enableHistory) {
        return (
          <View style={styles.suggestionsContainer}>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无搜索历史</Text>
              {searchHistory.length > 0 && (
                <TouchableEnhanced
                  style={styles.clearHistoryButton}
                  onPress={onClearHistory}
                >
                  <Text style={styles.clearHistoryText}>清除历史</Text>
                </TouchableEnhanced>
              )}
            </View>
          </View>
        );
      }
      
      return null;
    }
    
    return (
      <Animated.View
        style={[
          styles.suggestionsContainer,
          {
            opacity: animationValue,
            transform: [
              {
                translateY: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {displaySuggestions.map((suggestion, index) => {
            if (renderSuggestion) {
              return renderSuggestion(suggestion, index);
            }
            
            return (
              <TouchableEnhanced
                key={suggestion.id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionIcon}>
                    {suggestion.type === 'history' ? '🕐' : '🔍'}
                  </Text>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  {suggestion.category && (
                    <Text style={styles.suggestionCategory}>
                      {suggestion.category}
                    </Text>
                  )}
                </View>
              </TouchableEnhanced>
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  };
  
  // 动画样式
  const animatedContainerStyle = {
    borderColor: animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#E5E5E5', '#007AFF'],
    }),
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.searchContainer, animatedContainerStyle, style]}>
        {renderSearchIcon()}
        
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          value={query}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={() => handleSearch()}
          placeholder={mergedConfig.placeholder}
          placeholderTextColor="#999"
          maxLength={mergedConfig.maxLength}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        
        {renderClearButton()}
        {renderCancelButton()}
      </Animated.View>
      
      {renderFilters()}
      {renderSuggestionsList()}
    </View>
  );
}

// 样式
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  iconContainer: {
    marginRight: 8,
  },
  searchIcon: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearIcon: {
    fontSize: 14,
    color: '#999',
  },
  cancelButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  filtersContainer: {
    marginTop: 8,
  },
  filtersContent: {
    paddingHorizontal: 4,
  },
  filterChip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  clearHistoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#666',
  },
});

export default SearchEnhanced;