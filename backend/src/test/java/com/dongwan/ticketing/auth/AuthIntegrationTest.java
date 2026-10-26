package com.dongwan.ticketing.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
import com.dongwan.ticketing.auth.repository.AppUserRepository;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.jpa.hibernate.ddl-auto=create")
@AutoConfigureMockMvc
class AuthIntegrationTest {
    @Container @ServiceConnection
    static final MySQLContainer mysql = new MySQLContainer("mysql:8.4");
    @Autowired MockMvc mvc;
    @Autowired AppUserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired ObjectMapper mapper;
    @LocalServerPort int port;

    private record Client(MockHttpSession session, String header, String token) {}

    private Client csrf(MockHttpSession session) throws Exception {
        var request = get("/api/v1/auth/csrf");
        if (session != null) request.session(session);
        var result = mvc.perform(request).andExpect(status().isOk()).andReturn();
        var json = mapper.readTree(result.getResponse().getContentAsString());
        return new Client((MockHttpSession) result.getRequest().getSession(false),
                json.get("headerName").asString(), json.get("token").asString());
    }

    private Client signup(String username) throws Exception {
        Client client = csrf(null);
        mvc.perform(post("/api/v1/auth/signup").session(client.session())
                .header(client.header(), client.token()).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"%s","password":"SafePassword123!","id":999,"role":"ADMIN","roles":["ADMIN"]}
                    """.formatted(username)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        return client;
    }

    private MockHttpSession login(Client client, String username) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/login").session(client.session())
                .header(client.header(), client.token())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("username", username).param("password", "SafePassword123!")
                .param("userId", "999").param("role", "ADMIN"))
                .andExpect(status().isNoContent()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @Test
    void signupHashesPasswordAndIgnoresClaimedIdentityAndRole() throws Exception {
        signup("hash_user");
        var user = users.findByUsername("hash_user").orElseThrow();
        assertThat(user.getId()).isNotEqualTo(999L);
        assertThat(user.getRole()).isEqualTo("USER");
        assertThat(user.getPasswordHash()).isNotEqualTo("SafePassword123!");
        assertThat(encoder.matches("SafePassword123!", user.getPasswordHash())).isTrue();
    }

    @Test
    void loginPersistsIdentityRotatesSessionAndLogoutInvalidatesIt() throws Exception {
        Client client = signup("session_user");
        String oldId = client.session().getId();
        MockHttpSession session = login(client, "session_user");
        assertThat(session.getId()).isNotEqualTo(oldId);
        mvc.perform(get("/api/v1/auth/me").session(session).param("userId", "999"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("session_user"))
                .andExpect(jsonPath("$.id").value(users.findByUsername("session_user").orElseThrow().getId()))
                .andExpect(jsonPath("$.role").value("USER"));
        // Login clears the old CSRF token; acquire a fresh token from the real endpoint.
        mvc.perform(post("/api/v1/auth/logout").session(session).header(client.header(), client.token()))
                .andExpect(status().isForbidden());
        Client authenticated = csrf(session);
        mvc.perform(post("/api/v1/auth/logout").session(session)
                .header(authenticated.header(), authenticated.token()))
                .andExpect(status().isNoContent());
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/v1/auth/me").cookie(new jakarta.servlet.http.Cookie("JSESSIONID", session.getId())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void badPasswordDoesNotAuthenticate() throws Exception {
        Client client = signup("bad_password");
        mvc.perform(post("/api/v1/auth/login").session(client.session())
                .header(client.header(), client.token()).param("username", "bad_password")
                .param("password", "wrong"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").session(client.session())).andExpect(status().isUnauthorized());
    }

    @Test
    void userCannotAccessAdminOrMutateBusinessData() throws Exception {
        MockHttpSession session = login(signup("ordinary_user"), "ordinary_user");
        Client client = csrf(session);
        mvc.perform(get("/api/v1/admin/performances").session(session))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/performances").session(session)
                .header(client.header(), client.token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"unauthorized\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousAccessAndCsrfBoundaries() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/performances")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/performances")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/performances/999/sale-availability")).andExpect(status().isOk());
        for (String path : new String[]{"signup", "login", "logout"}) {
            mvc.perform(post("/api/v1/auth/" + path)).andExpect(status().isForbidden());
        }
        Client client = csrf(null);
        mvc.perform(post("/api/v1/admin/performances").session(client.session())
                .header(client.header(), client.token())).andExpect(status().isUnauthorized());
    }

    @Test
    void duplicateUsernameAndInvalidInput() throws Exception {
        Client client = signup("duplicate_user");
        mvc.perform(post("/api/v1/auth/signup").session(client.session())
                .header(client.header(), client.token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"duplicate_user\",\"password\":\"SafePassword123!\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/auth/signup").session(client.session())
                .header(client.header(), client.token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"new_user\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void corsOnlyAllowsConfiguredFrontendWithCredentials() throws Exception {
        mvc.perform(options("/api/v1/auth/login").header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type,x-csrf-token"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        mvc.perform(options("/api/v1/auth/login").header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void realServerIssuesSecureHttpOnlySameSiteSessionCookie() throws Exception {
        var client = java.net.http.HttpClient.newHttpClient();
        var response = client.send(java.net.http.HttpRequest.newBuilder(
                java.net.URI.create("http://localhost:" + port + "/api/v1/auth/csrf")).GET().build(),
                java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        String cookie = response.headers().firstValue("set-cookie").orElseThrow();
        assertThat(cookie).contains("JSESSIONID=", "HttpOnly", "Secure", "SameSite=Lax");
    }

    @Test
    void csrfCannotBeTransferredAcrossSessionsAndAuthenticatedWritesStillRequireIt() throws Exception {
        Client first = signup("csrf_user");
        Client other = csrf(null);
        mvc.perform(post("/api/v1/auth/login").session(first.session())
                .header(other.header(), other.token()).param("username", "csrf_user")
                .param("password", "SafePassword123!"))
                .andExpect(status().isForbidden());
        MockHttpSession session = login(first, "csrf_user");
        mvc.perform(post("/api/v1/auth/logout").session(session)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/auth/me").session(session)).andExpect(status().isOk());
    }

    @Test
    void evenClaimedPrivilegedAuthorityCannotBypassUnimplementedAdminPolicy() throws Exception {
        mvc.perform(get("/api/v1/admin/performances").with(
                org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                        .user("claimed_admin").roles("ADMIN", "SELLER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/auth/me").header("X-User-Id", "1").header("X-Role", "ADMIN"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void realHttpLoginCookieRoundTripAndLogout() throws Exception {
        var client = java.net.http.HttpClient.newHttpClient();
        String base = "http://localhost:" + port + "/api/v1/auth";
        var csrfResponse = client.send(java.net.http.HttpRequest.newBuilder(
                java.net.URI.create(base + "/csrf")).GET().build(),
                java.net.http.HttpResponse.BodyHandlers.ofString());
        String anonymousCookie = csrfResponse.headers().firstValue("set-cookie").orElseThrow().split(";", 2)[0];
        var token = mapper.readTree(csrfResponse.body());
        var registered = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base + "/signup"))
                .header("Cookie", anonymousCookie).header("Content-Type", "application/json")
                .header(token.get("headerName").asString(), token.get("token").asString())
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(
                        "{\"username\":\"http_user\",\"password\":\"SafePassword123!\"}"))
                .build(), java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(registered.statusCode()).isEqualTo(201);
        var loggedIn = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base + "/login"))
                .header("Cookie", anonymousCookie).header("Content-Type", "application/x-www-form-urlencoded")
                .header(token.get("headerName").asString(), token.get("token").asString())
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString("username=http_user&password=SafePassword123%21"))
                .build(), java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(loggedIn.statusCode()).isEqualTo(204);
        String authenticatedCookie = loggedIn.headers().firstValue("set-cookie").orElseThrow().split(";", 2)[0];
        assertThat(authenticatedCookie).isNotEqualTo(anonymousCookie);
        var me = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base + "/me"))
                .header("Cookie", authenticatedCookie).GET().build(), java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(me.statusCode()).isEqualTo(200);
        assertThat(mapper.readTree(me.body()).get("username").asString()).isEqualTo("http_user");
        var refreshed = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base + "/csrf"))
                .header("Cookie", authenticatedCookie).GET().build(), java.net.http.HttpResponse.BodyHandlers.ofString());
        token = mapper.readTree(refreshed.body());
        var logout = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base + "/logout"))
                .header("Cookie", authenticatedCookie)
                .header(token.get("headerName").asString(), token.get("token").asString())
                .POST(java.net.http.HttpRequest.BodyPublishers.noBody()).build(),
                java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(logout.statusCode()).isEqualTo(204);
        var expired = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base + "/me"))
                .header("Cookie", authenticatedCookie).GET().build(), java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(expired.statusCode()).isEqualTo(401);
    }
}
