package com.dongwan.ticketing.performance.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dongwan.ticketing.performance.dto.PublicPerformanceSessionResponse;
import com.dongwan.ticketing.performance.service.PublicPerformanceSessionService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "공연 회차 조회", description = "구매자용 공연 회차 요약 API")
@RestController
@RequestMapping("/api/v1/performances/{performanceId}/sessions")
public class PerformanceSessionPublicController {
    private final PublicPerformanceSessionService sessions;

    public PerformanceSessionPublicController(PublicPerformanceSessionService sessions) {
        this.sessions = sessions;
    }

    @Operation(summary = "공연 회차 요약 조회",
            description = "일정과 전체 등록 좌석의 가격 범위를 조회합니다. 예약·홀드 모델 도입 전까지 잔여 좌석 수는 등록된 회차 좌석 수입니다.")
    @GetMapping
    public List<PublicPerformanceSessionResponse> findAll(@PathVariable("performanceId") Long performanceId) {
        return sessions.findAll(performanceId);
    }
}
