<template>
  <div class="ip-blacklist-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">IP黑名单管理</span>
          <el-button type="danger" @click="showDialog = true">
            <el-icon><CircleClose /></el-icon> 添加黑名单IP
          </el-button>
        </div>
      </template>

      <!-- 黑名单列表 -->
      <el-table :data="blockedIps" style="width: 100%" v-loading="loading" stripe border>
        <el-table-column prop="ip_address" label="IP地址" width="200">
          <template #default="{ row }">
            <el-tag type="danger" effect="dark">{{ row.ip_address }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="reason" label="封禁原因" min-width="250" show-overflow-tooltip />
        
        <el-table-column prop="created_at" label="封禁时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="unblockIp(row)">
              解封
            </el-button>
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

    <!-- 添加黑名单对话框 -->
    <el-dialog v-model="showDialog" title="添加IP到黑名单" width="500px">
      <el-form :model="ipForm" label-width="100px">
        <el-form-item label="IP地址" required>
          <el-input v-model="ipForm.ip_address" placeholder="例如：192.168.1.100" />
          <div class="form-tip">支持IPv4和IPv6地址</div>
        </el-form-item>
        
        <el-form-item label="封禁原因">
          <el-input
            v-model="ipForm.reason"
            type="textarea"
            :rows="3"
            placeholder="可选，记录封禁原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="danger" @click="addToBlacklist" :loading="saving">封禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleClose } from '@element-plus/icons-vue'
import { adminAPI } from '../api'

const blockedIps = ref([])
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const ipForm = ref({
  ip_address: '',
  reason: ''
})

const fetchBlockedIps = async () => {
  loading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const data = await adminAPI.getBlockedIps(skip, pageSize.value)
    blockedIps.value = data
    // 模拟总数（如果后端没返回total）
    if (data.length < pageSize.value && currentPage.value === 1) {
      total.value = data.length
    } else {
      total.value = 100 // 假定一个较大值或需要后端支持
    }
  } catch (error) {
    console.error('获取黑名单失败', error)
  } finally {
    loading.value = false
  }
}

const addToBlacklist = async () => {
  if (!ipForm.value.ip_address) {
    ElMessage.warning('请输入IP地址')
    return
  }

  saving.value = true
  try {
    await adminAPI.blockIp(ipForm.value)
    ElMessage.success('IP已添加到黑名单')
    showDialog.value = false
    ipForm.value = {
      ip_address: '',
      reason: ''
    }
    await fetchBlockedIps()
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    saving.value = false
  }
}

const unblockIp = async (ip) => {
  await ElMessageBox.confirm(
    `确定要解封IP地址 ${ip.ip_address} 吗？`,
    '确认解封',
    {
      confirmButtonText: '解封',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  try {
    await adminAPI.unblockIp(ip.id)
    ElMessage.success('已解封')
    await fetchBlockedIps()
  } catch (error) {
    // 错误已在拦截器处理
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchBlockedIps()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchBlockedIps()
}

onMounted(() => {
  fetchBlockedIps()
})
</script>

<style scoped>
.ip-blacklist-container {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>
