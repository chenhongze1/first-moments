// Web平台全局样式修复
// 修复React Native Web在浏览器中的滚动问题

if (typeof window !== 'undefined') {
  const fixBodyOverflow = () => {
    const body = document.body;
    const html = document.documentElement;
    const root = document.getElementById('root');
    
    // 处理expo-reset样式冲突 - 强力修复
    const expoResetStyle = document.getElementById('expo-reset');
    if (expoResetStyle) {
      // 完全重写expo-reset样式，移除所有高度限制
      expoResetStyle.textContent = `
        #root, body, html {
          height: auto !important;
          min-height: 100vh !important;
          overflow: auto !important;
        }
        body {
          overflow: auto !important;
        }
        #root {
          display: flex !important;
          flex-direction: column !important;
          min-height: 100vh !important;
        }
        [data-reactroot] {
          height: auto !important;
          min-height: 100vh !important;
          overflow: auto !important;
        }
      `;
      console.log('强力重写expo-reset样式');
    }
    
    // 修复容器高度限制问题
    body.style.overflow = 'auto';
    body.style.height = 'auto';
    body.style.minHeight = '100vh';
    
    html.style.overflow = 'auto';
    html.style.height = 'auto';
    html.style.minHeight = '100vh';
    
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
      root.style.minHeight = '100vh';
    }
    
    // 修复React Native Web的data-reactroot容器
    const reactRoot = document.querySelector('[data-reactroot]') as HTMLElement;
    if (reactRoot) {
      reactRoot.style.height = 'auto';
      reactRoot.style.minHeight = '100vh';
      reactRoot.style.overflow = 'auto';
    }
    
    // 强制修复ScrollView容器高度
    const forceScrollFix = () => {
      // 计算所有元素的实际最大高度
      const allElements = document.querySelectorAll('*');
      let maxHeight = 0;
      
      allElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const bottom = rect.bottom + window.scrollY;
        if (bottom > maxHeight) {
          maxHeight = bottom;
        }
      });
      
      // 总是允许滚动，不限制容器高度
      const minHeight = Math.max(maxHeight, window.innerHeight);
      
      // 设置容器为自动高度，允许内容扩展
      [html, body].forEach(element => {
        if (element) {
          (element as HTMLElement).style.height = 'auto';
          (element as HTMLElement).style.minHeight = '100vh';
          (element as HTMLElement).style.maxHeight = 'none';
          (element as HTMLElement).style.overflow = 'auto';
        }
      });
      
      // root容器特殊处理
      if (root) {
        root.style.height = 'auto';
        root.style.minHeight = '100vh';
        root.style.maxHeight = 'none';
        root.style.overflow = 'visible';
        root.style.display = 'flex';
        root.style.flexDirection = 'column';
      }
      
      // React Native Web容器处理
      if (reactRoot) {
        reactRoot.style.height = 'auto';
        reactRoot.style.minHeight = '100vh';
        reactRoot.style.maxHeight = 'none';
        reactRoot.style.overflow = 'visible';
        reactRoot.style.flex = '1';
      }
      
      console.log(`内容高度: ${maxHeight}px, 视口高度: ${window.innerHeight}px`);
    };
    
    // 修复所有可能的固定高度容器
    const fixContainerHeights = () => {
      const containers = document.querySelectorAll('div');
      containers.forEach(container => {
        const computedStyle = window.getComputedStyle(container);
        const height = computedStyle.height;
        
        // 如果容器高度被固定为视口高度，改为最小高度
        if (height === '667px' || height === '100vh') {
          container.style.height = 'auto';
          container.style.minHeight = height;
        }
        
        // 特别处理React Native Web的ScrollView容器
        if (computedStyle.overflow === 'hidden' && container.children.length > 0) {
          container.style.overflow = 'visible';
        }
        
        // 修复flex容器的高度限制
        if (computedStyle.display === 'flex' && computedStyle.flexDirection === 'column') {
          if (height === '667px' || height === '100vh') {
            container.style.height = 'auto';
            container.style.minHeight = '100vh';
          }
        }
      });
      
      // 特别处理所有可能的滚动容器
      const scrollContainers = document.querySelectorAll('[style*="overflow"]');
      scrollContainers.forEach(container => {
        const element = container as HTMLElement;
        if (element.style.overflow === 'hidden') {
          element.style.overflow = 'auto';
        }
        
        // 确保滚动容器可以扩展
        if (element.style.height === '667px' || element.style.height === '100vh') {
          element.style.height = 'auto';
          element.style.minHeight = '100vh';
        }
      });
    };
    
    // 修复React Native Web主容器
    const fixReactNativeMainContainer = () => {
      const root = document.getElementById('root');
      if (root && root.children.length > 0) {
        const mainContainer = root.children[0] as HTMLElement;
        
        // 强制移除高度限制
        mainContainer.style.setProperty('height', 'auto', 'important');
        mainContainer.style.setProperty('min-height', '100vh', 'important');
        mainContainer.style.setProperty('max-height', 'none', 'important');
        mainContainer.style.setProperty('overflow', 'visible', 'important');
        
        // 确保flex布局正确
        mainContainer.style.setProperty('display', 'flex', 'important');
        mainContainer.style.setProperty('flex-direction', 'column', 'important');
        mainContainer.style.setProperty('flex', '1', 'important');
        
        console.log('已修复React Native主容器高度限制');
      }
    };
    
    // 修复ScrollView容器滚动问题
    const fixScrollViewContainer = () => {
      // 查找ScrollView容器
      const scrollContainer = document.querySelector('.r-overflow-1dqxon3') as HTMLElement;
      if (scrollContainer) {
        // 强制设置滚动样式
        scrollContainer.style.setProperty('overflow', 'auto', 'important');
        scrollContainer.style.setProperty('overflow-y', 'auto', 'important');
        scrollContainer.style.setProperty('height', '100vh', 'important');
        scrollContainer.style.setProperty('max-height', '100vh', 'important');
        
        // 确保内容容器可以扩展
        const contentContainer = scrollContainer.querySelector('.r-minHeight-sa2ff0') as HTMLElement;
        if (contentContainer) {
          contentContainer.style.setProperty('min-height', 'auto', 'important');
          contentContainer.style.setProperty('height', 'auto', 'important');
        }
        
        console.log('已修复ScrollView容器滚动');
      }
    };
    
    // 应用所有修复
    const applyAllFixes = () => {
      forceScrollFix();
      fixContainerHeights();
      fixReactNativeMainContainer();
      fixScrollViewContainer();
      console.log('Applied comprehensive scroll and height fixes');
    };
    
    applyAllFixes();
    
    // 延迟执行强制修复，确保DOM完全渲染
    setTimeout(applyAllFixes, 100);
  };
  
  // 页面加载完成后立即执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixBodyOverflow);
  } else {
    fixBodyOverflow();
  }
  
  // 监听DOM变化，确保修复持续有效
    const observer = new MutationObserver(() => {
      const body = document.body;
      const html = document.documentElement;
      const root = document.getElementById('root');
      const expoResetStyle = document.getElementById('expo-reset');
      
      // 检查是否需要重新应用修复
      let needsFix = false;
      
      if (body.style.overflow === 'hidden' || body.style.height === '667px' || body.style.height === '100vh') {
        needsFix = true;
      }
      
      if (html.style.overflow === 'hidden' || html.style.height === '667px' || html.style.height === '100vh') {
        needsFix = true;
      }
      
      if (root && (root.style.overflow === 'hidden' || root.style.height === '667px' || root.style.height === '100vh')) {
        needsFix = true;
      }
      
      if (expoResetStyle && expoResetStyle.textContent && 
          (expoResetStyle.textContent.includes('height:100%') || 
           expoResetStyle.textContent.includes('overflow:hidden') ||
           !expoResetStyle.textContent.includes('height: auto !important'))) {
        needsFix = true;
      }
      
      if (needsFix) {
        setTimeout(fixBodyOverflow, 50);
      }
    });
  
  observer.observe(document.head, {
    childList: true,
    subtree: true
  });
}

export {};