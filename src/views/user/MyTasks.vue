<template>
  <div v-loading="loading">
    <h2 style="margin-bottom: 24px;">我的校验任务</h2>
    <div class="task-list">
      <div v-for="task in myTasks" :key="task.batchId" class="modern-card task-card" :class="{ completed: task.processedCount === task.totalCount }" style="cursor: pointer; padding: 20px;" @click="enterTask(task)">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <el-tag :type="task.processedCount === task.totalCount ? 'success' : 'primary'" effect="dark" size="small">
            {{ task.processedCount === task.totalCount ? '已完成' : '进行中' }}
          </el-tag>
          <span style="font-size: 12px; color: #999;">{{ new Date(task.uploadTime).toLocaleDateString() }}</span>
        </div>
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">{{ task.fileName }}</h3>
        <p style="color: #666; font-size: 13px; margin: 0 0 20px 0;">批次号: {{ task.batchId }}</p>
        
        <div style="margin-bottom: 5px; display: flex; justify-content: space-between; font-size: 12px; color: #666;">
          <span>进度</span>
          <span>{{ Math.round((task.processedCount/task.totalCount)*100) }}%</span>
        </div>
        <el-progress :percentage="Math.round((task.processedCount/task.totalCount)*100)" :show-text="false"></el-progress>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMyTasks } from '../../api/task'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const myTasks = ref([])
const loading = ref(false)

const fetchData = async () => {
    loading.value = true
    try {
        const userId = user.value?.id || 1 // Fallback or handle auth
        const data = await getMyTasks(userId)
        myTasks.value = data
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
})

const enterTask = (task) => {
    // Route using internal ID if possible, but keep UID in query if needed for display
    router.push({ 
        name: 'TaskDetail', 
        params: { id: task.internalId }, 
        query: { fileName: task.fileName, uid: task.batchId } 
    })
}
</script>

<style scoped>
.task-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.modern-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #ebeef5; transition: transform 0.2s, box-shadow 0.2s; }
.modern-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
.task-card { border-left: 4px solid #409EFF; }
.task-card.completed { border-left-color: #67C23A; }
</style>
