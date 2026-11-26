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

    private final ClaudeClient claude;

    // Spring hands us the ClaudeClient automatically
    public AiController(ClaudeClient claude) {
        this.claude = claude;
    }

    // AI feature 1: turn a sentence into assignment details
    @PostMapping("/parse-assignment")
    public Map<String, String> parseAssignment(@RequestBody Map<String, String> request) {
        String text = clean(request.get("text"));
        if (text.isEmpty() || text.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please type a short description.");
        }

        LocalDate today = parseDateOrToday(request.get("today"));
        String dayName = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.US);

        String system = """
                You turn a student's description of an assignment into JSON.
                Today is %s (%s).
                Reply with ONLY a JSON object, no other text, with exactly these keys:
                "title": a short name for the assignment,
                "course": the course code or name, or "" if not mentioned,
                "dueDate": the due date as YYYY-MM-DD, worked out from today's date for words
                           like "tomorrow" or "Friday" (always the next one coming), or "" if no date is given,
                "priority": "High", "Medium", or "Low". Use "Medium" if not stated.
                            Use "High" for words like urgent, important, or high priority,
                "notes": one short sentence about anything you were unsure about, or "".
                """.formatted(today, dayName);

        return Map.of("result", claude.ask(system, text, 300));
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