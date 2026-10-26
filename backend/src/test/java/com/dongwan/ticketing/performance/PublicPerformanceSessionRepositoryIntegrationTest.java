package com.dongwan.ticketing.performance;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import com.dongwan.ticketing.performance.domain.*;
import com.dongwan.ticketing.performance.repository.*;

// ServiceConnection always supplies an independent container database; never the development datasource.
@Testcontainers
@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=create")
@Transactional
class PublicPerformanceSessionRepositoryIntegrationTest {
    @Container @ServiceConnection
    static final MySQLContainer mysql = new MySQLContainer("mysql:8.4");
    @Autowired PerformanceRepository performances;
    @Autowired PerformanceSessionRepository sessions;
    @Autowired VenueRepository venues;
    @Autowired SeatRepository seats;
    @Autowired SessionSeatRepository sessionSeats;

    @Test
    void aggregatesAndOrdersOnlyTheRequestedPerformanceIncludingSessionsWithoutSeats() {
        var performance = performances.save(new Performance("Isolated concert", null, Category.CONCERT, AgeRating.ALL));
        var other = performances.save(new Performance("Other concert", null, Category.CONCERT, AgeRating.ALL));
        var venue = venues.save(new Venue("Isolated venue", "Test address"));
        var earlier = LocalDateTime.of(2027, 1, 1, 19, 0);
        var later = earlier.plusDays(1);
        var lateSession = sessions.save(new PerformanceSession(performance, venue, later));
        var first = sessions.save(new PerformanceSession(performance, venue, earlier));
        var second = sessions.save(new PerformanceSession(performance, venue, earlier));
        var unrelated = sessions.save(new PerformanceSession(other, venue, earlier));
        var seat1 = seats.save(new Seat(venue, "A", "1", 1));
        var seat2 = seats.save(new Seat(venue, "A", "1", 2));
        sessionSeats.save(new SessionSeat(first, seat1, new BigDecimal("100000.00")));
        sessionSeats.save(new SessionSeat(first, seat2, new BigDecimal("50000.00")));
        sessionSeats.save(new SessionSeat(lateSession, seat1, new BigDecimal("75000.00")));
        sessionSeats.save(new SessionSeat(unrelated, seat1, new BigDecimal("1.00")));
        sessionSeats.flush();

        var result = sessions.findPublicSummaries(performance.getId());
        assertThat(result).extracting(summary -> summary.sessionId()).containsExactly(first.getId(), second.getId(), lateSession.getId());
        assertThat(result.getFirst().minPrice()).isEqualByComparingTo("50000.00");
        assertThat(result.getFirst().maxPrice()).isEqualByComparingTo("100000.00");
        assertThat(result.getFirst().remainingSeatCount()).isEqualTo(2);
        assertThat(result.get(1).minPrice()).isNull();
        assertThat(result.get(1).maxPrice()).isNull();
        assertThat(result.get(1).remainingSeatCount()).isZero();
        assertThat(result.get(2).minPrice()).isEqualByComparingTo("75000.00");
        assertThat(result.get(2).maxPrice()).isEqualByComparingTo("75000.00");
        assertThat(result.get(2).remainingSeatCount()).isEqualTo(1);
    }

    @Test
    void noSessionsReturnsAnEmptySummaryList() {
        var performance = performances.save(new Performance("No sessions", null, Category.CONCERT, AgeRating.ALL));
        assertThat(sessions.findPublicSummaries(performance.getId())).isEmpty();
    }
}
