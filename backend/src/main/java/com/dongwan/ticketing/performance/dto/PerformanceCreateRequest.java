package com.dongwan.ticketing.performance.dto;

import com.dongwan.ticketing.performance.domain.AgeRating;
import com.dongwan.ticketing.performance.domain.Category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PerformanceCreateRequest(

        @NotBlank
        String title,

        String description,

        @NotNull
        Category category,

        @NotNull
        AgeRating ageRating

) {
}