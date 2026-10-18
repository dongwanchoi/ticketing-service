package com.dongwan.ticketing.performance.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class PerformanceSale {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "performance_id", nullable = false, unique = true)
	private Performance performance;
	
    private LocalDateTime salesStartAt;

    private LocalDateTime salesEndAt;
	
    @Enumerated(EnumType.STRING)
    private SaleStatus status;
	
    protected PerformanceSale() {}
    
    public PerformanceSale(
            Performance performance,
            LocalDateTime salesStartAt,
            LocalDateTime salesEndAt,
            SaleStatus status
    ) {
        this.performance = performance;
        this.salesStartAt = salesStartAt;
        this.salesEndAt = salesEndAt;
        this.status = status;
    }
    public void update(
            LocalDateTime salesStartAt,
            LocalDateTime salesEndAt,
            SaleStatus status
    ) {
        this.salesStartAt = salesStartAt;
        this.salesEndAt = salesEndAt;
        this.status = status;
    }
    
    public boolean isOnSaleAt(LocalDateTime now) {

    	if(this.status != SaleStatus.OPEN) {
    		return false;
    	}
        if (this.salesStartAt == null && this.salesEndAt == null) {
            return true;
        }
        
        return !now.isBefore(this.salesStartAt)
                && now.isBefore(this.salesEndAt);
    }
    
    
    public Long getId() {
        return id;
    }

    public Performance getPerformance() {
        return performance;
    }

    public LocalDateTime getSalesStartAt() {
        return salesStartAt;
    }

    public LocalDateTime getSalesEndAt() {
        return salesEndAt;
    }

    public SaleStatus getStatus() {
        return status;
    }
}
