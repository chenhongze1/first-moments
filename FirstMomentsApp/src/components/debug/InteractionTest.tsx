import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLoading } from '../../contexts/LoadingContext';

interface InteractionTestProps {
  visible?: boolean;
}

export const InteractionTest: React.FC<InteractionTestProps> = ({ visible = __DEV__ }) => {
  const [clickCount, setClickCount] = useState(0);
  const { showLoading, hideLoading, isLoading } = useLoading();

  if (!visible) return null;

  const handleTestClick = () => {
    setClickCount(prev => prev + 1);
    Alert.alert('测试', `按钮点击成功！点击次数: ${clickCount + 1}`);
  };

  const handleShowLoading = () => {
    showLoading('test-loading', '测试加载中...');
    setTimeout(() => {
      hideLoading('test-loading');
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>交互测试</Text>
      <Text style={styles.status}>
        点击次数: {clickCount}
      </Text>
      <Text style={styles.status}>
        加载状态: {isLoading() ? '是' : '否'}
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={handleTestClick}>
        <Text style={styles.buttonText}>测试点击</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleShowLoading}>
        <Text style={styles.buttonText}>测试加载</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 200,
    right: 10,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 10000,
    minWidth: 120,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 5,
  },
  status: {
    color: 'white',
    fontSize: 10,
    marginVertical: 2,
  },
  button: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 3,
    marginVertical: 2,
  },
  buttonText: {
    color: 'green',
    fontSize: 10,
    textAlign: 'center',
  },
});