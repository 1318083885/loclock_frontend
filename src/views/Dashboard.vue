<template>
  <div>
    <h1>欢迎使用 LocLock</h1>
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" v-if="userStore.isSuperAdmin()">
        <el-card>
          <template #header>管理员总数</template>
          <div class="stat-number">{{ stats.totalAdmins }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card>
          <template #header>我的短链接</template>
          <div class="stat-number">{{ stats.totalLinks }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card>
          <template #header>{{ userStore.isSuperAdmin() ? '总访问量' : '今日访问量' }}</template>
          <div class="stat-number">{{ stats.todayVisits }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { linkAPI, adminAPI } from '../api'

const userStore = useUserStore()
const stats = ref({
  totalAdmins: 0,
  totalLinks: 0,
  todayVisits: 0
})

onMounted(async () => {
  try {
    if (userStore.isSuperAdmin()) {
      // 超级管理员获取全局统计
      const data = await adminAPI.getGlobalStats()
      stats.value.totalAdmins = data.totalAdmins
      stats.value.totalLinks = data.totalLinks
      stats.value.todayVisits = data.totalVisits // 暂时显示总访问量
    } else {
      // 普通管理员获取自己的统计
      const links = await linkAPI.getLinks(0, 1000)
      stats.value.totalLinks = links.length
      stats.value.todayVisits = links.reduce((sum, link) => sum + link.visit_count, 0)
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
})
</script>

<style scoped>
h1 {
  margin-bottom: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
  padding: 20px 0;
}

:deep(.el-col) {
  margin-bottom: 20px;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  h1 {
    font-size: 22px;
  }
  
  .stat-number {
    font-size: 28px;
    padding: 15px 0;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 20px;
  }
  
  .stat-number {
    font-size: 24px;
  }
}
</style>
