package de.ichbinhier.volunteerformservice.application;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

// Accepted kinds. The declared type must also match the leading bytes.
public enum DocumentType {

    PDF("application/pdf", bytes(0x25, 0x50, 0x44, 0x46)),

    DOC("application/msword", bytes(0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1)),

    DOCX(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            bytes(0x50, 0x4B, 0x03, 0x04)),

    JPEG("image/jpeg", bytes(0xFF, 0xD8, 0xFF)),

    PNG("image/png", bytes(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A));

    private final String contentType;

    private final byte[] signature;

    DocumentType(String contentType, byte[] signature) {
        this.contentType = contentType;
        this.signature = signature;
    }

    public String getContentType() {
        return contentType;
    }

    public int signatureLength() {
        return signature.length;
    }

    public boolean matches(byte[] head) {
        return head.length >= signature.length
                && Arrays.equals(head, 0, signature.length, signature, 0, signature.length);
    }

    public static Optional<DocumentType> forContentType(String declared) {
        if (declared == null) {
            return Optional.empty();
        }
        String mediaType = declared.split(";", 2)[0].strip().toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(type -> type.contentType.equals(mediaType))
                .findFirst();
    }

    private static byte[] bytes(int... values) {
        byte[] bytes = new byte[values.length];
        for (int i = 0; i < values.length; i++) {
            bytes[i] = (byte) values[i];
        }
        return bytes;
    }

}
