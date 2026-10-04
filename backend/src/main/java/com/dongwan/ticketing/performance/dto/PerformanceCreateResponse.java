package com.dongwan.ticketing.performance.dto;

import com.dongwan.ticketing.performance.domain.AgeRating;
import com.dongwan.ticketing.performance.domain.Category;

import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record PerformanceCreateResponse(

		Long id,
        String title,
        String description,
        Category category,
        AgeRating ageRating

) {
}