package com.dongwan.ticketing.performance.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dongwan.ticketing.performance.domain.Venue;
import com.dongwan.ticketing.performance.dto.VenueCreateRequest;
import com.dongwan.ticketing.performance.dto.VenueResponse;
import com.dongwan.ticketing.performance.repository.VenueRepository;

@Service
public class VenueService {

	private final VenueRepository venueRepository; 
	
	public VenueService(VenueRepository venueRepository){
		this.venueRepository = venueRepository;
	}
	
	@Transactional
	public VenueResponse create(VenueCreateRequest request) {
		Venue venue = new Venue(request.name(), request.address());
		
		Venue savedVenue = venueRepository.save(venue);
		
		VenueResponse response = new VenueResponse(savedVenue.getId(), savedVenue.getName(), savedVenue.getAddress()); 
		return response;
	}
	
	
	@Transactional(readOnly = true)
	public List<VenueResponse> findAll() {
		
		List<Venue> venues = venueRepository.findAll();
		List<VenueResponse> responses = new ArrayList<>();
		
		for(Venue venue : venues) {
			VenueResponse response = new VenueResponse(venue.getId(), venue.getName(), venue.getAddress());
			responses.add(response);
		}
			
		return responses;
	}
	
}
