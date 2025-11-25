<template>
  <div class="profile-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">个人资料设置</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="profile-form"
        v-loading="loading"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-divider content-position="left">修改密码（留空则不修改）</el-divider>
        
        <el-form-item label="新密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入新密码" 
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码" 
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="saving">保存修改</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2FA设置 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span class="title">双因素认证 (2FA)</span>
          <el-tag v-if="is2FAEnabled" type="success">已启用</el-tag>
          <el-tag v-else type="info">未启用</el-tag>
        </div>
      </template>

      <div class="twofa-container">
        <el-alert
          title="提升账号安全性"
          description="启用2FA后，每次登录除了密码外，还需要输入手机App（如Google Authenticator）生成的6位动态验证码。"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        />

        <div v-if="!is2FAEnabled">
          <!-- 未启用状态 -->
          <el-button type="primary" @click="start2FASetup" :loading="setupLoading">
            <el-icon><Lock /></el-icon> 启用2FA
          </el-button>
        </div>

        <div v-else>
          <!-- 已启用状态 -->
          <el-button type="danger" @click="show2FADisableDialog = true">
            <el-icon><Unlock /></el-icon> 禁用2FA
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 2FA设置对话框 -->
    <el-dialog v-model="show2FASetupDialog" title="启用双因素认证" width="500px">
      <div class="qr-setup">
        <el-steps :active="setupStep" align-center>
          <el-step title="扫描二维码" />
          <el-step title="验证绑定" />
        </el-steps>

        <div v-if="setupStep === 0" class="qr-code-container">
          <p>使用 <strong>Google Authenticator</strong> 或其他2FA App扫描二维码：</p>
          <canvas ref="qrCanvas" class="qr-canvas"></canvas>
          <p class="secret-text">或手动输入密钥：<el-tag>{{ totpSecret }}</el-tag></p>
          <el-button type="primary" @click="setupStep = 1">下一步</el-button>
        </div>

        <div v-if="setupStep === 1">
          <p>请输入App显示的6位验证码：</p>
          <el-input
            v-model="verifyCode"
            placeholder="例如：123456"
            maxlength="6"
            style="width: 200px; margin: 20px 0;"
          />
          <div>
            <el-button @click="show2FASetupDialog = false">取消</el-button>
            <el-button type="primary" @click="confirm2FASetup" :loading="setupLoading">
              确认启用
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 2FA禁用对话框 -->
    <el-dialog v-model="show2FADisableDialog" title="禁用双因素认证" width="400px">
      <p>请输入当前的6位验证码以确认禁用2FA：</p>
      <el-input
        v-model="disableCode"
        placeholder="例如：123456"
        maxlength="6"
        style="width: 200px; margin: 20px 0;"
      />
      <template #footer>
        <el-button @click="show2FADisableDialog = false">取消</el-button>
        <el-button type="danger" @click="confirm2FADisable" :loading="setupLoading">
          确认禁用
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Unlock } from '@element-plus/icons-vue'
import { authAPI } from '../api'
import { useUserStore } from '../stores/user'
import QRCode from 'qrcode'

const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)

// 2FA相关
const is2FAEnabled = ref(false)
const show2FASetupDialog = ref(false)
const show2FADisableDialog = ref(false)
const setupLoading = ref(false)
const setupStep = ref(0)
const totpSecret = ref('')
const qrCodeUrl = ref('')
const qrCanvas = ref(null)
const verifyCode = ref('')
const disableCode = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback()
  } else {
    if (form.confirmPassword !== '') {
      if (!formRef.value) return
      formRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback()
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { validator: validatePass, trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ]
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const user = await authAPI.getCurrentUser()
    form.username = user.username
    form.email = user.email
    is2FAEnabled.value = user.is_2fa_enabled || false
  } catch (error) {
    console.error('获取个人信息失败', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        const dataToSend = {
          username: form.username,
          email: form.email
        }
        
        if (form.password) {
          dataToSend.password = form.password
        }
        
        const updatedUser = await authAPI.updateProfile(dataToSend)
        
        // 更新store中的用户信息
        userStore.setUserInfo(updatedUser)
        
        ElMessage.success('个人资料更新成功')
        
        // 清空密码框
        form.password = ''
        form.confirmPassword = ''
      } catch (error) {
        // 错误已在拦截器处理
      } finally {
        saving.value = false
      }
    }
  })
}

const resetForm = () => {
  fetchProfile()
  form.password = ''
  form.confirmPassword = ''
}

// 2FA相关方法
const start2FASetup = async () => {
  setupLoading.value = true
  try {
    const data = await authAPI.setup2FA()
    totpSecret.value = data.secret
    qrCodeUrl.value = data.qr_code_url
    
    show2FASetupDialog.value = true
    setupStep.value = 0
    verifyCode.value = ''
    
    await nextTick()
    // 生成二维码
    if (qrCanvas.value) {
      await QRCode.toCanvas(qrCanvas.value, qrCodeUrl.value, {
        width: 250,
        margin: 2
      })
    }
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    setupLoading.value = false
  }
}

const confirm2FASetup = async () => {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    ElMessage.warning('请输入6位验证码')
    return
  }
  
  setupLoading.value = true
  try {
    await authAPI.enable2FA(verifyCode.value)
    ElMessage.success('2FA已启用')
    is2FAEnabled.value = true
    show2FASetupDialog.value = false
    setupStep.value = 0
    verifyCode.value = ''
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    setupLoading.value = false
  }
}

const confirm2FADisable = async () => {
  if (!disableCode.value || disableCode.value.length !== 6) {
    ElMessage.warning('请输入6位验证码')
    return
  }
  
  setupLoading.value = true
  try {
    await authAPI.disable2FA(disableCode.value)
    ElMessage.success('2FA已禁用')
    is2FAEnabled.value = false
    show2FADisableDialog.value = false
    disableCode.value = ''
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    setupLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 20px auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.profile-form {
  max-width: 500px;
  margin: 20px auto;
}

.twofa-container {
  padding: 20px;
}

.qr-setup {
  padding: 20px 0;
}

.qr-code-container {
  text-align: center;
  padding: 20px 0;
}

.qr-canvas {
  display: block;
  margin: 20px auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.secret-text {
  margin: 15px 0;
  color: #606266;
  font-size: 14px;
}
</style>
