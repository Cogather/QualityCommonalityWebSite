<template>
  <div class="dashboard-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane v-for="tab in availableTabs" :key="tab.key" :label="tab.label" :name="tab.key">
        <template v-if="tab.key === 'admin'">
          <div style="margin-bottom: 24px;">
            <h2 style="margin: 0; font-weight: 600;">欢迎回来，管理员</h2>
            <p style="color: #909399; margin: 8px 0 0 0; font-size: 14px;">以下是今日的AI模型表现及人工校验进度概览。</p>
          </div>

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
        </template>

        <template v-else-if="tab.key === 'user'">
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
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { Top, ArrowRight } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import { getAdminStats, getTopErrors, getCategoryDistribution } from '../api/dashboard'
import { getMyTasks } from '../api/task'

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)
const currentRole = computed(() => user.value?.role || 'user')
const activeTab = ref('user')
const availableTabs = computed(() => {
  const tabs = [{ key: 'user', label: '任务工作台' }]
  if (currentRole.value === 'admin') {
    tabs.unshift({ key: 'admin', label: '全局概览（管理员）' })
  }
  return tabs
})

// Refs for charts
const chartTopErrorRef = ref(null)
const chartWordcloudRef = ref(null)
let chartInstanceTopError = null
let chartInstanceWordcloud = null

// Data
const stats = reactive({
  totalPredictions: 0,
  pendingBatches: 0,
  accuracy: 0,
  correctionProgress: 0
})

const myTasks = ref([])

const formatNumber = (num) => (num || 0).toLocaleString()

const enterTask = (task) => {
  // Push internal ID if available, here we use batchId (UID) for route params but need to consider how TaskDetail uses it
  // Backend TaskDetail endpoint expects internal ID if we followed my implementation notes, OR we update TaskDetail logic
  // The TaskService.getMyTasks returns 'batchId' as UID and 'internalId' as DB ID.
  // Ideally we route with DB ID or handle UID lookup.
  // Let's use internalId for route param to be safe if backend expects ID.
  // But wait, my TaskController.getTaskDetails expects batchId (DB ID).
  router.push({ 
    name: 'TaskDetail', 
    params: { id: task.internalId }, 
    query: { fileName: task.fileName, uid: task.batchId } 
  })
}

const loadAdminData = async () => {
  try {
    const statsData = await getAdminStats()
    Object.assign(stats, statsData)

    const topErrors = await getTopErrors()
    const dist = await getCategoryDistribution()
    
    initCharts(topErrors, dist)
  } catch (e) {
    console.error(e)
  }
}

const loadUserData = async () => {
    try {
        // Pass current user ID. If not available in store, default to 1 or handle login requirement
        const userId = user.value?.id || 2 // Default to 2 (User) for testing if not set
        const tasks = await getMyTasks(userId)
        myTasks.value = tasks
    } catch (e) {
        console.error(e)
    }
}

const initCharts = (topErrors, categoryDist) => {
    if (chartTopErrorRef.value) {
        const categories = topErrors.map(i => i.name)
        const values = topErrors.map(i => i.value)
        
        chartInstanceTopError = echarts.init(chartTopErrorRef.value);
        chartInstanceTopError.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: categories.reverse() },
            series: [{ type: 'bar', data: values.reverse(), itemStyle: { color: '#F56C6C', borderRadius: [0,4,4,0] }, barWidth: '60%' }]
        });
    }

    if (chartWordcloudRef.value) {
        const wordData = buildWordData(categoryDist)
        chartInstanceWordcloud = echarts.init(chartWordcloudRef.value);
        chartInstanceWordcloud.setOption({
            tooltip: { trigger: 'item' },
            series: [{
                type: 'wordCloud',
                gridSize: 8,
                sizeRange: [14, 46],
                rotationRange: [0, 0],
                shape: 'circle',
                textStyle: {
                    color: () => {
                        const palette = ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE']
                        return palette[Math.floor(Math.random() * palette.length)]
                    }
                },
                data: wordData
            }]
        });
    }
}

// 拆分“大类 > 子类”为独立关键词，并按名称聚合数量
const buildWordData = (categoryDist = []) => {
    const agg = new Map()
    categoryDist.forEach(({ name, value }) => {
        const parts = (name || '').split('>').map(p => p.trim()).filter(Boolean)
        parts.forEach(part => {
            const current = agg.get(part) || 0
            agg.set(part, current + (Number(value) || 0))
        })
    })
    return Array.from(agg.entries()).map(([name, value]) => ({ name, value }))
}

onMounted(() => {
    nextTick(() => {
        activeTab.value = currentRole.value === 'admin' ? 'admin' : 'user'
        if (currentRole.value === 'admin') {
            loadAdminData();
            loadUserData();
        } else if (currentRole.value === 'user') {
            loadUserData();
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
