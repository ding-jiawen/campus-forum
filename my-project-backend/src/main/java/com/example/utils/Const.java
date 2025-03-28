package com.example.utils;

public class Const {
    public static final String JWT_BLACK_LIST = "jwt:blacklist:"; // jwt黑名单

    public static final String VERIFY_EMAIL_LIMIT = "verify:email:limit";
    public static final String VERIFY_EMAIL_DATA = "verify:email:data";

    public static final int ORDER_CORS = -102; // 比过滤器链优先级（-100）高
}
