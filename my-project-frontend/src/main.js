
import { createApp } from 'vue'
import App from './App.vue'
import router from "@/router";
import axios from "axios";
import 'element-plus/theme-chalk/dark/css-vars.css'

// 请求走后端服务器
axios.defaults.baseURL = 'http://localhost:8080'


const app = createApp(App)

app.use(router)

app.mount('#app')