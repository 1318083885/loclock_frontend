<template>
  <div class="map-picker-container">
    <div class="search-bar">
      <el-input 
        v-model="searchQuery" 
        placeholder="搜索地点（回车搜索）" 
        @keyup.enter="searchLocation"
        clearable
      >
        <template #append>
          <el-button @click="searchLocation" :loading="searching">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
    <div id="map" class="map-view"></div>
    <div class="map-tip">
      点击地图选择中心点，当前半径: {{ radius }}米
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  lat: {
    type: Number,
    default: 39.9042
  },
  lng: {
    type: Number,
    default: 116.4074
  },
  radius: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['update:lat', 'update:lng'])

const map = ref(null)
const marker = ref(null)
const circle = ref(null)
const searchQuery = ref('')
const searching = ref(false)

// 坐标转换工具函数
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

// GCJ-02 转 WGS-84 (高德 -> GPS)
const gcj02ToWgs84 = (lat, lng) => {
  if (outOfChina(lat, lng)) return [lat, lng]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLon = transformLon(lng - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI)
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI)
  const mgLat = lat + dLat
  const mgLon = lng + dLon
  return [lat * 2 - mgLat, lng * 2 - mgLon]
}

const outOfChina = (lat, lng) => {
  if (lng < 72.004 || lng > 137.8347) return true
  if (lat < 0.8293 || lat > 55.8271) return true
  return false
}

// 初始化地图
const initMap = () => {
  if (map.value) return

  // 修复Leaflet默认图标路径问题
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  })

  // 初始化时，将传入的WGS-84坐标转换为GCJ-02显示
  const [gcjLat, gcjLng] = wgs84ToGcj02(props.lat, props.lng)
  map.value = L.map('map').setView([gcjLat, gcjLng], 13)

  // 使用高德地图图层 (更适合国内访问)
  L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    attribution: '&copy; <a href="https://ditu.amap.com/">高德地图</a>',
    subdomains: ['1', '2', '3', '4']
  }).addTo(map.value)

  // 添加点击事件
  map.value.on('click', (e) => {
    // 点击的是GCJ-02坐标，需要转回WGS-84保存
    const [wgsLat, wgsLng] = gcj02ToWgs84(e.latlng.lat, e.latlng.lng)
    updateLocation(wgsLat, wgsLng, e.latlng.lat, e.latlng.lng)
  })

  // 初始化标记和圆圈 (使用GCJ-02坐标)
  updateVisuals(gcjLat, gcjLng, props.radius)
}

// 更新位置和视觉元素
// lat, lng: WGS-84坐标 (用于保存)
// displayLat, displayLng: GCJ-02坐标 (用于显示，可选)
const updateLocation = (lat, lng, displayLat = null, displayLng = null) => {
  // 保存WGS-84坐标
  emit('update:lat', parseFloat(lat.toFixed(6)))
  emit('update:lng', parseFloat(lng.toFixed(6)))
  
  // 如果没有提供显示坐标，则进行转换
  if (displayLat === null || displayLng === null) {
    const [gLat, gLng] = wgs84ToGcj02(lat, lng)
    updateVisuals(gLat, gLng, props.radius)
  } else {
    updateVisuals(displayLat, displayLng, props.radius)
  }
}

const updateVisuals = (lat, lng, radius) => {
  if (!map.value) return

  // 更新标记
  if (marker.value) {
    marker.value.setLatLng([lat, lng])
  } else {
    marker.value = L.marker([lat, lng]).addTo(map.value)
  }

  // 更新圆圈
  if (circle.value) {
    circle.value.setLatLng([lat, lng])
    circle.value.setRadius(radius)
  } else {
    circle.value = L.circle([lat, lng], {
      color: '#409EFF',
      fillColor: '#409EFF',
      fillOpacity: 0.2,
      radius: radius
    }).addTo(map.value)
  }
}

// 搜索地点
const searchLocation = async () => {
  if (!searchQuery.value) return
  
  searching.value = true
  try {
    // 使用Nominatim API进行搜索 (返回的是WGS-84坐标)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}`)
    const data = await response.json()
    
    if (data && data.length > 0) {
      const location = data[0]
      const lat = parseFloat(location.lat)
      const lng = parseFloat(location.lon)
      
      // 转换为GCJ-02用于显示
      const [gcjLat, gcjLng] = wgs84ToGcj02(lat, lng)
      
      map.value.setView([gcjLat, gcjLng], 13)
      // 传递WGS-84保存，GCJ-02显示
      updateLocation(lat, lng, gcjLat, gcjLng)
      ElMessage.success(`已定位到: ${location.display_name.split(',')[0]}`)
    } else {
      ElMessage.warning('未找到相关地点')
    }
  } catch (error) {
    ElMessage.error('搜索失败，请重试')
  } finally {
    searching.value = false
  }
}

// 监听props变化 (传入的是WGS-84坐标)
watch(() => [props.lat, props.lng, props.radius], ([newLat, newLng, newRadius]) => {
  if (map.value) {
    // 转换为GCJ-02用于显示
    const [gcjLat, gcjLng] = wgs84ToGcj02(newLat, newLng)
    
    updateVisuals(gcjLat, gcjLng, newRadius)
    // 如果距离当前视图中心太远，则平移
    const center = map.value.getCenter()
    const dist = map.value.distance(center, [gcjLat, gcjLng])
    if (dist > 5000) {
      map.value.setView([gcjLat, gcjLng])
    }
  }
})

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<style scoped>
.map-picker-container {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.search-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.map-view {
  width: 100%;
  height: 500px;
  z-index: 1;
}

.map-tip {
  padding: 5px 10px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  border-top: 1px solid #dcdfe6;
}
</style>
