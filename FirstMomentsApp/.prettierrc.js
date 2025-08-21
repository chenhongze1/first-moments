module.exports = {
  // 基础格式化选项
  semi: true,                    // 语句末尾添加分号
  trailingComma: 'es5',         // 在ES5中有效的尾随逗号（对象、数组等）
  singleQuote: true,            // 使用单引号而不是双引号
  printWidth: 100,              // 每行最大字符数
  tabWidth: 2,                  // 缩进空格数
  useTabs: false,               // 使用空格而不是制表符
  
  // JSX 相关
  jsxSingleQuote: true,         // JSX中使用单引号
  jsxBracketSameLine: false,    // JSX标签的>放在最后一行的末尾
  
  // 其他选项
  bracketSpacing: true,         // 对象字面量的括号间添加空格
  arrowParens: 'avoid',         // 箭头函数参数只有一个时省略括号
  endOfLine: 'lf',              // 换行符使用 lf
  
  // 文件覆盖配置
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
  ],
};