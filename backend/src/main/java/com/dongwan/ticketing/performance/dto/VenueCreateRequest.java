package com.dongwan.ticketing.performance.dto;

import jakarta.validation.constraints.NotBlank;

public record VenueCreateRequest (

	@NotBlank
	String name,

	@NotBlank
	String address
){
}
