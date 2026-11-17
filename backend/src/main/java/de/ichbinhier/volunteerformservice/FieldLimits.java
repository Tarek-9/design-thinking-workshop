package de.ichbinhier.volunteerformservice;

/**
 * The length limits a text field is validated and stored with. Request DTOs and
 * entities read them from here, so the validation and the database column cannot
 * disagree about how long a value may be.
 */
public final class FieldLimits {

    public static final int NAME_MAX = 120;
    public static final int EMAIL_MAX = 254;
    public static final int ABOUT_MAX = 2000;
    public static final int NOTES_MAX = 4000;
    /** Enum names, the changed field's name, and the consent text version. */
    public static final int CODE_MAX = 32;
    public static final int CATEGORY_NAME_MAX = 60;
    public static final int CATEGORY_DESCRIPTION_MAX = 140;
    /** The upload's original name and the generated stored name (`A23`). */
    public static final int DOCUMENT_NAME_MAX = 255;
    public static final int STORED_NAME_MAX = 36;
    /** The enum name of a document's type, stored as a string. */
    public static final int DOCUMENT_TYPE_MAX = 16;

    private FieldLimits() {
    }
}
