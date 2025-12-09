<template>
  <div class="guest-container">
    <div class="guest-card">
      <div v-if="!hasApplied">
        <el-icon class="guest-icon"><Lock /></el-icon>
        <div class="guest-title">权限待开通</div>
        <div class="guest-desc">您的账号已注册成功，请选择一位管理员提交权限申请，审批通过后即可使用。</div>
        
        <el-form label-position="top">
          <el-form-item label="选择审批管理员">
            <el-select v-model="selectedAdmin" placeholder="请选择..." style="width: 100%" :loading="loading">
              <el-option 
                v-for="admin in adminList" 
                :key="admin.id" 
                :label="admin.username" 
                :value="admin.id">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="备注（可选）">
            <el-input
              v-model="applyReason"
              type="textarea"
              :rows="2"
              placeholder="请填写申请说明，便于管理员审批"
            />
          </el-form-item>
          <el-button type="primary" style="width: 100%" @click="handleSubmit" :disabled="!selectedAdmin" :loading="submitting">提交申请</el-button>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Lock, Checked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAdmins } from '../api/user'
import { applyAccess } from '../api/access'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const selectedAdmin = ref('')
const hasApplied = ref(false)
const adminList = ref([])
const loading = ref(false)
const submitting = ref(false)
const applyReason = ref('')

const fetchAdmins = async () => {
    loading.value = true
    try {
        const data = await getAdmins()
        adminList.value = data
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchAdmins()
})

const getAdminName = (id) => {
    const admin = adminList.value.find(a => a.id === id)
    return admin ? admin.username : id
}

const handleSubmit = async () => {
    submitting.value = true
    try {
        const userId = user.value?.id
        if (!userId) {
            ElMessage.error('用户信息缺失，请重新登录')
            return
        }
        await applyAccess({ adminId: selectedAdmin.value, userId, reason: applyReason.value })
        hasApplied.value = true
        ElMessage.success('申请已发送')

    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
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
