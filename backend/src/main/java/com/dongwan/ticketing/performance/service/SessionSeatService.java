package com.dongwan.ticketing.performance.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.performance.domain.PerformanceSession;
import com.dongwan.ticketing.performance.domain.Seat;
import com.dongwan.ticketing.performance.domain.SessionSeat;
import com.dongwan.ticketing.performance.dto.SessionSeatRequest;
import com.dongwan.ticketing.performance.dto.SessionSeatResponse;
import com.dongwan.ticketing.performance.dto.SessionSeatUpdateRequest;
import com.dongwan.ticketing.performance.repository.PerformanceSessionRepository;
import com.dongwan.ticketing.performance.repository.SeatRepository;
import com.dongwan.ticketing.performance.repository.SessionSeatRepository;

@Service
public class SessionSeatService {

	private final PerformanceSessionRepository performanceSessionRepository;
	private final SeatRepository seatRepository;
	private final SessionSeatRepository sessionSeatRepository;

	public SessionSeatService(PerformanceSessionRepository performanceSessionRepository, SeatRepository seatRepository,
			SessionSeatRepository sessionSeatRepository) {
		this.performanceSessionRepository = performanceSessionRepository;
		this.seatRepository = seatRepository;
		this.sessionSeatRepository = sessionSeatRepository;
	}

	@Transactional
	public SessionSeatResponse create(Long performanceId, Long sessionId, SessionSeatRequest request) {
		PerformanceSession session = performanceSessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연 회차를 찾을 수 없습니다."));
		if (!session.getPerformance().getId().equals(performanceId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 회차를 찾을 수 없습니다.");
		}
		Seat seat = seatRepository.findById(request.seatId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "좌석을 찾을 수 없습니다."));

		if (!session.getVenue().getId().equals(seat.getVenue().getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 공연장의 좌석이 아닙니다.");
		}

		SessionSeat sessionSeat = new SessionSeat(session, seat, request.price());

		SessionSeat savedSessionSeat = sessionSeatRepository.save(sessionSeat);
		SessionSeatResponse response = new SessionSeatResponse(savedSessionSeat.getId(),
				savedSessionSeat.getPerformanceSession().getId(), savedSessionSeat.getSeat().getId(),
				savedSessionSeat.getPrice());
		return response;
	}

	@Transactional(readOnly = true)
	public List<SessionSeatResponse> findAll(Long performanceId, Long sessionId) {
		PerformanceSession session = performanceSessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연 회차를 찾을 수 없습니다."));

		if (!session.getPerformance().getId().equals(performanceId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 회차를 찾을 수 없습니다.");
		}
		List<SessionSeat> sessionSeats = sessionSeatRepository.findByPerformanceSession_Id(sessionId);
		List<SessionSeatResponse> responses = new ArrayList<>();
		for (SessionSeat sessionSeat : sessionSeats) {
			SessionSeatResponse response = new SessionSeatResponse(sessionSeat.getId(),
					sessionSeat.getPerformanceSession().getId(), sessionSeat.getSeat().getId(), sessionSeat.getPrice());
			responses.add(response);
		}
		return responses;
	}

	@Transactional
	public SessionSeatResponse update(Long performanceId, Long sessionId, Long sessionSeatId,
			SessionSeatUpdateRequest request) {
		PerformanceSession session = performanceSessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연 회차를 찾을 수 없습니다."));
		if (!session.getPerformance().getId().equals(performanceId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 회차를 찾을 수 없습니다.");
		}
		SessionSeat sessionSeat = sessionSeatRepository.findById(sessionSeatId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "판매 좌석을 찾을 수 없습니다."));
		if (!sessionSeat.getPerformanceSession().getId().equals(sessionId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 회차의 판매 좌석이 아닙니다.");
		}
		sessionSeat.updatePrice(request.price());

		SessionSeatResponse response = new SessionSeatResponse(sessionSeat.getId(), sessionSeat.getPerformanceSession().getId(), sessionSeat.getSeat().getId(), sessionSeat.getPrice());
		return response;
	}
	@Transactional
	public void delete(Long performanceId, Long sessionId, Long sessionSeatId) {
		
		PerformanceSession session = performanceSessionRepository.findById(sessionId).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연 회차를 찾을 수 없습니다.")); 
		if(!session.getPerformance().getId().equals(performanceId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 회차를 찾을 수 없습니다.");
		}
		
		SessionSeat sessionSeat = sessionSeatRepository.findById(sessionSeatId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "판매 좌석을 찾을 수 없습니다."));
		
		if(!sessionSeat.getPerformanceSession().getId().equals(sessionId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 회차의 판매 좌석이 아닙니다.");
		}
		sessionSeatRepository.delete(sessionSeat);
	}
}
