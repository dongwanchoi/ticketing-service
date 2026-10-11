package com.dongwan.ticketing.performance.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.performance.domain.Seat;
import com.dongwan.ticketing.performance.domain.Venue;
import com.dongwan.ticketing.performance.dto.SeatRequest;
import com.dongwan.ticketing.performance.dto.SeatResponse;
import com.dongwan.ticketing.performance.repository.SeatRepository;
import com.dongwan.ticketing.performance.repository.VenueRepository;

@Service
public class SeatService {

	private final SeatRepository seatRepository;
	private final VenueRepository venueRepository;

	public SeatService(SeatRepository seatRepository, VenueRepository venueRepository) {
		this.seatRepository = seatRepository;
		this.venueRepository = venueRepository;
	}

	@Transactional
	public SeatResponse create(Long venueId, SeatRequest request) {
		Venue venue = venueRepository.findById(venueId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연장을 찾을 수 없습니다."));

		Seat seat = new Seat(venue, request.section(), request.rowLabel(), request.seatNumber());
		
		Seat savedSeat = seatRepository.save(seat);

		SeatResponse response = new SeatResponse(savedSeat.getId(), savedSeat.getVenue().getId(), savedSeat.getSection(),
				savedSeat.getRowLabel(), savedSeat.getSeatNumber());
		return response;
	}
	
	@Transactional(readOnly = true)
	public List<SeatResponse> findAll(Long venueId) {
		venueRepository.findById(venueId).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연장을 찾을 수 없습니다."));
		
		List<Seat> seats = seatRepository.findByVenue_Id(venueId);
		List<SeatResponse> responses = new ArrayList<>(); 
		for(Seat seat: seats) {
			SeatResponse response = new SeatResponse(seat.getId(), seat.getVenue().getId(), seat.getSection(), seat.getRowLabel(), seat.getSeatNumber());
			responses.add(response);
		}
		return responses;
	}
}
