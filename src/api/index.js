import request from './axios'

// 认证相关API
export const authAPI = {
    login(username, password, totp_code = null) {
        const payload = { username, password }
        if (totp_code) {
            payload.totp_code = totp_code
        }
        return request.post('/auth/login', payload)
    },
    getCurrentUser() {
        return request.get('/auth/me')
    },
    updateProfile(userData) {
        return request.put('/auth/me', userData)
    },
    setup2FA() {
        return request.post('/auth/2fa/setup')
    },
    enable2FA(code) {
        return request.post('/auth/2fa/enable', { code })
    },
    disable2FA(code) {
        return request.post('/auth/2fa/disable', { code })
    }
}

// 管理员管理API（仅超级管理员）
export const adminAPI = {
    getUsers(skip = 0, limit = 100) {
        return request.get('/admin/users', { params: { skip, limit } })
    },
    getGlobalStats() {
        return request.get('/admin/stats')
    },
    createUser(userData) {
        return request.post('/admin/users', userData)
    },
    updateUser(userId, userData) {
        return request.put(`/admin/users/${userId}`, userData)
    },
    deleteUser(userId) {
        return request.delete(`/admin/users/${userId}`)
    },
    getBlockedIps(skip = 0, limit = 100) {
        return request.get('/admin/blocked-ips', { params: { skip, limit } })
    },
    blockIp(ipData) {
        return request.post('/admin/blocked-ips', ipData)
    },
    unblockIp(ipId) {
        return request.delete(`/admin/blocked-ips/${ipId}`)
    }
}

// 短链接管理API
export const linkAPI = {
    getLinks(skip = 0, limit = 100, search = '', showDeleted = false) {
        return request.get('/links', { params: { skip, limit, search, show_deleted: showDeleted } })
    },
    createLink(linkData) {
        return request.post('/links', linkData)
    },
    getLink(id) {
        return request.get(`/links/${id}`)
    },
    updateLink(id, linkData) {
        return request.put(`/links/${id}`, linkData)
    },
    deleteLink(id) {
        return request.delete(`/links/${id}`)
    },
    restoreLink(id) {
        return request.post(`/links/${id}/restore`)
    },
    getLinkStats(linkId) {
        return request.get(`/links/${linkId}/stats`)
    },
    getLocationHistory() {
        return request.get('/locations/history')
    },
    getTimeStats(linkId, granularity = 'day', days = 30) {
        return request.get(`/links/${linkId}/time-stats`, {
            params: { granularity, days }
        })
    },
    getDeviceStats(linkId) {
        return request.get(`/links/${linkId}/device-stats`)
    },
    getHeatmap(linkId) {
        return request.get(`/links/${linkId}/heatmap`)
    }
}
