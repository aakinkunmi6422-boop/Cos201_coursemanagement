/**
 * Represents a single course with a code, a title and a number of units.
 */
public class Course {
    private static final String SEPARATOR = "|";

    private final String code;
    private final String title;
    private final int units;

    public Course(String code, String title, int units) {
        this.code = code;
        this.title = title;
        this.units = units;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public int getUnits() {
        return units;
    }

    /** Converts this course into one line of text for saving to a file. */
    public String toFileLine() {
        return code + SEPARATOR + title + SEPARATOR + units;
    }

    /**
     * Rebuilds a course from a saved line.
     *
     * @throws IllegalArgumentException if the line is not in the expected format
     */
    public static Course fromFileLine(String line) {
        if (line == null || line.isBlank()) {
            throw new IllegalArgumentException("Empty line");
        }

        String[] parts = line.split("\\" + SEPARATOR);
        if (parts.length != 3) {
            throw new IllegalArgumentException("Expected 3 fields but found " + parts.length);
        }

        String code = parts[0].trim().toUpperCase();
        String title = parts[1].trim();
        int units;
        try {
            units = Integer.parseInt(parts[2].trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Units is not a number: " + parts[2]);
        }

        if (code.isEmpty() || title.isEmpty() || units <= 0) {
            throw new IllegalArgumentException("Missing or invalid field(s)");
        }
        return new Course(code, title, units);
    }

    @Override
    public String toString() {
        return String.format("| %-10s | %-34s | %5d |", code, title, units);
    }
}
