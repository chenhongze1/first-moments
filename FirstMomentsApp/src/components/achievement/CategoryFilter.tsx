import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius } from '../../styles';

interface CategoryFilterProps {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    count: number;
  }>;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  style?: ViewStyle;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  style,
}) => {
  const allCategory = {
    id: 'all',
    name: '全部',
    icon: '📋',
    count: categories.reduce((sum, cat) => sum + cat.count, 0),
  };

  const allCategories = [allCategory, ...categories];

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected ? styles.selectedItem : styles.unselectedItem,
              ]}
              onPress={() => onCategoryChange(category.id)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryContent}>
                <Text style={[
                  styles.categoryIcon,
                  isSelected && styles.selectedIcon
                ]}>
                  {category.icon}
                </Text>
                
                <Text style={[
                  styles.categoryName,
                  isSelected ? styles.selectedText : styles.unselectedText,
                ]}>
                  {category.name}
                </Text>
                
                <View style={[
                  styles.countBadge,
                  isSelected ? styles.selectedBadge : styles.unselectedBadge,
                ]}>
                  <Text style={[
                    styles.countText,
                    isSelected ? styles.selectedCountText : styles.unselectedCountText,
                  ]}>
                    {category.count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryItem: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
  },
  selectedItem: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unselectedItem: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  categoryContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryIcon: {
    fontSize: 20,
  },
  selectedIcon: {
    // 可以添加选中状态的图标样式
  },
  categoryName: {
    ...textStyles.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedText: {
    color: colors.white,
  },
  unselectedText: {
    color: colors.textPrimary,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  selectedBadge: {
    backgroundColor: colors.white,
  },
  unselectedBadge: {
    backgroundColor: colors.primary,
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectedCountText: {
    color: colors.primary,
  },
  unselectedCountText: {
    color: colors.white,
  },
});