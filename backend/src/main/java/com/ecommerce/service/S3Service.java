package com.ecommerce.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class S3Service {

    private final S3Client s3Client;
    private final String bucketName;
    private final String region;

    public S3Service(
            @Value("${aws.region}") String region,
            @Value("${aws.bucket-name}") String bucketName) {

        // EnvironmentVariableCredentialsProvider reads the standard AWS env vars:
        //   AWS_ACCESS_KEY_ID  and  AWS_SECRET_ACCESS_KEY
        // Fail fast with a clear message if either is absent.
        String accessKeyId = System.getenv("AWS_ACCESS_KEY_ID");
        String secretKey   = System.getenv("AWS_SECRET_ACCESS_KEY");

        if (accessKeyId == null || accessKeyId.isBlank()) {
            throw new IllegalStateException(
                "AWS_ACCESS_KEY_ID environment variable is not set");
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                "AWS_SECRET_ACCESS_KEY environment variable is not set");
        }

        this.region     = region;
        this.bucketName = bucketName;

        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
                .build();

        log.info("S3Service ready — bucket: {}, region: {}", bucketName, region);
    }

    /**
     * Runs once on startup. Calls headBucket so any misconfiguration
     * (wrong credentials, wrong region, wrong bucket name, missing IAM permission)
     * is printed to the log immediately — not silently swallowed until the first upload.
     */
    @PostConstruct
    public void verifyBucketAccess() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 OK — bucket '{}' is accessible in region '{}'", bucketName, region);
        } catch (S3Exception e) {
            log.error("S3 bucket check FAILED — code: {}, message: {}, bucket: {}, region: {}",
                    e.awsErrorDetails().errorCode(),
                    e.awsErrorDetails().errorMessage(),
                    bucketName, region);
        } catch (Exception e) {
            log.error("S3 connectivity error — {}: {}", e.getClass().getSimpleName(), e.getMessage(), e);
        }
    }

    /**
     * Uploads one file to S3 and returns its public URL.
     * The caller is responsible for validating file type before calling this.
     */
    public String upload(MultipartFile file) throws IOException {
        String ext = resolveExtension(file.getOriginalFilename(), file.getContentType());
        String key = UUID.randomUUID() + "." + ext;

        log.info("Uploading to S3 — bucket: {}, key: {}, contentType: {}, size: {} bytes",
                bucketName, key, file.getContentType(), file.getSize());

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(file.getContentType())
                        .contentLength(file.getSize())
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
        );

        String url = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
        log.info("Upload successful — {}", url);
        return url;
    }

    private String resolveExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }
        return switch (contentType != null ? contentType : "") {
            case "image/png"  -> "png";
            case "image/webp" -> "webp";
            case "image/gif"  -> "gif";
            default           -> "jpg";
        };
    }
}
