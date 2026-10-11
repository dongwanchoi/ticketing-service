package com.dongwan.ticketing.config;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class SwaggerConfig {
	
	public OpenAPI ticketingOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("Ticketing Service API")
						.description("티켓팅 서비스 REST API 문서")
						.version("v1"));
	}

}
