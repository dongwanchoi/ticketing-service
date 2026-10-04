package com.dongwan.ticketing.performance.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dongwan.ticketing.performance.domain.Performance;

public interface PerformanceRepository extends JpaRepository<Performance, Long> {

}
