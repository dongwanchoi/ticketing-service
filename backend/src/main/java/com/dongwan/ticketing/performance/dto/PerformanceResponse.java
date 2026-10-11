package com.dongwan.ticketing.performance.dto;

import com.dongwan.ticketing.performance.domain.AgeRating;
import com.dongwan.ticketing.performance.domain.Category;

public record PerformanceResponse(
		
		Long id,
        String title,
        String description,
        Category category,
        AgeRating ageRating
) {
}
