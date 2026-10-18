package com.dongwan.ticketing.performance.controller;

import com.dongwan.ticketing.performance.dto.SaleAvailabilityResponse;
import com.dongwan.ticketing.performance.service.PerformanceSaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "공연 판매 정보", description = "구매자용 공연 판매 정보 API")
@RequestMapping("/api/v1/performances")
@RestController
public class PerformanceSalePublicController {

	private final PerformanceSaleService performanceSaleService;

	public PerformanceSalePublicController(PerformanceSaleService performanceSaleService) {
		this.performanceSaleService = performanceSaleService;
	}

	@Operation(summary = "공연 예매 가능 여부 조회", description = "판매 상태 및 판매 기간을 기준으로 현재 예매 가능 여부를 반환합니다.")
	@GetMapping("/{performanceId}/sale-availability")
	public ResponseEntity<SaleAvailabilityResponse> getSaleAvailability(@PathVariable("performanceId") Long performanceId) {
		boolean onSale = performanceSaleService.isOnSale(performanceId);

		SaleAvailabilityResponse response = new SaleAvailabilityResponse(performanceId, onSale);

		return ResponseEntity.ok(response);
	}
}