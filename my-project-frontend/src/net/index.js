import axios from 'axios'
import {ElMessage} from "element-plus";

const authItemName = "access_token";

/**
 * 默认失败
 * @param message 错误的原因
 * @param code 错误状态码
 * @param url 请求地址
 */
const defaultFailure = (message, code, url) => {
    console.warn(`请求地址：${url}，状态码：${code}， 错误信息：${message}`)
    ElMessage.warning(message)
}


const defaultError = (err) => {
    console.warn(err)
    ElMessage.warning('发生了一些错误，请联系管理员')
}

/**
 * 获取 token
 * @returns {*|null}
 */
function getAccessToken() {
    const str = localStorage.getItem(authItemName) || sessionStorage.getItem(authItemName)
    // 没获取到token 说明没存
    if(!str) return null
    // 重新封装好
    const authObj = JSON.parse(str)
    // 若token过期了，删除token
    if(authObj.expire < new Date()) {
        deleteAccessToken()
        ElMessage.warning('登录状态已过期，请重新登录！')
        return null
    }
    return authObj.token
}

/**
 * 移除 token
 */
function deleteAccessToken() {
    localStorage.removeItem(authItemName)
    sessionStorage.removeItem(authItemName)
}

/**
 *存储 token
 */
function storeAccessToken(token, remember, expire) {
    // 封装好
    const authObj = {token: token, expire: expire}
    const str = JSON.stringify(authObj) // 转成字符串
    // 勾选了记住我 将token存在本地
    if(remember)
        localStorage.setItem(authItemName, str)
    // 否则 存在会话中，关闭游览器就没了
    else
        sessionStorage.setItem(authItemName, str)
}

/**
 * 获取请求头中的令牌
 * @returns {{Authorization: string}}
 */
function accessHeader() {
    const token = getAccessToken();
    return token ? {'Authorization' : `Bearer ${getAccessToken()}`} : {}
}

/**
 * 内部使用的Post
 * @param url 请求的地址
 * @param data 请求的数据
 * @param header 请求头
 * @param success
 * @param failure
 * @param error 出现错误的回调函数
 */
function internalPost(url, data, header, success, failure, error = defaultError) {
    console.log('调用InternalPost接收的data：' + data.code)
    console.log('调用InternalPost接收的url：' + url)
    axios.post(url, data, {headers: header}).then(({data}) => {
        console.log('调用axios.post时的验证码：' + data.code)
        if(data.code === 200) {
            success(data.data)
        } else {
            failure(data.message, data.code, data.url)
        }
    }).catch(err => error(err)) // 捕获其他错误
}

/**
 * 内部使用的Get
 * @param url
 * @param header
 * @param success
 * @param failure
 * @param error
 */
function internalGet(url, header, success, failure, error = defaultError) {
    axios.get(url, {headers: header}).then(({data}) => {
        if(data.code === 200) {
            success(data.data)
        } else {
            failure(data.message, data.code, data.url)
        }
    }).catch(err => error()) // 捕获其他错误
}

/**
 * 暴露给外部用的 get
 */
function get(url, success, failure = defaultFailure) {
    internalGet(url, accessHeader(), success, failure)
}

/**
 * 暴露给外部用的 post
 */
function post(url, data, success, failure = defaultFailure) {
    console.log('post请求时获取的data：' + data)
    console.log('post请求时获取的url：' + url)
    internalPost(url, data, accessHeader(), success, failure)

}

function login(username, password, remember, success, failure = defaultFailure) {
    internalPost('api/auth/login', {
        username: username,
        password: password
    }, {
        'Content-Type': 'application/x-www-form-urlencoded'
    }, (data) => {
        storeAccessToken(data.token, remember, data.expire)
        ElMessage.success(`登录成功，欢迎 ${data.username} 来到我们的系统`)
        success(data)
    }, failure)
}

function logout(success, failure = defaultFailure) {
    get('/api/auth/logout', () => {
        deleteAccessToken()
        ElMessage.success('退出登录成功，欢迎您再次使用')
        success()
    }, failure)
}

/**
 * 是否未进行登录验证
 */
function unauthorized() {
    return !getAccessToken()
}

export {login, logout, get, post, unauthorized}