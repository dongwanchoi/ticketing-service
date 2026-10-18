package com.dongwan.ticketing.performance.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dongwan.ticketing.performance.dto.PerformanceSaleCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceSaleResponse;
import com.dongwan.ticketing.performance.dto.PerformanceSaleUpdateRequest;
import com.dongwan.ticketing.performance.service.PerformanceSaleService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "공연 판매 정책 관리", description = "공연 판매 정책 관리 API")
@RequestMapping("/api/v1/admin/performances/{performanceId}/sale")
@RestController
public class PerformanceSaleController {

	private final PerformanceSaleService performanceSaleService;

	PerformanceSaleController(PerformanceSaleService performanceSaleService) {
		this.performanceSaleService = performanceSaleService;
	}

	@Operation(summary = "공연 판매 정책 등록", description = "특정 공연의 판매 정책을 추가합니다.")
	@PostMapping
	public ResponseEntity<PerformanceSaleResponse> create(@PathVariable("performanceId") Long performanceId,
			@Valid @RequestBody PerformanceSaleCreateRequest request) {
		PerformanceSaleResponse response = performanceSaleService.create(performanceId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@Operation(summary = "공연 판매 정책 조회", description = "특정 공연의 판매 정책을 조회합니다.")
	@GetMapping
	public ResponseEntity<PerformanceSaleResponse> findByPerformanceId(
			@PathVariable("performanceId") Long performanceId) {
		PerformanceSaleResponse response = performanceSaleService.findByPerformanceId(performanceId);
		return ResponseEntity.ok(response);
	}
	
	@Operation(summary = "공연 판매 정책 수정", description = "특정 공연의 판매 정책을 수정합니다.")
	@PutMapping
	public ResponseEntity<PerformanceSaleResponse> update(@PathVariable("performanceId") Long performanceId,@Valid @RequestBody PerformanceSaleUpdateRequest request){
		PerformanceSaleResponse response = performanceSaleService.update(performanceId, request);
		return ResponseEntity.ok(response);
	}

}
