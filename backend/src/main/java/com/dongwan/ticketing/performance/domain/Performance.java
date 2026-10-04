package com.dongwan.ticketing.performance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Performance {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Category category;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private AgeRating ageRating;

	protected Performance() {
	}

	public Performance(String title, String description, Category category, AgeRating ageRating) {
		this.title = title;
		this.description = description;
		this.category = category;
		this.ageRating = ageRating;
	}

	public Long getId() {
		return id;
	}

	public String getTitle() {
		return title;
	}

	public String getDescription() {
		return description;
	}

	public Category getCategory() {
		return category;
	}

	public AgeRating getAgeRating() {
		return ageRating;
	}
}