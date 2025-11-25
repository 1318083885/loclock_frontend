<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">LocLock</div>
      <el-menu :default-active="currentRoute" router>
        <el-menu-item index="dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="links">
          <el-icon><Link /></el-icon>
          <span>短链接管理</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isSuperAdmin()" index="admin">
          <el-icon><User /></el-icon>
          <span>管理员管理</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.isSuperAdmin()" index="ip-blacklist">
          <el-icon><CircleClose /></el-icon>
          <span>IP黑名单</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-content">
          <h3>{{ currentTitle }}</h3>
          <div class="user-info">
            <el-dropdown trigger="click">
              <span class="el-dropdown-link">
                {{ userStore.userInfo?.username }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/profile')">
                    <el-icon><User /></el-icon>个人资料
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Odometer, Link, User, ArrowDown, SwitchButton, CircleClose } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentRoute = computed(() => route.name?.toLowerCase() || 'dashboard')
const currentTitle = computed(() => route.meta.title || '仪表盘')

const handleLogout = async () => {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: white;
  background-color: #1f2d3d;
}

.el-menu {
  border-right: none;
  background-color: #304156;
}

:deep(.el-menu-item) {
  color: #bfcbd9;
}

:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  color: #fff;
  background-color: #263445 !important;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
}

.el-dropdown-link:hover {
  color: #409EFF;
}
</style>
