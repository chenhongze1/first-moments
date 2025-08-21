import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLoading } from '../../contexts/LoadingContext';

interface LoadingDebugProps {
  visible?: boolean;
}

export const LoadingDebug: React.FC<LoadingDebugProps> = ({ visible = __DEV__ }) => {
  const { isLoading, clearAll } = useLoading();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loading Debug</Text>
      <Text style={styles.status}>
        Global Loading: {isLoading() ? 'TRUE' : 'FALSE'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={clearAll}>
        <Text style={styles.buttonText}>Clear All Loading</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 10000,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  status: {
    color: 'white',
    fontSize: 10,
    marginVertical: 5,
  },
  button: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 3,
  },
  buttonText: {
    color: 'red',
    fontSize: 10,
    textAlign: 'center',
  },
});