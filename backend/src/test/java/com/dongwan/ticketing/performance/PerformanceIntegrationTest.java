package com.dongwan.ticketing.performance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import com.dongwan.ticketing.performance.domain.AgeRating;
import com.dongwan.ticketing.performance.domain.Category;
import com.dongwan.ticketing.performance.domain.Performance;
import com.dongwan.ticketing.performance.repository.PerformanceRepository;

@Testcontainers
@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=create")
@AutoConfigureMockMvc
class PerformanceIntegrationTest {

	@Container
	@ServiceConnection
	static final MySQLContainer mysql = new MySQLContainer("mysql:8.4");

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PerformanceRepository performanceRepository;

	@BeforeEach
	void setUp() {
	    performanceRepository.deleteAll();
	}
	
	@Test
	@DisplayName("공연 등록 API 호출 시 실제 MySQL에 공연이 저장된다")
	void createPerformance_whenRequestIsValid_savesPerformanceToDatabase() throws Exception {

		mockMvc.perform(post("/api/v1/admin/performances").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "title": "Integration Test Concert",
				  "description": "통합 테스트 공연",
				  "category": "CONCERT",
				  "ageRating": "ALL"
				}
				""")).andExpect(status().isCreated()).andExpect(jsonPath("$.id").exists());

		var performances = performanceRepository.findAll();

		assertThat(performances).hasSize(1);

		Performance performance = performances.get(0);

		assertThat(performance.getTitle()).isEqualTo("Integration Test Concert");

		assertThat(performance.getDescription()).isEqualTo("통합 테스트 공연");

		assertThat(performance.getCategory()).isEqualTo(Category.CONCERT);

		assertThat(performance.getAgeRating()).isEqualTo(AgeRating.ALL);
	}
	
	@Test
	@DisplayName("제목이 비어있으면 공연이 저장되지 않는다")
	void createPerformance_whenTitleIsBlank_doesNotSavePerformance()
	        throws Exception {

	    mockMvc.perform(
	                    post("/api/v1/admin/performances")
	                            .contentType(MediaType.APPLICATION_JSON)
	                            .content("""
	                                    {
	                                      "title": "",
	                                      "description": "저장되면 안 되는 공연",
	                                      "category": "CONCERT",
	                                      "ageRating": "ALL"
	                                    }
	                                    """)
	            )
	            .andExpect(status().isBadRequest());

	    assertThat(performanceRepository.count())
	            .isZero();
	}
}
