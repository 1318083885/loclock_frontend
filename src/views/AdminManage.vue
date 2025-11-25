<template>
  <div>
    <el-button type="primary" @click="showDialog = true" style="margin-bottom: 20px">
      <el-icon><Plus /></el-icon> 创建管理员
    </el-button>
    
    <el-table :data="users" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="row.role === 'super_admin' ? 'danger' : 'primary'">
            {{ row.role === 'super_admin' ? '超级管理员' : '管理员' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'">
            {{ row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="toggleStatus(row)">
            {{ row.is_active ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建管理员对话框 -->
    <el-dialog v-model="showDialog" title="创建管理员" width="500px">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" type="email" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="userForm.password" type="password" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="userForm.role">
            <el-radio value="admin">管理员</el-radio>
            <el-radio value="super_admin">超级管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="createUser">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminAPI } from '../api'

const users = ref([])
const showDialog = ref(false)
const userForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'admin'
})

const fetchUsers = async () => {
  try {
    users.value = await adminAPI.getUsers()
  } catch (error) {
    console.error('获取管理员列表失败', error)
  }
}

const createUser = async () => {
  try {
    await adminAPI.createUser(userForm.value)
    ElMessage.success('创建成功')
    showDialog.value = false
    userForm.value = { username: '', email: '', password: '', role: 'admin' }
    await fetchUsers()
  } catch (error) {
    // 错误已在拦截器处理
  }
}

const toggleStatus = async (user) => {
  try {
    await adminAPI.updateUser(user.id, { is_active: !user.is_active })
    ElMessage.success('状态更新成功')
    await fetchUsers()
  } catch (error) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  fetchUsers()
})
</script>
