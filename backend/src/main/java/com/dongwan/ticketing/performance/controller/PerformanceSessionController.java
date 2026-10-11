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

import com.dongwan.ticketing.performance.dto.PerformanceSessionCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceSessionResponse;
import com.dongwan.ticketing.performance.dto.PerformanceSessionUpdateRequest;
import com.dongwan.ticketing.performance.service.PerformanceService;
import com.dongwan.ticketing.performance.service.PerformanceSessionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name = "공연 회차 관리", description = "공연 회차 추가,수정,삭제 API")
@RequestMapping("/api/v1/admin/performances/{performanceId}/sessions")
@RestController
public class PerformanceSessionController {

	private final PerformanceSessionService performanceSessionService;

	public PerformanceSessionController(
	        PerformanceSessionService performanceSessionService
	) {
	    this.performanceSessionService = performanceSessionService;
	}

	@Operation(summary = "공연 회차 추가", description = "공연 ID를 통해 공연 회차를 추가합니다.")
	@PostMapping
	public ResponseEntity<PerformanceSessionResponse> create(@PathVariable("performanceId") Long performanceId, @Valid @RequestBody PerformanceSessionCreateRequest request) {
		PerformanceSessionResponse response = performanceSessionService.create(performanceId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@Operation(summary = "공연 회차 조회", description = "공연 ID를 통해 공연 회차를 조회합니다.")
	@GetMapping
	public ResponseEntity<List<PerformanceSessionResponse>> findAll(@PathVariable("performanceId") Long performanceId) {
		List<PerformanceSessionResponse> result = performanceSessionService.findAll(performanceId);
		return ResponseEntity.ok(result);
	}
	
	@Operation(summary="공연 회차 수정", description="공연 ID를 통해 공연 회차를 수정합니다.")
	@PutMapping("/{sessionId}")
	public ResponseEntity<PerformanceSessionResponse> update(@PathVariable("performanceId") Long performanceId, @PathVariable("sessionId") Long sessionId, @RequestBody PerformanceSessionUpdateRequest request){
		PerformanceSessionResponse result = performanceSessionService.update(performanceId, sessionId, request);
		return ResponseEntity.ok(result);
	}
	
	@Operation(summary="공연 회차 삭제", description ="공연 ID를 통해 공연 회차를 삭제합니다.")
	@DeleteMapping("/{sessionId}")
	public ResponseEntity<Void> delete(@PathVariable("performanceId") Long performanceId, @PathVariable("sessionId") Long sessionId){
		performanceSessionService.delete(performanceId, sessionId);
		return ResponseEntity.noContent().build();
	}

}
