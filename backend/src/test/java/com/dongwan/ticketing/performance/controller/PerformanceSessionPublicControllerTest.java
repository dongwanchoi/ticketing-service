package com.dongwan.ticketing.performance.controller;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.dongwan.ticketing.auth.repository.AppUserRepository;
import com.dongwan.ticketing.config.SecurityConfig;
import com.dongwan.ticketing.performance.dto.PublicPerformanceSessionResponse;
import com.dongwan.ticketing.performance.service.PublicPerformanceSessionService;

@WebMvcTest(PerformanceSessionPublicController.class)
@Import({SecurityConfig.class, PerformanceSessionPublicControllerTest.TestSecurity.class})
class PerformanceSessionPublicControllerTest {
    @TestConfiguration
    @EnableWebSecurity
    static class TestSecurity {}

    @Autowired MockMvc mvc;
    @MockitoBean PublicPerformanceSessionService sessions;
    @MockitoBean AppUserRepository users;

    @Test
    void anonymousGetExposesOnlyPublicSummary() throws Exception {
        when(sessions.findAll(1L)).thenReturn(List.of(new PublicPerformanceSessionResponse(2L,
                LocalDateTime.of(2027, 1, 1, 19, 0), new BigDecimal("50000.00"), new BigDecimal("100000.00"), 2)));
        mvc.perform(get("/api/v1/performances/1/sessions"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].sessionId").value(2))
                .andExpect(jsonPath("$[0].startsAt").value("2027-01-01T19:00:00"))
                .andExpect(jsonPath("$[0].minPrice").value(50000)).andExpect(jsonPath("$[0].maxPrice").value(100000))
                .andExpect(jsonPath("$[0].remainingSeatCount").value(2))
                .andExpect(jsonPath("$[0].venue").doesNotExist()).andExpect(jsonPath("$[0].venueId").doesNotExist())
                .andExpect(jsonPath("$[0].seats").doesNotExist()).andExpect(jsonPath("$[0].seatId").doesNotExist())
                .andExpect(jsonPath("$[0].length()").value(5));
    }

    @Test
    void emptySessionsAndMissingPerformanceRemainDistinct() throws Exception {
        when(sessions.findAll(1L)).thenReturn(List.of());
        when(sessions.findAll(99L)).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));
        mvc.perform(get("/api/v1/performances/1/sessions")).andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/api/v1/performances/99/sessions")).andExpect(status().isNotFound());
    }

    @Test
    void noSeatsHaveNullPricesAndZeroRemaining() throws Exception {
        when(sessions.findAll(1L)).thenReturn(List.of(new PublicPerformanceSessionResponse(2L,
                LocalDateTime.of(2027, 1, 1, 19, 0), null, null, 0)));
        mvc.perform(get("/api/v1/performances/1/sessions")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].minPrice").isEmpty()).andExpect(jsonPath("$[0].maxPrice").isEmpty())
                .andExpect(jsonPath("$[0].remainingSeatCount").value(0));
    }

    @Test
    void adminIndividualSessionAndSeatReadsRemainDenied() throws Exception {
        for (String path : List.of("/api/v1/admin/performances/1/sessions", "/api/v1/performances/1/sessions/2",
                "/api/v1/performances/1/sessions/2/seats", "/api/v1/performances/1/sessions/2/seats/3")) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).with(user("test").roles("ADMIN"))).andExpect(status().isForbidden());
        }
        verifyNoInteractions(sessions);
    }

    @Test
    void writesRemainDeniedEvenWithAuthenticationAndCsrf() throws Exception {
        mvc.perform(post("/api/v1/performances/1/sessions").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/performances/1/sessions").with(user("test")).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/performances/1/sessions").with(user("test")).with(csrf()))
                .andExpect(status().isForbidden());
        verifyNoInteractions(sessions);
    }
}
