package com.dongwan.ticketing.auth.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.dongwan.ticketing.auth.domain.AppUser;
import com.dongwan.ticketing.auth.repository.AppUserRepository;
import com.dongwan.ticketing.auth.web.AuthController.UserResponse;

@Service
public class AuthService {
    private final AppUserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(AppUserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Transactional
    public UserResponse signup(String username, String password) {
        try {
            AppUser user = users.saveAndFlush(new AppUser(username, encoder.encode(password)));
            return new UserResponse(user.getId(), user.getUsername(), user.getRole());
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is unavailable");
        }
    }
}
