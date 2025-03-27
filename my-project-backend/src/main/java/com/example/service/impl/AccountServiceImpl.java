package com.example.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.dto.Account;
import com.example.entity.vo.request.EmailRegisterVo;
import com.example.mapper.AccountMapper;
import com.example.service.AccountService;
import com.example.utils.Const;
import com.example.utils.FlowUtils;
import jakarta.annotation.Resource;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class AccountServiceImpl extends ServiceImpl<AccountMapper, Account> implements AccountService {

    @Resource
    AmqpTemplate amqpTemplate;

    @Resource
    StringRedisTemplate stringRedisTemplate;

    @Resource
    FlowUtils flowUtils;

    @Resource
    PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = this.findAccountByNameOrEmail(username);
        if(account == null) {
            throw new UsernameNotFoundException("用户名或密码错误");
        }
        return User.withUsername(username)
                .password(account.getPassword())
                .roles(account.getRole())
                .build();
    }

    public Account findAccountByNameOrEmail(String text) {
        return this.query()
                .eq("username", text).or()
                .eq("email", text)
                .one();
    }

    @Override
    public String registerEmailVerifyCode(String type, String email, String ip) {
        synchronized (ip.intern()) { // 用ip当锁，判断ip池中是否有相同的ip
            if(!this.verifyLimit(ip))
                return "请求繁忙，请稍后再试";
            Random random = new Random();
            // 生成6位数的随机验证码
            int code = random.nextInt(899999) + 100000;
            // 将邮件存入消息队列
            Map<String, Object> data = Map.of("type", type, "email", email, "code", code);
            amqpTemplate.convertAndSend("mail", data);
            // 将验证码存入redis 为之后用户注册时校验使用
            stringRedisTemplate.opsForValue()
                    .set(Const.VERIFY_EMAIL_DATA + email, String.valueOf(code), 3, TimeUnit.MINUTES);
            return null;
        }
    }

    @Override
    public String registerEmailAccount(EmailRegisterVo vo) {
        // 注册：1.判断该邮箱是否被注册过；
        // 2.判断用户名是否被占用
        String email = vo.getEmail();
        String key = Const.VERIFY_EMAIL_DATA + email;
        String code = stringRedisTemplate.opsForValue().get(key);
        String username = vo.getUsername();
        if(code == null) {
            return "请先获取验证码";
        }
        if(!code.equals(vo.getCode())) {
            return "验证码错误，请重新输入";
        }
        if(this.existAccountByEmail(email)) {
            return "该邮箱已被注册！";
        }
        if(this.existAccountByUsername(username)) {
            return "该用户名已被占用";
        }
        String password = passwordEncoder.encode(vo.getPassword()); // 对密码进行加密
        Account account = new Account(null, username, password, email, "user", new Date());
        if(this.save(account)) {
            // 使用过该验证码进行注册后，redis中没必要存了
            stringRedisTemplate.delete(key);
            return null;
        }
        else {
            return "内部错误，请联系管理员";
        }
    }

    /**
     * 判断邮箱是否已被注册
     */
    private boolean existAccountByEmail(String email) {
        return this.baseMapper.exists(Wrappers.<Account>query().eq("email", email));
    }

    /**
     * 判断用户名是否被占用
     */
    private boolean existAccountByUsername(String username) {
        return this.baseMapper.exists(Wrappers.<Account>query().eq("username", username));
    }

    /**
     * 判断限流
     */
    public boolean verifyLimit(String ip) {
        String key = Const.VERIFY_EMAIL_LIMIT + ip;
        return flowUtils.limitOnceCheck(key,  60);
    }

}
