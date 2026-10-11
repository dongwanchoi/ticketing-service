package com.dongwan.ticketing.performance.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dongwan.ticketing.performance.dto.VenueCreateRequest;
import com.dongwan.ticketing.performance.dto.VenueResponse;
import com.dongwan.ticketing.performance.service.VenueService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Tag(name ="공연 장소 관리", description ="장소 API")
@RequestMapping("/api/v1/admin/venues")
@RestController
public class VenueController {

	private final VenueService venueService;
	
	public VenueController(VenueService venueService) {
		this.venueService = venueService;
	}
	
	@PostMapping
	public ResponseEntity<VenueResponse> create(@Valid @RequestBody VenueCreateRequest request){
		VenueResponse result = venueService.create(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(result);
	}
	
	@GetMapping
	public ResponseEntity<List<VenueResponse>> findAll(){
		List<VenueResponse> response = venueService.findAll();
		return ResponseEntity.ok(response);
	}
	
	
}
