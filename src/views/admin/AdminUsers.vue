<template>
  <div class="modern-card" v-loading="loading">
    <div class="card-header">
      <h2 style="margin:0">用户管理</h2>
      <el-select v-model="roleFilter" placeholder="按角色筛选" clearable style="width: 180px" @change="fetchData">
        <el-option label="全部" value=""></el-option>
        <el-option label="ADMIN" value="ADMIN"></el-option>
        <el-option label="USER" value="USER"></el-option>
        <el-option label="GUEST" value="GUEST"></el-option>
      </el-select>
    </div>

    <el-table :data="users" style="width:100%">
      <el-table-column type="index" label="No." width="80"/>
      <el-table-column prop="username" label="用户名" min-width="160" show-overflow-tooltip/>
      <el-table-column prop="role" label="角色" width="120"/>
      <el-table-column label="操作" width="280" align="center">
        <template #default="{row}">
          <el-dropdown 
            v-if="!isSelf(row)" 
            @command="(cmd) => handleRoleChange(row, cmd)"
            trigger="click"
            style="margin-right: 8px;"
          >
            <el-button type="primary" size="small" plain :loading="row.loading">
              变更角色 <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="ADMIN" :disabled="row.role === 'ADMIN'">设为管理员</el-dropdown-item>
                <el-dropdown-item command="USER" :disabled="row.role === 'USER'">设为普通用户</el-dropdown-item>
                <el-dropdown-item command="GUEST" :disabled="row.role === 'GUEST'">设为访客</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-else style="color:#999; font-size:12px; margin-right:8px;">(当前用户)</span>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="users.length === 0" style="text-align:center; padding: 20px; color: #999;">暂无用户</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { getUsers, updateUserRole } from '../../api/user'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

const users = ref([])
const loading = ref(false)
const roleFilter = ref('')

const isSelf = (row) => currentUser.value?.id === row.id

const fetchData = async () => {
  loading.value = true
  try {
    const data = await getUsers(roleFilter.value || undefined)
    users.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleRoleChange = async (row, newRole) => {
  if (row.role === newRole) return
  row.loading = true
  try {
    await updateUserRole(row.id, newRole)
    ElMessage.success(`已将用户 ${row.username} 角色修改为 ${newRole}`)
    // 本地更新，减少刷新闪烁
    row.role = newRole
  } catch (e) {
    console.error(e)
    fetchData() // 失败则刷新列表
  } finally {
    row.loading = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.modern-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #ebeef5; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>


