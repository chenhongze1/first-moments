import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface AlertProps {
  message: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  showIcon?: boolean;
  icon?: React.ReactNode;
  closable?: boolean;
  closeText?: string;
  onClose?: () => void;
  action?: React.ReactNode;
  banner?: boolean;
  style?: ViewStyle;
  messageStyle?: TextStyle;
  descriptionStyle?: TextStyle;
}

const Alert: React.FC<AlertProps> = ({
  message,
  description,
  type = 'info',
  showIcon = true,
  icon,
  closable = false,
  closeText,
  onClose,
  action,
  banner = false,
  style,
  messageStyle,
  descriptionStyle,
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <Text style={styles.iconText}>✓</Text>;
      case 'warning':
        return <Text style={styles.iconText}>⚠</Text>;
      case 'error':
        return <Text style={styles.iconText}>✕</Text>;
      case 'info':
      default:
        return <Text style={styles.iconText}>ℹ</Text>;
    }
  };

  const getAlertStyle = (): ViewStyle => {
    const baseStyle = {
      ...styles.alert,
      ...styles[`alert${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof styles],
    };

    if (banner) {
      return {
        ...baseStyle,
        ...styles.banner,
      };
    }

    return baseStyle;
  };

  const getMessageStyle = (): TextStyle => {
    return {
      ...styles.message,
      ...styles[`message${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof styles],
    };
  };

  const getDescriptionStyle = (): TextStyle => {
    return {
      ...styles.description,
      ...styles[`description${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof styles],
    };
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <View style={[getAlertStyle(), style]}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            {icon || getDefaultIcon()}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[getMessageStyle(), messageStyle]}>
            {message}
          </Text>
          
          {description && (
            <Text style={[getDescriptionStyle(), descriptionStyle]}>
              {description}
            </Text>
          )}
        </View>
        
        {action && (
          <View style={styles.actionContainer}>
            {action}
          </View>
        )}
      </View>
      
      {closable && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {closeText ? (
            <Text style={styles.closeText}>{closeText}</Text>
          ) : (
            <Text style={styles.closeIcon}>×</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  alert: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginVertical: 4,
  },
  banner: {
    borderRadius: 0,
    marginVertical: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  actionContainer: {
    marginLeft: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#999999',
  },
  closeText: {
    fontSize: 12,
    color: '#666666',
  },
  iconText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  message: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  // Success styles
  alertSuccess: {
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  messageSuccess: {
    color: '#52c41a',
  },
  descriptionSuccess: {
    color: '#389e0d',
  },
  // Info styles
  alertInfo: {
    backgroundColor: '#e6f7ff',
    borderColor: '#91d5ff',
  },
  messageInfo: {
    color: '#1890ff',
  },
  descriptionInfo: {
    color: '#096dd9',
  },
  // Warning styles
  alertWarning: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  messageWarning: {
    color: '#faad14',
  },
  descriptionWarning: {
    color: '#d48806',
  },
  // Error styles
  alertError: {
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
  },
  messageError: {
    color: '#ff4d4f',
  },
  descriptionError: {
    color: '#cf1322',
  },
});

// Preset components
export const SuccessAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="success" />
);

export const InfoAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="info" />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="warning" />
);

export const ErrorAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="error" />
);

export const BannerAlert: React.FC<Omit<AlertProps, 'banner'>> = (props) => (
  <Alert {...props} banner />
);

export const ClosableAlert: React.FC<Omit<AlertProps, 'closable'>> = (props) => (
  <Alert {...props} closable />
);

export default Alert;