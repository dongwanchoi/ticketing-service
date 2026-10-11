package com.dongwan.ticketing.performance.dto;

import java.math.BigDecimal;

public record SessionSeatResponse (

	Long id,
	Long sessionId,
	Long seatId,
	BigDecimal price
	
){
}
