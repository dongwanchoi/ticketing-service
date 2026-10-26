package com.dongwan.ticketing.performance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.performance.dto.PublicPerformanceSessionResponse;
import com.dongwan.ticketing.performance.repository.PerformanceRepository;
import com.dongwan.ticketing.performance.repository.PerformanceSessionRepository;

class PublicPerformanceSessionServiceTest {
    private final PerformanceRepository performances = mock(PerformanceRepository.class);
    private final PerformanceSessionRepository sessions = mock(PerformanceSessionRepository.class);
    private final PublicPerformanceSessionService service = new PublicPerformanceSessionService(performances, sessions);

    @Test
    void missingPerformanceIs404AndDoesNotQuerySessions() {
        when(performances.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> service.findAll(99L)).isInstanceOfSatisfying(ResponseStatusException.class,
                error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verifyNoInteractions(sessions);
    }

    @Test
    void existingPerformanceWithoutSessionsReturnsEmptyList() {
        when(performances.existsById(1L)).thenReturn(true);
        when(sessions.findPublicSummaries(1L)).thenReturn(List.of());
        assertThat(service.findAll(1L)).isEmpty();
    }

    @Test
    void returnsAggregateSummariesWithoutLoadingIndividualSeats() {
        var summary = new PublicPerformanceSessionResponse(3L, LocalDateTime.of(2027, 1, 1, 19, 0),
                new BigDecimal("50000"), new BigDecimal("100000"), 2L);
        when(performances.existsById(1L)).thenReturn(true);
        when(sessions.findPublicSummaries(1L)).thenReturn(List.of(summary));
        assertThat(service.findAll(1L)).containsExactly(summary);
        verify(performances).existsById(1L);
        verify(sessions).findPublicSummaries(1L);
        verifyNoMoreInteractions(performances, sessions);
    }
}
