import { Tabs } from 'expo-router';
import React from 'react';
import { TabBar } from '../../src/components/navigation/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: '时光',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '记录',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: '地图',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
        }}
      />
    </Tabs>
  );
}
