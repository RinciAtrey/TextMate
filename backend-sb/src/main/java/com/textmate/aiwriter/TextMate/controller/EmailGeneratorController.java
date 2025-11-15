package com.textmate.aiwriter.TextMate.controller;

import com.textmate.aiwriter.TextMate.EmailRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
public class EmailGeneratorController {

    public ResponseEntity<String> generateEmail(@ResponseBody EmailRequest emailRequest){
        return ResponseEntity.ok("");
    }
}
