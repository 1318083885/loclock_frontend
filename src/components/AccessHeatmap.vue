<template>
  <el-card class="heatmap-card">
    <template #header>
      <span class="title">访问热力图</span>
    </template>
    
    <div v-loading="loading">
      <div id="heatmap-container" style="width: 100%; height: 600px;"></div>
      <div v-if="!loading && pointCount === 0" class="no-data-overlay">
        <el-empty description="暂无访问数据" />
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { linkAPI } from '../api'

const props = defineProps({
  linkId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const pointCount = ref(0)
let map = null

// 坐标转换工具函数（WGS-84 -> GCJ-02）
const PI = 3.1415926535897932384626
const a = 6378245.0
const ee = 0.00669342162296594323

const transformLat = (x, y) => {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0
  return ret
}

const transformLon = (x, y) => {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

const outOfChina = (lat, lng) => {
  if (lng < 72.004 || lng > 137.8347) return true
  if (lat < 0.8293 || lat > 55.8271) return true
  return false
}

// WGS-84 转 GCJ-02 (GPS -> 高德)
const wgs84ToGcj02 = (lat, lng) => {
  if (outOfChina(lat, lng)) return [lat, lng]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLon = transformLon(lng - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI)
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI)
  return [lat + dLat, lng + dLon]
}


onMounted(async () => {
  loading.value = true
  
  try {
    // 加载热力图数据
    const data = await linkAPI.getHeatmap(props.linkId)
    pointCount.value = data.points.length
    
    // 修复Leaflet默认图标路径问题
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
    })
    
    // 将WGS-84坐标转为GCJ-02用于显示
    const [centerLat, centerLng] = wgs84ToGcj02(data.center.lat, data.center.lng)
    const [areaLat, areaLng] = wgs84ToGcj02(data.allowed_area.lat, data.allowed_area.lng)
    
    // 创建地图实例（使用转换后的坐标）
    map = L.map('heatmap-container').setView([centerLat, centerLng], 14)
    
    // 使用高德地图瓦片（免费，无需key）
    L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      attribution: '&copy; <a href="https://ditu.amap.com/">高德地图</a>',
      subdomains: ['1', '2', '3', '4']
    }).addTo(map)
    
    // 添加允许访问区域（圆形，使用转换后的坐标）
    L.circle([areaLat, areaLng], {
      color: '#409EFF',
      fillColor: '#409EFF',
      fillOpacity: 0.15,
      radius: data.allowed_area.radius,
      weight: 2
    }).addTo(map)
    
    // 添加中心点标记（使用转换后的坐标）
    L.marker([areaLat, areaLng])
      .addTo(map)
      .bindPopup('允许访问中心')
    
    // 如果有数据，添加热力图
    if (pointCount.value > 0) {
      // 准备热力图数据 [lat, lng, intensity]，转换每个点的坐标
      const heatData = data.points.map(point => {
        const [gcjLat, gcjLng] = wgs84ToGcj02(point.lat, point.lng)
        return [gcjLat, gcjLng, point.weight]
      })
      
      // 创建热力图层
      L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: Math.max(...data.points.map(p => p.weight)),
        gradient: {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      }).addTo(map)
    }
    
  } catch (error) {
    console.error('加载热力图失败', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.heatmap-card {
  margin-bottom: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.no-data-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

#heatmap-container {
  border-radius: 4px;
  overflow: hidden;
}
</style>
