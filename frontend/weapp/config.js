/**
 * 环境配置文件
 * 根据小程序环境自动选择合适的 API 地址
 */

// 环境配置
const ENV_CONFIG = {
  // 开发环境 - 本地调试
  development: {
    baseUrl: 'http://localhost:8000/api/v1',
    description: '开发环境'
  },
  // 测试环境
  test: {
    baseUrl: 'https://test-api.tonghua.org/api/v1',
    description: '测试环境'
  },
  // 生产环境
  production: {
    baseUrl: 'https://api.tonghua.org/api/v1',
    description: '生产环境'
  }
};

/**
 * 获取当前环境
 * 优先级：配置文件 > 小程序编译环境 > 默认生产环境
 */
function getCurrentEnv() {
  // 检查是否在小程序编译环境中定义了环境变量
  if (typeof __wxConfig !== 'undefined' && __wxConfig.envVersion) {
    const env = __wxConfig.envVersion;
    if (env === 'develop') return 'development';
    if (env === 'trial') return 'test';
    if (env === 'release') return 'production';
  }

  // 默认生产环境
  return 'production';
}

// 导出配置
const config = {
  ...ENV_CONFIG[getCurrentEnv()],
  env: getCurrentEnv(),
  isDev: getCurrentEnv() === 'development',
  isTest: getCurrentEnv() === 'test',
  isProd: getCurrentEnv() === 'production'
};

module.exports = config;
