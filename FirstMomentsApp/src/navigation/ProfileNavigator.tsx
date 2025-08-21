import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileListScreen } from '../screens/ProfileListScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';

export type ProfileStackParamList = {
  ProfileList: undefined;
  ProfileDetail: { profileId: string };
  CreateProfile: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="ProfileList" 
        component={ProfileListScreen}
        options={{
          title: '档案管理',
        }}
      />
      <Stack.Screen 
        name="ProfileDetail" 
        component={ProfileDetailScreen}
        options={{
          title: '档案详情',
        }}
      />
      <Stack.Screen 
        name="CreateProfile" 
        component={CreateProfileScreen}
        options={{
          title: '创建档案',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;