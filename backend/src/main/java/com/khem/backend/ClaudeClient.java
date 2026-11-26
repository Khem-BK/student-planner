package com.khem.backend;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

// Sends a message to the Claude API and returns Claude's reply as text.
@Service
public class ClaudeClient {

    private static final String MODEL = "claude-haiku-5-5";

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.anthropic.com")
            .build();

    @SuppressWarnings("unchecked")
    public String ask(String systemPrompt, String userMessage, int maxTokens) {
        // The key is read from your Mac's settings, never written in the code
        String apiKey = System.getenv("ANTHROPIC_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "ANTHROPIC_API_KEY is not set on the server.");
        }

        Map<String, Object> body = Map.of(
                "model", MODEL,
                "max_tokens", maxTokens,
                "system", systemPrompt,
                "messages", List.of(Map.of("role", "user", "content", userMessage)));

        try {
            Map<String, Object> response = restClient.post()
                    .uri("/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null || response.get("content") == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty reply from the AI.");
            }

            // Claude's reply comes in "blocks". Join the text ones together.
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
            StringBuilder text = new StringBuilder();
            for (Map<String, Object> block : content) {
                if ("text".equals(block.get("type"))) {
                    text.append(block.get("text"));
                }
            }
            return text.toString();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach the AI service.", e);
        }
    }
}