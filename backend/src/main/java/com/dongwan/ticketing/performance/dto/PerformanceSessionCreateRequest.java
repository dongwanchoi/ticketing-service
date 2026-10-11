package com.dongwan.ticketing.performance.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public record PerformanceSessionCreateRequest(

		@NotNull
		Long venueId,
		
		@NotNull 
		LocalDateTime startsAt
		

) {
}
