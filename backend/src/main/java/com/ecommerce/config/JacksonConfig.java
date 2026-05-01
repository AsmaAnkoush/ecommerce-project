package com.ecommerce.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Forces Jackson to serialize LocalDateTime with a trailing 'Z' so browsers
 * parse it as UTC rather than local time.
 *
 * Without this, Spring serializes LocalDateTime as "2025-05-01T14:30:00"
 * (no timezone indicator). JavaScript's Date constructor then treats that
 * string as *local* browser time, causing the displayed time to be shifted
 * by the browser's UTC offset.
 *
 * With this config the wire format becomes "2025-05-01T14:30:00Z" and
 * browsers correctly interpret the value as UTC, then convert to local
 * time for display.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            SimpleModule module = new SimpleModule("LocalDateTimeUTC");
            module.addSerializer(LocalDateTime.class, new JsonSerializer<LocalDateTime>() {
                private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

                @Override
                public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider provider)
                        throws IOException {
                    gen.writeString(value.format(FMT) + "Z");
                }
            });
            builder.modulesToInstall(module);
        };
    }
}
