package com.dongwan.ticketing.performance.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class PerformanceSession {

	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn( name = "performance_id", nullable = false)
	private Performance performance;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="venue_id", nullable = false)
	private Venue venue;
	
	@Column(nullable = false)
	private LocalDateTime startsAt;
	
	protected PerformanceSession() {}
	
	public PerformanceSession(Performance performance, Venue venue, LocalDateTime startsAt) {
		this.performance = performance;
		this.venue = venue;
		this.startsAt = startsAt;
	}
	
	public void update(LocalDateTime startsAt) {
		this.startsAt = startsAt;
	}
	
	public Long getId() {
		return id;
	}
	public Performance getPerformance() {
		return performance;
	}
	
	public Venue getVenue() {
		return venue;
	}
	
	public LocalDateTime getStartsAt() {
		return startsAt;
	}
}
