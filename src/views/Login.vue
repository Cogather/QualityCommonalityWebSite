<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <h2>AI Data Flywheel</h2>
        <p>System Login</p>
      </div>
      <el-form :model="loginForm" ref="loginFormRef" :rules="rules" label-position="top">
        <el-form-item label="Username" prop="username">
          <el-input v-model="loginForm.username" placeholder="admin / user" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="loginForm.password" type="password" show-password placeholder="Any password for demo" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">Login</el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: 'Please input username', trigger: 'blur' }],
  password: [{ required: true, message: 'Please input password', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const data = await login(loginForm)
        
        // Normalize role to lowercase
        if (data.user && data.user.role) {
            data.user.role = data.user.role.toLowerCase()
        } else {
            // Fallback if no user object or role returned (e.g. if using mock without proper structure)
            const u = loginForm.username.toLowerCase()
            if (!data.user) data.user = { username: loginForm.username }
            if (u === 'admin') data.user.role = 'admin'
            else if (u.startsWith('user')) data.user.role = 'user'
            else data.user.role = 'guest'
        }

        authStore.setToken(data.token)
        authStore.setUser(data.user)
        ElMessage.success('Login Successful')
        
        const role = data.user.role
        if (role === 'guest') {
            router.push('/guest')
        } else {
            router.push('/dashboard')
        } 
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d3a4b;
  
  .login-card {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);

    .header {
      text-align: center;
      margin-bottom: 30px;
      h2 { margin: 0; color: #303133; }
      p { margin: 10px 0 0; color: #909399; font-size: 14px; }
    }

    .login-btn {
      width: 100%;
      margin-top: 20px;
    }
  }
}
</style>

