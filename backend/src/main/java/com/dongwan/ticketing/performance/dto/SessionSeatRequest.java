package com.dongwan.ticketing.performance.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SessionSeatRequest (

	@NotNull
	Long seatId,
	
	@NotNull
	@Positive
	BigDecimal price
		
){
}
