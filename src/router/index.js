import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import MainLayout from '../layout/MainLayout.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/guest',
    name: 'Guest',
    component: () => import('../views/Guest.vue')
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'admin/batch-manage',
        name: 'BatchManage',
        component: () => import('../views/admin/BatchManage.vue')
      },
      {
        path: 'admin/approvals',
        name: 'AdminApprovals',
        component: () => import('../views/admin/AdminApprovals.vue')
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('../views/admin/AdminUsers.vue')
      },
      {
        path: 'user/my-tasks',
        name: 'MyTasks',
        component: () => import('../views/user/MyTasks.vue')
      },
      {
        path: 'user/task/:id',
        name: 'TaskDetail',
        component: () => import('../views/user/TaskDetail.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  // Ensure we are not in an infinite loop
  if (to.name !== 'Login' && !authStore.token) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && authStore.token) {
     // If logged in, redirect based on role
     const role = authStore.user?.role
     if (role === 'guest') next({ name: 'Guest' })
     else next({ name: 'Dashboard' })
  } else {
    // Role based guard could go here
    const role = authStore.user?.role
    if (role === 'guest' && to.name !== 'Guest' && to.name !== 'Login') {
        next({ name: 'Guest' })
    } else {
        next()
    }
  }
})

export default router
