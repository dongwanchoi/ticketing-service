package com.dongwan.ticketing.performance.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dongwan.ticketing.performance.domain.PerformanceSession;

public interface PerformanceSessionRepository extends JpaRepository<PerformanceSession, Long> {

    List<PerformanceSession> findByPerformance_Id(Long performanceId);
}
