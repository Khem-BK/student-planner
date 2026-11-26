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
                {"assignments": [{"title": "", "course": "", "dueDate": "", "priority": "", "notes": ""}]}
                Rules for each assignment:
                - "title": a short name, like "Lab 5 report" or "Midterm exam".
                - "course": the course code or name if the text mentions one, otherwise "".
                - "dueDate": YYYY-MM-DD, or "" if no date is given.
                - "priority": "High" for exams, final projects, or anything called urgent or important.
                  "Low" for small readings or optional work. Otherwise "Medium".
                - "notes": one short sentence about anything you were unsure about, or "".
                Never invent assignments that are not in the text.
                If there are none, reply {"assignments": []}. List at most 40.
                """.formatted(today, dayName);

        return Map.of("result", claude.ask(system, text, 3000));
    }

    // AI feature 2: break an assignment into smaller steps (used tomorrow)
    @PostMapping("/subtasks")
    public Map<String, String> subtasks(@RequestBody Map<String, String> request) {
        String title = clean(request.get("title"));
        if (title.isEmpty() || title.length() > 300) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The assignment needs a title.");
        }

        String system = """
                You help a student break one assignment into smaller steps.
                Reply with ONLY a JSON object, no other text, in this form:
                {"subtasks": ["first step", "second step"]}
                Rules: 3 to 7 steps, in the order they should be done.
                Each step is short (under 12 words), concrete, and starts with a verb.
                Only include steps that fit this assignment.
                """;

        String userMessage = "Assignment: " + title
                + "\nCourse: " + clean(request.get("course"))
                + "\nDue date: " + clean(request.get("dueDate"));

        return Map.of("result", claude.ask(system, userMessage, 400));
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