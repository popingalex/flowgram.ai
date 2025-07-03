// API服务演示 - 简化版本
// 展示基本的API调用和mock降级功能

import { apiService } from './services/api-service'
import { API_CONFIG } from './config/api'

async function runDemo() {
  console.log('=== API服务演示 ===')

  // 1. 显示配置信息
  console.log('\n1. API配置信息:')
  console.log(`- 基础URL: ${API_CONFIG.BASE_URL}`)
  console.log(`- 超时时间: ${API_CONFIG.TIMEOUT}ms`)
  console.log(`- 重试次数: ${API_CONFIG.RETRY_COUNT}`)
  console.log(`- 当前模式: ${apiService.getApiMode()}`)

  // 2. 获取模块列表
  console.log('\n2. 获取模块列表:')
  const modulesResponse = await apiService.getModules()
  if (modulesResponse.success) {
    console.log(`- 成功获取 ${modulesResponse.data?.length} 个模块`)
    modulesResponse.data?.forEach(module => {
      console.log(`  - ${module.name}: ${module.description}`)
    })
  } else {
    console.log(`- 获取失败: ${modulesResponse.error}`)
  }

  // 3. 获取实体列表
  console.log('\n3. 获取实体列表:')
  const entitiesResponse = await apiService.getEntities()
  if (entitiesResponse.success) {
    console.log(`- 成功获取 ${entitiesResponse.data?.length} 个实体`)
    entitiesResponse.data?.forEach(entity => {
      console.log(`  - ${entity.name}: ${entity.description}`)
    })
  } else {
    console.log(`- 获取失败: ${entitiesResponse.error}`)
  }

  // 4. 创建测试模块
  console.log('\n4. 创建测试模块:')
  const createModuleResponse = await apiService.createModule({
    name: '测试模块',
    description: '这是一个测试模块',
    attributes: [],
    behaviors: []
  })
  if (createModuleResponse.success) {
    console.log(`- 成功创建模块: ${createModuleResponse.data?.name}`)
  } else {
    console.log(`- 创建失败: ${createModuleResponse.error}`)
  }

  // 5. 模式切换演示
  console.log('\n5. 模式切换演示:')
  console.log(`- 当前模式: ${apiService.getApiMode()}`)
  apiService.toggleMockMode()
  console.log(`- 切换后模式: ${apiService.getApiMode()}`)

  console.log('\n=== 演示完成 ===')
}

// 运行演示
runDemo().catch(console.error)
