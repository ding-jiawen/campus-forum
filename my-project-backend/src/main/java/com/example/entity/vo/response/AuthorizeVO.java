package com.example.entity.vo.response;

import lombok.Data;

import java.util.Date;

/**
 * 用户信息
 */

@Data
public class AuthorizeVO {
    String username;
    String role;
    String token;
    Date expire;
}
