package com.dongwan.ticketing.performance.dto;

import java.time.LocalDateTime;

import com.dongwan.ticketing.performance.domain.SaleStatus;

import jakarta.validation.constraints.NotNull;

public record PerformanceSaleUpdateRequest (

	LocalDateTime salesStartAt,
	LocalDateTime salesEndAt,
	
	@NotNull
	SaleStatus status
){
}
