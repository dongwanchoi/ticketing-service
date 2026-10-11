package com.dongwan.ticketing.performance.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.performance.domain.Performance;
import com.dongwan.ticketing.performance.domain.PerformanceSession;
import com.dongwan.ticketing.performance.domain.Venue;
import com.dongwan.ticketing.performance.dto.PerformanceSessionCreateRequest;
import com.dongwan.ticketing.performance.dto.PerformanceSessionResponse;
import com.dongwan.ticketing.performance.dto.PerformanceSessionUpdateRequest;
import com.dongwan.ticketing.performance.repository.PerformanceRepository;
import com.dongwan.ticketing.performance.repository.PerformanceSessionRepository;
import com.dongwan.ticketing.performance.repository.VenueRepository;

@Service
public class PerformanceSessionService {

	private final PerformanceSessionRepository performanceSessionRepository;
	private final PerformanceRepository performanceRepository;
	private final VenueRepository venueRepository;
	
	public PerformanceSessionService(PerformanceSessionRepository performanceSessionRepository, PerformanceRepository performanceRepository, VenueRepository venueRepository) {
		this.performanceSessionRepository = performanceSessionRepository;
		this.performanceRepository = performanceRepository;
		this.venueRepository = venueRepository;
	}

	@Transactional
	public PerformanceSessionResponse create(Long performanceId, PerformanceSessionCreateRequest request) {
		Performance performance = performanceRepository.findById(performanceId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다."));
		Venue venue = venueRepository.findById(request.venueId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연장을 찾을 수 없습니다."));

		PerformanceSession session = new PerformanceSession(performance, venue, request.startsAt());
		PerformanceSession savedSession = performanceSessionRepository.save(session);

		return new PerformanceSessionResponse(savedSession.getId(), savedSession.getPerformance().getId(), savedSession.getVenue().getId(),
				savedSession.getStartsAt());
	}

	@Transactional(readOnly = true)
	public List<PerformanceSessionResponse> findAll(Long performanceId) {
		performanceRepository.findById(performanceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다."));

		List<PerformanceSession> sessions = performanceSessionRepository.findByPerformance_Id(performanceId);
		List<PerformanceSessionResponse> responses = new ArrayList<>();

		for (PerformanceSession session : sessions) {
			PerformanceSessionResponse response = new PerformanceSessionResponse(session.getId(),session.getPerformance().getId(),session.getVenue().getId(),session.getStartsAt());
			responses.add(response);
		}
		return responses;
	}

	@Transactional
	public PerformanceSessionResponse update(Long performanceId, Long sessionId,
			PerformanceSessionUpdateRequest request) {
		performanceRepository.findById(performanceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다."));

		PerformanceSession session = performanceSessionRepository.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연 회차를 찾을 수 없습니다."));

		if (!session.getPerformance().getId().equals(performanceId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 회차를 찾을 수 없습니다.");
		}

		session.update(request.startsAt());
		return new PerformanceSessionResponse(session.getId(), session.getPerformance().getId(),session.getVenue().getId(), session.getStartsAt());
	}
	
	@Transactional
	public void delete(Long performanceId, Long sessionId) {
		performanceRepository.findById(performanceId).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연을 찾을 수 없습니다.")); 
		PerformanceSession session = performanceSessionRepository.findById(sessionId).orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "공연 회차를 찾을 수 없습니다."));      
		if(!session.getPerformance().getId().equals(performanceId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 공연의 회차를 찾을 수 없습니다."); 
		}
		performanceSessionRepository.deleteById(sessionId);
	}
}
