package com.dongwan.ticketing.performance.dto;

import java.time.LocalDateTime;

import com.dongwan.ticketing.performance.domain.Performance;

public record PerformanceSessionResponse (
		
		Long id,
		Long performanceId,
		Long venueId,
		LocalDateTime startsAt
){
}
