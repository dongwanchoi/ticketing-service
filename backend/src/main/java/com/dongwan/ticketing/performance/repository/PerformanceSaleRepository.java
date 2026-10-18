package com.dongwan.ticketing.performance.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dongwan.ticketing.performance.domain.PerformanceSale;	

public interface PerformanceSaleRepository extends JpaRepository<PerformanceSale, Long>{
	Optional<PerformanceSale> findByPerformance_Id(Long performanceId);
	boolean existsByPerformance_Id(Long performanceId);
}
