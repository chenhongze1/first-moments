import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../styles';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { hideModal } from '../store/slices/uiSlice';
import { Button } from './Button';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
}

// 基础Modal组件
export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = 'fade',
  transparent = true,
}) => {
  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {/* 阻止事件冒泡 */}}>
            <View style={styles.modalContainer}>
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.content}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// 确认对话框
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonColor?: string;
  dangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  confirmButtonColor,
  dangerous = false,
}) => {
  return (
    <Modal visible={visible} onClose={onCancel} showCloseButton={false}>
      <View style={styles.confirmModal}>
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>
        <View style={styles.confirmButtons}>
          <Button
            title={cancelText}
            variant="outline"
            onPress={onCancel}
            style={styles.confirmButton}
          />
          <Button
            title={confirmText}
            variant={dangerous ? 'secondary' : 'primary'}
            onPress={onConfirm}
            style={styles.confirmButtonPrimary}
          />
        </View>
      </View>
    </Modal>
  );
};

// 信息对话框
interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  title,
  message,
  buttonText = '知道了',
  onClose,
}) => {
  return (
    <Modal visible={visible} onClose={onClose} showCloseButton={false}>
      <View style={styles.infoModal}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoMessage}>{message}</Text>
        <Button
          title={buttonText}
          variant="primary"
          onPress={onClose}
          style={styles.infoButton}
        />
      </View>
    </Modal>
  );
};

// 底部弹出Modal
interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  children,
  height = screenHeight * 0.6,
}) => {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.bottomSheetOverlay}>
          <TouchableWithoutFeedback onPress={() => {/* 阻止事件冒泡 */}}>
            <View style={[styles.bottomSheetContainer, { height }]}>
              <View style={styles.bottomSheetHandle} />
              {title && (
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.bottomSheetTitle}>{title}</Text>
                  <TouchableOpacity onPress={onClose}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.bottomSheetContent}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// Redux连接的Modal容器
export const ModalContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { modals } = useAppSelector((state: any) => state.ui);

  // 获取最新的模态框
  const modal = modals[modals.length - 1];

  const handleClose = () => {
    if (modal) {
      dispatch(hideModal(modal.id));
    }
  };

  if (!modal) {
    return null;
  }

  switch (modal.type) {
    case 'confirm':
      return (
        <ConfirmModal
          visible={true}
          title={modal.props?.title || '确认'}
          message={modal.props?.message || ''}
          confirmText={modal.props?.confirmText}
          cancelText={modal.props?.cancelText}
          onConfirm={() => {
            modal.props?.onConfirm?.();
            handleClose();
          }}
          onCancel={() => {
            modal.props?.onCancel?.();
            handleClose();
          }}
          dangerous={modal.props?.dangerous}
        />
      );
    case 'info':
      return (
        <InfoModal
          visible={true}
          title={modal.props?.title || '提示'}
          message={modal.props?.message || ''}
          buttonText={modal.props?.buttonText}
          onClose={handleClose}
        />
      );
    case 'bottomSheet':
      return (
        <BottomSheetModal
          visible={true}
          title={modal.props?.title}
          onClose={handleClose}
          height={modal.props?.height}
        >
          {modal.props?.content}
        </BottomSheetModal>
      );
    default:
      return (
        <Modal
          visible={true}
          title={modal.props?.title}
          onClose={handleClose}
        >
          {modal.props?.content}
        </Modal>
      );
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    maxWidth: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    minWidth: screenWidth * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.lg,
  },

  // 确认对话框样式
  confirmModal: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  confirmTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  confirmButtonPrimary: {
    marginLeft: spacing.sm,
  },

  // 信息对话框样式
  infoModal: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  infoMessage: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  infoButton: {
    minWidth: 120,
  },

  // 底部弹出样式
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  bottomSheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomSheetContent: {
    flex: 1,
    padding: spacing.lg,
  },
});

export default Modal;