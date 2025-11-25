<template>
  <div class="checking-container">
    <div class="spinner" v-if="checking"></div>
    <h2 v-if="checking">{{ linkTitle || '正在验证您的位置...' }}</h2>
    <p v-if="checking && linkTitle" style="margin-top: 10px; opacity: 0.8;">正在验证您的位置...</p>
    <div v-if="error" class="error">
      <h2 v-if="linkTitle">{{ linkTitle }}</h2>
      <h3>{{ error }}</h3>
      <button @click="retry">重试</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../api/axios'

const route = useRoute()
const router = useRouter()
const checking = ref(true)
const error = ref('')
const linkTitle = ref('')

const fetchLinkInfo = async () => {
  try {
    const response = await request.get(`/public/${route.params.shortCode}`)
    if (response.title) {
      linkTitle.value = response.title
      document.title = response.title
    }
  } catch (err) {
    console.error('Failed to fetch link info', err)
  }
}

const verifyLocation = async (latitude, longitude) => {
  try {
    const response = await request.post(`/verify/${route.params.shortCode}`, {
      latitude,
      longitude
    })
    
    if (response.allowed) {
      // 访问允许，跳转到目标URL
      window.location.href = response.target_url
    } else {
      // 访问被拒绝，跳转到拒绝页面
      router.push({
        path: `/denied/${route.params.shortCode}`,
        query: {
          distance: response.distance,
          radius: response.radius,
          message: response.message,
          wechat: response.contact_wechat || '',
          title: response.title || linkTitle.value
        }
      })
    }
  } catch (err) {
    error.value = err.response?.data?.detail || '验证失败，请重试'
    checking.value = false
  }
}

const getLocation = () => {
  checking.value = true
  error.value = ''
  
  if (!navigator.geolocation) {
    error.value = '您的浏览器不支持地理位置功能'
    checking.value = false
    return
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      verifyLocation(position.coords.latitude, position.coords.longitude)
    },
    (err) => {
      if (err.code === 1) {
        error.value = '需要地理位置权限才能访问此页面'
      } else {
        error.value = '无法获取您的位置，请检查设置'
      }
      checking.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

const retry = () => {
  getLocation()
}

onMounted(() => {
  fetchLinkInfo()
  getLocation()
})
</script>

<style scoped>
.checking-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

h2 {
  margin: 20px 0;
}

.error button {
  padding: 10px 30px;
  font-size: 16px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
}

.error button:hover {
  opacity: 0.9;
}
</style>
