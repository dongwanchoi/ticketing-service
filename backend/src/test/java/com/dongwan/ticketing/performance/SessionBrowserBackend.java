package com.dongwan.ticketing.performance;

import java.math.BigDecimal;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.testcontainers.mysql.MySQLContainer;

import com.dongwan.ticketing.TicketingApplication;
import com.dongwan.ticketing.performance.domain.*;
import com.dongwan.ticketing.performance.repository.*;

/** Manual browser-test server backed exclusively by a fresh disposable MySQL container. */
public final class SessionBrowserBackend {
    private SessionBrowserBackend() {}

    public static void main(String[] args) throws Exception {
        // Refuse to replace or interfere with an existing process on the dedicated test port.
        try (var probe = new ServerSocket(9080, 1, InetAddress.getByName("127.0.0.1"))) {
            // Only availability is checked here; Spring owns the listening socket after startup.
        }
        var mysql = new MySQLContainer("mysql:8.4").withDatabaseName("session_browser_isolated");
        var running = new AtomicReference<ConfigurableApplicationContext>();
        var shutdown = new Thread(() -> {
            var context = running.getAndSet(null);
            if (context != null) context.close();
            mysql.close();
        }, "session-browser-cleanup");
        Runtime.getRuntime().addShutdownHook(shutdown);
        try {
            mysql.start();
            var context = new SpringApplicationBuilder(TicketingApplication.class).run(
                    "--server.port=9080", "--server.address=127.0.0.1",
                    "--spring.datasource.url=" + mysql.getJdbcUrl(),
                    "--spring.datasource.username=" + mysql.getUsername(),
                    "--spring.datasource.password=" + mysql.getPassword(),
                    "--spring.jpa.hibernate.ddl-auto=create", "--spring.jpa.open-in-view=false",
                    "--spring.main.banner-mode=off", "--logging.level.root=WARN");
            running.set(context);
            if (!mysql.getJdbcUrl().equals(context.getEnvironment().getProperty("spring.datasource.url"))) {
                throw new IllegalStateException("Refusing to seed an unexpected datasource");
            }
            seed(context);
            System.out.println("SESSION_BROWSER_READY port=9080 performances=2 sessions=3 isolatedDatabase=true");
        } catch (Throwable error) {
            shutdown.run();
            throw error;
        }
    }

    private static void seed(ConfigurableApplicationContext context) {
        var performances = context.getBean(PerformanceRepository.class);
        var sessions = context.getBean(PerformanceSessionRepository.class);
        var venues = context.getBean(VenueRepository.class);
        var seats = context.getBean(SeatRepository.class);
        var sessionSeats = context.getBean(SessionSeatRepository.class);
        var concert = performances.save(new Performance("Browser Concert", "Disposable test data", Category.CONCERT, AgeRating.ALL));
        performances.save(new Performance("No Sessions Concert", "Disposable test data", Category.CONCERT, AgeRating.ALL));
        var venue = venues.save(new Venue("Disposable Venue", "Test address"));
        var firstSeat = seats.save(new Seat(venue, "A", "1", 1));
        var secondSeat = seats.save(new Seat(venue, "A", "1", 2));
        var date = LocalDateTime.of(2027, 1, 1, 19, 0);
        var first = sessions.save(new PerformanceSession(concert, venue, date));
        var second = sessions.save(new PerformanceSession(concert, venue, date.plusDays(1)));
        sessions.save(new PerformanceSession(concert, venue, date.plusDays(2)));
        sessionSeats.save(new SessionSeat(first, firstSeat, new BigDecimal("50000.00")));
        sessionSeats.save(new SessionSeat(first, secondSeat, new BigDecimal("100000.00")));
        sessionSeats.save(new SessionSeat(second, firstSeat, new BigDecimal("75000.00")));
    }
}
