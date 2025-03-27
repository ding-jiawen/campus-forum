package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.entity.dto.Account;
import com.example.entity.vo.request.EmailRegisterVo;
import org.springframework.security.core.userdetails.UserDetailsService;


public interface AccountService extends IService<Account>, UserDetailsService {
    Account findAccountByNameOrEmail(String test);
    String registerEmailVerifyCode(String type, String email, String ip);
    String registerEmailAccount(EmailRegisterVo vo);

}
