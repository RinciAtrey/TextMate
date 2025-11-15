package com.textmate.aiwriter.TextMate.service;

import com.textmate.aiwriter.TextMate.EmailRequest;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EmailGeneratorService {
    public String generateEmailReply(EmailRequest emailRequest){
        //Building the prompt
        String prompt= buildPrompt(emailRequest);

        //Crafting a request
        Map<String, Object> requestBody= Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                            Map.of("text", prompt)
                })
                }
        );
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt= new StringBuilder();
        prompt.append("Generate a professional reply for the following email content. Please don't generate a subject line.");
        if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()){
            prompt.append("Use a ").append(emailRequest.getTone()).append("tone.");
        }
        prompt.append("\nOriginal email: \n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }
}
