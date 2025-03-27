package com.example.controller;

import com.example.entity.RestBean;
import com.example.entity.vo.request.EmailRegisterVo;
import com.example.service.AccountService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.function.Supplier;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthorizeController {

    @Resource
    AccountService accountService;

    @GetMapping("/ask-code")
    public RestBean<Void> askVerifyCode(@RequestParam @Email String email,
                                        @RequestParam @Pattern(regexp = "register|reset") String type,
                                        HttpServletRequest request) {
        return this.messageHandler(() ->
                accountService.registerEmailVerifyCode(type, email, request.getRemoteAddr()));
    }

    /**
     * 注册接口
     */
    @PostMapping("/register")
    public RestBean<Void> registerAccount(EmailRegisterVo vo) {
        return this.messageHandler(() -> accountService.registerEmailAccount(vo));
    }

    private RestBean<Void> messageHandler(Supplier<String> action) {
        String message = action.get();
        return message == null ? RestBean.success() : RestBean.failure(400, message);
    }
}
