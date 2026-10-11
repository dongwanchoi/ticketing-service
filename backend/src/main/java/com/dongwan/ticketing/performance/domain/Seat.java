package com.dongwan.ticketing.performance.domain;

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

@Table(name = "seat", uniqueConstraints = { @UniqueConstraint(name = "uk_seat_venue_position", columnNames = {
		"venue_id", "section", "row_label", "seat_number" }) })
@Entity
public class Seat {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "venue_id", nullable = false)
	private Venue venue;

	@Column(nullable = false)
	private String section;

	@Column(nullable = false)
	private String rowLabel;

	@Column(nullable = false)
	private Integer seatNumber;

	protected Seat() {
	}

	public Seat(Venue venue, String section, String rowLabel, Integer seatNumber) {
		this.venue = venue;
		this.section = section;
		this.rowLabel = rowLabel;
		this.seatNumber = seatNumber;
	}

	public Long getId() {
		return id;
	}

	public Venue getVenue() {
		return venue;
	}

	public String getSection() {
		return section;
	}

	public String getRowLabel() {
		return rowLabel;
	}

	public Integer getSeatNumber() {
		return seatNumber;
	}
}
