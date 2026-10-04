package com.dongwan.ticketing.performance.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.dongwan.ticketing.performance.domain.AgeRating;
import com.dongwan.ticketing.performance.domain.Category;
import com.dongwan.ticketing.performance.dto.PerformanceCreateResponse;
import com.dongwan.ticketing.performance.service.PerformanceService;

@WebMvcTest(PerformanceController.class)
class PerformanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PerformanceService performanceService;

    @Test
    @DisplayName("정상적인 공연을 등록하면 201 Created를 반환한다")
    void createPerformance_whenRequestIsValid_returns201Created() throws Exception {

        PerformanceCreateResponse response =
                new PerformanceCreateResponse(
                        1L,
                        "Test Concert",
                        "테스트 공연",
                        Category.CONCERT,
                        AgeRating.ALL
                );

        given(performanceService.create(any()))
                .willReturn(response);

        mockMvc.perform(
                        post("/api/v1/admin/performances")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "title": "Test Concert",
                                          "description": "테스트 공연",
                                          "category": "CONCERT",
                                          "ageRating": "ALL"
                                        }
                                        """)
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Test Concert"))
                .andExpect(jsonPath("$.category").value("CONCERT"))
                .andExpect(jsonPath("$.ageRating").value("ALL"));
    }

    @Test
    @DisplayName("제목이 비어있으면 400 Bad Request를 반환한다")
    void createPerformance_whenTitleIsBlank_returns400BadRequest() throws Exception {

        mockMvc.perform(
                        post("/api/v1/admin/performances")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "title": "",
                                          "description": "테스트 공연",
                                          "category": "CONCERT",
                                          "ageRating": "ALL"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("존재하지 않는 카테고리를 요청하면 400 Bad Request를 반환한다")
    void createPerformance_whenCategoryIsInvalid_returns400BadRequest() throws Exception {

        mockMvc.perform(
                        post("/api/v1/admin/performances")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "title": "Invalid Category Test",
                                          "description": "잘못된 카테고리 테스트",
                                          "category": "MOVIE",
                                          "ageRating": "ALL"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("공연 설명이 없어도 201 Created를 반환한다")
    void createPerformance_whenDescriptionIsMissing_returns201Created() throws Exception {

        PerformanceCreateResponse response =
                new PerformanceCreateResponse(
                        1L,
                        "Description Optional Test",
                        null,
                        Category.CONCERT,
                        AgeRating.ALL
                );

        given(performanceService.create(any()))
                .willReturn(response);

        mockMvc.perform(
                        post("/api/v1/admin/performances")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "title": "Description Optional Test",
                                          "category": "CONCERT",
                                          "ageRating": "ALL"
                                        }
                                        """)
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Description Optional Test"))
                .andExpect(jsonPath("$.description").doesNotExist());
    }

    @Test
    @DisplayName("관람등급이 없으면 400 Bad Request를 반환한다")
    void createPerformance_whenAgeRatingIsMissing_returns400BadRequest() throws Exception {

        mockMvc.perform(
                        post("/api/v1/admin/performances")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "title": "Age Rating Missing Test",
                                          "description": "관람등급 누락 테스트",
                                          "category": "CONCERT"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }
}