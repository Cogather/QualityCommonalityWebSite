<template>
  <div class="modern-card" v-loading="loading">
    <div class="card-header">
      <h2 style="margin:0">权限审批</h2>
    </div>
    <el-table :data="requests" style="width:100%" :empty-text="''">
      <el-table-column type="index" label="No." width="80"/>
      <el-table-column label="申请人" min-width="140" show-overflow-tooltip>
        <template #default="{row}">
          {{ row.userName || row.userId || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="审批管理员" min-width="140" show-overflow-tooltip>
        <template #default="{row}">
          {{ row.adminName || row.adminId || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="备注" min-width="200" show-overflow-tooltip/>
      <el-table-column prop="createdAt" label="申请时间" width="180">
        <template #default="{row}">
          {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{row}">
          <el-button type="success" size="small" plain @click="handleApprove(row)" :loading="actionLoading">通过</el-button>
          <el-button type="danger" size="small" plain @click="handleReject(row)" :loading="actionLoading">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="requests.length === 0" style="text-align:center; padding: 20px; color: #999;">暂无待审批请求</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminRequests, approveRequest, rejectRequest } from '../../api/access'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const requests = ref([])
const loading = ref(false)
const actionLoading = ref(false)

const fetchData = async () => {
  if (!user.value?.id) return
  loading.value = true
  try {
    const data = await getAdminRequests(user.value.id)
    requests.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleApprove = async (row) => {
  actionLoading.value = true
  try {
    await approveRequest(row.id)
    ElMessage.success('已审批通过')
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    actionLoading.value = false
  }
}

const handleReject = async (row) => {
  actionLoading.value = true
  try {
    await rejectRequest(row.id)
    ElMessage.success('已驳回')
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


