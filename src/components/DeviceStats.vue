<template>
  <el-card class="device-stats-card">
    <template #header>
      <span class="title">设备与浏览器分析</span>
    </template>
    
    <div v-loading="loading">
      <el-row :gutter="20">
        <!-- 设备类型 -->
        <el-col :span="8">
          <div class="chart-wrapper">
            <h4>设备类型</h4>
            <div ref="deviceChartRef" style="height: 300px;"></div>
          </div>
        </el-col>
        
        <!-- 浏览器 -->
        <el-col :span="8">
          <div class="chart-wrapper">
            <h4>浏览器</h4>
            <div ref="browserChartRef" style="height: 300px;"></div>
          </div>
        </el-col>
        
        <!-- 操作系统 -->
        <el-col :span="8">
          <div class="chart-wrapper">
            <h4>操作系统</h4>
            <div ref="osChartRef" style="height: 300px;"></div>
          </div>
        </el-col>
      </el-row>
      
      <div v-if="!loading && totalCount === 0" class="no-data">
        <el-empty description="暂无设备数据" />
      </div>
    </div>
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
const deviceChartRef = ref(null)
const browserChartRef = ref(null)
const osChartRef = ref(null)
const totalCount = ref(0)

let deviceChart = null
let browserChart = null
let osChart = null

const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']

const createPieOption = (title, data) => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'bottom',
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          value: item.count,
          name: item.name,
          itemStyle: { color: colors[index % colors.length] }
        }))
      }
    ]
  }
}

const initCharts = () => {
  if (deviceChartRef.value) {
    deviceChart = echarts.init(deviceChartRef.value)
  }
  if (browserChartRef.value) {
    browserChart = echarts.init(browserChartRef.value)
  }
  if (osChartRef.value) {
    osChart = echarts.init(osChartRef.value)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await linkAPI.getDeviceStats(props.linkId)
    
    // 计算总数
    totalCount.value = data.devices.reduce((sum, item) => sum + item.count, 0)
    
    // 更新图表
    if (deviceChart && data.devices.length > 0) {
      deviceChart.setOption(createPieOption('设备类型', data.devices))
    }
    
    if (browserChart && data.browsers.length > 0) {
      // 只显示前5个浏览器，其他归为"其他"
      const topBrowsers = data.browsers.slice(0, 5)
      const otherCount = data.browsers.slice(5).reduce((sum, item) => sum + item.count, 0)
      if (otherCount > 0) {
        topBrowsers.push({ name: '其他', count: otherCount })
      }
      browserChart.setOption(createPieOption('浏览器', topBrowsers))
    }
    
    if (osChart && data.os.length > 0) {
      // 只显示前5个操作系统
      const topOS = data.os.slice(0, 5)
      const otherCount = data.os.slice(5).reduce((sum, item) => sum + item.count, 0)
      if (otherCount > 0) {
        topOS.push({ name: '其他', count: otherCount })
      }
      osChart.setOption(createPieOption('操作系统', topOS))
    }
  } catch (error) {
    console.error('加载设备统计失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await nextTick()
  initCharts()
  loadData()
})

watch(() => props.linkId, () => {
  loadData()
})

// 窗口大小变化时重新调整图表
window.addEventListener('resize', () => {
  deviceChart?.resize()
  browserChart?.resize()
  osChart?.resize()
})
</script>

<style scoped>
.device-stats-card {
  margin-bottom: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.chart-wrapper {
  text-align: center;
}

.chart-wrapper h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}
</style>
