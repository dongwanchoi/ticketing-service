package com.dongwan.ticketing.performance.dto;

public record SeatResponse (

	Long id,
	Long venueId,
	String section,
	String rowLabel,
	Integer seatNumber
	
){
}
