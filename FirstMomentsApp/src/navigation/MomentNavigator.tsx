import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MomentListScreen from '../screens/moment/MomentListScreen';
import MomentDetailScreen from '../screens/moment/MomentDetailScreen';
import CreateMomentScreen from '../screens/moment/CreateMomentScreen';
import { colors } from '../styles';

// 定义时光记录导航参数类型
export type MomentStackParamList = {
  MomentList: undefined;
  MomentDetail: {
    momentId: string;
  };
  CreateMoment: {
    moment?: any;
    isEdit?: boolean;
  };
};

const MomentStack = createNativeStackNavigator<MomentStackParamList>();

const MomentNavigator = () => {
  return (
    <MomentStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <MomentStack.Screen
        name="MomentList"
        component={MomentListScreen}
        options={{
          title: '时光记录',
          headerLargeTitle: true,
        }}
      />
      <MomentStack.Screen
        name="MomentDetail"
        component={MomentDetailScreen}
        options={{
          title: '记录详情',
          headerBackTitle: '返回',
        }}
      />
      <MomentStack.Screen
        name="CreateMoment"
        component={CreateMomentScreen}
        options={({ route }) => ({
          title: route.params?.isEdit ? '编辑记录' : '创建记录',
          headerBackTitle: '取消',
          presentation: 'modal',
        })}
      />
    </MomentStack.Navigator>
  );
};

export default MomentNavigator;