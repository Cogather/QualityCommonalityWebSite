<template>
  <div>
    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">批次分发管理</h2>
      <el-upload action="#" :show-file-list="false" :auto-upload="false" :on-change="handleFileChange">
        <el-button type="primary" :icon="Upload">上传新批次 (JSON)</el-button>
      </el-upload>
    </div>
    <div class="modern-card">
      <el-table :data="batches" stripe style="width: 100%" size="large" v-loading="loading">
        <el-table-column prop="batchUid" label="批次ID" width="180">
          <template #default="{row}">
            <span style="font-family: monospace;">{{ row.batchUid }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="200"></el-table-column>
        <el-table-column prop="createdAt" label="上传时间" width="180" sortable>
          <template #default="{row}">
             {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="数据量" width="120" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assigneeName" label="当前处理人" width="150">
          <template #default="scope">
            <div v-if="scope.row.assigneeName" style="display: flex; align-items: center; gap: 5px;">
              <el-avatar :size="20" style="background: #409EFF">{{ scope.row.assigneeName.substring(0,1).toUpperCase() }}</el-avatar>
              {{ scope.row.assigneeName }}
            </div>
            <span v-else style="color: #ccc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'PENDING'" type="primary" link @click="openDistributeDialog(scope.row)">分发</el-button>
            <el-button v-else-if="scope.row.status === 'ASSIGNED'" type="warning" link @click="openDistributeDialog(scope.row)">修改分发</el-button>
            <el-button v-else type="info" link disabled>已完成</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="distributeDialogVisible" title="分发任务" width="400px" destroy-on-close>
      <p>正在分发批次：<strong>{{ currentDistributeBatch?.fileName }}</strong></p>
      <el-form label-position="top">
        <el-form-item label="选择校验人员">
          <el-select v-model="selectedUser" placeholder="请选择用户" style="width: 100%">
            <el-option 
              v-for="user in userOptions" 
              :key="user.id" 
              :label="user.username + ' (User)'" 
              :value="user.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="distributeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDistribute" :loading="distributeLoading">确认分发</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getBatchList, uploadBatch, distributeBatch, getAssignableUsers, deleteBatch } from '../../api/batch'
import { ElMessageBox } from 'element-plus'

const batches = ref([])
const loading = ref(false)
const userOptions = ref([])

const distributeDialogVisible = ref(false)
const currentDistributeBatch = ref(null)
const selectedUser = ref('')
const distributeLoading = ref(false)

const getStatusType = (s) => ({ PENDING: 'warning', ASSIGNED: 'primary', COMPLETED: 'success' }[s])
const getStatusText = (s) => ({ PENDING: '待分发', ASSIGNED: '校验中', COMPLETED: '已完成' }[s])

const fetchData = async () => {
  loading.value = true
  try {
    const data = await getBatchList()
    batches.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const data = await getAssignableUsers()
    userOptions.value = data
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})

const handleFileChange = async (file) => {
    // 验证文件类型
    if (!file.raw.name.endsWith('.json')) {
        ElMessage.error('只支持JSON文件')
        return
    }
    
    try {
        const result = await uploadBatch(file.raw)
        ElMessage.success(`文件 ${file.raw.name} 上传成功！批次号：${result.batch_uid}，共 ${result.total_count} 个问题`)
        fetchData()
    } catch (e) {
        // handled by interceptor
    }
}

const openDistributeDialog = (row) => {
    currentDistributeBatch.value = row
    selectedUser.value = row.assigneeId || ''
    // Lazy load users if empty
    if (userOptions.value.length === 0) {
        fetchUsers()
    }
    distributeDialogVisible.value = true
}

const confirmDistribute = async () => {
    if(!selectedUser.value) return ElMessage.warning('请选择')
    
    distributeLoading.value = true
    try {
        await distributeBatch(currentDistributeBatch.value.id, selectedUser.value)
        distributeDialogVisible.value = false
        ElMessage.success('分发成功')
        fetchData()
    } catch(e) {
        // err
    } finally {
        distributeLoading.value = false
    }
}

const handleDelete = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除批次 "${row.fileName}" (${row.batchUid}) 吗？此操作将同时删除该批次下的所有聚类组和问题数据，且无法恢复！`,
            '确认删除',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning',
                dangerouslyUseHTMLString: false
            }
        )
        
        // 用户确认删除
        loading.value = true
        try {
            await deleteBatch(row.id)
            ElMessage.success('删除成功')
            fetchData()
        } catch(e) {
            // error handled by interceptor
        } finally {
            loading.value = false
        }
    } catch(e) {
        // 用户取消删除，不做任何操作
    }
}
</script>

<style scoped>
.modern-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #ebeef5; }
</style>
