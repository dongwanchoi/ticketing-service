package com.dongwan.ticketing.performance.dto;

public record SaleAvailabilityResponse(
        Long performanceId,
        boolean onSale
) {
}