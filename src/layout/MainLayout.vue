<template>
  <div class="app-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <el-icon color="#fff" :size="20"><DataLine /></el-icon>
        </div>
        <span>AI数据飞轮系统</span>
        <el-tag :type="currentRole === 'admin' ? 'danger' : 'success'" effect="plain" round size="small" style="margin-left: 8px; font-weight: normal;">
          {{ currentRole === 'admin' ? '管理员 (Administrator)' : '普通用户 (User)' }}
        </el-tag>
      </div>
      <div class="actions">
        <div class="user-info">
          <el-avatar :size="32" :src="currentRole === 'admin' ? 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
          <span class="user-name">{{ currentRole === 'admin' ? 'Admin' : user?.username || 'Operator_01' }}</span>
          <el-icon @click="handleLogout" class="logout-icon" title="退出登录"><SwitchButton /></el-icon>
        </div>
      </div>
    </div>

    <div class="main">
      <!-- Sidebar -->
      <div class="sidebar">
        <el-menu :default-active="activeMenu" @select="handleMenuSelect" text-color="#606266" active-text-color="#409EFF" style="border: none; padding-top: 10px;">
          
          <!-- Common Menu -->
          <el-menu-item index="dashboard">
            <el-icon><Odometer /></el-icon>
            <span>{{ currentRole === 'admin' ? '全局概览' : '个人中心' }}</span>
          </el-menu-item>

          <!-- Admin Specific -->
          <template v-if="currentRole === 'admin'">
            <el-menu-item-group title="数据管理">
              <el-menu-item index="batch-manage">
                <el-icon><Files /></el-icon>
                <span>批次分发</span>
              </el-menu-item>
              <el-menu-item index="admin-approvals">
                <el-icon><Files /></el-icon>
                <span>权限审批</span>
              </el-menu-item>
              <el-menu-item index="admin-users">
                <el-icon><Files /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
            </el-menu-item-group>
          </template>

          <!-- Task Center: 普通用户 & 管理员都可进入 -->
          <template v-if="currentRole === 'user' || currentRole === 'admin'">
            <el-menu-item-group title="任务中心">
              <el-menu-item index="my-tasks">
                <el-icon><List /></el-icon>
                <span>我的任务</span>
              </el-menu-item>
            </el-menu-item-group>
          </template>
        </el-menu>
      </div>

      <!-- Content Area -->
      <div class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { DataLine, SwitchButton, Odometer, Files, List } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
// Fallback to 'user' if no role specified, or handle via auth store
const currentRole = computed(() => user.value?.role || 'user')

const activeMenu = ref(route.name ? route.name.toString().toLowerCase() : 'dashboard')

watch(() => route.name, (newVal) => {
  if (newVal) {
    // Map route names to menu indexes if they differ
    if (newVal === 'TaskDetail') {
      activeMenu.value = 'my-tasks'
    } else {
      activeMenu.value = newVal.toString().toLowerCase()
    }
  }
})

const handleMenuSelect = (key) => {
  if (key === 'dashboard') router.push('/dashboard')
  else if (key === 'batch-manage') router.push('/admin/batch-manage')
  else if (key === 'admin-approvals') router.push('/admin/approvals')
  else if (key === 'admin-users') router.push('/admin/users')
  else if (key === 'my-tasks') router.push('/user/my-tasks')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-container { display: flex; flex-direction: column; height: 100vh; }
.header { background: #fff; height: 60px; border-bottom: 1px solid #dcdfe6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); z-index: 10; }
.logo { font-size: 20px; font-weight: bold; color: #303133; display: flex; align-items: center; gap: 10px; }
.logo-icon { background: #409EFF; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.main { display: flex; flex: 1; overflow: hidden; }
.sidebar { width: 240px; background: #fff; border-right: 1px solid #dcdfe6; display: flex; flex-direction: column; transition: width 0.3s; }
.content { flex: 1; padding: 24px; overflow-y: auto; background-color: #f5f7fa; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.user-name { font-size: 14px; font-weight: 500; }
.logout-icon { margin-left: 10px; color: #909399; cursor: pointer; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

