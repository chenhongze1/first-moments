import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView, SlideInView, AnimatedButton } from '../../src/components/animations/AnimatedComponents';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useResponsive, responsive } from '../../src/utils/responsive';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '../../src/styles';

const { width } = Dimensions.get('window');

const CreateScreen = () => {
  const { theme } = useTheme();
  const responsiveUtils = useResponsive();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const colors = theme.colors;
  const styles = createStyles(colors, responsiveUtils);

  const moods = [
    { id: 'happy', label: '开心', icon: 'happy-outline', color: '#FFD700' },
    { id: 'excited', label: '兴奋', icon: 'flash-outline', color: '#FF6B6B' },
    { id: 'calm', label: '平静', icon: 'leaf-outline', color: '#4ECDC4' },
    { id: 'thoughtful', label: '思考', icon: 'bulb-outline', color: '#45B7D1' },
    { id: 'grateful', label: '感恩', icon: 'heart-outline', color: '#96CEB4' },
    { id: 'nostalgic', label: '怀念', icon: 'time-outline', color: '#FFEAA7' },
  ];

  const commonTags = [
    '生活', '工作', '学习', '旅行', '美食', '运动',
    '朋友', '家人', '爱情', '成长', '感悟', '梦想'
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要访问相册权限来选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要访问相机权限来拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入记录标题');
      return;
    }
    
    // 这里将来会连接到后端API
    Alert.alert('成功', '记录已保存！', [
      { text: '确定', onPress: () => {
        // 重置表单
        setTitle('');
        setContent('');
        setLocation('');
        setMood('');
        setSelectedImages([]);
        setSelectedTags([]);
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FadeInView>
        {/* 头部 */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>创建记录</Text>
          <Text style={styles.headerSubtitle}>记录生活中的美好瞬间</Text>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 标题输入 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>标题</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="给这个时刻起个标题吧..."
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
        </View>

        {/* 内容输入 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>内容</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="分享你的想法和感受..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* 图片选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>图片</Text>
          <View style={styles.imageContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color={colors.primary} />
                  <Text style={styles.imageActionText}>拍照</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>
                  <Ionicons name="images" size={24} color={colors.primary} />
                  <Text style={styles.imageActionText}>相册</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* 心情选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>心情</Text>
          <View style={styles.moodContainer}>
            {moods.map((moodItem) => (
              <TouchableOpacity
                key={moodItem.id}
                style={[
                  styles.moodItem,
                  mood === moodItem.id && { backgroundColor: moodItem.color + '20' }
                ]}
                onPress={() => setMood(mood === moodItem.id ? '' : moodItem.id)}
              >
                <Ionicons
                  name={moodItem.icon as any}
                  size={24}
                  color={mood === moodItem.id ? moodItem.color : colors.textSecondary}
                />
                <Text style={[
                  styles.moodText,
                  mood === moodItem.id && { color: moodItem.color }
                ]}>
                  {moodItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 位置输入 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>位置</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.locationInput}
              placeholder="你在哪里？"
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="navigate" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 标签选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>标签</Text>
          <View style={styles.tagsContainer}>
            {commonTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagItem,
                  selectedTags.includes(tag) && styles.selectedTag
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.selectedTagText
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 保存按钮 */}
        <AnimatedButton style={styles.saveButton} onPress={handleSave}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.saveButtonGradient}
          >
            <Ionicons name="checkmark" size={24} color="white" />
            <Text style={styles.saveButtonText}>保存记录</Text>
          </LinearGradient>
        </AnimatedButton>
        </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, responsiveUtils: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: responsiveUtils.isTablet ? responsive.spacing.xl : responsive.spacing.lg,
    paddingTop: responsiveUtils.isTablet ? responsive.spacing.xxl : responsive.spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xxxl : responsive.fontSize.xxl,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: responsive.spacing.xs,
  },
  headerSubtitle: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.lg : responsive.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: responsiveUtils.getSafeAreaPadding().horizontal,
  },
  section: {
    marginBottom: responsiveUtils.isTablet ? responsive.spacing.xxl : responsive.spacing.xl,
  },
  sectionTitle: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xl : responsive.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: responsive.spacing.md,
  },
  titleInput: {
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    padding: responsiveUtils.isTablet ? responsive.spacing.lg : responsive.spacing.md,
    fontSize: responsive.fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentInput: {
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    padding: responsiveUtils.isTablet ? responsive.spacing.lg : responsive.spacing.md,
    fontSize: responsive.fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: responsiveUtils.isTablet ? 150 : 120,
  },
  imageContainer: {
    marginTop: responsive.spacing.sm,
  },
  imageItem: {
    position: 'relative',
    marginRight: responsive.spacing.md,
  },
  selectedImage: {
    width: responsiveUtils.isTablet ? 120 : 80,
    height: responsiveUtils.isTablet ? 120 : 80,
    borderRadius: responsive.borderRadius.sm,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: responsive.borderRadius.sm,
    width: responsiveUtils.isTablet ? 28 : 24,
    height: responsiveUtils.isTablet ? 28 : 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageActions: {
    flexDirection: 'row',
  },
  imageActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: responsiveUtils.isTablet ? 120 : 80,
    height: responsiveUtils.isTablet ? 120 : 80,
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginRight: responsive.spacing.md,
  },
  imageActionText: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.sm : responsive.fontSize.xs,
    color: colors.primary,
    marginTop: responsive.spacing.xs,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: responsive.spacing.sm,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveUtils.isTablet ? responsive.spacing.md : responsive.spacing.sm,
    borderRadius: responsive.borderRadius.full,
    marginRight: responsive.spacing.md,
    marginBottom: responsive.spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodText: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.md : responsive.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: responsive.spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    padding: responsiveUtils.isTablet ? responsive.spacing.lg : responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationInput: {
    flex: 1,
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.lg : responsive.fontSize.md,
    color: colors.textPrimary,
    marginLeft: responsive.spacing.sm,
  },
  locationButton: {
    padding: responsive.spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: responsive.spacing.sm,
  },
  tagItem: {
    paddingHorizontal: responsiveUtils.isTablet ? responsive.spacing.lg : responsive.spacing.md,
    paddingVertical: responsiveUtils.isTablet ? responsive.spacing.sm : responsive.spacing.xs,
    borderRadius: responsive.borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: responsive.spacing.sm,
    marginBottom: responsive.spacing.sm,
  },
  selectedTag: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.md : responsive.fontSize.sm,
    color: colors.textSecondary,
  },
  selectedTagText: {
    color: colors.primary,
  },
  saveButton: {
    marginTop: responsive.spacing.lg,
    marginBottom: responsive.spacing.xl,
    borderRadius: responsive.borderRadius.lg,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveUtils.isTablet ? responsive.spacing.xl : responsive.spacing.lg,
  },
  saveButtonText: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xl : responsive.fontSize.lg,
    fontWeight: '600',
    color: 'white',
    marginLeft: responsive.spacing.sm,
  },
});

export default CreateScreen;