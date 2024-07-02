import axios from 'axios'
import { toast } from 'react-toastify'

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
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  return response
}, function (error) {
  // Mọi mã http status code không nằm trong khoảng 200 - 299 sẽ là thất bại thì rơi vào đây
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  if (error?.response?.status !== 410) {
    toast.error(error.response?.data?.message || error?.message)
  }

  return Promise.reject(error)
})

export default authorizedAxiosInstance