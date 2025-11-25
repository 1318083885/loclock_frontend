import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authAPI } from '../api'

export const useUserStore = defineStore('user', () => {
    const userInfo = ref(null)
    const token = ref(localStorage.getItem('token') || '')

    const setToken = (newToken) => {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    const setUserInfo = (info) => {
        userInfo.value = info
    }

    const logout = () => {
        token.value = ''
        userInfo.value = null
        localStorage.removeItem('token')
    }

    const fetchUserInfo = async () => {
        try {
            const data = await authAPI.getCurrentUser()
            setUserInfo(data)
            return data
        } catch (error) {
            logout()
            throw error
        }
    }

    const isSuperAdmin = () => {
        return userInfo.value?.role === 'super_admin'
    }

    return {
        userInfo,
        token,
        setToken,
        setUserInfo,
        logout,
        fetchUserInfo,
        isSuperAdmin
    }
})
