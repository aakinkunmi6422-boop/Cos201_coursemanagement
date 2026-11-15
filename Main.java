import java.io.IOException;
import java.util.Scanner;

/**
 * Student Course Management Portal - text based interface.
 */
public class Main {
    private static final String DEFAULT_FILE = "courses.txt";
    private static final int MAX_UNITS = 10;

    private final Scanner scanner = new Scanner(System.in);
    private final CourseManager manager = new CourseManager();

    public static void main(String[] args) {
        new Main().start();
    }

    private void start() {
        printBanner();
        runMenu();
        System.out.println("\nThank you for using the portal. Goodbye!");
        scanner.close();
    }

    // ------------------------------------------------------------------
    // Menu (RECURSIVE: the menu calls itself until the user chooses Exit)
    // ------------------------------------------------------------------
    private void runMenu() {
        printMenu();
        String choice = readLine("Enter your choice (1-7): ");

        switch (choice) {
            case "1":
                addCourse();
                break;
            case "2":
                viewAllCourses();
                break;
            case "3":
                searchCourse();
                break;
            case "4":
                computeTotalUnits();
                break;
            case "5":
                saveToFile();
                break;
            case "6":
                loadFromFile();
                break;
            case "7":
                return; // base case: stop the recursion
            default:
                System.out.println("\n[!] Invalid choice \"" + choice + "\". Please enter a number from 1 to 7.");
        }
        runMenu(); // recursive call: show the menu again
    }

    // ------------------------------------------------------------------
    // Menu actions
    // ------------------------------------------------------------------
    private void addCourse() {
        printHeader("ADD NEW COURSE");
        try {
            String code = readCourseCode();
            String title = readCourseTitle();
            int units = readUnits();

            manager.addCourse(new Course(code, title, units));
            System.out.println("\n[OK] Course " + code + " added successfully.");
        } catch (IllegalArgumentException e) {
            System.out.println("\n[!] Could not add course: " + e.getMessage());
        }
    }

    private void viewAllCourses() {
        printHeader("ALL COURSES");
        if (manager.isEmpty()) {
            System.out.println("No courses have been added yet.");
            return;
        }
        printTableTop();
        for (Course course : manager.getAllCourses()) {
            System.out.println(course);
        }
        printTableLine();
        System.out.println("Total courses: " + manager.size());
    }

    private void searchCourse() {
        printHeader("SEARCH COURSE BY CODE");
        String code = readLine("Enter course code: ").replaceAll("\\s+", "").toUpperCase();

        if (code.isEmpty()) {
            System.out.println("\n[!] Course code cannot be empty.");
            return;
        }

        Course found = manager.findByCode(code);
        if (found == null) {
            System.out.println("\n[!] No course found with code " + code + ".");
        } else {
            System.out.println("\nCourse found:");
            printTableTop();
            System.out.println(found);
            printTableLine();
        }
    }

    private void computeTotalUnits() {
        printHeader("TOTAL UNITS");
        System.out.println("Courses entered : " + manager.size());
        System.out.println("Total units     : " + manager.totalUnits());
    }

    private void saveToFile() {
        printHeader("SAVE TO FILE");
        if (manager.isEmpty()) {
            System.out.println("[!] Nothing to save. Add some courses first.");
            return;
        }
        String filename = readFilename();
        try {
            manager.saveToFile(filename);
            System.out.println("\n[OK] " + manager.size() + " course(s) saved to \"" + filename + "\".");
        } catch (IOException e) {
            System.out.println("\n[!] Could not save file: " + e.getMessage());
        }
    }

    private void loadFromFile() {
        printHeader("LOAD FROM FILE");
        String filename = readFilename();
        try {
            int skipped = manager.loadFromFile(filename);
            System.out.println("\n[OK] " + manager.size() + " course(s) loaded from \"" + filename + "\".");
            if (skipped > 0) {
                System.out.println("[!] " + skipped + " invalid or duplicate line(s) were skipped.");
            }
        } catch (IOException e) {
            System.out.println("\n[!] Could not load file: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Input helpers (loops keep asking until the input is valid)
    // ------------------------------------------------------------------
    private String readLine(String prompt) {
        System.out.print(prompt);
        if (!scanner.hasNextLine()) {
            // Input stream closed (e.g. Ctrl+D) - exit cleanly instead of crashing
            System.out.println("\nInput closed. Exiting.");
            System.exit(0);
        }
        return scanner.nextLine().trim();
    }

    /** Code format: 2-4 letters followed by 3 digits, e.g. CSC101 (spaces are removed). */
    private String readCourseCode() {
        while (true) {
            String code = readLine("Course code (e.g. CSC101): ").replaceAll("\\s+", "").toUpperCase();
            if (code.matches("[A-Z]{2,4}\\d{3}")) {
                return code;
            }
            System.out.println("[!] Invalid code. Use 2-4 letters followed by 3 digits (e.g. CSC101).");
        }
    }

    private String readCourseTitle() {
        while (true) {
            String title = readLine("Course title: ").replaceAll("\\s+", " ");
            if (title.isEmpty()) {
                System.out.println("[!] Title cannot be empty.");
            } else if (title.contains("|")) {
                System.out.println("[!] Title cannot contain the '|' character.");
            } else if (title.length() > 34) {
                System.out.println("[!] Title is too long (max 34 characters).");
            } else {
                return toTitleCase(title);
            }
        }
    }

    private int readUnits() {
        while (true) {
            String input = readLine("Units (1-" + MAX_UNITS + "): ");
            try {
                int units = Integer.parseInt(input);
                if (units >= 1 && units <= MAX_UNITS) {
                    return units;
                }
                System.out.println("[!] Units must be between 1 and " + MAX_UNITS + ".");
            } catch (NumberFormatException e) {
                System.out.println("[!] \"" + input + "\" is not a valid whole number.");
            }
        }
    }

    private String readFilename() {
        String filename = readLine("File name (press Enter for \"" + DEFAULT_FILE + "\"): ");
        return filename.isEmpty() ? DEFAULT_FILE : filename;
    }

    /** Simple string processing: "intro to programming" -> "Intro To Programming". */
    private String toTitleCase(String text) {
        StringBuilder result = new StringBuilder();
        for (String word : text.split(" ")) {
            if (word.isEmpty()) {
                continue;
            }
            if (result.length() > 0) {
                result.append(' ');
            }
            result.append(Character.toUpperCase(word.charAt(0)))
                  .append(word.substring(1).toLowerCase());
        }
        return result.toString();
    }

    // ------------------------------------------------------------------
    // Text GUI helpers
    // ------------------------------------------------------------------
    private void printBanner() {
        System.out.println("==================================================");
        System.out.println("      STUDENT COURSE MANAGEMENT PORTAL");
        System.out.println("==================================================");
    }

    private void printMenu() {
        System.out.println("\n+------------------------------------------------+");
        System.out.println("|                  MAIN MENU                     |");
        System.out.println("+------------------------------------------------+");
        System.out.println("|  1. Add Course                                 |");
        System.out.println("|  2. View All Courses                           |");
        System.out.println("|  3. Search Course by Code                      |");
        System.out.println("|  4. Compute Total Units                        |");
        System.out.println("|  5. Save to File                               |");
        System.out.println("|  6. Load from File                             |");
        System.out.println("|  7. Exit Program                               |");
        System.out.println("+------------------------------------------------+");
    }

    private void printHeader(String title) {
        System.out.println("\n--- " + title + " ---");
    }

    private void printTableLine() {
        System.out.println("+------------+------------------------------------+-------+");
    }

    private void printTableTop() {
        printTableLine();
        System.out.println(String.format("| %-10s | %-34s | %5s |", "CODE", "TITLE", "UNITS"));
        printTableLine();
    }
}
