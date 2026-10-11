package com.dongwan.ticketing.performance.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dongwan.ticketing.performance.domain.Seat;

public interface SeatRepository extends JpaRepository<Seat, Long>{

	List<Seat> findByVenue_Id(Long venueId);
}
