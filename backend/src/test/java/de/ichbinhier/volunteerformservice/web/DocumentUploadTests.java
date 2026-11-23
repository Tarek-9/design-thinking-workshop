package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationDocument;
import de.ichbinhier.volunteerformservice.application.ApplicationDocumentRepository;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.DocumentProperties;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.application.WeeklyTime;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SignIns;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentUploadTests {

    private static final String UPLOAD = "/api/v1/applications/{id}/documents";

    private static final String STAFF_DOCUMENTS = "/api/v1/staff/applications/{id}/documents";

    private static final String STAFF_APPLICATION = "/api/v1/staff/applications/";

    private static final int MEGABYTE = 1024 * 1024;

    private static final int LIMIT_BYTES = 5 * MEGABYTE;

    private static final String DOCX_TYPE =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private static final String PDF_HEAD = "%PDF-1.7\n";

    private static final List<Sample> EVERY_ALLOWED_TYPE = List.of(
            new Sample("lebenslauf.pdf", "application/pdf", PDF_HEAD),
            new Sample("anschreiben.doc", "application/msword",
                    "\u00D0\u00CF\u0011\u00E0\u00A1\u00B1\u001A\u00E1"),
            new Sample("anschreiben.docx", DOCX_TYPE, "PK\u0003\u0004"),
            new Sample("foto.jpg", "image/jpeg", "\u00FF\u00D8\u00FF\u00E0"),
            new Sample("foto.png", "image/png", "\u0089PNG\r\n\u001A\n"));

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private ApplicationDocumentRepository documents;

    @Autowired private StateChangeRepository changes;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SignIns signIns;

    @Autowired private DocumentProperties properties;

    private Category socialMedia;

    private Cookie signIn;

    private Application application;

    @BeforeEach
    void reset() throws IOException {
        documents.deleteAll();
        changes.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();
        FileSystemUtils.deleteRecursively(properties.uploadPath());

        socialMedia = categories.save(category("Social Media", 1));
        Staff ashton = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.online")
                .passwordHash(passwordEncoder.encode("correct horse"))
                .build());
        signIn = new Cookie("ibh_session", signIns.open(ashton));
        application = applications.save(application(socialMedia));
    }

    // Rows and files go first, so later runs start clean.
    @AfterEach
    void clear() throws IOException {
        documents.deleteAll();
        changes.deleteAll();
        applications.deleteAll();
        FileSystemUtils.deleteRecursively(properties.uploadPath());
    }

    @Test
    void applicantsUploadEveryAllowedTypeWithoutASignIn() throws Exception {
        for (Sample sample : EVERY_ALLOWED_TYPE) {
            Application own = applications.save(application(socialMedia));
            mvc.perform(upload(own.getId(), sample.file()))
                    .andExpect(status().isCreated());
        }

        assertThat(documents.findAll())
                .extracting(ApplicationDocument::getType)
                .hasSize(EVERY_ALLOWED_TYPE.size());
    }

    @Test
    void acceptsSeveralFilesInOneRequest() throws Exception {
        mvc.perform(upload(application.getId(),
                        new Sample("a.pdf", "application/pdf", PDF_HEAD).file(),
                        new Sample("b.png", "image/png", "\u0089PNG\r\n\u001A\n").file(),
                        new Sample("c.docx", DOCX_TYPE, "PK\u0003\u0004").file()))
                .andExpect(status().isCreated());

        assertThat(documents.countByApplicationId(application.getId())).isEqualTo(3);
    }

    @Test
    void rejectsAFileOfAnUnlistedType() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "notiz.txt", "text/plain", "Hallo".getBytes())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("files"))
                .andExpect(jsonPath("$.errors[0].code").value("DOCUMENT_TYPE_UNSUPPORTED"));

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
    }

    @Test
    void rejectsAFileWhoseBytesAreNotTheirDeclaredType() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "bild.png", "image/png",
                                padded(PDF_HEAD, 64))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("DOCUMENT_TYPE_UNSUPPORTED"));

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
    }

    @Test
    void rejectsASpreadsheetDeclaredAsDocx() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "anschreiben.docx",
                                DOCX_TYPE,
                                zip("xl/workbook.xml", "<workbook/>"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("files"))
                .andExpect(jsonPath("$.errors[0].code")
                        .value("DOCUMENT_TYPE_UNSUPPORTED"));

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
    }

    @Test
    void rejectsBrokenAndEmptyArchivesDeclaredAsDocx() throws Exception {
        byte[] word = zip("word/document.xml", "<document/>");
        List<byte[]> invalid = List.of(
                new byte[0],
                padded("PK\u0003\u0004", 64),
                zip(null, ""),
                zip("word/document.xml", ""),
                Arrays.copyOf(word, word.length - 22));

        for (byte[] bytes : invalid) {
            mvc.perform(upload(application.getId(),
                            new MockMultipartFile("files", "anschreiben.docx",
                                    DOCX_TYPE, bytes)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors[0].field").value("files"))
                    .andExpect(jsonPath("$.errors[0].code")
                            .value("DOCUMENT_TYPE_UNSUPPORTED"));
        }

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
    }

    @Test
    void rejectsOleWithoutAWordDocumentStream() throws Exception {
        for (String stream : List.of("Workbook", "PowerPoint Document")) {
            mvc.perform(upload(application.getId(),
                            new MockMultipartFile("files", "anschreiben.doc",
                                    "application/msword", ole(stream))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors[0].field").value("files"))
                    .andExpect(jsonPath("$.errors[0].code")
                            .value("DOCUMENT_TYPE_UNSUPPORTED"));
        }

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
    }

    @Test
    void acceptsWordContainersWithTheirDeclaredTypes() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "anschreiben.doc",
                                "application/msword", ole("WordDocument")),
                        new MockMultipartFile("files", "anschreiben.docx",
                                DOCX_TYPE, wordPackage())))
                .andExpect(status().isCreated());

        assertThat(documents.countByApplicationId(application.getId()))
                .isEqualTo(2);
        assertThat(storedFiles()).hasSize(2);
    }

    @Test
    void anInvalidWordContainerRemovesEarlierFiles() throws Exception {
        mvc.perform(upload(application.getId(),
                        new Sample("a.pdf", "application/pdf", PDF_HEAD).file(),
                        new MockMultipartFile("files", "anschreiben.docx",
                                DOCX_TYPE,
                                zip("xl/workbook.xml", "<workbook/>"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("files"))
                .andExpect(jsonPath("$.errors[0].code")
                        .value("DOCUMENT_TYPE_UNSUPPORTED"));

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
    }

    @Test
    void acceptsAFileOfExactlyTheSizeLimit() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "gross.pdf", "application/pdf",
                                padded(PDF_HEAD, LIMIT_BYTES))))
                .andExpect(status().isCreated());
    }

    @Test
    void rejectsAFileOverTheSizeLimitWithoutStoringAnything() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "zu-gross.pdf", "application/pdf",
                                padded(PDF_HEAD, LIMIT_BYTES + 1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("files"))
                .andExpect(jsonPath("$.errors[0].code").value("DOCUMENT_TOO_LARGE"));

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
    }

    @Test
    void keepsAtMostThreeDocumentsPerApplication() throws Exception {
        mvc.perform(upload(application.getId(),
                        new Sample("a.pdf", "application/pdf", PDF_HEAD).file(),
                        new Sample("b.pdf", "application/pdf", PDF_HEAD).file(),
                        new Sample("c.pdf", "application/pdf", PDF_HEAD).file()))
                .andExpect(status().isCreated());

        mvc.perform(upload(application.getId(),
                        new Sample("d.pdf", "application/pdf", PDF_HEAD).file()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("DOCUMENT_LIMIT_REACHED"));

        assertThat(documents.countByApplicationId(application.getId())).isEqualTo(3);
    }

    @Test
    void rejectsAnUploadWithoutFiles() throws Exception {
        mvc.perform(multipart(UPLOAD, application.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("DOCUMENT_REQUIRED"));
    }

    @Test
    void answersNotFoundForAnUnknownApplication() throws Exception {
        mvc.perform(upload(UUID.randomUUID(), new Sample("a.pdf", "application/pdf", PDF_HEAD).file()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void storesARandomFileNameAndKeepsOnlyTheLastSegmentOfTheOriginal() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "../../etc/Lebenslauf.pdf", "application/pdf",
                                padded(PDF_HEAD, 64))))
                .andExpect(status().isCreated());

        ApplicationDocument stored = documents.findAll().getFirst();
        assertThat(stored.getOriginalName()).isEqualTo("Lebenslauf.pdf");
        assertThat(storedFiles())
                .singleElement()
                .satisfies(name -> assertThat(UUID.fromString(name)).isNotNull());
    }

    @Test
    void staffListsTheDocumentsOfAnApplication() throws Exception {
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "Lebenslauf.pdf", "application/pdf",
                                padded(PDF_HEAD, 64))))
                .andExpect(status().isCreated());

        mvc.perform(get(STAFF_DOCUMENTS, application.getId()).cookie(signIn))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.documents.length()").value(1))
                .andExpect(jsonPath("$.documents[0].fileName").value("Lebenslauf.pdf"))
                .andExpect(jsonPath("$.documents[0].contentType").value("application/pdf"))
                .andExpect(jsonPath("$.documents[0].sizeBytes").value(64));
    }

    @Test
    void listingAndDownloadingNeedAStaffSignIn() throws Exception {
        mvc.perform(upload(application.getId(), new Sample("a.pdf", "application/pdf", PDF_HEAD).file()))
                .andExpect(status().isCreated());
        UUID document = documents.findAll().getFirst().getId();

        mvc.perform(get(STAFF_DOCUMENTS, application.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));

        mvc.perform(get(STAFF_DOCUMENTS + "/{documentId}", application.getId(), document))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void staffDownloadsTheStoredBytesAsAnAttachment() throws Exception {
        byte[] content = padded(PDF_HEAD, 128);
        mvc.perform(upload(application.getId(),
                        new MockMultipartFile("files", "Lebenslauf für Ärger.pdf", "application/pdf", content)))
                .andExpect(status().isCreated());
        UUID document = documents.findAll().getFirst().getId();

        mvc.perform(get(STAFF_DOCUMENTS + "/{documentId}", application.getId(), document).cookie(signIn))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString("Lebenslauf")))
                .andExpect(content().bytes(content));
    }

    @Test
    void aDocumentIsNotFoundUnderAnotherApplication() throws Exception {
        mvc.perform(upload(application.getId(), new Sample("a.pdf", "application/pdf", PDF_HEAD).file()))
                .andExpect(status().isCreated());
        UUID document = documents.findAll().getFirst().getId();
        Application other = applications.save(application(socialMedia));

        mvc.perform(get(STAFF_DOCUMENTS + "/{documentId}", other.getId(), document).cookie(signIn))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void erasingAnApplicationRemovesItsDocumentsAndTheirFiles() throws Exception {
        mvc.perform(upload(application.getId(),
                        new Sample("a.pdf", "application/pdf", PDF_HEAD).file(),
                        new Sample("b.png", "image/png", "\u0089PNG\r\n\u001A\n").file()))
                .andExpect(status().isCreated());
        assertThat(storedFiles()).hasSize(2);

        mvc.perform(patch(STAFF_APPLICATION + application.getId())
                        .cookie(signIn)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"discarded\":true}"))
                .andExpect(status().isOk());

        mvc.perform(delete(STAFF_APPLICATION + "{id}/permanently", application.getId()).cookie(signIn))
                .andExpect(status().isNoContent());

        assertThat(documents.findAll()).isEmpty();
        assertThat(storedFiles()).isEmpty();
        assertThat(applications.findById(application.getId())).isEmpty();
    }

    // MockMvc bypasses the multipart limit, so DocumentUploadLimitTests covers the server.
    @Test
    void anOversizedRequestAnswersDocumentTooLargeOnFiles() {
        ResponseEntity<ProblemDetail> response = new ApiExceptionHandler()
                .onOversizedUpload(new MaxUploadSizeExceededException(LIMIT_BYTES));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getProperties())
                .containsEntry("code", "VALIDATION_FAILED")
                .containsEntry("errors", List.of(new ApiFieldError("files", "DOCUMENT_TOO_LARGE")));
    }

    private List<String> storedFiles() throws IOException {
        Path folder = properties.uploadPath();
        if (!Files.exists(folder)) {
            return List.of();
        }
        try (Stream<Path> files = Files.list(folder)) {
            return files.map(file -> file.getFileName().toString()).toList();
        }
    }

    private static MockMultipartHttpServletRequestBuilder upload(UUID applicationId, MockMultipartFile... files) {
        MockMultipartHttpServletRequestBuilder request = multipart(UPLOAD, applicationId);
        for (MockMultipartFile file : files) {
            request.file(file);
        }
        return request;
    }

    private static byte[] padded(String head, int size) {
        byte[] bytes = new byte[size];
        byte[] prefix = head.getBytes(StandardCharsets.ISO_8859_1);
        System.arraycopy(prefix, 0, bytes, 0, prefix.length);
        return bytes;
    }

    private static byte[] zip(String name, String content) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ZipOutputStream archive = new ZipOutputStream(bytes)) {
            if (name != null) {
                zipEntry(archive, name, content);
            }
        }
        return bytes.toByteArray();
    }

    private static byte[] wordPackage() throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ZipOutputStream archive = new ZipOutputStream(bytes)) {
            zipEntry(archive, "[Content_Types].xml",
                    "<Types xmlns=\"http://schemas.openxmlformats.org/package/"
                            + "2006/content-types\"><Default "
                            + "Extension=\"rels\" ContentType=\"application/vnd."
                            + "openxmlformats-package."
                            + "relationships+xml\"/><Override "
                            + "PartName=\"/word/document.xml\" ContentType=\""
                            + DOCX_TYPE + ".main+xml\"/></Types>");
            zipEntry(archive, "_rels/.rels",
                    "<Relationships xmlns=\"http://schemas.openxmlformats.org/"
                            + "package/2006/relationships\"><Relationship "
                            + "Id=\"rId1\" "
                            + "Type=\"http://schemas.openxmlformats.org/"
                            + "officeDocument/2006/relationships/"
                            + "officeDocument\" "
                            + "Target=\"word/document.xml\"/></Relationships>");
            zipEntry(archive, "word/document.xml",
                    "<w:document xmlns:w=\"http://schemas.openxmlformats.org/"
                            + "wordprocessingml/2006/main\">"
                            + "<w:body/></w:document>");
        }
        return bytes.toByteArray();
    }

    private static void zipEntry(ZipOutputStream archive, String name,
            String content) throws IOException {
        archive.putNextEntry(new ZipEntry(name));
        archive.write(content.getBytes(StandardCharsets.UTF_8));
        archive.closeEntry();
    }

    private static byte[] ole(String streamName) {
        // Header, directory, one regular 4096-byte stream, then its FAT sector.
        int sectorSize = 512;
        int endOfChain = -2;
        ByteBuffer file = ByteBuffer.allocate(11 * sectorSize)
                .order(ByteOrder.LITTLE_ENDIAN);
        file.put(padded("\u00D0\u00CF\u0011\u00E0"
                + "\u00A1\u00B1\u001A\u00E1", 8));
        file.putShort(24, (short) 0x003E);
        file.putShort(26, (short) 3);
        file.putShort(28, (short) 0xFFFE);
        file.putShort(30, (short) 9);
        file.putShort(32, (short) 6);
        file.putInt(44, 1);
        file.putInt(48, 0);
        file.putInt(56, 4096);
        file.putInt(60, endOfChain);
        file.putInt(68, endOfChain);
        for (int offset = 76; offset < sectorSize; offset += 4) {
            file.putInt(offset, -1);
        }
        file.putInt(76, 9);

        oleDirectoryEntry(file, sectorSize, "Root Entry", 5, 1,
                endOfChain, 0);
        oleDirectoryEntry(file, sectorSize + 128, streamName, 2, -1,
                1, 4096);
        file.putShort(2 * sectorSize, (short) 0xA5EC);
        file.putShort(2 * sectorSize + 2, (short) 0x00C1);

        int fat = 10 * sectorSize;
        for (int sector = 0; sector < sectorSize / 4; sector++) {
            file.putInt(fat + 4 * sector, -1);
        }
        file.putInt(fat, endOfChain);
        for (int sector = 1; sector < 8; sector++) {
            file.putInt(fat + 4 * sector, sector + 1);
        }
        file.putInt(fat + 4 * 8, endOfChain);
        file.putInt(fat + 4 * 9, -3);
        return file.array();
    }

    private static void oleDirectoryEntry(ByteBuffer file, int offset,
            String name, int type, int child, int startSector, long size) {
        byte[] encoded = (name + "\0").getBytes(StandardCharsets.UTF_16LE);
        file.position(offset);
        file.put(encoded);
        file.putShort(offset + 64, (short) encoded.length);
        file.put(offset + 66, (byte) type);
        file.put(offset + 67, (byte) 1);
        file.putInt(offset + 68, -1);
        file.putInt(offset + 72, -1);
        file.putInt(offset + 76, child);
        file.putInt(offset + 116, startSector);
        file.putLong(offset + 120, size);
    }

    private static Category category(String name, int displayOrder) {
        return Category.builder().name(name).displayOrder(displayOrder).active(true).build();
    }

    private static Application application(Category category) {
        return Application.builder()
                .submissionId(UUID.randomUUID())
                .category(category)
                .name("Anna Müller")
                .email("anna@example.de")
                .weeklyTime(WeeklyTime.HOURS_1_2)
                .about("Ich arbeite seit drei Jahren in der Moderation.")
                .consentTextVersion("2026-09")
                .consentAt(Instant.now())
                .build();
    }

    // A real signature at the start, so the bytes match the declared type.
    private record Sample(String name, String contentType, String head) {

        MockMultipartFile file() throws IOException {
            byte[] bytes = switch (contentType) {
                case "application/msword" -> ole("WordDocument");
                case DOCX_TYPE -> wordPackage();
                default -> padded(head, 64);
            };
            return new MockMultipartFile("files", name, contentType, bytes);
        }

    }

}
