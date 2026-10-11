package com.dongwan.ticketing.performance.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Table(name = "session_seat", uniqueConstraints = @UniqueConstraint(name = "uk_session_seat", columnNames = {"performance_session_id", "seat_id" }))
@Entity
public class SessionSeat {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "performance_session_id", nullable = false)
	private PerformanceSession performanceSession;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "seat_id", nullable = false)
	private Seat seat;
	
	@Column(nullable = false)
	private BigDecimal price;
	
	protected SessionSeat(){}
	
	public SessionSeat(PerformanceSession performanceSession, Seat seat, BigDecimal price) {
		this.performanceSession = performanceSession;
		this.seat = seat;
		this.price = price;
	}
	
	public void updatePrice(BigDecimal price) {
	    this.price = price;
	}
	
	public Long getId() {
		return id;
	}
	
	public PerformanceSession getPerformanceSession() {
		return performanceSession;
	}
	
	public Seat getSeat() {
		return seat;
	}
	
	public BigDecimal getPrice() {
		return price;
	}
	
}
