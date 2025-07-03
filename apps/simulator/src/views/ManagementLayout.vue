<template>
  <el-container direction="vertical" class="management-layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        class="nav-menu"
        @select="handleMenuSelect"
      >
        <!-- <el-menu-item index="entities">实体管理</el-menu-item>
        <el-menu-item index="modules">模块管理</el-menu-item>
        <el-menu-item index="systems">系统管理</el-menu-item> -->
        <el-menu-item index="relationships">关系管理</el-menu-item>
        <el-sub-menu index="behaviors">
          <template #title>行为管理</template>
          <el-menu-item index="behaviors/remote">远程行为</el-menu-item>
          <el-menu-item index="behaviors/local">本地行为</el-menu-item>
          <el-menu-item index="behaviors/script">脚本行为</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="test">
          <template #title>测试页面</template>
          <el-menu-item index="test/graph">组件关系图</el-menu-item>
          <el-menu-item index="test/simulation">仿真测试</el-menu-item>
        </el-sub-menu>
      </el-menu>

      <!-- 右侧操作按钮 -->
      <div class="header-actions">
        <el-dropdown>
          <el-button :icon="More" circle />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>设置</el-dropdown-item>
              <el-dropdown-item>帮助</el-dropdown-item>
              <el-dropdown-item divided>退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { More } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  const path = route.path
  console.log('Current path:', path) // 调试用

  // 精确匹配关系管理路径
  if (path.includes('/management/relationship')) return 'relationships'
  if (path.includes('/entities')) return 'entities'
  if (path.includes('/modules')) return 'modules'
  if (path.includes('/systems')) return 'systems'
  if (path.includes('/behaviors/remote')) return 'behaviors/remote'
  if (path.includes('/behaviors/local')) return 'behaviors/local'
  if (path.includes('/behaviors/script')) return 'behaviors/script'
  if (path.includes('/behaviors')) return 'behaviors'

  // 默认返回关系管理
  return 'relationships'
})

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  if (index === 'relationships') {
    // 导航到关系管理，保持当前的子路由或默认到第一个实体
    const currentPath = route.path
    if (currentPath.includes('/management/relationship/')) {
      // 如果已经在关系管理的子页面，不改变URL
      return
    } else {
      // 否则导航到关系管理根页面，会自动选择第一个实体
      router.push('/management/relationship')
    }
  } else if (index.startsWith('behaviors/')) {
    router.push(`/management/${index}`)
  } else if (index === 'behaviors') {
    router.push('/management/behaviors/remote')
  } else {
    router.push(`/management/${index}`)
  }
}
</script>

<style scoped>
.management-layout {
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-content {
  padding: 0;
  height: calc(100vh - 60px);
  overflow: hidden;
}
</style>
