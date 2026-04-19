package com.ecommerce.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding-window rate limiter for unauthenticated /api/auth/* endpoints.
 * Per-IP, in-memory — fine for a single-node deployment. For multi-node
 * production, swap the backing store for Redis without changing the filter
 * shape.
 *
 * Why this exists: blocks credential stuffing, registration spam, and
 * password-reset enumeration without adding a heavy dependency.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    @Value("${app.auth.rate-limit.max-requests:10}")
    private int maxRequests;

    @Value("${app.auth.rate-limit.window-seconds:60}")
    private int windowSeconds;

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();
    private final ObjectMapper json = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/auth");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String ip = clientIp(request);
        long now = Instant.now().toEpochMilli();
        long windowStart = now - windowSeconds * 1000L;

        Deque<Long> stamps = hits.computeIfAbsent(ip, k -> new ArrayDeque<>());
        synchronized (stamps) {
            // Drop entries outside the window
            while (!stamps.isEmpty() && stamps.peekFirst() < windowStart) {
                stamps.pollFirst();
            }
            if (stamps.size() >= maxRequests) {
                writeTooManyRequests(response);
                return;
            }
            stamps.addLast(now);
        }
        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) return fwd.split(",")[0].trim();
        return req.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(json.writeValueAsString(Map.of(
                "success", false,
                "message", "Too many requests. Please wait a moment and try again."
        )));
    }
}
