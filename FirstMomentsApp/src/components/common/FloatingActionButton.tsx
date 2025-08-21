import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../styles';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = 'add',
  label,
  size = 'medium',
  style,
  disabled = false,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 48,
          height: 48,
          borderRadius: 24,
        };
      case 'large':
        return {
          width: 72,
          height: 72,
          borderRadius: 36,
        };
      default:
        return {
          width: 56,
          height: 56,
          borderRadius: 28,
        };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getSizeStyles(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon as any}
        size={getIconSize()}
        color={disabled ? colors.textSecondary : colors.white}
      />
      {label && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  disabled: {
    backgroundColor: colors.gray300,
  },
  label: {
    fontSize: 12,
    color: colors.white,
    marginTop: 2,
    fontWeight: '500',
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
});

export default FloatingActionButton;