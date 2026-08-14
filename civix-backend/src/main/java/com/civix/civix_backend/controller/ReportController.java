package com.civix.civix_backend.controller;

import com.civix.civix_backend.dto.MonthlyReportResponse;
import com.civix.civix_backend.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('OFFICIAL', 'ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport(
            @RequestParam int month,
            @RequestParam int year) {
        MonthlyReportResponse report = reportService.generateReportData(month, year);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/export/pdf")
    public void exportPdf(
            @RequestParam int month,
            @RequestParam int year,
            HttpServletResponse response) throws IOException {
        
        MonthlyReportResponse report = reportService.generateReportData(month, year);

        response.setContentType(MediaType.APPLICATION_PDF_VALUE);
        String headerKey = HttpHeaders.CONTENT_DISPOSITION;
        String headerValue = "attachment; filename=CIVIX_Report_" + year + "_" + month + ".pdf";
        response.setHeader(headerKey, headerValue);

        reportService.generatePdf(report, response.getOutputStream());
    }

    @GetMapping({"/export/csv", "/monthly/export/csv"})
    public void exportCsv(
            @RequestParam int month,
            @RequestParam int year,
            HttpServletResponse response) throws IOException {

        MonthlyReportResponse report = reportService.generateReportData(month, year);

        response.setContentType("text/csv");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        String headerKey = HttpHeaders.CONTENT_DISPOSITION;
        String headerValue = "attachment; filename=CIVIX_Report_" + year + "_" + month + ".csv";
        response.setHeader(headerKey, headerValue);

        try (OutputStreamWriter writer = new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8)) {
            reportService.generateCsv(report, writer);
        }
    }
}
