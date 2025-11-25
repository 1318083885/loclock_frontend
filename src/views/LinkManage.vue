<template>
  <div class="link-manage-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">短链接管理</span>
          <el-button type="primary" @click="showDialog = true">
            <el-icon><Plus /></el-icon> 创建短链接
          </el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索短链接、目标URL或位置名称"
          style="width: 300px;"
          @keyup.enter="handleSearch"
          clearable
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
        
        <div style="flex: 1;"></div>
        
        <el-radio-group v-model="showDeleted" @change="handleSearch" size="small">
          <el-radio-button :label="false">正常链接</el-radio-button>
          <el-radio-button :label="true">回收站</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 表格 -->
      <el-table :data="links" style="width: 100%" v-loading="loading" stripe border>
        <el-table-column prop="short_code" label="短链接" width="120">
          <template #default="{ row }">
            <el-tag effect="dark" type="primary" style="font-weight: bold; letter-spacing: 1px;">
              {{ row.short_code }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.title || '-' }}
          </template>
        </el-table-column>

        <el-table-column v-if="userStore.isSuperAdmin()" prop="creator_username" label="创建者" width="120">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain">{{ row.creator_username }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="target_url" label="目标URL" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <a :href="row.target_url" target="_blank" class="link-url">{{ row.target_url }}</a>
          </template>
        </el-table-column>
...
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="短链接代码">
              <el-input v-model="linkForm.short_code" placeholder="留空自动生成" :disabled="!!editingLink">
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="链接标题">
              <el-input v-model="linkForm.title" placeholder="显示在浏览器标题栏（可选）">
                <template #prefix>
                  <el-icon><Document /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="位置名称">
          <el-autocomplete
            v-model="linkForm.location_name"
            :fetch-suggestions="querySearchLocation"
            placeholder="如：北京天安门广场"
            clearable
            style="width: 100%"
            @select="handleLocationSelect"
          >
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
          </el-autocomplete>
        </el-form-item>
...
import { Search, Plus, CopyDocument, Picture, Edit, Delete, Link, Location, Connection, ChatDotRound, Download, CircleCloseFilled, RefreshLeft, Document } from '@element-plus/icons-vue'
...
const linkForm = ref({
  short_code: '',
  title: '',
  target_url: '',
  location_name: '',
  center_lat: 39.9042,
  center_lng: 116.4074,
  radius_meters: 1000,
  contact_wechat: '',
  expire_at: null,
  max_visits: 0,
  is_active: true
})
...
const editLink = (link) => {
  editingLink.value = link
  linkForm.value = {
    short_code: link.short_code,
    title: link.title || '',
    target_url: link.target_url,
    location_name: link.location_name,
    center_lat: parseFloat(link.center_lat),
    center_lng: parseFloat(link.center_lng),
    radius_meters: link.radius_meters,
    contact_wechat: link.contact_wechat || '',
    expire_at: link.expire_at,
    max_visits: link.max_visits || 0,
    is_active: link.is_active
  }
  showDialog.value = true
}
...
    linkForm.value = {
      short_code: '',
      title: '',
      target_url: '',
      location_name: '',
      center_lat: 39.9042,
      center_lng: 116.4074,
      radius_meters: 1000,
      contact_wechat: '',
      expire_at: null,
      max_visits: 0,
      is_active: true
    }
        
        <el-table-column prop="location_name" label="位置" width="150" show-overflow-tooltip />
        
        <el-table-column label="范围" width="120">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.radius_meters }}米</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 5px;">
              <el-tag v-if="row.is_banned" type="danger" effect="dark" size="small">封</el-tag>
              <el-switch
                v-if="!row.is_banned || userStore.isSuperAdmin()"
                v-model="row.is_active"
                inline-prompt
                :active-text="row.is_banned ? '解封' : '启用'"
                :inactive-text="row.is_banned ? '封禁' : '禁用'"
                :loading="row.statusLoading"
                @change="handleStatusChange(row)"
                :style="row.is_banned ? '--el-switch-off-color: #F56C6C' : ''"
              />
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="统计" width="180">
          <template #default="{ row }">
            <div class="stats-info">
              <div class="stat-item">
                <span class="label">总访:</span>
                <span class="value">{{ row.visit_count }}</span>
              </div>
              <div class="stat-item success">
                <span class="label">通过:</span>
                <span class="value">{{ row.success_count }}</span>
              </div>
              <div class="stat-item error">
                <span class="label">拒绝:</span>
                <span class="value">{{ row.denied_count }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button-group v-if="!showDeleted">
              <el-button size="small" @click="viewAnalytics(row)" icon="DataAnalysis" title="数据分析"></el-button>
              <el-button size="small" @click="copyLink(row)" icon="CopyDocument" title="复制链接"></el-button>
              <el-button size="small" @click="showQRCode(row)" icon="Picture" title="二维码"></el-button>
              <el-button size="small" type="primary" @click="editLink(row)" icon="Edit" title="编辑" :disabled="row.is_banned && !userStore.isSuperAdmin()"></el-button>
              <el-button 
                size="small" 
                :type=" userStore.isSuperAdmin() && row.creator_username !== userStore.username ? 'warning' : 'danger'" 
                @click="deleteLink(row)" 
                :icon="Delete" 
                :title="userStore.isSuperAdmin() && row.creator_username !== userStore.username ? '封禁' : '删除'"
              >
              </el-button>
            </el-button-group>
            <el-button-group v-else>
              <el-button size="small" type="success" @click="restoreLink(row)" icon="RefreshLeft">恢复</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog 
      v-model="showDialog" 
      :title="editingLink ? '编辑短链接' : '创建短链接'" 
      width="900px"
      top="5vh"
      destroy-on-close
    >
      <el-form :model="linkForm" label-width="100px" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="短链接代码">
              <el-input v-model="linkForm.short_code" placeholder="留空自动生成" :disabled="!!editingLink">
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="链接标题">
              <el-input v-model="linkForm.title" placeholder="显示在浏览器标题栏">
                <template #prefix>
                  <el-icon><Document /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="位置名称">
              <el-autocomplete
                v-model="linkForm.location_name"
                :fetch-suggestions="querySearchLocation"
                placeholder="如：北京天安门广场"
                clearable
                style="width: 100%"
                @select="handleLocationSelect"
              >
                <template #prefix>
                  <el-icon><Location /></el-icon>
                </template>
              </el-autocomplete>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="目标URL" required>
          <el-input v-model="linkForm.target_url" placeholder="https://example.com">
            <template #prefix>
              <el-icon><Connection /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="地理位置" required>
          <div class="map-wrapper" style="width: 100%;">
            <MapPicker 
              v-model:lat="linkForm.center_lat" 
              v-model:lng="linkForm.center_lng" 
              :radius="linkForm.radius_meters"
            />
          </div>
          <div class="coord-inputs">
            <el-input-number v-model="linkForm.center_lat" :precision="6" :step="0.0001" size="small" style="width: 160px" controls-position="right">
              <template #prefix>纬度</template>
            </el-input-number>
            <el-input-number v-model="linkForm.center_lng" :precision="6" :step="0.0001" size="small" style="width: 160px" controls-position="right">
              <template #prefix>经度</template>
            </el-input-number>
          </div>
        </el-form-item>

        <el-form-item label="范围半径">
          <div class="radius-control">
            <el-slider v-model="linkForm.radius_meters" :min="100" :max="5000" :step="100" show-input input-size="small" />
            <span class="unit">米</span>
          </div>
        </el-form-item>

        <el-form-item label="联系微信">
          <el-input v-model="linkForm.contact_wechat" placeholder="访问被拒时显示（可选）" clearable>
            <template #prefix>
              <el-icon><ChatDotRound /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">
            用户访问被拒时可看到此微信号并快速复制
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="过期时间">
              <el-date-picker
                v-model="linkForm.expire_at"
                type="datetime"
                placeholder="选择过期时间"
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="访问限制">
              <el-input-number 
                v-model="linkForm.max_visits" 
                :min="0" 
                placeholder="0表示不限"
                style="width: 100%"
              >
                <template #suffix>次</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="form-tip" style="margin-left: 100px; margin-bottom: 20px;">
          留空或设为0表示不限制
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveLink" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 数据分析对话框 -->
    <el-dialog v-model="analyticsDialog" title="数据分析" width="90%" top="5vh">
      <TimeStats v-if="analyticsDialog && currentAnalyticsLink" :linkId="currentAnalyticsLink" />
      <DeviceStats v-if="analyticsDialog && currentAnalyticsLink" :linkId="currentAnalyticsLink" />
      <AccessHeatmap v-if="analyticsDialog && currentAnalyticsLink" :linkId="currentAnalyticsLink" />
    </el-dialog>

    <!-- 二维码对话框 -->
    <el-dialog v-model="qrDialog" title="短链接二维码" width="400px" center>
      <div class="qr-container">
        <div class="qr-link">{{ currentShortLink }}</div>
        <canvas ref="qrCanvas" class="qr-canvas"></canvas>
        
        <div class="logo-upload">
          <el-upload
            v-model:file-list="logoFile"
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            :on-change="handleLogoChange"
            :show-file-list="false"
          >
            <el-button size="small" plain>
              <el-icon><Picture /></el-icon> 上传Logo (可选)
            </el-button>
          </el-upload>
          <div v-if="customLogo" class="logo-preview">
            <img :src="customLogo" />
            <el-icon class="remove-logo" @click="removeLogo"><CircleCloseFilled /></el-icon>
          </div>
        </div>
        
        <el-button type="primary" @click="downloadQRCode" style="width: 100%; margin-top: 20px;">
          <el-icon><Download /></el-icon> 下载二维码
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, CopyDocument, Picture, Edit, Delete, Link, Location, Connection, ChatDotRound, Download, CircleCloseFilled, RefreshLeft } from '@element-plus/icons-vue'
import { linkAPI } from '../api'
import { useUserStore } from '../stores/user'
import QRCode from 'qrcode'
import MapPicker from '../components/MapPicker.vue'
import TimeStats from '../components/TimeStats.vue'
import DeviceStats from '../components/DeviceStats.vue'
import AccessHeatmap from '../components/AccessHeatmap.vue'

const userStore = useUserStore()
const links = ref([])
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const editingLink = ref(null)
const searchQuery = ref('')
const showDeleted = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 二维码相关
const qrDialog = ref(false)
const qrCanvas = ref(null)
const currentShortLink = ref('')
const logoFile = ref([])
const customLogo = ref(null)

// 位置历史建议
const locationHistory = ref([])

const linkForm = ref({
  short_code: '',
  target_url: '',
  location_name: '',
  center_lat: 39.9042,
  center_lng: 116.4074,
  radius_meters: 1000,
  contact_wechat: '',
  expire_at: null,
  max_visits: 0,
  is_active: true
})

const fetchLocationHistory = async () => {
  try {
    const history = await linkAPI.getLocationHistory()
    // 后端现在直接返回包含value和其他字段的对象列表
    locationHistory.value = history
  } catch (error) {
    console.error('获取位置历史失败', error)
  }
}

const querySearchLocation = (queryString, cb) => {
  const results = queryString
    ? locationHistory.value.filter(createFilter(queryString))
    : locationHistory.value
  cb(results)
}

const createFilter = (queryString) => {
  return (item) => {
    return (item.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0)
  }
}

const handleLocationSelect = (item) => {
  // 自动填充经纬度和半径
  if (item.center_lat && item.center_lng) {
    linkForm.value.center_lat = item.center_lat
    linkForm.value.center_lng = item.center_lng
    linkForm.value.radius_meters = item.radius_meters || 1000
    ElMessage.success(`已自动填充位置：${item.value}`)
  }
}

const fetchLinks = async () => {
  loading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    // 注意：当前API不支持返回总数，这里假设返回全部或足够多，实际生产应优化后端分页
    // 暂时先获取列表，后续如果后端支持分页元数据再完善
    const data = await linkAPI.getLinks(skip, pageSize.value, searchQuery.value, showDeleted.value)
    links.value = data
    // 模拟总数（如果后端没返回total）
    if (data.length < pageSize.value && currentPage.value === 1) {
      total.value = data.length
    } else {
      total.value = 100 // 假定一个较大值或需要后端支持
    }
    
    // 获取位置历史
    fetchLocationHistory()
  } catch (error) {
    console.error('获取短链接列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchLinks()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchLinks()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchLinks()
}

const editLink = (link) => {
  editingLink.value = link
  linkForm.value = {
    short_code: link.short_code,
    target_url: link.target_url,
    location_name: link.location_name,
    center_lat: parseFloat(link.center_lat),
    center_lng: parseFloat(link.center_lng),
    radius_meters: link.radius_meters,
    contact_wechat: link.contact_wechat || '',
    expire_at: link.expire_at,
    max_visits: link.max_visits || 0,
    is_active: link.is_active
  }
  showDialog.value = true
}

const saveLink = async () => {
  saving.value = true
  try {
    // 准备数据，将空字符串转为undefined
    const dataToSend = {
      ...linkForm.value,
      short_code: linkForm.value.short_code.trim() || undefined,
      max_visits: linkForm.value.max_visits || null // 0转为null
    }
    
    if (editingLink.value) {
      await linkAPI.updateLink(editingLink.value.id, dataToSend)
      ElMessage.success('更新成功')
    } else {
      await linkAPI.createLink(dataToSend)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    editingLink.value = null
    linkForm.value = {
      short_code: '',
      target_url: '',
      location_name: '',
      center_lat: 39.9042,
      center_lng: 116.4074,
      radius_meters: 1000,
      contact_wechat: '',
      expire_at: null,
      max_visits: 0,
      is_active: true
    }
    await fetchLinks()
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    saving.value = false
  }
}

const deleteLink = async (link) => {
  const isBanAction = userStore.isSuperAdmin() && link.creator_username !== userStore.username
  const message = isBanAction 
    ? '确定要封禁此链接吗？封禁后用户无法自行解封。' 
    : '确定要删除此短链接吗？'
    
  await ElMessageBox.confirm(message, '警告', {
    confirmButtonText: isBanAction ? '封禁' : '删除',
    cancelButtonText: '取消',
    type: isBanAction ? 'warning' : 'error'
  })
  try {
    await linkAPI.deleteLink(link.id)
    ElMessage.success('删除成功')
    await fetchLinks()
  } catch (error) {
    // 错误已在拦截器处理
  }
}

const restoreLink = async (link) => {
  try {
    await linkAPI.restoreLink(link.id)
    ElMessage.success('恢复成功')
    await fetchLinks()
  } catch (error) {
    // 错误已在拦截器处理
  }
}

const handleStatusChange = async (row) => {
  row.statusLoading = true
  try {
    const updatedLink = await linkAPI.updateLink(row.id, { is_active: row.is_active })
    // 更新本地状态，特别是is_banned可能发生了变化
    Object.assign(row, updatedLink)
    ElMessage.success(row.is_active ? '已启用' : '已禁用')
  } catch (error) {
    row.is_active = !row.is_active // 恢复状态
  } finally {
    row.statusLoading = false
  }
}

// 复制短链接
const copyLink = async (link) => {
  const fullUrl = `${window.location.protocol}//${window.location.host}/s/${link.short_code}`
  try {
    await navigator.clipboard.writeText(fullUrl)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = fullUrl
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('链接已复制到剪贴板')
  }
}

// 查看数据分析
const analyticsDialog = ref(false)
const currentAnalyticsLink = ref(null)

const viewAnalytics = (link) => {
  currentAnalyticsLink.value = link.id
  analyticsDialog.value = true
}

// 显示二维码
const showQRCode = async (link) => {
  currentShortLink.value = `${window.location.protocol}//${window.location.host}/s/${link.short_code}`
  qrDialog.value = true
  logoFile.value = []
  customLogo.value = null
  
  await nextTick()
  generateQRCode()
}

// 生成二维码
const generateQRCode = async () => {
  if (!qrCanvas.value) return
  
  const options = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  }
  
  try {
    await QRCode.toCanvas(qrCanvas.value, currentShortLink.value, options)
    
    // 如果有自定义logo，添加到中心
    if (customLogo.value) {
      const canvas = qrCanvas.value
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        const logoSize = canvas.width * 0.2 // logo占二维码的20%
        const x = (canvas.width - logoSize) / 2
        const y = (canvas.height - logoSize) / 2
        
        // 绘制白色背景
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10)
        
        // 绘制logo
        ctx.drawImage(img, x, y, logoSize, logoSize)
      }
      img.src = customLogo.value
    }
  } catch (error) {
    ElMessage.error('二维码生成失败')
  }
}

// 处理logo上传
const handleLogoChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    customLogo.value = e.target.result
    generateQRCode()
  }
  reader.readAsDataURL(file.raw)
}

const removeLogo = () => {
  customLogo.value = null
  logoFile.value = []
  generateQRCode()
}

// 下载二维码
const downloadQRCode = () => {
  if (!qrCanvas.value) return
  
  const link = document.createElement('a')
  link.download = `qrcode-${currentShortLink.value.split('/').pop()}.png`
  link.href = qrCanvas.value.toDataURL()
  link.click()
  ElMessage.success('二维码已下载')
}

onMounted(() => {
  fetchLinks()
})
</script>

<style scoped>
.link-manage-container {
  padding: 20px;
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

.filter-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.link-url {
  color: #409EFF;
  text-decoration: none;
}

.link-url:hover {
  text-decoration: underline;
}

.stats-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
}

.stat-item.success .value { color: #67C23A; }
.stat-item.error .value { color: #F56C6C; }

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.map-wrapper {
  margin-bottom: 10px;
}

.coord-inputs {
  display: flex;
  gap: 10px;
}

.radius-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.qr-container {
  text-align: center;
}

.qr-link {
  margin-bottom: 15px;
  color: #606266;
  font-weight: bold;
  word-break: break-all;
}

.qr-canvas {
  display: block;
  margin: 0 auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
}

.logo-upload {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.logo-preview {
  position: relative;
  width: 60px;
  height: 60px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 2px;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-logo {
  position: absolute;
  top: -8px;
  right: -8px;
  color: #F56C6C;
  cursor: pointer;
  background: white;
  border-radius: 50%;
}
</style>
