/**
 * STUDENT COURSE MANAGEMENT SYSTEM
 * --------------------------------
 * A console-based Node.js application that lets a student keep a list of
 * registered courses (code, title, unit), search it, total the units, and
 * save/load the list from a CSV file.
 *
 * Run with:   node student-course-management.js
 * Needs:      Node.js 16 or newer (no extra packages required)
 *
 * Structure (as suggested in the project breakdown):
 *   1. Course         - stores ONE course
 *   2. CourseManager  - stores and manages MANY courses (add, search, total, save, load)
 *   3. Menu / UI      - talks to the user and calls CourseManager
 */

const fs = require("fs");
const readline = require("readline/promises");

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
const DEFAULT_FILE = "courses.csv"; // predictable file name, saved next to where you run the program
const MAX_UNIT = 10;                // a sensible upper limit for credit units

// ---------------------------------------------------------------------------
// Small helpers for validation (string processing)
// ---------------------------------------------------------------------------

/** Trim spaces and convert a course code to UPPERCASE so "csc101 " becomes "CSC101". */
function normaliseCode(code) {
  return String(code).trim().toUpperCase();
}

/** Trim extra spaces from a title (also squashes repeated inner spaces). */
function normaliseTitle(title) {
  return String(title).trim().replace(/\s+/g, " ");
}

/**
 * Convert text to a whole number. Throws an Error with a friendly message if
 * the text is not a whole number between 1 and MAX_UNIT.
 */
function parseUnit(text) {
  const cleaned = String(text).trim();
  if (!/^\d+$/.test(cleaned)) {
    throw new Error("Unit must be a whole number (for example 2 or 3).");
  }
  const unit = Number(cleaned);
  if (unit < 1 || unit > MAX_UNIT) {
    throw new Error(`Unit must be between 1 and ${MAX_UNIT}.`);
  }
  return unit;
}

// ---------------------------------------------------------------------------
// CSV helpers (so a title like "Physics, Part 1" does not break the file)
// ---------------------------------------------------------------------------

/** Wrap a value in quotes if it contains a comma, quote or line break. */
function csvEscape(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

/** Split ONE line of CSV into its fields, respecting quoted fields. */
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (insideQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'; // two quotes in a row = one literal quote
        i++;
      } else if (char === '"') {
        insideQuotes = false; // closing quote
      } else {
        current += char;
      }
    } else if (char === '"') {
      insideQuotes = true; // opening quote
    } else if (char === ",") {
      fields.push(current); // end of this field
      current = "";
    } else {
      current += char;
    }
  }

  if (insideQuotes) {
    throw new Error("Unclosed quotation mark.");
  }
  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// 1. COURSE CLASS - represents one course
// ---------------------------------------------------------------------------
class Course {
  constructor(courseCode, courseTitle, unit) {
    this.courseCode = normaliseCode(courseCode);
    this.courseTitle = normaliseTitle(courseTitle);
    this.unit = unit;
  }

  getCourseCode() {
    return this.courseCode;
  }

  getCourseTitle() {
    return this.courseTitle;
  }

  getUnit() {
    return this.unit;
  }

  /** Nicely aligned line for display in the console. */
  displayCourse() {
    return (
      this.courseCode.padEnd(10) +
      this.courseTitle.padEnd(40) +
      String(this.unit).padStart(4)
    );
  }

  /** One CSV line for saving to file. */
  toFileRecord() {
    return [
      csvEscape(this.courseCode),
      csvEscape(this.courseTitle),
      csvEscape(this.unit),
    ].join(",");
  }
}

// ---------------------------------------------------------------------------
// 2. COURSE MANAGER CLASS - manages the collection of Course objects
// ---------------------------------------------------------------------------
class CourseManager {
  constructor() {
    this.courses = [];        // starts empty
    this.unsavedChanges = false; // used for the "save before exit?" prompt
  }

  /** Does a course with this code already exist? (case-insensitive) */
  containsCourseCode(code) {
    const wanted = normaliseCode(code);
    return this.courses.some((course) => course.getCourseCode() === wanted);
  }

  /**
   * Add a validated course. Throws an Error with a clear message if the
   * code or title is blank, or the code already exists.
   */
  addCourse(course) {
    if (course.getCourseCode() === "") {
      throw new Error("Course code cannot be empty.");
    }
    if (course.getCourseTitle() === "") {
      throw new Error("Course title cannot be empty.");
    }
    if (this.containsCourseCode(course.getCourseCode())) {
      throw new Error(`Course code ${course.getCourseCode()} already exists.`);
    }
    this.courses.push(course);
    this.unsavedChanges = true;
  }

  /** Print every course in aligned columns (or a message if there are none). */
  displayAllCourses() {
    if (this.courses.length === 0) {
      console.log("\nNo courses have been added yet.");
      return;
    }

    console.log("\n" + "CODE".padEnd(10) + "TITLE".padEnd(40) + "UNIT".padStart(4));
    console.log("-".repeat(54));
    for (const course of this.courses) {
      console.log(course.displayCourse());
    }
    console.log("-".repeat(54));
    console.log(`Number of courses: ${this.countCoursesRecursive(0)}`);
  }

  /**
   * Search by course code using RECURSION.
   * - Base case 1: index has gone past the end of the list -> not found (null)
   * - Base case 2: the course at this index matches -> return it
   * - Recursive case: otherwise, search again starting at the next index
   */
  searchCourseByCode(code, index = 0) {
    if (index >= this.courses.length) {
      return null;
    }
    if (this.courses[index].getCourseCode() === normaliseCode(code)) {
      return this.courses[index];
    }
    return this.searchCourseByCode(code, index + 1);
  }

  /**
   * Count the courses using RECURSION (a simple demonstration).
   * - Base case: index reached the end of the list -> return 0
   * - Recursive case: 1 + the count of the remaining courses
   */
  countCoursesRecursive(index = 0) {
    if (index >= this.courses.length) {
      return 0;
    }
    return 1 + this.countCoursesRecursive(index + 1);
  }

  /** Add up all units using a loop. Returns 0 for an empty list. */
  calculateTotalUnits() {
    let total = 0;
    for (const course of this.courses) {
      total += course.getUnit();
    }
    return total;
  }

  /**
   * Save the COMPLETE current list to a CSV file (overwrites the old file,
   * so there are never duplicate records). Throws on file errors.
   */
  saveToFile(filename) {
    const lines = ["course_code,course_title,unit"]; // header row
    for (const course of this.courses) {
      lines.push(course.toFileRecord());
    }
    fs.writeFileSync(filename, lines.join("\n") + "\n", "utf8");
    this.unsavedChanges = false;
  }

  /**
   * Load courses from a CSV file. Policy: loading REPLACES the current list,
   * but only after the file has been read successfully.
   * Returns { loaded, skipped, problems } so the menu can report what happened.
   * Throws on file errors (e.g. file not found).
   */
  loadFromFile(filename) {
    const text = fs.readFileSync(filename, "utf8");
    const lines = text.split(/\r?\n/);

    const newCourses = [];
    const problems = [];
    let skipped = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const line = lines[i].trim();

      if (line === "") continue;                                 // ignore blank lines
      if (i === 0 && line.toLowerCase().startsWith("course_code")) continue; // skip header

      try {
        const fields = parseCsvLine(line);
        if (fields.length !== 3) {
          throw new Error("expected 3 fields (code, title, unit)");
        }

        const code = normaliseCode(fields[0]);
        const title = normaliseTitle(fields[1]);
        if (code === "") throw new Error("course code is blank");
        if (title === "") throw new Error("course title is blank");
        const unit = parseUnit(fields[2]);

        if (newCourses.some((c) => c.getCourseCode() === code)) {
          throw new Error(`duplicate course code ${code}`);
        }

        newCourses.push(new Course(code, title, unit));
      } catch (error) {
        skipped++;
        problems.push(`Line ${lineNumber}: ${error.message}`);
      }
    }

    // If the file had records but NONE were usable, keep the existing list safe.
    if (newCourses.length === 0 && skipped > 0) {
      throw new Error("The file contained no valid course records.");
    }

    this.courses = newCourses; // replace the in-memory list
    this.unsavedChanges = false;
    return { loaded: newCourses.length, skipped, problems };
  }
}

// ---------------------------------------------------------------------------
// 3. MENU / USER INTERFACE
// ---------------------------------------------------------------------------
class Menu {
  constructor(manager, rl) {
    this.manager = manager;
    this.rl = rl;
  }

  showMenu() {
    console.log("\n==================================");
    console.log("  STUDENT COURSE MANAGEMENT SYSTEM");
    console.log("==================================");
    console.log("  1. Add Course");
    console.log("  2. View All Courses");
    console.log("  3. Search Course by Code");
    console.log("  4. Compute Total Units");
    console.log("  5. Save to File");
    console.log("  6. Load from File");
    console.log("  7. Exit Program");
    console.log("==================================");
  }

  /** Ask a question and return the typed answer. */
  async ask(prompt) {
    return await this.rl.question(prompt);
  }

  /** Validate that the menu choice is a whole number from 1 to 7. */
  parseChoice(text) {
    const cleaned = text.trim();
    if (!/^\d+$/.test(cleaned)) return null;
    const choice = Number(cleaned);
    return choice >= 1 && choice <= 7 ? choice : null;
  }

  // ----- Option 1: Add a course (re-asks each field until it is valid) -----
  async handleAdd() {
    console.log("\n--- Add Course ---");

    let code;
    while (true) {
      code = normaliseCode(await this.ask("Course code (e.g. CSC101): "));
      if (code === "") {
        console.log("Error: course code cannot be empty. Try again.");
      } else if (this.manager.containsCourseCode(code)) {
        console.log(`Error: ${code} already exists. Enter a different code.`);
      } else {
        break;
      }
    }

    let title;
    while (true) {
      title = normaliseTitle(await this.ask("Course title: "));
      if (title === "") {
        console.log("Error: course title cannot be empty. Try again.");
      } else {
        break;
      }
    }

    let unit;
    while (true) {
      try {
        unit = parseUnit(await this.ask(`Credit unit (1-${MAX_UNIT}): `));
        break;
      } catch (error) {
        console.log("Error: " + error.message);
      }
    }

    try {
      this.manager.addCourse(new Course(code, title, unit));
      console.log(`\nSuccess: ${code} - ${title} (${unit} unit${unit > 1 ? "s" : ""}) added.`);
    } catch (error) {
      console.log("Error: " + error.message);
    }
  }

  // ----- Option 3: Search by code -----
  async handleSearch() {
    console.log("\n--- Search Course by Code ---");
    const code = await this.ask("Enter course code: ");

    if (normaliseCode(code) === "") {
      console.log("Error: course code cannot be empty.");
      return;
    }

    const course = this.manager.searchCourseByCode(code);
    if (course) {
      console.log("\nCourse found:");
      console.log(`  Code : ${course.getCourseCode()}`);
      console.log(`  Title: ${course.getCourseTitle()}`);
      console.log(`  Unit : ${course.getUnit()}`);
    } else {
      console.log(`\nCourse not found: ${normaliseCode(code)}`);
    }
  }

  // ----- Option 4: Total units -----
  handleTotal() {
    const total = this.manager.calculateTotalUnits();
    const count = this.manager.countCoursesRecursive();
    console.log(`\nTotal credit units: ${total} (from ${count} course${count === 1 ? "" : "s"})`);
  }

  // ----- Option 5: Save -----
  async handleSave() {
    const answer = (await this.ask(`File name (press Enter for "${DEFAULT_FILE}"): `)).trim();
    const filename = answer === "" ? DEFAULT_FILE : answer;

    try {
      this.manager.saveToFile(filename);
      console.log(`\nSuccess: ${this.manager.courses.length} course(s) saved to "${filename}".`);
    } catch (error) {
      console.log(`\nError: could not save the file (${error.message}).`);
    }
  }

  // ----- Option 6: Load -----
  async handleLoad() {
    const answer = (await this.ask(`File name (press Enter for "${DEFAULT_FILE}"): `)).trim();
    const filename = answer === "" ? DEFAULT_FILE : answer;

    try {
      const result = this.manager.loadFromFile(filename);
      console.log(`\nSuccess: ${result.loaded} course(s) loaded from "${filename}". The previous list was replaced.`);
      if (result.skipped > 0) {
        console.log(`Warning: ${result.skipped} record(s) skipped:`);
        for (const problem of result.problems) {
          console.log("  - " + problem);
        }
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`\nError: "${filename}" was not found. There is no saved list to load.`);
      } else if (error.code === "EACCES") {
        console.log(`\nError: permission denied when reading "${filename}".`);
      } else {
        console.log(`\nError: could not load the file (${error.message}).`);
      }
    }
  }

  // ----- Option 7: Exit (offers to save unsaved changes) -----
  async handleExit() {
    if (this.manager.unsavedChanges) {
      const answer = (await this.ask("You have unsaved changes. Save before exiting? (y/n): ")).trim().toLowerCase();
      if (answer === "y" || answer === "yes") {
        await this.handleSave();
      }
    }
    console.log("\nThank you for using the Student Course Management System. Goodbye!");
  }

  /** The main loop: keeps showing the menu until the user chooses Exit. */
  async run() {
    let running = true;

    while (running) {
      this.showMenu();
      const input = await this.ask("Enter your choice (1-7): ");
      const choice = this.parseChoice(input);

      switch (choice) {
        case 1:
          await this.handleAdd();
          break;
        case 2:
          this.manager.displayAllCourses();
          break;
        case 3:
          await this.handleSearch();
          break;
        case 4:
          this.handleTotal();
          break;
        case 5:
          await this.handleSave();
          break;
        case 6:
          await this.handleLoad();
          break;
        case 7:
          await this.handleExit();
          running = false;
          break;
        default:
          console.log("\nInvalid choice. Please enter a number from 1 to 7.");
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Program starts here
// ---------------------------------------------------------------------------
async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const manager = new CourseManager();
  const menu = new Menu(manager, rl);

  try {
    await menu.run();
  } catch (error) {
    // Happens if the input stream closes unexpectedly (e.g. Ctrl+D)
    console.log("\nInput closed. Exiting program.");
  } finally {
    rl.close();
  }
}

main();
