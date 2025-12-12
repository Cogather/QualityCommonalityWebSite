<template>
  <div v-loading="loading">
    <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <el-button @click="$router.push('/user/my-tasks')" link><el-icon><Back /></el-icon>&nbsp;返回任务列表</el-button>
        <el-divider direction="vertical"></el-divider>
        <span style="font-weight: bold;">{{ fileName }}</span>
        <span style="color: #909399; font-size: 13px;">(Batch: {{ batchUid }})</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <el-select v-model="filterCategoryLarge" placeholder="筛选大类" clearable style="width: 150px">
          <el-option v-for="cat in categoryLargeList" :key="cat" :label="cat" :value="cat"></el-option>
        </el-select>
        <el-select v-model="filterCategorySub" placeholder="筛选子类" clearable style="width: 150px">
          <el-option v-for="cat in categorySubList" :key="cat" :label="cat" :value="cat"></el-option>
        </el-select>
        <el-button-group>
          <el-button :type="filterStatus==='all'?'primary':''" plain @click="filterStatus='all'">全部</el-button>
          <el-button :type="filterStatus==='pending'?'primary':''" plain @click="filterStatus='pending'">待办</el-button>
        </el-button-group>
      </div>
    </div>
    
    <!-- 统一表格展示 -->
    <el-table :data="tableData" style="width: 100%" border :span-method="objectSpanMethod">
      <!-- 1. SPDT -->
      <el-table-column label="SPDT" width="100" align="center">
        <template #default="{row}">
          <span v-if="row.isFirstRow">{{ row.spdt || '分组' }}</span>
        </template>
      </el-table-column>

      <!-- 2. IPMT -->
      <el-table-column label="IPMT" width="100" align="center">
        <template #default="{row}">
          <span v-if="row.isFirstRow">{{ row.ipmt || 'XX' }}</span>
        </template>
      </el-table-column>

      <!-- 3. 聚类类别 -->
      <el-table-column label="聚类类别" width="200">
        <template #header>
          <span>聚类类别</span>
          <el-tooltip content="AI给出的聚类类别" placement="top">
            <el-icon style="margin-left: 4px; color: #909399; cursor: help;"><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
        <template #default="{row}">
          <div v-if="row.isFirstRow" style="display: flex; flex-wrap: wrap; gap: 4px;">
            <el-tag v-for="(cat, idx) in row.clusterCategories" :key="idx" type="info" effect="plain" size="small">
              {{ cat }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 4. 聚类总结 -->
      <el-table-column label="聚类总结" min-width="300">
        <template #header>
          <span>聚类总结</span>
          <el-tooltip content="AI给出的聚类总结" placement="top">
            <el-icon style="margin-left: 4px; color: #909399; cursor: help;"><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
        <template #default="{row}">
          <div v-if="row.isFirstRow" style="white-space: normal; word-break: break-word; line-height: 1.4;">
            {{ row.clusterSummary }}
          </div>
        </template>
      </el-table-column>

      <!-- 5. 问题数 -->
      <el-table-column label="问题数" width="80" align="center">
        <template #default="{row}">
          <span v-if="row.isFirstRow">{{ row.problemCount }}</span>
        </template>
      </el-table-column>

      <!-- 6. 用户矫正类别 -->
      <el-table-column label="用户矫正类别" width="220">
        <template #default="{row}">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 8px;">
              <el-button 
                :type="row.status === 'VERIFIED' ? 'success' : ''" 
                :plain="row.status !== 'VERIFIED'"
                size="small" 
                @click="row.status === 'PENDING' ? handleVerify(row) : null">
                <el-icon v-if="row.status === 'VERIFIED'"><Check /></el-icon>
                AI准确
              </el-button>
              <el-button 
                :type="row.status === 'CORRECTED' ? 'warning' : 'primary'" 
                :plain="row.status !== 'CORRECTED'"
                size="small" 
                @click="openCorrection(row, row.cluster)">
                <el-icon v-if="row.status === 'CORRECTED'"><Edit /></el-icon>
                我要纠错
              </el-button>
            </div>
            <div v-if="row.status === 'VERIFIED'" style="padding: 6px 8px; background: #f0f9ff; border: 1px solid #67C23A; border-radius: 4px; font-size: 12px; color: #67C23A; display: flex; align-items: center; gap: 4px;">
              <el-icon><Check /></el-icon> 已确认为正样本
            </div>
            <el-input 
              v-else-if="row.status === 'CORRECTED'"
              v-model="row.correctedCategoryDisplay"
              size="small"
              placeholder="硬件板卡故障"
              style="font-size: 12px;"
              readonly
            />
          </div>
        </template>
      </el-table-column>

      <!-- 7. 矫正说明 -->
      <el-table-column label="矫正说明" width="250">
        <template #default="{row}">
          <el-input 
            v-if="row.status === 'CORRECTED'"
            v-model="row.reason"
            type="textarea"
            :rows="2"
            placeholder="日志显示物理层报错,并非参数配置问题。"
            size="small"
            @blur="saveReason(row)"
            style="--el-input-border-color: #E6A23C;"
          />
          <span v-else style="color: #909399; font-size: 12px;">无需填写</span>
        </template>
      </el-table-column>

      <!-- 8. PROD_EN_NAME -->
      <el-table-column prop="prodEnName" label="PROD_EN_NAME" min-width="150" show-overflow-tooltip></el-table-column>
      
      <!-- 9. RESOLUTION_DETAIL -->
      <el-table-column prop="resolutionDetail" label="RESOLUTION_DETAIL" min-width="180">
        <template #default="{ row }">
          <div style="white-space: normal; word-break: break-word; line-height: 1.4;">
            {{ row.resolutionDetail || '-' }}
          </div>
        </template>
      </el-table-column>

      <!-- 10. ISSUE_DETAILS -->
      <el-table-column prop="issueDetails" label="ISSUE_DETAILS" min-width="200">
        <template #default="{ row }">
          <div style="white-space: normal; word-break: break-word; line-height: 1.4;">
            {{ row.issueDetails || '-' }}
          </div>
        </template>
      </el-table-column>
      
      <!-- 11. ISSUE_NO -->
      <el-table-column prop="issueNo" label="ISSUE_NO" width="120"></el-table-column>

      <!-- 12. ISSUE_TYPE -->
      <el-table-column label="ISSUE_TYPE" width="120" align="center">
        <template #default="{row}">
          {{ row.issueType || '质量 ITR' }}
        </template>
      </el-table-column>
    </el-table>

    <!-- Correction Dialog -->
    <el-dialog v-model="correctionDialogVisible" title="人工纠错反馈" width="500px">
      <el-form :model="correctionForm" label-position="top">
        <el-form-item label="AI 预测结果">
          <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: #f5f7fa; border-radius: 4px;">
            <el-tag type="info" effect="dark">{{ currentCluster?.categoryLarge }}</el-tag>
            <el-icon><ArrowRight /></el-icon>
            <el-tag type="info" effect="plain">{{ currentCluster?.categorySub }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="真实类别 (您的判断)">
          <div style="display: flex; gap: 10px;">
            <el-input v-model="correctionForm.categoryLarge" placeholder="请输入大类" style="flex: 1"></el-input>
            <el-input v-model="correctionForm.categorySub" placeholder="请输入子类" style="flex: 1"></el-input>
          </div>
        </el-form-item>
        <el-form-item label="纠错原因/备注">
          <el-input type="textarea" v-model="correctionForm.reason" rows="3" placeholder="请简述判断依据，帮助AI更好地学习..."></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: space-between;">
          <el-button type="success" plain @click="revertToVerified">确认AI准确</el-button>
          <div>
            <el-button @click="correctionDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmCorrection" :loading="submitting">提交修正</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Back, ArrowRight, Check, Edit, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getTaskDetails, verifyIssue, correctIssue } from '../../api/task'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const batchId = route.params.id // This is DB internal ID
const fileName = route.query.fileName
const batchUid = route.query.uid

const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id || 1) // 获取当前用户ID

const loading = ref(false)
const submitting = ref(false)
const clusters = ref([]) // 存储聚类组数据

const filterStatus = ref('all')
const filterCategoryLarge = ref('') // 筛选大类（独立筛选）
const filterCategorySub = ref('') // 筛选子类（独立筛选）
const categoryLargeList = ref([]) // 所有可用的大类列表
const categorySubList = ref([]) // 所有可用的子类列表（独立于大类）

const correctionDialogVisible = ref(false)
const currentIssue = ref(null)
const currentCluster = ref(null)
const correctionForm = reactive({ categoryLarge: '', categorySub: '', reason: '' })

// 获取问题的实际类别（直接使用humanCategory字段，所有状态都使用此字段）
const getIssueActualCategory = (issue) => {
    // 直接使用humanCategoryLarge和humanCategorySub字段
    // VERIFIED/PENDING状态：存储AI预测的类别
    // CORRECTED状态：存储人工修正的类别
    return {
        categoryLarge: issue.humanCategoryLarge,
        categorySub: issue.humanCategorySub
    }
}

// 提取所有类别用于筛选（包括AI预测和用户修正的类别）
const extractCategories = () => {
    const categoryLargeSet = new Set()
    const categorySubSet = new Set() // 独立的子类集合
    
    clusters.value.forEach(cluster => {
        // 遍历该聚类组下的所有问题
        cluster.issues.forEach(issue => {
            const actualCategory = getIssueActualCategory(issue)
            const large = actualCategory.categoryLarge
            const sub = actualCategory.categorySub
            
            // 收集大类
            if (large) {
                categoryLargeSet.add(large)
            }
            
            // 收集子类（独立于大类）
            if (sub) {
                categorySubSet.add(sub)
            }
        })
    })
    
    // 转换为数组
    categoryLargeList.value = Array.from(categoryLargeSet).sort()
    categorySubList.value = Array.from(categorySubSet).sort()
}

const fetchData = async () => {
    loading.value = true
    try {
        const data = await getTaskDetails(batchId)
        clusters.value = data || []
        extractCategories()
    } catch (e) {
        console.error(e)
        ElMessage.error('加载任务详情失败')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
})

// 过滤后的聚类组
const filteredClusters = computed(() => {
    return clusters.value.filter(cluster => {
        // 检查该聚类组是否有问题匹配筛选条件
        const hasMatchingIssue = cluster.issues.some(issue => {
            // 获取问题的实际类别（直接使用后端返回的字段）
            const actualCategory = getIssueActualCategory(issue)
            
            // 按大类筛选（独立筛选）
            if (filterCategoryLarge.value && actualCategory.categoryLarge !== filterCategoryLarge.value) {
                return false
            }
            
            // 按子类筛选（独立筛选）
            if (filterCategorySub.value && actualCategory.categorySub !== filterCategorySub.value) {
                return false
            }
            
            // 按状态筛选
            if (filterStatus.value === 'pending' && issue.status !== 'PENDING') {
                return false
            }
            
            return true
        })
        
        // 如果该聚类组没有任何匹配的问题，则不显示该聚类组
        if (!hasMatchingIssue) {
            return false
        }
        
        return true
    }).map(cluster => {
        // 对每个聚类组，只显示匹配筛选条件的问题
        const filteredIssues = cluster.issues.filter(issue => {
            const actualCategory = getIssueActualCategory(issue)
            
            // 按大类筛选（独立筛选）
            if (filterCategoryLarge.value && actualCategory.categoryLarge !== filterCategoryLarge.value) {
                return false
            }
            
            // 按子类筛选（独立筛选）
            if (filterCategorySub.value && actualCategory.categorySub !== filterCategorySub.value) {
                return false
            }
            
            // 按状态筛选
            if (filterStatus.value === 'pending' && issue.status !== 'PENDING') {
                return false
            }
            
            return true
        })
        
        // 返回过滤后的聚类组（包含过滤后的问题列表）
        return {
            ...cluster,
            issues: filteredIssues
        }
    })
})

// 转换为表格数据格式
const tableData = computed(() => {
    const result = []
    
    filteredClusters.value.forEach(cluster => {
        // 构建聚类类别数组（大类+子类）
        const clusterCategories = []
        if (cluster.categoryLarge) clusterCategories.push(cluster.categoryLarge)
        if (cluster.categorySub) clusterCategories.push(cluster.categorySub)
        
        // 为每个问题创建一行数据
        cluster.issues.forEach((issue, index) => {
            const row = {
                ...issue,
                cluster: cluster,
                isFirstRow: index === 0, // 标记是否为聚类组的第一行
                clusterId: cluster.clusterId, // 用于行合并
                rowspan: index === 0 ? cluster.issues.length : 0, // 第一行的rowspan值
                spdt: '分组',
                ipmt: 'XX',
                clusterCategories: clusterCategories,
                clusterSummary: cluster.summary || '',
                problemCount: cluster.problemCount || 0,
                issueType: '质量 ITR',
                correctedCategoryDisplay: issue.status === 'CORRECTED' 
                    ? `${issue.humanCategoryLarge || ''}${issue.humanCategorySub ? ' > ' + issue.humanCategorySub : ''}`.trim()
                    : ''
            }
            result.push(row)
        })
    })
    
    return result
})

// 行合并方法
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }) => {
    // 需要合并的列索引：SPDT(0), IPMT(1), 聚类类别(2), 聚类总结(3), 问题数(4)
    const mergeColumns = [0, 1, 2, 3, 4]
    
    if (mergeColumns.includes(columnIndex)) {
        if (row.isFirstRow) {
            return {
                rowspan: row.rowspan,
                colspan: 1
            }
        } else {
            return {
                rowspan: 0,
                colspan: 0
            }
        }
    }
    return {
        rowspan: 1,
        colspan: 1
    }
}

const handleVerify = async (row) => {
    try {
        await verifyIssue(row.id, userId.value)
        
        // 更新本地数据
        const cluster = clusters.value.find(c => c.issues.some(i => i.id === row.id))
        if (cluster) {
            const issueInCluster = cluster.issues.find(i => i.id === row.id)
            if (issueInCluster) {
                issueInCluster.status = 'VERIFIED'
                // VERIFIED状态：humanCategory字段存储AI预测的类别（后端已更新）
                // 需要从cluster获取AI预测的类别更新到本地
                issueInCluster.humanCategoryLarge = cluster.categoryLarge
                issueInCluster.humanCategorySub = cluster.categorySub
                issueInCluster.reason = null
            }
        }
        // 重新提取类别列表（因为类别可能发生变化）
        extractCategories()
        ElMessage.success('已标记为准确')
    } catch (e) {
        console.error(e)
        ElMessage.error('操作失败')
    }
}

// 保存矫正说明
const saveReason = async (row) => {
    if (row.status !== 'CORRECTED') return
    
    try {
        // 如果类别信息已存在，直接更新reason
        if (row.humanCategoryLarge && row.humanCategorySub) {
            await correctIssue(row.id, {
                categoryLarge: row.humanCategoryLarge,
                categorySub: row.humanCategorySub,
                reason: row.reason || ''
            }, userId.value)
            
            // 更新本地数据
            const cluster = clusters.value.find(c => c.issues.some(i => i.id === row.id))
            if (cluster) {
                const issueInCluster = cluster.issues.find(i => i.id === row.id)
                if (issueInCluster) {
                    issueInCluster.reason = row.reason || ''
                }
            }
        }
    } catch (e) {
        console.error(e)
        ElMessage.error('保存失败')
    }
}

const openCorrection = (row, cluster) => {
    currentIssue.value = row
    currentCluster.value = cluster || row.cluster

    if (row.status === 'CORRECTED') {
        correctionForm.categoryLarge = row.humanCategoryLarge || ''
        correctionForm.categorySub = row.humanCategorySub || ''
        correctionForm.reason = row.reason || ''
    } else {
        correctionForm.categoryLarge = currentCluster.value.categoryLarge
        correctionForm.categorySub = currentCluster.value.categorySub
        correctionForm.reason = ''
    }
    correctionDialogVisible.value = true
}

const confirmCorrection = async () => {
    if(!correctionForm.categoryLarge || !correctionForm.categorySub) {
        return ElMessage.warning('请完整填写分类信息')
    }
    
    submitting.value = true
    try {
        await correctIssue(currentIssue.value.id, {
            categoryLarge: correctionForm.categoryLarge,
            categorySub: correctionForm.categorySub,
            reason: correctionForm.reason || ''
        }, userId.value)
        
        // 更新本地数据
        const cluster = clusters.value.find(c => c.issues.some(i => i.id === currentIssue.value.id))
        if (cluster) {
            const issue = cluster.issues.find(i => i.id === currentIssue.value.id)
            if (issue) {
                issue.status = 'CORRECTED'
                issue.humanCategoryLarge = correctionForm.categoryLarge
                issue.humanCategorySub = correctionForm.categorySub
                issue.reason = correctionForm.reason || ''
            }
        }
        
        // 重新提取类别列表（因为新增了用户修正的类别）
        extractCategories()
        
        correctionDialogVisible.value = false
        ElMessage.success('已提交纠错')
    } catch (e) {
        console.error(e)
        ElMessage.error('提交失败')
    } finally {
        submitting.value = false
    }
}

const revertToVerified = async () => {
    submitting.value = true
    try {
        await verifyIssue(currentIssue.value.id, userId.value)
        
        // 更新本地数据
        const cluster = clusters.value.find(c => c.issues.some(i => i.id === currentIssue.value.id))
        if (cluster) {
            const issue = cluster.issues.find(i => i.id === currentIssue.value.id)
            if (issue) {
                issue.status = 'VERIFIED'
                // VERIFIED状态：humanCategory字段存储AI预测的类别（后端已更新）
                // 需要从cluster获取AI预测的类别更新到本地
                issue.humanCategoryLarge = cluster.categoryLarge
                issue.humanCategorySub = cluster.categorySub
                issue.reason = null
            }
        }
        
        // 重新提取类别列表（因为类别可能发生变化）
        extractCategories()
        
        correctionDialogVisible.value = false
        ElMessage.success('已更正为准确')
    } catch (e) {
        console.error(e)
        ElMessage.error('操作失败')
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>
.modern-card { 
  background: #fff; 
  border-radius: 12px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
  border: 1px solid #ebeef5; 
  overflow: hidden;
}

.cluster-group {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
