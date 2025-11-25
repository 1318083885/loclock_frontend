<template>
  <div class="denied-container">
    <div class="denied-card">
      <h1 v-if="title" style="margin-bottom: 10px; color: #333;">{{ title }}</h1>
      <h1 :style="title ? 'font-size: 20px; margin-bottom: 20px;' : ''">⛔ 访问被拒绝</h1>
      <p class="message">您不在允许访问的地理范围内</p>
      
      <div class="info">
        <div class="info-item">
          <strong>您距离目标位置：</strong>
          <span class="highlight">{{ formatDistance(distance) }}</span>
        </div>
        <div class="info-item">
          <strong>允许访问范围：</strong>
          <span>{{ formatDistance(radius) }}</span>
        </div>
        
        <div class="info-item wechat-section" v-if="wechat">
          <strong>联系管理员：</strong>
          <div class="wechat-wrapper">
            <span class="wechat-id">{{ wechat }}</span>
            <button class="copy-btn" @click="copyWechat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              复制微信
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const distance = ref(parseFloat(route.query.distance) || 0)
const radius = ref(parseInt(route.query.radius) || 0)
const wechat = ref(route.query.wechat || '')
const title = ref(route.query.title || '')

onMounted(() => {
  if (title.value) {
    document.title = title.value
  }
})

const formatDistance = (meters) => {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' 公里'
  }
  return Math.round(meters) + ' 米'
}

const copyWechat = async () => {
  try {
    await navigator.clipboard.writeText(wechat.value)
    alert('✅ 微信号已复制到剪贴板')
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = wechat.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('✅ 微信号已复制到剪贴板')
  }
}
</script>

<style scoped>
.denied-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

.denied-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

h1 {
  color: #f5576c;
  margin: 0 0 20px;
  font-size: 28px;
}

.message {
  font-size: 18px;
  color: #333;
  margin-bottom: 30px;
}

.info {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 10px;
  text-align: left;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  font-size: 16px;
}

.info-item strong {
  color: #666;
}

.info-item span {
  color: #333;
  font-weight: bold;
}

.info-item .highlight {
  color: #f5576c;
}

.wechat-section {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.wechat-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.wechat-id {
  flex: 1;
  background: #fff;
  padding: 10px 15px;
  border-radius: 8px;
  border: 2px solid #07c160;
  color: #07c160;
  font-weight: bold;
  font-size: 16px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.copy-btn:hover {
  background: #06ad56;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
}

.copy-btn:active {
  transform: translateY(0);
}
</style>
