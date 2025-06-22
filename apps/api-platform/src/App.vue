<template>
  <div id="app" class="h-screen flex flex-col">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-200 bg-white">
      <div class="px-4 py-2">
        <nav class="flex space-x-6">
          <router-link
            to="/entities"
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="
              $route.path === '/entities'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            ">
            实体列表
          </router-link>
          <router-link
            to="/modules"
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="
              $route.path === '/modules'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            ">
            模块列表
          </router-link>
          <router-link
            to="/expressions"
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="
              $route.path === '/expressions'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            ">
            表达式管理
          </router-link>
          <router-link
            to="/apis"
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="
              $route.path === '/apis'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            ">
            API工作台
          </router-link>
        </nav>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="flex-1 overflow-hidden">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// 应用根组件
</script>

<style>
/* 全局样式 */
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}
</style>
