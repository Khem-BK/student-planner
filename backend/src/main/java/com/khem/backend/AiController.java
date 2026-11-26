package com.khem.backend;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final int MAX_TEXT_LENGTH = 15000;

    private final ClaudeClient claude;

    // Spring hands us the ClaudeClient automatically
    public AiController(ClaudeClient claude) {
        this.claude = claude;
    }

    // AI feature 1: find every assignment in pasted text (one sentence or a whole syllabus)
    @PostMapping("/extract-assignments")
    public Map<String, String> extractAssignments(@RequestBody Map<String, String> request) {
        String text = clean(request.get("text"));
        if (text.isEmpty() || text.length() > MAX_TEXT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please paste some text (up to " + MAX_TEXT_LENGTH + " characters).");
        }

        LocalDate today = parseDateOrToday(request.get("today"));
        String dayName = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.US);

        String system = """
                You read text that a student pasted: a syllabus, a course announcement, an email,
                or a short description of one assignment. Find every assignment, quiz, exam,
                project, reading, or other deadline in it.
                Today is %s (%s). Use this to work out dates like "Friday" or "next week".
                If a date has no year, pick the year that puts it closest to today.
                Reply with ONLY a JSON object, no other text, in this form:
                {"assignments": [{"title": "", "course": "", "dueDate": "", "dueTime": "", "priority": "", "notes": ""}]}
                Rules for each assignment:
                - "title": a short name, like "Lab 5 report" or "Midterm exam".
                - "course": the course code or name if the text mentions one, otherwise "".
                - "dueDate": YYYY-MM-DD, or "" if no date is given.
                - "dueTime": HH:MM in 24 hour time (for example "23:59" for 11:59 pm, "12:15" for
                  12:15 pm, "08:00" for 8 am), or "" if no time is given.
                  Use "23:59" for midnight and "12:00" for noon. Never guess a time that is not in the text.
                - "priority": "High" for exams, final projects, or anything called urgent or important.
                  "Low" for small readings or optional work. Otherwise "Medium".
                - "notes": one short sentence about anything you were unsure about, or "".
                Never invent assignments that are not in the text.
                If there are none, reply {"assignments": []}. List at most 40.
                """.formatted(today, dayName);

        return Map.of("result", claude.ask(system, text, 3000));
    }

    // AI feature 2: break a big assignment into smaller steps (or say it doesn't need any)
    @PostMapping("/subtasks")
    public Map<String, String> subtasks(@RequestBody Map<String, String> request) {
        String title = clean(request.get("title"));
        if (title.isEmpty() || title.length() > 300) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The assignment needs a title.");
        }

        String details = clean(request.get("details"));
        if (details.length() > 8000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The instructions are too long (up to 8000 characters).");
        }

        String system = """
                You help a student decide whether an assignment should be broken into smaller steps.
                Reply with ONLY a JSON object, no other text, in this form:
                {"subtasks": ["first step", "second step"], "reason": ""}
                Always reply with this JSON object, no matter what.
                If the student pasted the assignment instructions, base the steps on them:
                follow their parts, drafts, peer reviews, feedback, and submissions in order,
                and use their names (like "Part A" or "rhetorical analysis").
                Never add requirements that are not in the instructions.
                If something is unclear (for example, dates in the instructions do not match the
                due date), still give the steps and mention the concern in one short sentence in "reason".
                If the assignment is simple and can be done in one sitting (for example a quiz,
                a short reading, a worksheet, a discussion post, or a small homework), do NOT make
                up steps. Reply with an empty list and a short, friendly reason, like:
                {"subtasks": [], "reason": "This looks simple enough to do in one sitting."}
                Otherwise give 3 to 7 steps (up to 10 if the instructions have many parts),
                in the order they should be done.
                Each step is short (under 14 words), concrete, and starts with a verb.
                """;

        String userMessage = "Assignment: " + title
                + "\nCourse: " + clean(request.get("course"))
                + "\nDue date: " + clean(request.get("dueDate"))
                + (details.isEmpty() ? "" : "\nInstructions from the course:\n" + details);

        return Map.of("result", claude.ask(system, userMessage, 1500));
    }

    private static String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private static LocalDate parseDateOrToday(String value) {
        try {
            return LocalDate.parse(clean(value));
        } catch (Exception e) {
            return LocalDate.now();
        }
    }
}