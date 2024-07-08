import authorizedAxiosInstance from '~/utils/authorizedAxios'
import { API_ROOT } from '~/utils/constants'

export const handleLogoutAPI = async () => {
  // Trường hợp 1: Dùng localstorage -> Chỉ xóa thông tin user trong localstorage phía Front-end
  localStorage.clear('accessToken')
  localStorage.clear('refreshToken')
  localStorage.clear('userInfo')

  // Trường hợp 2: Dùng Http Only Cookies -> Gọi API để remove cookies
  return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
}

export const refreshTokenAPI = async (refreshToken) => {
  return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/refresh_token`, { refreshToken })
}