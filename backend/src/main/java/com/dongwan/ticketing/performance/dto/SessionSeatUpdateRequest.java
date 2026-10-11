package com.dongwan.ticketing.performance.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SessionSeatUpdateRequest(

        @NotNull
        @Positive
        BigDecimal price

) {
}