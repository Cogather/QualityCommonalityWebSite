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
        <el-select v-model="filterCategory" placeholder="筛选聚类类别" clearable style="width: 150px">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat"></el-option>
        </el-select>
        <el-button-group>
          <el-button :type="filterStatus==='all'?'primary':''" plain @click="filterStatus='all'">全部</el-button>
          <el-button :type="filterStatus==='pending'?'primary':''" plain @click="filterStatus='pending'">待办</el-button>
        </el-button-group>
      </div>
    </div>
    
    <div class="modern-card">
      <el-table :data="tableData" style="width: 100%" :span-method="objectSpanMethod" border>
        <!-- Group Columns (Merged) -->
        <el-table-column prop="spdt" label="SPDT" width="100" align="center"></el-table-column>
        <el-table-column prop="ipmt" label="IPMT" width="100" align="center"></el-table-column>
        <el-table-column label="聚类类别" width="140" align="center">
          <template #default="{row}">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <el-tag type="info" effect="dark" size="small">{{ row.aiCategoryLarge }}</el-tag>
              <el-icon style="transform: rotate(90deg); color: #909399; font-size: 12px;"><ArrowRight /></el-icon>
              <el-tag type="info" effect="plain" size="small">{{ row.aiCategorySub }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="聚类总结" width="200" show-overflow-tooltip>
          <template #default="{row}">
            <span style="color: #666; font-size: 12px;">{{ row.summary }}</span>
          </template>
        </el-table-column>
        <el-table-column label="问题数" width="80" align="center">
          <template #default="{row}">
            <el-badge :value="row.groupSize" type="info" />
          </template>
        </el-table-column>

        <!-- Requested Column Order -->
        <!-- 1. 用户矫正类别 (User Correction Category) -->
        <el-table-column label="用户矫正类别" width="220">
          <template #default="{row}">
            <div v-if="row.status === 'PENDING'" style="display: flex; gap: 8px;">
              <el-button type="success" size="small" plain @click="handleVerify(row)">准确</el-button>
              <el-button type="primary" size="small" plain @click="openCorrection(row)">纠错</el-button>
            </div>
            <div v-else-if="row.status === 'VERIFIED'" style="display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #67C23A; font-size: 12px; display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; gap: 4px;"><el-icon><Check /></el-icon> AI准确</div>
                <span style="color: #999; font-size: 11px;">{{ row.aiCategoryLarge }} > {{ row.aiCategorySub }}</span>
              </span>
              <el-button type="primary" link size="small" @click="openCorrection(row)">修改</el-button>
            </div>
            <div v-else-if="row.status === 'CORRECTED'" style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 12px; color: #E6A23C; display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; gap: 4px;"><el-icon><Edit /></el-icon> 人工修正</div>
                <span style="font-weight: 500;">{{ row.humanCategoryLarge }} > {{ row.humanCategorySub }}</span>
              </span>
              <el-button type="primary" link size="small" @click="openCorrection(row)">修改</el-button>
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
        <el-table-column prop="title" label="PROD_EN_NAME" min-width="180" show-overflow-tooltip></el-table-column>
        
        <!-- 4. RESOLUTION_DETAIL -->
        <el-table-column prop="resolution" label="RESOLUTION_DETAIL" min-width="150" show-overflow-tooltip></el-table-column>

        <!-- 5. ISSUE_DETAILS -->
        <el-table-column prop="description" label="ISSUE_DETAILS" min-width="250" show-overflow-tooltip></el-table-column>
        
        <!-- 6. ISSUE_NO -->
        <el-table-column prop="id" label="ISSUE_NO" width="100"></el-table-column>
        
        <!-- 7. ISSUE_TYPE -->
        <el-table-column prop="issueType" label="ISSUE_TYPE" width="120"></el-table-column>
      </el-table>
    </div>

    <!-- Correction Dialog -->
    <el-dialog v-model="correctionDialogVisible" title="人工纠错反馈" width="500px">
      <el-form :model="correctionForm" label-position="top">
        <el-form-item label="AI 预测结果">
          <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: #f5f7fa; border-radius: 4px;">
            <el-tag type="info" effect="dark">{{ currentIssue?.aiCategoryLarge }}</el-tag>
            <el-icon><ArrowRight /></el-icon>
            <el-tag type="info" effect="plain">{{ currentIssue?.aiCategorySub }}</el-tag>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Back, ArrowRight, Check, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getTaskDetails, verifyIssue, correctIssue } from '../../api/task'

const route = useRoute()
const batchId = route.params.id // This is DB internal ID
const fileName = route.query.fileName
const batchUid = route.query.uid

const loading = ref(false)
const submitting = ref(false)
const rawItems = ref([])

const filterStatus = ref('all')
const filterCategory = ref('')
const categories = ['网络问题', '硬件问题', '软件问题', '安全问题', '其他']

const correctionDialogVisible = ref(false)
const currentIssue = ref(null)
const correctionForm = reactive({ categoryLarge: '', categorySub: '', reason: '' })

const fetchData = async () => {
    loading.value = true
    try {
        const data = await getTaskDetails(batchId)
        rawItems.value = data
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
})

const filteredItems = computed(() => {
    return rawItems.value.filter(item => {
        if (filterCategory.value && item.aiCategoryLarge !== filterCategory.value) return false;
        if (filterStatus.value === 'pending' && item.status !== 'PENDING') return false;
        return true;
    });
});

const getSummary = (large, sub) => {
    // Basic mock summary logic, in real world might come from AI or backend
    if (large === '网络问题') return '网络连接超时，日志显示多次握手失败...';
    if (large === '硬件问题') return '检测到物理设备响应异常，可能是磁盘损坏或内存溢出...';
    if (large === '软件问题') return '空指针异常或未捕获的运行时错误，需开发介入...';
    if (large === '安全问题') return '用户尝试访问受限资源，认证失败...';
    return '异常信号终止，无详细堆栈信息...';
};

const tableData = computed(() => {
    const groups = {};
    filteredItems.value.forEach(item => {
        const key = `${item.spdt}|${item.ipmt}|${item.aiCategoryLarge}|${item.aiCategorySub}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    const result = [];
    Object.keys(groups).forEach(key => {
        const items = groups[key];
        items.forEach((item, index) => {
            const row = { 
                ...item,
                summary: getSummary(item.aiCategoryLarge, item.aiCategorySub),
                groupSize: items.length
            };
            if (index === 0) {
                row.rowSpan = items.length;
            } else {
                row.rowSpan = 0;
            }
            result.push(row);
        });
    });
    return result;
});

const objectSpanMethod = ({ row, column, rowIndex, columnIndex }) => {
    if (columnIndex < 5) {
        if (row.rowSpan > 0) {
            return { rowspan: row.rowSpan, colspan: 1 };
        } else {
            return { rowspan: 0, colspan: 0 };
        }
    }
};

const handleVerify = async (item) => {
    try {
        await verifyIssue(item.id)
        
        // Optimistic update
        const origin = rawItems.value.find(i => i.id === item.id)
        if (origin) {
            origin.status = 'VERIFIED'
            origin.humanCategoryLarge = null
            origin.humanCategorySub = null
            origin.reason = null
        }
        ElMessage.success('已标记为准确')
    } catch (e) {
        console.error(e)
    }
};

const openCorrection = (item) => {
    const origin = rawItems.value.find(i => i.id === item.id);
    currentIssue.value = origin;

    if (origin.status === 'CORRECTED') {
        correctionForm.categoryLarge = origin.humanCategoryLarge;
        correctionForm.categorySub = origin.humanCategorySub;
        correctionForm.reason = origin.reason;
    } else {
        correctionForm.categoryLarge = origin.aiCategoryLarge;
        correctionForm.categorySub = origin.aiCategorySub;
        correctionForm.reason = '';
    }
    correctionDialogVisible.value = true;
};

const confirmCorrection = async () => {
    if(!correctionForm.categoryLarge || !correctionForm.categorySub) return ElMessage.warning('请完整填写分类信息');
    
    submitting.value = true
    try {
        await correctIssue(currentIssue.value.id, {
            categoryLarge: correctionForm.categoryLarge,
            categorySub: correctionForm.categorySub,
            reason: correctionForm.reason
        })
        
        // Update local
        currentIssue.value.status = 'CORRECTED';
        currentIssue.value.humanCategoryLarge = correctionForm.categoryLarge;
        currentIssue.value.humanCategorySub = correctionForm.categorySub;
        currentIssue.value.reason = correctionForm.reason;
        
        correctionDialogVisible.value = false;
        ElMessage.success('已提交纠错');
    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
};

const revertToVerified = async () => {
    submitting.value = true
    try {
        await verifyIssue(currentIssue.value.id)
        
        currentIssue.value.status = 'VERIFIED';
        currentIssue.value.humanCategoryLarge = null;
        currentIssue.value.humanCategorySub = null;
        currentIssue.value.reason = null;
        
        correctionDialogVisible.value = false;
        ElMessage.success('已更正为准确');
    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
};
</script>

<style scoped>
.modern-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #ebeef5; }
</style>
