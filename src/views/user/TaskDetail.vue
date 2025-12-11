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
    
    <!-- 按聚类组展示 -->
    <div v-for="cluster in filteredClusters" :key="cluster.clusterId" class="cluster-group" style="margin-bottom: 24px;">
      <div class="modern-card">
        <!-- 聚类组头部 -->
        <div style="padding: 16px; background: #f5f7fa; border-radius: 8px 8px 0 0; border-bottom: 2px solid #e4e7ed; display: flex; align-items: center; gap: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-tag type="info" effect="dark" size="small">{{ cluster.categoryLarge }}</el-tag>
              <el-icon style="color: #909399;"><ArrowRight /></el-icon>
              <el-tag type="info" effect="plain" size="small">{{ cluster.categorySub }}</el-tag>
            </div>
            <span style="color: #666; font-size: 12px; margin-top: 4px;">{{ cluster.summary }}</span>
          </div>
          <el-badge :value="cluster.problemCount" type="info" />
        </div>
        
        <!-- 问题列表 -->
        <el-table :data="cluster.issues" style="width: 100%" border>

          <!-- 1. 用户矫正类别 (User Correction Category) -->
          <el-table-column label="用户矫正类别" width="220">
            <template #default="{row}">
              <div v-if="row.status === 'PENDING'" style="display: flex; gap: 8px;">
                <el-button type="success" size="small" plain @click="handleVerify(row)">准确</el-button>
                <el-button type="primary" size="small" plain @click="openCorrection(row, cluster)">纠错</el-button>
              </div>
              <div v-else-if="row.status === 'VERIFIED'" style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #67C23A; font-size: 12px; display: flex; flex-direction: column; gap: 2px;">
                  <div style="display: flex; align-items: center; gap: 4px;"><el-icon><Check /></el-icon> AI准确</div>
                  <span style="color: #999; font-size: 11px;">{{ row.humanCategoryLarge }} > {{ row.humanCategorySub }}</span>
                </span>
                <el-button type="primary" link size="small" @click="openCorrection(row, cluster)">修改</el-button>
              </div>
              <div v-else-if="row.status === 'CORRECTED'" style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; color: #E6A23C; display: flex; flex-direction: column; gap: 2px;">
                  <div style="display: flex; align-items: center; gap: 4px;"><el-icon><Edit /></el-icon> 人工修正</div>
                  <span style="font-weight: 500;">{{ row.humanCategoryLarge }} > {{ row.humanCategorySub }}</span>
                </span>
                <el-button type="primary" link size="small" @click="openCorrection(row, cluster)">修改</el-button>
              </div>
            </template>
          </el-table-column>

          <!-- 2. 矫正说明 (Correction Note) -->
          <el-table-column label="矫正说明" width="150" show-overflow-tooltip>
            <template #default="{row}">
              {{ row.reason || '-' }}
            </template>
          </el-table-column>

          <!-- 3. PROD_EN_NAME -->
          <el-table-column prop="prodEnName" label="PROD_EN_NAME" min-width="180" show-overflow-tooltip></el-table-column>
          
          <!-- 4. RESOLUTION_DETAIL -->
          <el-table-column prop="resolutionDetail" label="RESOLUTION_DETAIL" min-width="150" show-overflow-tooltip></el-table-column>

          <!-- 5. ISSUE_DETAILS -->
          <el-table-column prop="issueDetails" label="ISSUE_DETAILS" min-width="250" show-overflow-tooltip></el-table-column>
          
          <!-- 6. ISSUE_NO -->
          <el-table-column prop="issueNo" label="ISSUE_NO" width="100"></el-table-column>
        </el-table>
      </div>
    </div>

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
import { Back, ArrowRight, Check, Edit } from '@element-plus/icons-vue'
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

const handleVerify = async (issue) => {
    try {
        await verifyIssue(issue.id, userId.value)
        
        // 更新本地数据
        const cluster = clusters.value.find(c => c.issues.some(i => i.id === issue.id))
        if (cluster) {
            const issueInCluster = cluster.issues.find(i => i.id === issue.id)
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

const openCorrection = (issue, cluster) => {
    currentIssue.value = issue
    currentCluster.value = cluster

    if (issue.status === 'CORRECTED') {
        correctionForm.categoryLarge = issue.humanCategoryLarge || ''
        correctionForm.categorySub = issue.humanCategorySub || ''
        correctionForm.reason = issue.reason || ''
    } else {
        correctionForm.categoryLarge = cluster.categoryLarge
        correctionForm.categorySub = cluster.categorySub
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
            reason: correctionForm.reason
        }, userId.value)
        
        // 更新本地数据
        const cluster = clusters.value.find(c => c.issues.some(i => i.id === currentIssue.value.id))
        if (cluster) {
            const issue = cluster.issues.find(i => i.id === currentIssue.value.id)
            if (issue) {
                issue.status = 'CORRECTED'
                issue.humanCategoryLarge = correctionForm.categoryLarge
                issue.humanCategorySub = correctionForm.categorySub
                issue.reason = correctionForm.reason
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
