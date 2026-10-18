package com.dongwan.ticketing.performance.service;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.performance.domain.Performance;
import com.dongwan.ticketing.performance.domain.PerformanceSale;
import com.dongwan.ticketing.performance.dto.PerformanceSaleCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceSaleResponse;
import com.dongwan.ticketing.performance.dto.PerformanceSaleUpdateRequest;
import com.dongwan.ticketing.performance.repository.PerformanceRepository;
import com.dongwan.ticketing.performance.repository.PerformanceSaleRepository;

@Service
public class PerformanceSaleService {

	private final PerformanceRepository performanceRepository;
	private final PerformanceSaleRepository performanceSaleRepository;

	PerformanceSaleService(PerformanceSaleRepository performanceSaleRepository,
			PerformanceRepository performanceRepository) {
		this.performanceRepository = performanceRepository;
		this.performanceSaleRepository = performanceSaleRepository;
	}

	@Transactional
	public PerformanceSaleResponse create(Long performanceId, PerformanceSaleCreateRequest request) {
		Performance performance = performanceRepository.findById(performanceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다."));

		if (performanceSaleRepository.existsByPerformance_Id(performanceId)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 판매 정보가 등록된 공연입니다.");
		}

		validateSalePeriod(request.salesStartAt(), request.salesEndAt());
		
		PerformanceSale performanceSale = new PerformanceSale(performance, request.salesStartAt(), request.salesEndAt(),
				request.status());
		PerformanceSale savedSale = performanceSaleRepository.save(performanceSale);

		PerformanceSaleResponse response = new PerformanceSaleResponse(savedSale.getId(),
				savedSale.getPerformance().getId(), savedSale.getSalesStartAt(), savedSale.getSalesEndAt(),
				savedSale.getStatus());
		return response;
	}

	@Transactional(readOnly = true)
	public PerformanceSaleResponse findByPerformanceId(Long performanceId) {

		PerformanceSale performanceSale = performanceSaleRepository.findByPerformance_Id(performanceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 판매 정책이 없습니다."));

		return new PerformanceSaleResponse(performanceSale.getId(), performanceSale.getPerformance().getId(),
				performanceSale.getSalesStartAt(), performanceSale.getSalesEndAt(), performanceSale.getStatus());
	}
	
	@Transactional
	public PerformanceSaleResponse update(Long performanceId, PerformanceSaleUpdateRequest request) {
		PerformanceSale performanceSale = performanceSaleRepository.findByPerformance_Id(performanceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 판매 정책이 없습니다."));

		validateSalePeriod(request.salesStartAt(), request.salesEndAt());
		performanceSale.update(request.salesStartAt(), request.salesEndAt(), request.status());
		
		return new PerformanceSaleResponse(performanceSale.getId(), performanceSale.getPerformance().getId(),
				performanceSale.getSalesStartAt(), performanceSale.getSalesEndAt(), performanceSale.getStatus());
	}
	
	private void validateSalePeriod(LocalDateTime start, LocalDateTime end) {
		
		if ((start == null) != (end == null)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매 시작일과 종료일은 모두 입력하거나 모두 생략해야 합니다.");
		}

		if (start != null && !start.isBefore(end)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매 종료일은 시작일보다 늦어야 합니다.");
		}
	}
}
