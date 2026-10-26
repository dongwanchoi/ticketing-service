package com.dongwan.ticketing.auth.security;

import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import com.dongwan.ticketing.auth.domain.AppUser;

public class AuthenticatedUser extends User {
    private static final long serialVersionUID = 1L;
    private final Long id;
    private final String role;

    public AuthenticatedUser(AppUser user) {
        super(user.getUsername(), user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())));
        this.id = user.getId();
        this.role = user.getRole();
    }

    public Long getId() { return id; }
    public String getRole() { return role; }
}
