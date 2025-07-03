#!/usr/bin/env node

/**
 * Mock数据更新脚本
 * 从后端API获取最新数据并更新到mock数据文件中
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 后端API地址
  BACKEND_URL: 'http://localhost:8080',
  // 数据文件目录
  MOCK_DATA_DIR: path.join(__dirname, 'src/mock-data'),
  // API端点映射 - 基于真实的Controller接口
  ENDPOINTS: {
    modules: '/api/modular/modules/', // ModuleController
    entities: '/api/modular/entities', // EntityController
    systems: '/api/systems', // SystemController
    remoteBehaviors: '/exp/remote', // ExpController - 远程行为
    localBehaviors: '/exp/local', // ExpController - 本地行为
    scriptBehaviors: '/exp/script', // ExpController - 脚本行为
  },
};

// 工具函数
const httpGet = (url) => {
  return new Promise((resolve, reject) => {
    const request = require('http').get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => (data += chunk));
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.abort();
      reject(new Error('Request timeout'));
    });
  });
};

const writeJsonFile = (filename, data) => {
  const filepath = path.join(CONFIG.MOCK_DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ 已更新: ${filename} (${Array.isArray(data) ? data.length : 'N/A'} 条记录)`);
};

// 更新函数
const updateMockData = async () => {
  console.log('🚀 开始更新Mock数据...');
  console.log(`📡 后端地址: ${CONFIG.BACKEND_URL}`);

  try {
    // 1. 更新模块数据 - /api/modules
    console.log('\n📦 更新模块数据...');
    try {
      const modules = await httpGet(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.modules}`);
      writeJsonFile('modules.json', modules);
    } catch (e) {
      console.log('⚠️  模块数据获取失败，保持现有数据:', e.message);
    }

    // 2. 更新实体数据 - /api/entities
    console.log('\n🏗️  更新实体数据...');
    try {
      const entities = await httpGet(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.entities}`);
      writeJsonFile('entities.json', entities);
    } catch (e) {
      console.log('⚠️  实体数据获取失败，保持现有数据:', e.message);
    }

    // 3. 更新系统数据 - /api/systems (新增，包含participants信息)
    console.log('\n🔧 更新系统数据...');
    try {
      const systems = await httpGet(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.systems}`);
      writeJsonFile('systems.json', systems);
    } catch (e) {
      console.log('⚠️  系统数据获取失败，保持现有数据:', e.message);
    }

    // 4. 更新行为数据 - 合并三种类型的行为
    console.log('\n⚡ 更新行为数据...');
    try {
      const [remoteBehaviors, localBehaviors, scriptBehaviors] = await Promise.all([
        httpGet(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.remoteBehaviors}`).catch(() => []),
        httpGet(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.localBehaviors}`).catch(() => []),
        httpGet(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.scriptBehaviors}`).catch(() => []),
      ]);

      // 合并所有行为，添加类型标识
      const allBehaviors = [
        ...remoteBehaviors.map((b) => ({ ...b, type: 'remote' })),
        ...localBehaviors.map((b) => ({ ...b, type: 'local' })),
        ...scriptBehaviors.map((b) => ({ ...b, type: 'script' })),
      ];

      writeJsonFile('behaviors.json', allBehaviors);
      console.log(`   - 远程行为: ${remoteBehaviors.length} 个`);
      console.log(`   - 本地行为: ${localBehaviors.length} 个`);
      console.log(`   - 脚本行为: ${scriptBehaviors.length} 个`);
    } catch (e) {
      console.log('⚠️  行为数据获取失败，保持现有数据:', e.message);
    }

    // 5. 保持现有的图数据和枚举数据（这些可能来自其他源）
    console.log('\n📋 图数据和枚举数据保持不变（来自其他数据源）');

    console.log('\n✅ Mock数据更新完成！');
    console.log('\n📊 API端点总结:');
    console.log('   - 模块: GET /api/modular/modules/');
    console.log('   - 实体: GET /api/modular/entities');
    console.log('   - 系统: GET /api/systems');
    console.log('   - 远程行为: GET /exp/remote');
    console.log('   - 本地行为: GET /exp/local');
    console.log('   - 脚本行为: GET /exp/script');
  } catch (error) {
    console.error('❌ 更新过程中发生错误:', error.message);
    process.exit(1);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  updateMockData();
}

module.exports = { updateMockData };
