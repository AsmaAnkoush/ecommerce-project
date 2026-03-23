package com.ecommerce.service;

import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.User;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // ── Internal ─────────────────────────────────────────────────────────────
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    // ── Profile (self) ────────────────────────────────────────────────────────
    public UserResponse getProfile(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public UserResponse updateProfile(Long id, User updates) {
        User user = findById(id);
        user.setFirstName(updates.getFirstName());
        user.setLastName(updates.getLastName());
        user.setPhone(updates.getPhone());
        user.setAddress(updates.getAddress());
        return toResponse(userRepository.save(user));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<UserResponse> search(String keyword, Pageable pageable) {
        return userRepository.search(keyword, pageable).map(this::toResponse);
    }

    public UserResponse getUser(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public UserResponse changeRole(Long id, User.Role role) {
        User user = findById(id);
        user.setRole(role);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.delete(findById(id));
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .address(u.getAddress())
                .role(u.getRole().name())
                .createdAt(u.getCreatedAt())
                .orderCount(u.getOrders() != null ? u.getOrders().size() : 0)
                .build();
    }
}
