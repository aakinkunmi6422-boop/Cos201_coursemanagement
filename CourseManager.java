import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Stores and manages all courses in an internal ArrayList.
 */
public class CourseManager {
    private final List<Course> courses = new ArrayList<>();

    /**
     * Adds a course after checking for duplicate codes.
     *
     * @throws IllegalArgumentException if the code already exists
     */
    public void addCourse(Course course) {
        if (findByCode(course.getCode()) != null) {
            throw new IllegalArgumentException("A course with code " + course.getCode() + " already exists.");
        }
        courses.add(course);
    }

    public boolean isEmpty() {
        return courses.isEmpty();
    }

    public int size() {
        return courses.size();
    }

    /** Returns a read-only copy of the stored courses. */
    public List<Course> getAllCourses() {
        return new ArrayList<>(courses);
    }

    /** Public entry point for the recursive search. Returns null if not found. */
    public Course findByCode(String code) {
        return findByCode(code, 0);
    }

    /** RECURSION: checks the course at 'index', then calls itself for the next one. */
    private Course findByCode(String code, int index) {
        if (index >= courses.size()) {
            return null; // base case: reached the end, not found
        }
        if (courses.get(index).getCode().equals(code)) {
            return courses.get(index); // base case: found
        }
        return findByCode(code, index + 1); // recursive case
    }

    /** Public entry point for the recursive unit total. */
    public int totalUnits() {
        return totalUnits(0);
    }

    /** RECURSION: units of this course + total of all the remaining courses. */
    private int totalUnits(int index) {
        if (index >= courses.size()) {
            return 0; // base case
        }
        return courses.get(index).getUnits() + totalUnits(index + 1);
    }

    /** Writes every course to a text file, one course per line. **/

    public void saveToFile(String filename) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(filename))) {
            for (Course course : courses) {
                writer.write(course.toFileLine());
                writer.newLine();
            }
        }
    }

    /** This replaces the current list with courses stored in the file **/
    public int loadFromFile(String filename) throws IOException {
        List<Course> loaded = new ArrayList<>();
        int skipped = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                try {
                    Course course = Course.fromFileLine(line);
                    boolean duplicate = false;
                    for (Course existing : loaded) {
                        if (existing.getCode().equals(course.getCode())) {
                            duplicate = true;
                            break;
                        }
                    }
                    if (duplicate) {
                        skipped++;
                    } else {
                        loaded.add(course);
                    }
                } catch (IllegalArgumentException e) {
                    skipped++;
                }
            }
        }

        courses.clear();
        courses.addAll(loaded);
        return skipped;
    }
}
