<template>
  <div class="guest-container">
    <div class="guest-card">
      <div v-if="!hasApplied">
        <el-icon class="guest-icon"><Lock /></el-icon>
        <div class="guest-title">权限待开通</div>
        <div class="guest-desc">您的账号已注册成功，请选择一位管理员提交权限申请，审批通过后即可使用。</div>
        
        <el-form label-position="top">
          <el-form-item label="选择审批管理员">
            <el-select v-model="selectedAdmin" placeholder="请选择..." style="width: 100%">
              <el-option label="Admin (系统管理员)" value="admin"></el-option>
              <el-option label="Manager_Li (李经理)" value="li"></el-option>
              <el-option label="Director_Wang (王总监)" value="wang"></el-option>
            </el-select>
          </el-form-item>
          <el-button type="primary" style="width: 100%" @click="submitApplication" :disabled="!selectedAdmin">提交申请</el-button>
        </el-form>
      </div>

      <div v-else>
        <el-icon class="guest-icon" style="color: #67C23A"><Checked /></el-icon>
        <div class="guest-title">申请已提交</div>
        <div class="guest-desc">
          已向管理员 <strong>{{ getAdminName(selectedAdmin) }}</strong> 发送请求。<br>
          请耐心等待审批，或联系管理员加速审核。
        </div>
        <el-button plain style="width: 100%" disabled>审核中...</el-button>
      </div>
      
      <div style="margin-top: 20px;">
        <el-button text @click="handleLogout">退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Lock, Checked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const selectedAdmin = ref('')
const hasApplied = ref(false)

const getAdminName = (val) => {
    const map = { 'admin': 'Admin (系统管理员)', 'li': 'Manager_Li (李经理)', 'wang': 'Director_Wang (王总监)' }
    return map[val] || val
}

const submitApplication = () => {
    hasApplied.value = true
    ElMessage.success('申请已发送')
}

const handleLogout = () => {
    authStore.logout()
    router.push('/login')
}
</script>

<style scoped>
.guest-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; text-align: center; }
.guest-card { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); width: 400px; }
.guest-icon { font-size: 60px; color: #E6A23C; margin-bottom: 20px; }
.guest-title { font-size: 20px; font-weight: bold; color: #303133; margin-bottom: 10px; }
.guest-desc { font-size: 14px; color: #606266; margin-bottom: 30px; line-height: 1.6; }
</style>

