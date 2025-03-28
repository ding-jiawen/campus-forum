<script setup>

import {computed, reactive, ref} from "vue";
import {Key, Lock, Message, User} from "@element-plus/icons-vue";
import router from "@/router/index.js";
import {ElMessage} from "element-plus";
import {get, post} from "@/net/index.js";

const form = reactive( {
  username: '',
  password: '',
  password_repeat: '',
  email: '',
  code: ''
})


const coldTime = ref(0) // coldTime 发送验证码请求的冷却时间
const formRef = ref() // 验证整个表单

/**
 * 自定义验证用户名
 * @param rule
 * @param value
 * @param callback
 */
const validateUsername = (rule, value, callback) => {
  if(value === '') { // 检查输入是否为空
    callback(new Error('请输入用户名'))
  } else if(!/^a[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(value)) { // 检查用户名是否符合正则表达式
    callback(new Error('用户名不能包含特殊字符，只能是中/英文'))
  } else { // 通过验证
    callback()
  }
}

/**
 * 自定义验证密码
 * @param rule
 * @param value
 * @param callback
 */
const validatePassword = (rule, value, callback) => {
  if(value === '') { // 检查输入是否为空
    callback(new Error('请再次输入密码'))
  } else if(value !== form.password) { //
    callback(new Error('两次输入的密码不一致'))
  } else { // 通过验证
    callback()
  }
}

const rule = {
  username: [
    { validator: validateUsername, trigger: ['blur', 'change']}, // trigger触发验证的事件：blur 失去焦点 change 值变化
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur'},
    { min: 6, max: 20, message: '密码的长度必须在6-20个字符之间', trigger: ['blur', 'change']}
  ],
  password_repeat: [
    { validator: validatePassword, trigger: ['blur', 'change']}
  ],
  email: [
    { required: true, message: '请输入邮件地址', trigger: 'blur'},
    { type: 'email', message: '请输入合法的电子邮件', trigger: ['blur', 'change']}
  ],
  code: [
    { required: true, message: '请输入获取的验证码', trigger: 'blur'}
  ]
}

let intervalId;

/**
 * 发送请求获取验证码
 */
function askCode() {
  if(isEmailValid) {
    coldTime.value = 60

    get(`/api/auth/ask-code?email=${form.email}&type=register`, () => {
      ElMessage.success(`验证码已发送到邮箱：${form.email}，请注意查收`)
      intervalId = setInterval(() => {
        coldTime.value--;
        if (coldTime.value <= 0) {
          clearInterval(intervalId); // 清除定时器
          coldTime.value = 0; // 确保冷却时间不为负 让按钮恢复成请求验证码状态
        }
      }, 1000);
    }, (message) => {
      ElMessage.warning(message)
      coldTime.value = 0
      clearInterval(intervalId) // 请求失败时也停止定时器
    })
  } else {
    ElMessage.warning('请输入正确的电子邮件')
  }
}

const isEmailValid = computed(() => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email))

function register() {
  formRef.value.validate((valid) => {
    if(valid) {
      post('/api/auth/register', {
        username: form.username,
        password: form.password,
        password_repeat: form.password_repeat,
        email: form.email,
        code: form.code
      }, () =>{
        ElMessage.success('注册成功，欢迎加入我们')
        router.push('/')
      })
    } else {
      ElMessage.warning('请完整填写注册表单内容')
    }
  })
}

</script>

<template>
  <div style="text-align: center; margin: 0 20px">
    <div style="margin-top: 100px">
      <div style="font-size: 25px; font-weight: bold">注册新用户</div>
      <div style="font-size: 14px; color: grey">欢迎注册我们的学习平台，请在下方填写相关信息</div>
    </div>
    <div style="margin-top: 50px">
      <el-form :model="form" :rules="rule" ref="formRef">
        <el-form-item prop="username">
          <el-input v-model="form.username" maxlength="10" type="text" placeholder="用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" maxlength="20" type="password" placeholder="密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password_repeat">
          <el-input v-model="form.password_repeat" maxlength="20" type="password" placeholder="确认密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="form.email" type="text" placeholder="邮箱地址">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="code">
          <el-row :gutter="10" style="width: 100%">
            <el-col :span="17">
              <el-input v-model="form.code" maxlength="6" type="text" placeholder="请输入验证码">
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="5">
              <el-button @click="askCode" :disabled="!isEmailValid || coldTime" type="success">
                {{ coldTime > 0 ? `请稍后${coldTime}秒` : '获取验证码' }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </div>
    <div style="margin-top: 80px">
      <el-button @click="register" style="width: 270px" type="primary">立即注册</el-button>
    </div>
    <div style="margin-top: 20px">
      <span style="font-size: 14px; line-height: 15px; color: grey">已有账号？</span>
      <el-link style="translate: 0 -1px" @click="router.push('/')">立即登录</el-link>
    </div>
  </div>
</template>

<style scoped>

</style>