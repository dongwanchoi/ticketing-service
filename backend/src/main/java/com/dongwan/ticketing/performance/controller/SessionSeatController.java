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

import com.dongwan.ticketing.performance.dto.SessionSeatRequest;
import com.dongwan.ticketing.performance.dto.SessionSeatResponse;
import com.dongwan.ticketing.performance.dto.SessionSeatUpdateRequest;
import com.dongwan.ticketing.performance.service.SessionSeatService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name="회차 별 좌석 관리", description="회차 별 좌석 관리 API")
@RequestMapping("/api/v1/admin/performances/{performanceId}/sessions/{sessionId}/seats")
@RestController
public class SessionSeatController {
	
	private final SessionSeatService sessionSeatService;
	
	SessionSeatController(SessionSeatService sessionSeatService){
		this.sessionSeatService = sessionSeatService;
	}
	
	@Operation(summary = "판매 좌석 등록", description = "ID를 받아서 특정 회차에 좌석 1개를 판매 좌석 등록합니다.")
	@PostMapping
	public ResponseEntity<SessionSeatResponse> create(@PathVariable("performanceId") Long performanceId, @PathVariable("sessionId") Long sessionId, @Valid @RequestBody SessionSeatRequest request){
		SessionSeatResponse response = sessionSeatService.create(performanceId, sessionId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}
	
	@Operation(summary = "회차별 판매 좌석 목록 조회", description = "ID를 받아서 회차별 판매 좌석 목록을 조회합니다.")
	@GetMapping
	public ResponseEntity<List<SessionSeatResponse>> findAll(@PathVariable("performanceId") Long performanceId, @PathVariable("sessionId") Long sessionId){
		List<SessionSeatResponse> responses = sessionSeatService.findAll(performanceId, sessionId);
		return ResponseEntity.ok(responses);
	}
	@Operation(summary = "회차별 판매 좌석 가격 수정", description = "ID를 받아서 회차별 판매 좌석 가격을 수정합니다.")
	@PutMapping("/{sessionSeatId}")
	public ResponseEntity<SessionSeatResponse> update(@PathVariable("performanceId") Long performanceId, @PathVariable("sessionId") Long sessionId, @PathVariable("sessionSeatId") Long sessionSeatId,@Valid @RequestBody SessionSeatUpdateRequest request) {
		SessionSeatResponse response = sessionSeatService.update(performanceId,sessionId, sessionSeatId, request);
		return ResponseEntity.ok(response);
	}
	
	@Operation(summary = "회차별 판매 좌석 삭제", description = "ID를 받아서 회차별 판매 좌석 가격을 삭제합니다.")
	@DeleteMapping("/{sessionSeatId}")
	public ResponseEntity<Void> delete(@PathVariable("performanceId") Long performanceId, @PathVariable("sessionId") Long sessionId, @PathVariable("sessionSeatId") Long sessionSeatId){
		sessionSeatService.delete(performanceId, sessionId, sessionSeatId);
		return ResponseEntity.noContent().build();
	}

}
