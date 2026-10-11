package com.dongwan.ticketing.performance.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dongwan.ticketing.performance.domain.Venue;

public interface VenueRepository extends JpaRepository<Venue, Long>{

}
