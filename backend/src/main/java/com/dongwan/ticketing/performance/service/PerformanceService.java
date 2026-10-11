package com.dongwan.ticketing.performance.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.performance.domain.Performance;
import com.dongwan.ticketing.performance.dto.PerformanceCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceResponse;
import com.dongwan.ticketing.performance.dto.PerformanceUpdateRequest;
import com.dongwan.ticketing.performance.repository.PerformanceRepository;
	
@Service
public class PerformanceService {

    private final PerformanceRepository performanceRepository;

    public PerformanceService(PerformanceRepository performanceRepository) {
        this.performanceRepository = performanceRepository;
    }

    @Transactional
    public PerformanceResponse findDetail(Long id) {
    	Performance performance = performanceRepository.findById(id)
    			.orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다."));
    	
    	PerformanceResponse response = new PerformanceResponse(
	            performance.getId(),
	            performance.getTitle(),
	            performance.getDescription(),
	            performance.getCategory(),
	            performance.getAgeRating()
	        );
    	return response;
    }
    
    @Transactional
    public void delete(Long id) {
    	Performance performance = performanceRepository.findById(id)
    			.orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다."));
    	performanceRepository.delete(performance);
    }
    
    @Transactional
    public PerformanceResponse update(Long id, PerformanceUpdateRequest request) {
    	Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다."));
    	   performance.update(request.title(), request.description(), request.category(), request.ageRating());

    	   return new PerformanceResponse(
    	            performance.getId(),
    	            performance.getTitle(),
    	            performance.getDescription(),
    	            performance.getCategory(),
    	            performance.getAgeRating()
    	    );
    }
    
    public List<PerformanceResponse> findAll() {
    	List<Performance> performances = performanceRepository.findAll();
    	List<PerformanceResponse> responses  = new ArrayList<>();

    	for(Performance performance : performances) {
    		PerformanceResponse response = new PerformanceResponse(
    	            performance.getId(),
    	            performance.getTitle(),
    	            performance.getDescription(),
    	            performance.getCategory(),
    	            performance.getAgeRating()
    	        );
    		System.out.println(response);
    		responses.add(response);
    	}
    	
    	return responses;
    }
    
    @Transactional
    public PerformanceResponse create(PerformanceCreateRequest request) {

        Performance performance = new Performance(
                request.title(),
                request.description(),
                request.category(),
                request.ageRating()
        );

        Performance savedPerformance = performanceRepository.save(performance);

        return new PerformanceResponse(
                savedPerformance.getId(),
                savedPerformance.getTitle(),
                savedPerformance.getDescription(),
                savedPerformance.getCategory(),
                savedPerformance.getAgeRating()
        );
    }
}