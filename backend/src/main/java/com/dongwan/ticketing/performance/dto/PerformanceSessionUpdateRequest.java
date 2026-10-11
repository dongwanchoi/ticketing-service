package com.dongwan.ticketing.performance.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public record PerformanceSessionUpdateRequest(

		@NotNull LocalDateTime startsAt

){
}
