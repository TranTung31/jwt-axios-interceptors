import axios from 'axios'
import { toast } from 'react-toastify'
import { handleLogoutAPI, refreshTokenAPI } from '~/apis/index'

// Khởi tạo 1 đối tượng Axios (authorizedAxiosInstance) mục đích để custom và cấu hình chung cho dự án
let authorizedAxiosInstance = axios.create()

// Thời gian chờ tối đa của 1 request: Để 10 phút
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10

// withCredentials: Cho phép axios tự động đính kèm và gửi cookie trong mỗi request lên BE (phục vụ trường hợp nếu chúng ta sử dụng Jwt tokens(access & refresh) theo cơ chế httpOnly Cookie)
authorizedAxiosInstance.defaults.withCredentials = true

// Add a request interceptor
authorizedAxiosInstance.interceptors.request.use(function (config) {
  // Do something before request is sent
  const accessToken = localStorage.getItem('accessToken')

  // Cần thêm "Bearer" vì nên tuân thủ theo tiêu chuẩn OAuth 2.0 trong việc xác định loại token đang sử dụng
  // Bearer là định nghĩa cho loại token dành cho việc xác thực và ủy quyền, có các loại token khác như Basic token, Digest token, OAuth token,...
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}, function (error) {
  // Do something with request error
  return Promise.reject(error)
})

// Add a response interceptor
authorizedAxiosInstance.interceptors.response.use(function (response) {
  // Mọi mã http status code nằm trong khoảng 200 - 299 sẽ là thành công thì rơi vào đây
  return response
}, (error) => {
  // Mọi mã http status code không nằm trong khoảng 200 - 299 sẽ là thất bại thì rơi vào đây
  // Nếu API trả về mã lỗi 401 thì cho người dùng logout luôn
  if (error?.response?.status === 401) {
    handleLogoutAPI().then(() => {
      location.href = '/login'
    })
  }

  // Nếu API trả về mã lỗi 410 thì gọi API refreshToken tạo accessToken mới
  // Đầu tiên lấy được các request API đang bị lỗi thông qua error.config
  const originalRequest = error.config
  if (error?.response?.status === 410 && !originalRequest._retry) {
    // Gán thêm 1 giá trị _retry luôn = true trong khoảng thời gian chờ, để việc refreshToken này chỉ gọi 1 lần tại 1 thời điểm
    originalRequest._retry = true
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      // Phải có return ở đây thì authorizedAxiosInstance(originalRequest) mới hoạt động
      return refreshTokenAPI(refreshToken)
        .then((res) => {
          // Trường hợp 1: Dùng localstorage -> Lấy và gán lại accessToken vào localstorage
          // eslint-disable-next-line no-unsafe-optional-chaining
          const { accessToken } = res?.data
          localStorage.setItem('accessToken', accessToken)
          authorizedAxiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`

          // Trường hợp 2: Dùng Http Only Cookies -> Đã gắn vào cookies khi gọi refreshTokenAPI

          // return về axios instance kết hợp cái originalRequest để gọi lại những API ban đầu bị lỗi
          return authorizedAxiosInstance(originalRequest)
        })
        .catch((_error) => {
          // Nếu nhận bất kỳ lỗi nào từ API refreshToken thì logout luôn
          handleLogoutAPI().then(() => {
            location.href = '/login'
          })

          return Promise.reject(_error)
        })
    }
  }

  if (error?.response?.status !== 410) {
    toast.error(error.response?.data?.message || error?.message)
  }

  return Promise.reject(error)
})

export default authorizedAxiosInstance