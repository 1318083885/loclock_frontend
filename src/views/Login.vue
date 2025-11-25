<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>LocLock 管理后台</h2>
      </template>
      <el-form :model="loginForm" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username" v-if="!requires2FA">
          <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password" v-if="!requires2FA">
          <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock" @keyup.enter="handleLogin" />
        </el-form-item>
        
        <!-- 2FA验证码输入 -->
        <div v-if="requires2FA" class="twofa-step">
          <el-alert
            title="需要双因素认证"
            description="请打开您的认证App（如Google Authenticator），输入6位验证码。"
            type="info"
            :closable="false"
            style="margin-bottom: 20px;"
          />
          <el-form-item prop="totpCode">
            <el-input 
              v-model="loginForm.totpCode" 
              placeholder="请输入6位验证码" 
              prefix-icon="Lock"
              maxlength="6"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button text @click="requires2FA = false; loginForm.totpCode = ''">返回重新登录</el-button>
        </div>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
            {{ requires2FA ? '验证并登录' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const requires2FA = ref(false)

const loginForm = ref({
  username: '',
  password: '',
  totpCode: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  totpCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  // 第一步：验证用户名密码
  if (!requires2FA.value) {
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      
      loading.value = true
      try {
        const data = await authAPI.login(loginForm.value.username, loginForm.value.password)
        
        // 检查是否需要2FA
        if (data.requires_2fa) {
          requires2FA.value = true
          loading.value = false
          return
        }
        
        // 不需要2FA，直接登录成功
        userStore.setToken(data.access_token)
        await new Promise(resolve => setTimeout(resolve, 0))
        await userStore.fetchUserInfo()
        ElMessage.success('登录成功')
        router.push('/')
      } catch (error) {
        // 错误已在axios拦截器中处理
      } finally {
        loading.value = false
      }
    })
  } else {
    // 第二步：验证2FA代码
    if (!loginForm.value.totpCode || loginForm.value.totpCode.length !== 6) {
      ElMessage.warning('请输入6位验证码')
      return
    }
    
    loading.value = true
    try {
      const data = await authAPI.login(
        loginForm.value.username, 
        loginForm.value.password,
        loginForm.value.totpCode
      )
      
      userStore.setToken(data.access_token)
      await new Promise(resolve => setTimeout(resolve, 0))
      await userStore.fetchUserInfo()
      ElMessage.success('登录成功')
      router.push('/')
    } catch (error) {
      // 错误已在axios拦截器中处理
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
}

h2 {
  text-align: center;
  margin: 0;
  color: #303133;
}
</style>
