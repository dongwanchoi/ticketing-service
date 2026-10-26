package com.dongwan.ticketing.performance.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dongwan.ticketing.performance.dto.PerformanceResponse;
import com.dongwan.ticketing.performance.service.PerformanceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "공연 조회", description = "구매자용 공연 조회 API")
@RestController
@RequestMapping("/api/v1/performances")
public class PerformancePublicController {

    private final PerformanceService performanceService;

    public PerformancePublicController(
            PerformanceService performanceService
    ) {
        this.performanceService = performanceService;
    }

    @Operation(
        summary = "공연 목록 조회",
        description = "공연 목록을 조회합니다."
    )
    @GetMapping
    public ResponseEntity<List<PerformanceResponse>> findAll() {

        List<PerformanceResponse> response =
                performanceService.findAll();

        return ResponseEntity.ok(response);
    }
}