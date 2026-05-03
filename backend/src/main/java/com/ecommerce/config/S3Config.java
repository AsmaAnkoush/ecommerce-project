package com.ecommerce.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@Slf4j
public class S3Config {

    @Value("${aws.region}")
    private String region;

    @Bean
    public S3Client s3Client() {
        String accessKey = System.getenv("AWS_ACCESS_KEY_ID");
        String secretKey = System.getenv("AWS_SECRET_ACCESS_KEY");

        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException(
                    "AWS_ACCESS_KEY_ID environment variable is not set. " +
                    "Set it in your system environment or IDE run configuration.");
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "AWS_SECRET_ACCESS_KEY environment variable is not set. " +
                    "Set it in your system environment or IDE run configuration.");
        }

        log.info("Building S3Client — region: {}", region);
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
                .build();
    }
}
