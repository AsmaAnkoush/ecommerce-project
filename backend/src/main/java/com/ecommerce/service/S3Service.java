package com.ecommerce.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetBucketLocationRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class S3Service {

    private final S3Client s3Client;
    private final String bucketName;
    private final String region;

    public S3Service(
            S3Client s3Client,
            @Value("${aws.region}") String region,
            @Value("${aws.bucket-name}") String bucketName) {
        this.s3Client   = s3Client;
        this.region     = region;
        this.bucketName = bucketName;
        log.info("S3Service ready — bucket: {}, region: {}", bucketName, region);
    }

    /**
     * Verifies bucket access on startup so any misconfiguration (wrong credentials,
     * wrong region, wrong bucket name, missing IAM permission) appears in the logs
     * immediately — not silently at the first upload request.
     */
    @PostConstruct
    public void verifyBucketAccess() {
        // Use getBucketLocation (GET) rather than headBucket (HEAD) because
        // HEAD responses carry no body — AWS cannot return an XML error code,
        // so S3Exception.awsErrorDetails().errorCode() is always null on failure.
        try {
            var loc = s3Client.getBucketLocation(
                    GetBucketLocationRequest.builder().bucket(bucketName).build());
            String actualRegion = loc.locationConstraintAsString();
            if (actualRegion.isBlank()) actualRegion = "us-east-1";
            log.info("S3 OK — bucket '{}' is in region '{}' (configured: '{}')", bucketName, actualRegion, region);
            if (!region.equals(actualRegion)) {
                log.warn("S3 REGION MISMATCH — bucket is in '{}' but AWS_REGION is set to '{}'. Fix AWS_REGION.",
                        actualRegion, region);
            }
        } catch (S3Exception e) {
            log.error("S3 bucket check FAILED — code: {}, message: {}, requestId: {}, bucket: {}, region: {}",
                    e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode()    : "null",
                    e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : "null",
                    e.requestId(), bucketName, region);
        } catch (Exception e) {
            log.error("S3 connectivity error on startup — {}: {}", e.getClass().getSimpleName(), e.getMessage(), e);
        }
    }

    /**
     * Uploads one file to S3 and returns its public URL.
     * The caller (UploadController) is responsible for type/size validation.
     */
    public String upload(MultipartFile file) throws IOException {
        String ext = resolveExtension(file.getOriginalFilename(), file.getContentType());
        String key = UUID.randomUUID() + "." + ext;

        log.info("Uploading to S3 — bucket: {}, region: {}, key: {}, contentType: {}, size: {} bytes",
                bucketName, region, key, file.getContentType(), file.getSize());

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .contentLength(file.getSize())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (S3Exception e) {
            log.error("S3 PutObject FAILED — errorCode: {}, errorMessage: {}, requestId: {}, bucket: {}, region: {}",
                    e.awsErrorDetails().errorCode(),
                    e.awsErrorDetails().errorMessage(),
                    e.requestId(),
                    bucketName, region);
            log.error("Full S3Exception:", e);
            throw e;
        } catch (SdkClientException e) {
            log.error("S3 SDK client error (network/config) — {}: {}, bucket: {}, region: {}",
                    e.getClass().getSimpleName(), e.getMessage(), bucketName, region);
            log.error("Full SdkClientException:", e);
            throw e;
        }

        String url = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
        log.info("Upload successful — {}", url);
        return url;
    }

    /**
     * Runs a connectivity/permissions check against S3 and returns a structured
     * result map. Used by the debug endpoint — no file upload needed.
     * REMOVE this method (and the debug endpoint) before going to production.
     */
    public Map<String, Object> diagnose() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("bucket", bucketName);
        result.put("region", region);
        result.put("accessKeyIdPresent", System.getenv("AWS_ACCESS_KEY_ID") != null
                && !System.getenv("AWS_ACCESS_KEY_ID").isBlank());
        result.put("secretKeyPresent", System.getenv("AWS_SECRET_ACCESS_KEY") != null
                && !System.getenv("AWS_SECRET_ACCESS_KEY").isBlank());

        String accessKey = System.getenv("AWS_ACCESS_KEY_ID");
        if (accessKey != null && accessKey.length() > 4) {
            result.put("accessKeyIdPrefix", accessKey.substring(0, 4) + "****");
        }

        // Use GetBucketLocation (a GET request) instead of HeadBucket.
        // HEAD responses have no body, so AWS cannot return the XML error code.
        // GET responses always include an XML body with the exact errorCode.
        try {
            var locationResp = s3Client.getBucketLocation(
                    GetBucketLocationRequest.builder().bucket(bucketName).build());
            String actualRegion = locationResp.locationConstraintAsString();
            result.put("status", "OK");
            result.put("bucketRegion", actualRegion.isBlank() ? "us-east-1" : actualRegion);
            result.put("configuredRegion", region);
            result.put("regionMatch", region.equals(actualRegion.isBlank() ? "us-east-1" : actualRegion));
            result.put("message", "Bucket is accessible — credentials and permissions are valid");
        } catch (S3Exception e) {
            String code = e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode() : null;
            String msg  = e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : null;
            result.put("status", "FAILED");
            result.put("errorCode",    code);
            result.put("errorMessage", msg);
            result.put("httpStatus",   e.statusCode());
            result.put("requestId",    e.requestId());
            result.put("diagnosis",    diagnoseErrorCode(code, e.statusCode()));
            log.error("S3 diagnose FAILED — code: {}, message: {}, requestId: {}, bucket: {}, region: {}",
                    code, msg, e.requestId(), bucketName, region);
        } catch (SdkClientException e) {
            result.put("status", "FAILED");
            result.put("errorCode",    e.getClass().getSimpleName());
            result.put("errorMessage", e.getMessage());
            result.put("diagnosis",    "Network/config error — check region spelling and internet connectivity");
            log.error("S3 diagnose SDK client error — {}: {}", e.getClass().getSimpleName(), e.getMessage());
        } catch (Exception e) {
            result.put("status", "FAILED");
            result.put("errorCode",    e.getClass().getSimpleName());
            result.put("errorMessage", e.getMessage());
            result.put("diagnosis",    "Unexpected error — see server logs for full stack trace");
            log.error("S3 diagnose unexpected error:", e);
        }

        // Only run PutObject/DeleteObject test if the bucket check passed
        if ("OK".equals(result.get("status"))) {
            String testKey = "debug-probe-" + UUID.randomUUID() + ".txt";
            try {
                byte[] bytes = "s3-probe".getBytes();
                s3Client.putObject(
                        PutObjectRequest.builder()
                                .bucket(bucketName).key(testKey)
                                .contentType("text/plain").contentLength((long) bytes.length)
                                .build(),
                        RequestBody.fromBytes(bytes));
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(testKey).build());
                result.put("putObjectTest", "OK — PutObject + DeleteObject both succeeded");
            } catch (S3Exception e) {
                String code = e.awsErrorDetails() != null ? e.awsErrorDetails().errorCode() : null;
                result.put("putObjectTest", "FAILED");
                result.put("putObjectError", code + " — " + (e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : e.getMessage()));
                result.put("putObjectDiagnosis", diagnoseErrorCode(code, e.statusCode()));
            }
        }

        return result;
    }

    private String diagnoseErrorCode(String code, int httpStatus) {
        return switch (code != null ? code : "") {
            case "InvalidAccessKeyId"    -> "AWS_ACCESS_KEY_ID is wrong or belongs to a deleted/inactive IAM user.";
            case "SignatureDoesNotMatch" -> "AWS_SECRET_ACCESS_KEY is wrong. Double-check for copy-paste whitespace.";
            case "NoSuchBucket"          -> "Bucket '" + bucketName + "' does not exist in region '" + region + "'. Check AWS_BUCKET_NAME and AWS_REGION.";
            case "AccessDenied"          -> "IAM user is explicitly denied this action. Check for 'Effect: Deny' in IAM identity-based policies, SCPs, or a restrictive bucket policy. An explicit Deny overrides all Allow statements.";
            case "NoSuchKey"             -> "Key not found — bucket exists but the specific object is missing.";
            case "PermanentRedirect"     -> "Bucket exists in a DIFFERENT region than '" + region + "'. Fix AWS_REGION to match the actual bucket region.";
            default -> httpStatus == 301 || httpStatus == 307
                    ? "Region mismatch — bucket is in a different region. Fix AWS_REGION."
                    : "Unknown error code '" + code + "' (HTTP " + httpStatus + "). Check AWS documentation.";
        };
    }

    /** Uploads multiple files in sequence and returns their public URLs. */
    public List<String> uploadMultiple(List<MultipartFile> files) throws IOException {
        List<String> urls = new ArrayList<>(files.size());
        for (MultipartFile file : files) {
            urls.add(upload(file));
        }
        return urls;
    }

    /**
     * Deletes a file from S3 given its full public URL.
     * No-ops silently if the key doesn't exist (S3 delete is idempotent).
     */
    public void deleteFile(String fileUrl) {
        String key = extractKeyFromUrl(fileUrl);
        log.info("Deleting from S3 — key: {}", key);
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build());
        log.info("Deleted from S3 — key: {}", key);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String extractKeyFromUrl(String url) {
        String prefix = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);
        if (url == null || !url.startsWith(prefix)) {
            throw new IllegalArgumentException("URL does not belong to bucket '" + bucketName + "': " + url);
        }
        return url.substring(prefix.length());
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
