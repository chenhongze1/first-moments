import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { RootState } from '../../store';
import { createMomentAsync, updateMomentAsync } from '../../store/slices/momentSlice';
import { LoadingIndicator } from '../../components/ui/LoadingStates';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../styles';
import { CreateMomentData, UpdateMomentData, Moment } from '../../services/momentAPI';

const { width } = Dimensions.get('window');

interface CreateMomentScreenProps {
  route: {
    params?: {
      moment?: Moment;
      isEdit?: boolean;
    };
  };
  navigation: any;
}

const CreateMomentScreen: React.FC<CreateMomentScreenProps> = ({ route, navigation }) => {
  const { moment: editMoment, isEdit = false } = route.params || {};
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.moment);
  
  const [content, setContent] = useState(editMoment?.content || '');
  const [selectedImages, setSelectedImages] = useState<string[]>(editMoment?.media?.map(m => m.url) || []);
  const [tags, setTags] = useState<string[]>(editMoment?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [mood, setMood] = useState(editMoment?.mood || 'happy');
  const [location, setLocation] = useState(editMoment?.location || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [privacy, setPrivacy] = useState(editMoment?.privacy || 'public');

  const moods = [
    { key: 'happy', emoji: '😊', label: '开心' },
    { key: 'sad', emoji: '😢', label: '难过' },
    { key: 'excited', emoji: '🤩', label: '兴奋' },
    { key: 'calm', emoji: '😌', label: '平静' },
    { key: 'angry', emoji: '😠', label: '生气' },
    { key: 'surprised', emoji: '😲', label: '惊讶' },
    { key: 'love', emoji: '😍', label: '喜爱' },
    { key: 'tired', emoji: '😴', label: '疲惫' }
  ];

  const privacyOptions = [
    { key: 'public', icon: 'globe-outline', label: '公开' },
    { key: 'friends', icon: 'people-outline', label: '朋友可见' },
    { key: 'private', icon: 'lock-closed-outline', label: '仅自己可见' }
  ];

  useEffect(() => {
    // Request permissions
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相册权限来选择图片');
      }
    })();
  }, []);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1]
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 9)); // 最多9张图片
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要位置权限来获取当前位置');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      
      // 反向地理编码
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        setLocation({
          coordinates: {
            latitude,
            longitude
          },
          address: {
            formatted: `${address.city || ''} ${address.district || ''} ${address.street || ''}`.trim(),
            country: address.country || '',
            state: address.region || '',
            city: address.city || '',
            district: address.district || '',
            street: address.street || ''
          }
        });
      }
    } catch (error) {
      Alert.alert('错误', '获取位置失败');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入时光记录内容');
      return;
    }

    try {
      if (isEdit && editMoment) {
        const updateData: UpdateMomentData = {
          content: content.trim(),
          tags,
          mood,
          location,
          privacy
        };
        await dispatch(updateMomentAsync({
          id: editMoment.id,
          data: updateData
        }) as any);
        Alert.alert('成功', '时光记录已更新', [
          { text: '确定', onPress: () => navigation.goBack() }
        ]);
      } else {
        const createData: CreateMomentData = {
          title: content.trim().substring(0, 50) || '时光记录',
          content: content.trim(),
          profileId: 'default-profile', // 需要从用户状态获取
          tags,
          mood,
          location,
          privacy
        };
        await dispatch(createMomentAsync({
          data: createData
        }) as any);
        Alert.alert('成功', '时光记录已创建', [
          { text: '确定', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('错误', isEdit ? '更新失败' : '创建失败');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>记录内容</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="分享你的时光..."
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{content.length}/1000</Text>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>添加图片</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imagesContainer}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {selectedImages.length < 9 && (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                  <Ionicons name="camera" size={24} color={colors.textSecondary} />
                  <Text style={styles.addImageText}>添加图片</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>标签</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="添加标签"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              maxLength={20}
            />
            <TouchableOpacity
              style={[styles.addTagButton, !tagInput.trim() && styles.addTagButtonDisabled]}
              onPress={addTag}
              disabled={!tagInput.trim()}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons name="close" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Mood */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>心情</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.moodsContainer}>
              {moods.map((moodOption) => (
                <TouchableOpacity
                  key={moodOption.key}
                  style={[
                    styles.moodButton,
                    mood === moodOption.key && styles.selectedMoodButton
                  ]}
                  onPress={() => setMood(moodOption.key as any)}
                >
                  <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    mood === moodOption.key && styles.selectedMoodLabel
                  ]}>
                    {moodOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>位置</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <LoadingIndicator size="small" />
              ) : (
                <Ionicons name="location" size={20} color={colors.primary} />
              )}
              <Text style={styles.locationButtonText}>
                {isLoadingLocation ? '获取中...' : '获取当前位置'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {location && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={styles.locationText}>{location.address.formatted}</Text>
              <TouchableOpacity onPress={() => setLocation(null)}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>隐私设置</Text>
          <View style={styles.privacyContainer}>
            {privacyOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.privacyButton,
                  privacy === option.key && styles.selectedPrivacyButton
                ]}
                onPress={() => setPrivacy(option.key as any)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={privacy === option.key ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.privacyLabel,
                  privacy === option.key && styles.selectedPrivacyLabel
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!content.trim() || isLoading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!content.trim() || isLoading}
        >
          {isLoading ? (
            <LoadingIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? '更新时光记录' : '发布时光记录'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1
  },
  section: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  contentInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.base,
    minHeight: 120,
    textAlignVertical: 'top'
  },
  characterCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs
  },
  imagesContainer: {
    flexDirection: 'row'
  },
  imageWrapper: {
    position: 'relative',
    marginRight: spacing.sm
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 10
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addImageText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.base,
    marginRight: spacing.sm
  },
  addTagButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addTagButtonDisabled: {
    backgroundColor: colors.gray300
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginRight: spacing.xs
  },
  moodsContainer: {
    flexDirection: 'row'
  },
  moodButton: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray300
  },
  selectedMoodButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10'
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs
  },
  moodLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  selectedMoodLabel: {
    color: colors.primary,
    fontWeight: fontWeight.medium
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary
  },
  locationButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.xs
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: spacing.sm,
    borderRadius: borderRadius.md
  },
  locationText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    marginRight: spacing.xs
  },
  privacyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  privacyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginHorizontal: spacing.xs
  },
  selectedPrivacyButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10'
  },
  privacyLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs
  },
  selectedPrivacyLabel: {
    color: colors.primary,
    fontWeight: fontWeight.medium
  },
  submitContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300
  },
  submitButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white
  }
});

export default CreateMomentScreen;