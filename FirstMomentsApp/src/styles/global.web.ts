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
      
      // 如果内容高度超过视口，强制设置容器高度
      if (maxHeight > window.innerHeight) {
        const heightValue = `${maxHeight}px`;
        
        // 强制设置所有关键容器的高度
        [html, body, root, reactRoot].forEach(element => {
          if (element) {
            (element as HTMLElement).style.height = heightValue;
            (element as HTMLElement).style.minHeight = heightValue;
            (element as HTMLElement).style.maxHeight = 'none';
            (element as HTMLElement).style.overflow = 'auto';
          }
        });
        
        console.log(`强制设置内容高度为: ${heightValue}`);
      }
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
      });
    };
    
    fixContainerHeights();
    
    // 延迟执行强制修复，确保DOM完全渲染
    setTimeout(forceScrollFix, 100);
    
    console.log('Applied comprehensive scroll and height fixes');
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
        fixBodyOverflow();
      }
    });
  
  observer.observe(document.head, {
    childList: true,
    subtree: true
  });
}

export {};