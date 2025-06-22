import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/entities'
    },
    {
      path: '/entities',
      name: 'entities',
      component: () => import('../views/EntitiesView.vue')
    },
    {
      path: '/modules',
      name: 'modules',
      component: () => import('../views/ModulesView.vue')
    },
    {
      path: '/expressions',
      name: 'expressions',
      component: () => import('../views/ExpressionsView.vue')
    },
    {
      path: '/apis',
      name: 'apis',
      component: () => import('../views/ApiPlatform.vue')
    }
  ]
})

export default router
