package de.ichbinhier.volunteerformservice;

/** Validation and the database column read these, so they cannot disagree. */
public final class FieldLimits {

    public static final int NAME_MAX = 120;
    public static final int EMAIL_MAX = 254;
    public static final int ABOUT_MAX = 2000;
    public static final int NOTES_MAX = 4000;
    public static final int CODE_MAX = 32;
    public static final int CATEGORY_NAME_MAX = 60;
    public static final int CATEGORY_DESCRIPTION_MAX = 140;
    public static final int DOCUMENT_NAME_MAX = 255;
    public static final int STORED_NAME_MAX = 36;
    public static final int DOCUMENT_TYPE_MAX = 16;

    private FieldLimits() {
    }
}
