package com.dongwan.ticketing.performance.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dongwan.ticketing.performance.dto.PerformanceCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceResponse;
import com.dongwan.ticketing.performance.dto.PerformanceUpdateRequest;
import com.dongwan.ticketing.performance.service.PerformanceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "공연 관리", description = " 공연 추가,수정,삭제 API")
@RequestMapping("/api/v1/admin/performances")
@RestController
public class PerformanceController {

	private final PerformanceService performanceService;

	public PerformanceController(PerformanceService performanceService) {
		this.performanceService = performanceService;
	}

	@Operation(summary = "공연 생성", description = "필수 공연 값을 통해 공연 정보를 추가합니다.")
	@PostMapping
	public ResponseEntity<PerformanceResponse> create(@Valid @RequestBody PerformanceCreateRequest request) {
		PerformanceResponse response = performanceService.create(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@Operation(summary = "공연 정보 조회", description = "추가된 공연 리스트를 전부 조회합니다.")
	@GetMapping
	public ResponseEntity<List<PerformanceResponse>> findAll() {
		List<PerformanceResponse> response = performanceService.findAll();
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "공연 단건 수정", description = "공연 ID를 통해 특정 공연의 정보를 수정합니다.")
	@PutMapping("/{id}")
	public ResponseEntity<PerformanceResponse> update(@PathVariable("id") Long id,
			@Valid @RequestBody PerformanceUpdateRequest request) {
		PerformanceResponse response = performanceService.update(id, request);
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "공연 단건 삭제", description = "공연 ID를 통해 특정 공연의 정보를 삭제합니다.")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
		performanceService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@Operation(summary = "공연 상세 보기", description = "공연 ID를 통해 공연 상세 정보를 조회합니다.")
	@GetMapping("/{id}")
	public ResponseEntity<PerformanceResponse> findDetail(@PathVariable("id") Long id) {
		PerformanceResponse response = performanceService.findDetail(id);
		return ResponseEntity.ok(response);
	}
	
	
	
	
}
