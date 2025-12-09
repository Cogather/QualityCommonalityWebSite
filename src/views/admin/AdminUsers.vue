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
      <el-table-column label="操作" width="240" align="center">
        <template #default="{row}">
          <el-button
            size="small"
            type="warning"
            plain
            :disabled="isSelf(row) || row.role === 'GUEST'"
            @click="handleRevoke(row)"
            :loading="actionLoading"
          >撤销为访客</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="users.length === 0" style="text-align:center; padding: 20px; color: #999;">暂无用户</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUsers, revokeUser } from '../../api/user'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

const users = ref([])
const loading = ref(false)
const actionLoading = ref(false)
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

const handleRevoke = async (row) => {
  actionLoading.value = true
  try {
    await revokeUser(row.id)
    ElMessage.success('已撤销为访客')
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
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


