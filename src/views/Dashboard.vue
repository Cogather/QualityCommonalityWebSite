<template>
  <div class="dashboard-container">
    <!-- ADMIN DASHBOARD -->
    <div v-if="currentRole === 'admin'" key="admin-dash">
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-weight: 600;">欢迎回来，管理员</h2>
        <p style="color: #909399; margin: 8px 0 0 0; font-size: 14px;">以下是今日的AI模型表现及人工校验进度概览。</p>
      </div>

      <!-- Top Stats -->
      <div class="dashboard-grid">
        <div class="modern-card">
          <div class="stat-item">
            <span class="stat-label">AI预测总数 (条)</span>
            <span class="stat-num">{{ formatNumber(stats.totalPredictions) }}</span>
            <span class="stat-trend trend-up"><el-icon><Top /></el-icon> 较昨日 +12%</span>
          </div>
        </div>
        <div class="modern-card">
          <div class="stat-item">
            <span class="stat-label">模型准确率 (Accuracy)</span>
            <span class="stat-num">{{ stats.accuracy }}%</span>
            <span class="stat-trend trend-up"><el-icon><Top /></el-icon> 较上周 +1.2%</span>
          </div>
        </div>
        <div class="modern-card">
          <div class="stat-item">
            <span class="stat-label">待分发任务 (批次)</span>
            <span class="stat-num" style="color: #E6A23C">{{ stats.pendingBatches }}</span>
            <span class="stat-trend trend-down" style="color: #909399;">正常积压</span>
          </div>
        </div>
        <div class="modern-card">
          <div class="stat-item">
            <span class="stat-label">人工校验完成率</span>
            <span class="stat-num">{{ stats.correctionProgress }}%</span>
            <el-progress :percentage="stats.correctionProgress" :show-text="false" stroke-width="6" style="margin-top: 10px;"></el-progress>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="chart-row">
        <div class="modern-card">
          <div class="card-header">
            <span class="card-title">Top 5 预测错误类别</span>
          </div>
          <div ref="chartTopErrorRef" style="height: 300px; width: 100%;"></div>
        </div>
        <div class="modern-card">
          <div class="card-header">
            <span class="card-title">问题分类词云分布</span>
          </div>
          <div ref="chartWordcloudRef" style="height: 300px; width: 100%;"></div>
        </div>
      </div>
    </div>

    <!-- USER DASHBOARD -->
    <div v-else-if="currentRole === 'user'" key="user-dash">
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-weight: 600;">工作台</h2>
        <p style="color: #909399; margin: 8px 0 0 0; font-size: 14px;">你好 {{ user?.username || 'User' }}，准备好开始今天的校验工作了吗？</p>
      </div>

      <div class="dashboard-grid" style="grid-template-columns: 1fr;">
        <div class="modern-card">
          <div class="stat-item">
            <span class="stat-label">我的待办任务</span>
            <span class="stat-num" style="color: #409EFF">{{ myTasks.reduce((acc, t) => acc + (t.totalCount - t.processedCount), 0) }}</span>
            <span class="stat-trend">涉及 {{ myTasks.length }} 个批次</span>
          </div>
        </div>
      </div>
      
      <div class="modern-card" style="margin-top: 20px;">
        <div class="card-header">
          <span class="card-title">快捷入口：最近的任务</span>
          <el-button type="primary" link @click="$router.push('/user/my-tasks')">查看全部 <el-icon><ArrowRight /></el-icon></el-button>
        </div>
        <el-table :data="myTasks.slice(0, 3)" style="width: 100%">
          <el-table-column prop="fileName" label="批次文件"></el-table-column>
          <el-table-column label="进度" width="300">
            <template #default="scope">
              <div style="display: flex; align-items: center; gap: 10px;">
                <el-progress :percentage="Math.round((scope.row.processedCount/scope.row.totalCount)*100)" style="flex: 1"></el-progress>
                <span style="font-size: 12px; color: #909399;">{{scope.row.processedCount}}/{{scope.row.totalCount}}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column align="right">
            <template #default="scope">
              <el-button size="small" type="primary" plain round @click="enterTask(scope.row)">继续校验</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { Top, ArrowRight } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
// Note: echarts-wordcloud might need to be imported if used, or handled if script tag was used in prototype.
// Since npm install failed, I'll assume they are not available or I need to mock them/skip them.
// For now, I'll add the import but comment it out if it fails, or handle graceful degradation.
// import 'echarts-wordcloud'; 

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)
const currentRole = computed(() => user.value?.role || 'user')

// Refs for charts
const chartTopErrorRef = ref(null)
const chartWordcloudRef = ref(null)
let chartInstanceTopError = null
let chartInstanceWordcloud = null

// Mock Data
const stats = reactive({
  totalPredictions: 12580,
  pendingBatches: 2,
  accuracy: 86.5,
  correctionProgress: 68
})

const myTasks = ref([
    {
        batchId: 'B-231002-002',
        fileName: 'issue_logs_q3_02.json',
        uploadTime: '2023-10-02',
        totalCount: 12,
        processedCount: 2
    },
    {
        batchId: 'B-231001-001',
        fileName: 'issue_logs_q3_01.json',
        uploadTime: '2023-10-01',
        totalCount: 100,
        processedCount: 100
    }
])

const formatNumber = (num) => num.toLocaleString()

const enterTask = (task) => {
  // Push to task detail view with batchId
  router.push({ name: 'TaskDetail', params: { id: task.batchId }, query: { fileName: task.fileName } })
}

const initAdminCharts = () => {
    if (chartTopErrorRef.value) {
        chartInstanceTopError = echarts.init(chartTopErrorRef.value);
        chartInstanceTopError.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: ['网络配置', '软件Bug', '硬件故障', '数据异常', '权限'].reverse() },
            series: [{ type: 'bar', data: [320, 250, 180, 120, 80].reverse(), itemStyle: { color: '#F56C6C', borderRadius: [0,4,4,0] }, barWidth: '60%' }]
        });
    }

    if (chartWordcloudRef.value) {
        // Fallback to pie chart if wordcloud is not available or just use pie as in prototype backup?
        // Prototype used echarts-wordcloud but had a pie chart config as fallback in code (Wait, the prototype code shows a PIE chart config for 'chart-wordcloud' element ID! line 655 type: 'pie').
        // So I will use Pie chart as per the prototype code provided.
        chartInstanceWordcloud = echarts.init(chartWordcloudRef.value);
        chartInstanceWordcloud.setOption({
                tooltip: { trigger: 'item' },
                legend: { bottom: 0, left: 'center' },
                series: [{
                    type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
                    label: { show: false },
                    data: [
                        { value: 1048, name: '网络' }, { value: 735, name: '数据库' },
                        { value: 580, name: '权限' }, { value: 484, name: 'IO错误' },
                        { value: 300, name: '其他' }
                    ]
                }]
        });
    }
}

onMounted(() => {
    nextTick(() => {
        if (currentRole.value === 'admin') {
            initAdminCharts();
        }
    });
    window.addEventListener('resize', handleResize);
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (chartInstanceTopError) chartInstanceTopError.dispose();
    if (chartInstanceWordcloud) chartInstanceWordcloud.dispose();
})

const handleResize = () => {
    if (chartInstanceTopError) chartInstanceTopError.resize();
    if (chartInstanceWordcloud) chartInstanceWordcloud.resize();
}

</script>

<style scoped>
.dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
.chart-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
.modern-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #ebeef5; transition: transform 0.2s, box-shadow 0.2s; height: 100%; box-sizing: border-box; }
.modern-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0; }
.stat-item { display: flex; flex-direction: column; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-num { font-size: 32px; font-weight: 700; color: #303133; line-height: 1.2; }
.stat-trend { font-size: 13px; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
.trend-up { color: #67C23A; }
.trend-down { color: #F56C6C; }
</style>

