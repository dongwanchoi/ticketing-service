package com.dongwan.ticketing.auth.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import com.dongwan.ticketing.auth.security.AuthenticatedUser;
import com.dongwan.ticketing.auth.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    // ASCII passwords keep BCrypt's 72-byte limit explicit; never trim passwords.
    public record SignupRequest(
            @NotNull @Pattern(regexp = "[a-z0-9_]{3,50}") String username,
            @NotNull @Pattern(regexp = "[\\x21-\\x7E]{12,72}") String password) {}
    public record UserResponse(Long id, String username, String role) {}
    public record CsrfResponse(String headerName, String parameterName, String token) {}

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse signup(@Valid @RequestBody SignupRequest request) {
        return auth.signup(request.username(), request.password());
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getParameterName(), token.getToken());
    }
}
