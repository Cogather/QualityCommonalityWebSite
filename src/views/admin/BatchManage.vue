<template>
  <div>
    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">批次分发管理</h2>
      <el-upload action="#" :show-file-list="false" :auto-upload="false" :on-change="handleFileChange">
        <el-button type="primary" :icon="Upload">上传新批次 (JSON)</el-button>
      </el-upload>
    </div>
    <div class="modern-card">
      <el-table :data="batches" stripe style="width: 100%" size="large">
        <el-table-column prop="batchId" label="批次ID" width="180">
          <template #default="{row}">
            <span style="font-family: monospace;">{{ row.batchId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="200"></el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180" sortable></el-table-column>
        <el-table-column prop="totalCount" label="数据量" width="120" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="当前处理人" width="150">
          <template #default="scope">
            <div v-if="scope.row.assignee" style="display: flex; align-items: center; gap: 5px;">
              <el-avatar :size="20" style="background: #409EFF">{{ scope.row.assignee.substring(0,1) }}</el-avatar>
              {{ scope.row.assignee }}
            </div>
            <span v-else style="color: #ccc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'pending'" type="primary" link @click="openDistributeDialog(scope.row)">分发</el-button>
            <el-button v-else-if="scope.row.status === 'assigned'" type="warning" link @click="openDistributeDialog(scope.row)">修改分发</el-button>
            <el-button v-else type="info" link disabled>已完成</el-button>
            <el-button type="danger" link>删除</el-button>
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
            <el-option label="张三 (User001)" value="User001"></el-option>
            <el-option label="李四 (User002)" value="User002"></el-option>
            <el-option label="王五 (User003)" value="User003"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="distributeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDistribute">确认分发</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const batches = ref([
    { batchId: 'B-231001-001', uploadTime: '2023-10-01 10:00', fileName: 'issue_logs_q3_01.json', totalCount: 100, status: 'completed', assignee: 'User001' },
    { batchId: 'B-231002-002', uploadTime: '2023-10-02 14:30', fileName: 'issue_logs_q3_02.json', totalCount: 150, status: 'assigned', assignee: 'User001' },
    { batchId: 'B-231003-003', uploadTime: '2023-10-03 09:15', fileName: 'urgent_issues_v2.json', totalCount: 50, status: 'pending', assignee: null },
])

const distributeDialogVisible = ref(false)
const currentDistributeBatch = ref(null)
const selectedUser = ref('')

const getStatusType = (s) => ({ pending: 'warning', assigned: 'primary', completed: 'success' }[s])
const getStatusText = (s) => ({ pending: '待分发', assigned: '校验中', completed: '已完成' }[s])

const handleFileChange = (file) => {
    ElMessage.success(`文件 ${file.name} 已添加到列表`)
    batches.value.unshift({
        batchId: `B-23100${batches.value.length+4}`, 
        uploadTime: new Date().toLocaleString(),
        fileName: file.name, 
        totalCount: Math.floor(Math.random()*100)+50, 
        status: 'pending', 
        assignee: null
    })
}

const openDistributeDialog = (row) => {
    currentDistributeBatch.value = row
    // If assigned, pre-fill
    selectedUser.value = row.assignee || ''
    distributeDialogVisible.value = true
}

const confirmDistribute = () => {
    if(!selectedUser.value) return ElMessage.warning('请选择')
    
    // Update status
    currentDistributeBatch.value.status = 'assigned'
    currentDistributeBatch.value.assignee = selectedUser.value
    
    distributeDialogVisible.value = false
    ElMessage.success(currentDistributeBatch.value.status === 'assigned' ? '分发信息已更新' : '已分发')
}
</script>

<style scoped>
.modern-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #ebeef5; }
</style>

