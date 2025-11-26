<template>
  <el-container class="layout-container">
    <!-- 移动端汉堡菜单按钮 -->
    <div v-if="isMobile" class="mobile-menu-btn" @click="drawerVisible = true">
      <el-icon :size="24"><Expand /></el-icon>
    </div>
    
    <!-- 桌面端侧边栏 -->
    <el-aside v-if="!isMobile" width="200px">
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

    <!-- 移动端抽屉侧边栏 -->
    <el-drawer v-model="drawerVisible" :with-header="false" size="70%" direction="ltr">
      <div class="mobile-sidebar">
        <div class="logo">LocLock</div>
        <el-menu :default-active="currentRoute" router @select="handleMenuSelect">
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
      </div>
    </el-drawer>
    
    <el-container>
      <el-header>
        <div class="header-content">
          <h3 :class="{ 'mobile-title': isMobile }">{{ currentTitle }}</h3>
          <div class="user-info">
            <el-dropdown trigger="click">
              <span class="el-dropdown-link">
                <span v-if="!isMobile">{{ userStore.userInfo?.username }}</span>
                <el-icon :class="{ 'mobile-user-icon': isMobile }"><User /></el-icon>
                <el-icon v-if="!isMobile" class="el-icon--right"><arrow-down /></el-icon>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Odometer, Link, User, ArrowDown, SwitchButton, CircleClose, Expand } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const drawerVisible = ref(false)
const isMobile = ref(false)

const currentRoute = computed(() => route.name?.toLowerCase() || 'dashboard')
const currentTitle = computed(() => route.meta.title || '仪表盘')

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleMenuSelect = () => {
  drawerVisible.value = false
}

const handleLogout = async () => {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  position: relative;
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
  padding: 0 20px;
}

.header-content {
  width: 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h3 {
  margin: 0;
  font-size: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.el-dropdown-link:hover {
  color: #409EFF;
}

/* 移动端样式 */
.mobile-menu-btn {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1000;
  cursor: pointer;
  color: #409EFF;
  background: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-sidebar {
  background-color: #304156;
  height: 100%;
}

.mobile-sidebar .el-menu {
  background-color: #304156;
}

.mobile-title {
  font-size: 16px !important;
  margin-left: 50px;
}

.mobile-user-icon {
  font-size: 20px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .el-header {
    padding: 0 15px;
  }
  
  .el-main {
    padding: 15px;
  }
  
  .header-content h3 {
    font-size: 16px;
  }
}
</style>
