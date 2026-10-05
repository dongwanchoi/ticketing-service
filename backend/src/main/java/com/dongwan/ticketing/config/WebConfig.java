package com.dongwan.ticketing.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration //애플리케이션 설정 클래스
public class WebConfig implements WebMvcConfigurer { //Spring MVC 기본 설정 커스텀 인터페이스
	
	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**") //api로 시작하는 모든 API 허용
				.allowedOrigins("http://localhost:3000")//CORS 허용 범위 지정
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
		  		.allowedHeaders("*");
	}
}
