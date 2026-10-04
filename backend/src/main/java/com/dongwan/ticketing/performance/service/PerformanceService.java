package com.dongwan.ticketing.performance.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dongwan.ticketing.performance.domain.Performance;
import com.dongwan.ticketing.performance.dto.PerformanceCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceCreateResponse;
import com.dongwan.ticketing.performance.repository.PerformanceRepository;

@Service
public class PerformanceService {

    private final PerformanceRepository performanceRepository;

    public PerformanceService(PerformanceRepository performanceRepository) {
        this.performanceRepository = performanceRepository;
    }

    @Transactional
    public PerformanceCreateResponse create(PerformanceCreateRequest request) {

        Performance performance = new Performance(
                request.title(),
                request.description(),
                request.category(),
                request.ageRating()
        );

        Performance savedPerformance = performanceRepository.save(performance);

        return new PerformanceCreateResponse(
                savedPerformance.getId(),
                savedPerformance.getTitle(),
                savedPerformance.getDescription(),
                savedPerformance.getCategory(),
                savedPerformance.getAgeRating()
        );
    }
}