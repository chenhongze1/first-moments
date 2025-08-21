const mongoose = require('mongoose');
const UserAchievement = require('./src/models/UserAchievement');

// 创建一个测试实例
const achievement = new UserAchievement({
  user: new mongoose.Types.ObjectId(),
  template: new mongoose.Types.ObjectId(),
  progress: {
    current: 5,
    target: 10
  }
});

console.log('Before pre-save:');
console.log('- status:', achievement.status);
console.log('- progress:', achievement.progress);

// 手动调用 pre save 中间件
const schema = achievement.constructor.schema;
const preSaveMiddleware = schema.pre.bind(schema);

// 查看 schema 的 pre hooks
console.log('\nSchema pre hooks:', schema._pres);
console.log('Schema pre hooks keys:', schema._pres ? Object.keys(schema._pres) : 'undefined');
console.log('Schema paths:', Object.keys(schema.paths));

// 尝试直接调用 save 来触发 pre save 中间件
console.log('\n=== Testing pre-save middleware ===');
const originalStatus = achievement.status;
const originalProgress = achievement.progress.percentage;

// 模拟 save 操作
const preSaveFunction = function(next) {
  // 更新进度百分比
  if (this.progress.target > 0) {
    this.progress.percentage = Math.min(100, (this.progress.current / this.progress.target) * 100);
  }
  
  // 自动更新状态
  if (this.progress.current >= this.progress.target && this.status !== 'achieved') {
    this.status = 'achieved';
    this.achievedAt = new Date();
  } else if (this.progress.current > 0 && this.progress.current < this.progress.target && this.status !== 'achieved') {
    this.status = 'in_progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  } else if (this.progress.current === 0 && this.status !== 'achieved') {
    this.status = 'not_started';
    this.startedAt = undefined;
  }
  
  if (next) next();
};

// 手动调用 pre save 函数
preSaveFunction.call(achievement, () => {});

console.log('After calling pre-save function:');
console.log('- status changed from', originalStatus, 'to', achievement.status);
console.log('- progress.percentage changed from', originalProgress, 'to', achievement.progress.percentage);
console.log('- startedAt:', achievement.startedAt);

// 手动执行 pre save 逻辑
if (achievement.progress.target > 0) {
  achievement.progress.percentage = Math.min(100, (achievement.progress.current / achievement.progress.target) * 100);
}

if (achievement.progress.current >= achievement.progress.target && achievement.status !== 'achieved') {
  achievement.status = 'achieved';
  achievement.achievedAt = new Date();
} else if (achievement.progress.current > 0 && achievement.progress.current < achievement.progress.target && achievement.status !== 'achieved') {
  achievement.status = 'in_progress';
  if (!achievement.startedAt) {
    achievement.startedAt = new Date();
  }
} else if (achievement.progress.current === 0 && achievement.status !== 'achieved') {
  achievement.status = 'not_started';
  achievement.startedAt = undefined;
}

console.log('\nAfter manual pre-save logic:');
console.log('- status:', achievement.status);
console.log('- progress:', achievement.progress);
console.log('- startedAt:', achievement.startedAt);