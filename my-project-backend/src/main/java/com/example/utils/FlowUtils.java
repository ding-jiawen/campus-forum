package com.example.utils;

import jakarta.annotation.Resource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class FlowUtils {

    @Resource
    StringRedisTemplate stringRedisTemplate;

    public boolean limitOnceCheck(String key, int blockTime) {
        if(Boolean.TRUE.equals(stringRedisTemplate.hasKey(key))) { // redis中有该验证码 说明要进行限流
            return false;
        } else {
            stringRedisTemplate.opsForValue().set(key,"",  blockTime, TimeUnit.SECONDS);
            return true;
        }
    }
}
