package com.dongwan.ticketing.performance.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.dongwan.ticketing.performance.domain.PerformanceSession;
import com.dongwan.ticketing.performance.dto.PublicPerformanceSessionResponse;

public interface PerformanceSessionRepository extends JpaRepository<PerformanceSession, Long> {

    List<PerformanceSession> findByPerformance_Id(Long performanceId);

    // No reservation/hold model exists yet: every SessionSeat currently counts as remaining.
    // Aggregate in one query, including sessions that have no configured seats.
    @Query("""
            select new com.dongwan.ticketing.performance.dto.PublicPerformanceSessionResponse(
                session.id, session.startsAt, min(seat.price), max(seat.price), count(seat.id))
            from PerformanceSession session
            left join SessionSeat seat on seat.performanceSession = session
            where session.performance.id = :performanceId
            group by session.id, session.startsAt
            order by session.startsAt asc, session.id asc
            """)
    List<PublicPerformanceSessionResponse> findPublicSummaries(@Param("performanceId") Long performanceId);
}
