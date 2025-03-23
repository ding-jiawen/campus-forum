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
 * 内部使用的Post
 * @param url
 * @param data
 * @param header
 * @param success
 * @param failure
 * @param error
 */
function internalPost(url, data, header, success, failure, error = defaultError) {
    axios.post(url, data, {headers: header}).then(({data}) => {
        if(data.code === 200) {
            success(data.data)
        } else {
            failure(data.message, data.code. data.url)
        }
    }).catch(err => error()) // 捕获其他错误
}

/**
 * 内部使用的Get
 * @param url
 * @param data
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
            failure(data.message, data.code. data.url)
        }
    }).catch(err => error()) // 捕获其他错误
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

export {login}