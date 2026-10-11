package com.dongwan.ticketing.performance.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dongwan.ticketing.performance.dto.SeatRequest;
import com.dongwan.ticketing.performance.dto.SeatResponse;
import com.dongwan.ticketing.performance.service.SeatService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name ="공연장 좌석 관리", description ="공연장 좌석 관리 API")
@RequestMapping("/api/v1/admin/venues/{venueId}/seats")
@RestController
public class SeatController {
	
	private final SeatService seatService;
	
	public SeatController(SeatService seatService) {
		this.seatService = seatService;
	}
	
	@Operation(summary ="좌석 생성", description ="장소 ID를 통해 좌석 생성합니다.")
	@PostMapping
	public ResponseEntity<SeatResponse> create(@PathVariable("venueId") Long venueId, @Valid @RequestBody SeatRequest request){
		SeatResponse response = seatService.create(venueId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}
	
	@GetMapping
	public ResponseEntity<List<SeatResponse>> findAll(@PathVariable("venueId") Long venueId){
		List<SeatResponse> response = seatService.findAll(venueId);
		return ResponseEntity.ok(response);
	}
}
