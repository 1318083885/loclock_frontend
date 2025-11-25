<template>
  <el-card class="time-stats-card">
    <template #header>
      <div class="card-header">
        <span class="title">访问趋势分析</span>
        <div class="controls">
          <el-radio-group v-model="granularity" size="small" @change="loadData">
            <el-radio-button label="hour">小时</el-radio-button>
            <el-radio-button label="day">天</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
          <el-select v-model="days" size="small" @change="loadData" style="width: 120px; margin-left: 10px;">
            <el-option label="最近7天" :value="7" />
            <el-option label="最近15天" :value="15" />
            <el-option label="最近30天" :value="30" />
            <el-option label="最近60天" :value="60" />
            <el-option label="最近90天" :value="90" />
          </el-select>
        </div>
      </div>
    </template>
    
    <div v-loading="loading" class="chart-container">
      <div ref="chartRef" style="width: 100%; height: 400px;"></div>
      <div v-if="!loading && stats.total === 0" class="no-data">
        <el-empty description="暂无访问数据" />
      </div>
    </div>
    
    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-summary">
      <el-col :span="8">
        <div class="stat-item">
          <div class="stat-label">总访问</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-item success">
          <div class="stat-label">成功</div>
          <div class="stat-value">{{ stats.granted }}</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-item danger">
          <div class="stat-label">拒绝</div>
          <div class="stat-value">{{ stats.denied }}</div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { linkAPI } from '../api'

const props = defineProps({
  linkId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const chartRef = ref(null)
let chartInstance = null
const granularity = ref('day')
const days = ref(30)

const stats = ref({
  total: 0,
  granted: 0,
  denied: 0
})

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['总访问', '成功', '拒绝'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '60px',
      top: '10px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '总访问',
        type: 'line',
        data: [],
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '成功',
        type: 'line',
        data: [],
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '拒绝',
        type: 'line',
        data: [],
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await linkAPI.getTimeStats(props.linkId, granularity.value, days.value)
    
    // 计算总计
    let total = 0
    let granted = 0
    let denied = 0
    
    const times = []
    const totals = []
    const granteds = []
    const denieds = []
    
    data.data.forEach(item => {
      // 格式化时间显示
      let timeLabel = ''
      const date = new Date(item.time)
      
      if (granularity.value === 'hour') {
        timeLabel = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
      } else if (granularity.value === 'day') {
        timeLabel = `${date.getMonth() + 1}/${date.getDate()}`
      } else if (granularity.value === 'week') {
        timeLabel = `${date.getMonth() + 1}月第${Math.ceil(date.getDate() / 7)}周`
      } else {
        timeLabel = `${date.getFullYear()}-${date.getMonth() + 1}`
      }
      
      times.push(timeLabel)
      totals.push(item.total)
      granteds.push(item.granted)
      denieds.push(item.denied)
      
      total += item.total
      granted += item.granted
      denied += item.denied
    })
    
    stats.value = { total, granted, denied }
    
    // 更新图表
    if (chartInstance) {
      chartInstance.setOption({
        xAxis: { data: times },
        series: [
          { data: totals },
          { data: granteds },
          { data: denieds }
        ]
      })
    }
  } catch (error) {
    console.error('加载时间统计失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await nextTick()
  initChart()
  loadData()
})

// 监听linkId变化
watch(() => props.linkId, () => {
  loadData()
})

// 窗口大小变化时重新调整图表
window.addEventListener('resize', () => {
  if (chartInstance) {
    chartInstance.resize()
  }
})
</script>

<style scoped>
.time-stats-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.controls {
  display: flex;
  align-items: center;
}

.chart-container {
  position: relative;
  min-height: 400px;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.stats-summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.stat-item {
  text-align: center;
  padding: 15px;
  border-radius: 4px;
  background: #f5f7fa;
}

.stat-item.success {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
}

.stat-item.danger {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-item.success .stat-value {
  color: #67C23A;
}

.stat-item.danger .stat-value {
  color: #F56C6C;
}
</style>
