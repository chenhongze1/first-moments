const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 在Web平台上排除react-native-maps
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.blockList = [
    /react-native-maps/,
  ];
  
  // 配置静态资源
  config.resolver.assetExts.push('ttf');
  config.web = {
    ...config.web,
    staticFolder: 'web'
  };
}

module.exports = config;