package com.dongwan.ticketing.performance.dto;

import java.time.LocalDateTime;

import com.dongwan.ticketing.performance.domain.SaleStatus;

public record PerformanceSaleResponse (
		Long id,
		Long performanceId,
		LocalDateTime salesStartAt,
		LocalDateTime salesEndAt,
		SaleStatus status
){
}
