package com.dongwan.ticketing.performance.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dongwan.ticketing.performance.domain.SessionSeat;

public interface SessionSeatRepository extends JpaRepository<SessionSeat, Long>{
	List<SessionSeat> findByPerformanceSession_Id(Long sessionId);
}
