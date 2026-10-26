package com.dongwan.ticketing.performance.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.performance.dto.PublicPerformanceSessionResponse;
import com.dongwan.ticketing.performance.repository.PerformanceRepository;
import com.dongwan.ticketing.performance.repository.PerformanceSessionRepository;

@Service
@Transactional(readOnly = true)
public class PublicPerformanceSessionService {
    private final PerformanceRepository performances;
    private final PerformanceSessionRepository sessions;

    public PublicPerformanceSessionService(PerformanceRepository performances, PerformanceSessionRepository sessions) {
        this.performances = performances;
        this.sessions = sessions;
    }

    public List<PublicPerformanceSessionResponse> findAll(Long performanceId) {
        if (!performances.existsById(performanceId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공연을 찾을 수 없습니다.");
        }
        return sessions.findPublicSummaries(performanceId);
    }
}
