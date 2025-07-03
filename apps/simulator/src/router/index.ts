import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import ManagementLayout from '@/views/ManagementLayout.vue'
import EntityManagement from '@/views/EntityManagement.vue'
import ModuleManagement from '@/views/ModuleManagement.vue'
import SystemManagement from '@/views/SystemManagement.vue'
import BehaviorManagement from '@/views/BehaviorManagement.vue'
import RelationshipManagement from '@/views/RelationshipManagement.vue'
import EntityDetail from '@/components/entity/EntityDetail.vue'
import TestView from '@/views/TestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/management/relationship'
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    // 直接的实体管理路由
    {
      path: '/entities',
      name: 'entities-root',
      component: EntityManagement,
      children: [
        {
          path: ':id',
          name: 'entity-detail-root',
          component: EntityDetail,
          props: true
        }
      ]
    },
    // 管理页面主路由 - 包含导航的顶层布局
    {
      path: '/management',
      name: 'management',
      component: ManagementLayout,
      redirect: '/management/relationship', // 默认重定向到关系管理
      children: [
                // 关系管理
        {
          path: 'relationship',
          name: 'relationship',
          component: RelationshipManagement,
          children: [
            {
              path: 'entities/:id',
              name: 'relationship-entity-detail',
              component: EntityDetail,
              props: route => ({ id: route.params.id })
            }
          ]
        },
        // 实体管理
        {
          path: 'entities',
          name: 'entities',
          component: EntityManagement,
          children: [
            {
              path: ':id',
              name: 'entity-detail',
              component: EntityDetail,
              props: true
            }
          ]
        },
        // 模块管理
        {
          path: 'modules',
          name: 'modules',
          component: ModuleManagement
        },
        // 系统管理
        {
          path: 'systems',
          name: 'systems',
          component: SystemManagement
        },
        // 行为管理
        {
          path: 'behaviors',
          name: 'behaviors',
          component: BehaviorManagement
        }
      ]
    },
    // 测试页面
    {
      path: '/test',
      name: 'test',
      component: TestView
    }
  ]
})

export default router
