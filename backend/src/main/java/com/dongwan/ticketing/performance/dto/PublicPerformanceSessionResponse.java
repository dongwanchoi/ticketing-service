package com.dongwan.ticketing.performance.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Public summary only; no venue or individual seat information is exposed. */
public record PublicPerformanceSessionResponse(
        Long sessionId,
        LocalDateTime startsAt,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        long remainingSeatCount
) {}
