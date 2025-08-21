import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { responsive } from '../../utils/responsive';
import { spacing } from '../../styles';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface CheckInModalProps {
  visible: boolean;
  location: LocationData | null;
  onClose: () => void;
  onCheckIn: (data: CheckInData) => void;
}

interface CheckInData {
  location: LocationData;
  description: string;
  images: string[];
  category: string;
}

const CheckInModal: React.FC<CheckInModalProps> = ({
  visible,
  location,
  onClose,
  onCheckIn,
}) => {
  const { theme } = useTheme();
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('景点');
  const [isLoading, setIsLoading] = useState(false);

  const colors = theme.colors;
  const styles = createStyles(colors);

  const categories = [
    { id: 'scenic', name: '景点', icon: 'camera' },
    { id: 'food', name: '美食', icon: 'restaurant' },
    { id: 'shopping', name: '购物', icon: 'bag' },
    { id: 'entertainment', name: '娱乐', icon: 'game-controller' },
    { id: 'transport', name: '交通', icon: 'train' },
    { id: 'accommodation', name: '住宿', icon: 'bed' },
  ];

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckIn = async () => {
    if (!location) return;

    if (description.trim().length === 0) {
      Alert.alert('提示', '请添加打卡描述');
      return;
    }

    setIsLoading(true);
    try {
      const checkInData: CheckInData = {
        location,
        description: description.trim(),
        images,
        category: selectedCategory,
      };

      await onCheckIn(checkInData);
      
      // 重置表单
      setDescription('');
      setImages([]);
      setSelectedCategory('景点');
      onClose();
    } catch (error) {
      console.error('打卡失败:', error);
      Alert.alert('打卡失败', '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      '选择图片',
      '请选择图片来源',
      [
        { text: '取消', style: 'cancel' },
        { text: '拍照', onPress: takePhoto },
        { text: '从相册选择', onPress: pickImage },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>地点打卡</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 位置信息 */}
          {location && (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.locationName}>{location.name || '未知地点'}</Text>
              </View>
              <Text style={styles.locationAddress}>{location.address || '未知地址'}</Text>
            </View>
          )}

          {/* 分类选择 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>选择分类</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.name && styles.categoryItemSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color={
                      selectedCategory === category.name
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.name && styles.categoryTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 描述输入 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>打卡描述</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="分享你的感受和体验..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.characterCount}>{description.length}/200</Text>
          </View>

          {/* 图片选择 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>添加图片</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imageContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 6 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
                    <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    <Text style={styles.addImageText}>添加图片</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={handleCheckIn}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.checkInButtonGradient}
            >
              {isLoading ? (
                <Text style={styles.checkInButtonText}>打卡中...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.checkInButtonText}>完成打卡</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: spacing.xs,
    },
    headerTitle: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    placeholder: {
      width: 32,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    locationCard: {
      backgroundColor: colors.surface,
      borderRadius: responsive.borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    locationName: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      marginLeft: spacing.xs,
    },
    locationAddress: {
      fontSize: responsive.fontSize.sm,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryItem: {
      width: '30%',
      aspectRatio: 1,
      backgroundColor: colors.surface,
      borderRadius: responsive.borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    categoryText: {
      fontSize: responsive.fontSize.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    categoryTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    descriptionInput: {
      backgroundColor: colors.surface,
      borderRadius: responsive.borderRadius.lg,
      padding: spacing.lg,
      fontSize: responsive.fontSize.md,
      color: colors.textPrimary,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
    },
    characterCount: {
      fontSize: responsive.fontSize.xs,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: spacing.xs,
    },
    imageContainer: {
      flexDirection: 'row',
    },
    imageItem: {
      position: 'relative',
      marginRight: spacing.md,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: responsive.borderRadius.md,
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: 'white',
      borderRadius: 10,
    },
    addImageButton: {
      width: 80,
      height: 80,
      backgroundColor: colors.surface,
      borderRadius: responsive.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    addImageText: {
      fontSize: responsive.fontSize.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    footer: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    checkInButton: {
      borderRadius: responsive.borderRadius.lg,
      overflow: 'hidden',
    },
    checkInButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    checkInButtonText: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: 'white',
      marginLeft: spacing.xs,
    },
  });

export default CheckInModal;