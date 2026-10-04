package com.dongwan.ticketing.performance.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dongwan.ticketing.performance.dto.PerformanceCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceCreateResponse;
import com.dongwan.ticketing.performance.service.PerformanceService;

import jakarta.validation.Valid;

@RequestMapping("/api/v1/admin/performances")
@RestController
public class PerformanceController {

	private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }
	
	@PostMapping
	public ResponseEntity<PerformanceCreateResponse> create(@Valid @RequestBody PerformanceCreateRequest request) {
		PerformanceCreateResponse response = performanceService.create(request);
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(response);
	}
}
