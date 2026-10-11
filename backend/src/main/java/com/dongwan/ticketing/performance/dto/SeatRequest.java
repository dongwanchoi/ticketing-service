package com.dongwan.ticketing.performance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SeatRequest (

	@NotBlank
	String section,
	@NotBlank
	String rowLabel,
	@NotNull
	Integer seatNumber
	
){
}
