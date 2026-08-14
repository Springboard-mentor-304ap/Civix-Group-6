package com.civix.civix_backend.service;

import com.civix.civix_backend.dto.MonthlyReportResponse;
import com.civix.civix_backend.entity.Petition;
import com.civix.civix_backend.entity.Signature;
import com.civix.civix_backend.entity.Vote;
import com.civix.civix_backend.repository.PetitionRepository;
import com.civix.civix_backend.repository.SignatureRepository;
import com.civix.civix_backend.repository.VoteRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.io.Writer;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final PetitionRepository petitionRepository;
    private final SignatureRepository signatureRepository;
    private final VoteRepository voteRepository;

    public ReportService(PetitionRepository petitionRepository,
                         SignatureRepository signatureRepository,
                         VoteRepository voteRepository) {
        this.petitionRepository = petitionRepository;
        this.signatureRepository = signatureRepository;
        this.voteRepository = voteRepository;
    }

    public MonthlyReportResponse generateReportData(int month, int year) {
        YearMonth targetMonth = YearMonth.of(year, month);
        LocalDateTime start = targetMonth.atDay(1).atStartOfDay();
        LocalDateTime end = targetMonth.atEndOfMonth().atTime(23, 59, 59, 999999);

        List<Petition> petitions = petitionRepository.findAllByCreatedAtBetween(start, end);
        List<Signature> signatures = signatureRepository.findAllByTimestampBetween(start, end);
        List<Vote> votes = voteRepository.findAllByTimestampBetween(start, end);

        MonthlyReportResponse report = new MonthlyReportResponse();
        
        // Month name
        String monthName = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + year;
        report.setMonth(monthName);

        // Core counts
        long total = petitions.size();
        report.setTotalPetitions(total);

        long resolved = 0;
        long rejected = 0;
        long pending = 0;
        long active = 0;

        for (Petition p : petitions) {
            String status = p.getStatus() != null ? p.getStatus().toUpperCase() : "ACTIVE";
            if (status.equals("ACTIVE")) {
                active++;
            }
            if (status.equals("RESOLVED") || status.equals("APPROVED")) {
                resolved++;
            } else if (status.equals("REJECTED")) {
                rejected++;
            } else {
                pending++;
            }
        }

        report.setResolved(resolved);
        report.setRejected(rejected);
        report.setPending(pending);
        report.setActive(active);

        double rate = total == 0 ? 0.0 : (resolved * 100.0) / total;
        // Round to 1 decimal place
        report.setResolutionRate(Math.round(rate * 10.0) / 10.0);

        // Average Resolution Time (in hours)
        double totalResolutionHours = 0;
        long resolvedCountWithTime = 0;
        for (Petition p : petitions) {
            if (p.getReviewedAt() != null && (p.getStatus().equals("RESOLVED") || p.getStatus().equals("APPROVED") || p.getStatus().equals("REJECTED"))) {
                long hours = Duration.between(p.getCreatedAt(), p.getReviewedAt()).toHours();
                totalResolutionHours += hours;
                resolvedCountWithTime++;
            }
        }
        double avgHours = resolvedCountWithTime == 0 ? 0.0 : totalResolutionHours / resolvedCountWithTime;
        report.setAverageResolutionTime(Math.round(avgHours * 10.0) / 10.0);

        // Most Active Locality
        Map<String, Long> localityCounts = petitions.stream()
                .filter(p -> p.getLocation() != null && !p.getLocation().isBlank())
                .collect(Collectors.groupingBy(Petition::getLocation, Collectors.counting()));
        String activeLocality = localityCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        report.setMostActiveLocality(activeLocality);

        // Most Active Category
        Map<String, Long> categoryCounts = petitions.stream()
                .filter(p -> p.getCategory() != null && !p.getCategory().isBlank())
                .collect(Collectors.groupingBy(Petition::getCategory, Collectors.counting()));
        String activeCategory = categoryCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
        report.setMostActiveCategory(activeCategory);

        // Unique Citizens Participated
        Set<Long> participantIds = new HashSet<>();
        petitions.forEach(p -> participantIds.add(p.getCreator().getId()));
        signatures.forEach(s -> participantIds.add(s.getUser().getId()));
        votes.forEach(v -> participantIds.add(v.getUser().getId()));
        report.setTotalCitizensParticipated(participantIds.size());

        // Top Trending Issues (top 3 by signature count)
        List<String> trending = petitions.stream()
                .sorted((a, b) -> {
                    long countA = signatureRepository.countByPetitionId(a.getId());
                    long countB = signatureRepository.countByPetitionId(b.getId());
                    return Long.compare(countB, countA);
                })
                .limit(3)
                .map(p -> p.getTitle() + " (" + signatureRepository.countByPetitionId(p.getId()) + " sigs)")
                .collect(Collectors.toList());
        report.setTopTrendingIssues(trending);

        // Monthly Growth Percentage
        YearMonth prevMonth = targetMonth.minusMonths(1);
        LocalDateTime prevStart = prevMonth.atDay(1).atStartOfDay();
        LocalDateTime prevEnd = prevMonth.atEndOfMonth().atTime(23, 59, 59, 999999);
        long prevTotal = petitionRepository.findAllByCreatedAtBetween(prevStart, prevEnd).size();
        
        double growth = prevTotal == 0 ? (total > 0 ? 100.0 : 0.0) : ((total - prevTotal) * 100.0) / prevTotal;
        report.setMonthlyGrowthPercentage(Math.round(growth * 10.0) / 10.0);

        return report;
    }

    public void generatePdf(MonthlyReportResponse report, OutputStream out) {
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font configurations
            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD);
            Font sectionFont = new Font(Font.HELVETICA, 14, Font.BOLD);
            Font bodyFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font boldFont = new Font(Font.HELVETICA, 11, Font.BOLD);

            // Document Title
            Paragraph title = new Paragraph("CIVIX - Monthly Civic Engagement Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Report Meta
            document.add(new Paragraph("Report Period: " + report.getMonth(), boldFont));
            document.add(new Paragraph("Generated On: " + LocalDateTime.now(), bodyFont));
            document.add(new Paragraph("Role restriction: OFFICIAL & ADMIN Confidential", bodyFont));
            document.add(new Paragraph(" ", bodyFont)); // Empty spacer

            // Section 1: Petition Statistics
            document.add(new Paragraph("1. General Petition Statistics", sectionFont));
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------", bodyFont));
            
            PdfPTable statsTable = new PdfPTable(2);
            statsTable.setWidthPercentage(100);
            statsTable.setSpacingBefore(10);
            statsTable.setSpacingAfter(15);

            addTableCell(statsTable, "Metric Name", boldFont);
            addTableCell(statsTable, "Value", boldFont);

            addTableCell(statsTable, "Total Petitions Launched", bodyFont);
            addTableCell(statsTable, String.valueOf(report.getTotalPetitions()), bodyFont);

            addTableCell(statsTable, "Resolved / Approved Petitions", bodyFont);
            addTableCell(statsTable, String.valueOf(report.getResolved()), bodyFont);

            addTableCell(statsTable, "Rejected Petitions", bodyFont);
            addTableCell(statsTable, String.valueOf(report.getRejected()), bodyFont);

            addTableCell(statsTable, "Pending / Active Petitions", bodyFont);
            addTableCell(statsTable, String.valueOf(report.getPending()), bodyFont);

            addTableCell(statsTable, "Active Petitions", bodyFont);
            addTableCell(statsTable, String.valueOf(report.getActive()), bodyFont);

            addTableCell(statsTable, "Resolution Rate", bodyFont);
            addTableCell(statsTable, report.getResolutionRate() + "%", bodyFont);

            addTableCell(statsTable, "Monthly Growth Rate", bodyFont);
            addTableCell(statsTable, report.getMonthlyGrowthPercentage() + "%", bodyFont);

            document.add(statsTable);

            // Section 2: Engagement & Activity Analysis
            document.add(new Paragraph("2. Locality & Category Analysis", sectionFont));
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------", bodyFont));

            PdfPTable analysisTable = new PdfPTable(2);
            analysisTable.setWidthPercentage(100);
            analysisTable.setSpacingBefore(10);
            analysisTable.setSpacingAfter(15);

            addTableCell(analysisTable, "Metric", boldFont);
            addTableCell(analysisTable, "Analysis Details", boldFont);

            addTableCell(analysisTable, "Most Active Locality", bodyFont);
            addTableCell(analysisTable, report.getMostActiveLocality(), bodyFont);

            addTableCell(analysisTable, "Most Active Category", bodyFont);
            addTableCell(analysisTable, report.getMostActiveCategory(), bodyFont);

            addTableCell(analysisTable, "Total Active Citizens Participated", bodyFont);
            addTableCell(analysisTable, String.valueOf(report.getTotalCitizensParticipated()), bodyFont);

            addTableCell(analysisTable, "Average Resolution Time", bodyFont);
            addTableCell(analysisTable, report.getAverageResolutionTime() + " Hours", bodyFont);

            document.add(analysisTable);

            // Section 3: Trending Issues
            document.add(new Paragraph("3. Top Trending Issues / Petitions", sectionFont));
            document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------", bodyFont));
            document.add(new Paragraph(" ", bodyFont)); // Empty spacer

            if (report.getTopTrendingIssues() != null && !report.getTopTrendingIssues().isEmpty()) {
                int count = 1;
                for (String issue : report.getTopTrendingIssues()) {
                    document.add(new Paragraph("  " + count + ". " + issue, bodyFont));
                    count++;
                }
            } else {
                document.add(new Paragraph("No trending issues recorded for this period.", bodyFont));
            }

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF document", e);
        }
    }

    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(6);
        table.addCell(cell);
    }

    public void generateCsv(MonthlyReportResponse report, Writer writer) throws IOException {
        CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT
                .withHeader("Report Period", "Metric Name", "Value", "Notes"));

        csvPrinter.printRecord(report.getMonth(), "Total Petitions", report.getTotalPetitions(), "Total petitions launched in this period");
        csvPrinter.printRecord(report.getMonth(), "Resolved Petitions", report.getResolved(), "Petitions resolved or approved");
        csvPrinter.printRecord(report.getMonth(), "Rejected Petitions", report.getRejected(), "Petitions marked as rejected");
        csvPrinter.printRecord(report.getMonth(), "Pending Petitions", report.getPending(), "Active or under review status");
        csvPrinter.printRecord(report.getMonth(), "Active Petitions", report.getActive(), "Petitions in active status");
        csvPrinter.printRecord(report.getMonth(), "Resolution Rate", report.getResolutionRate() + "%", "Percentage of resolved to total petitions");
        csvPrinter.printRecord(report.getMonth(), "Average Resolution Time", report.getAverageResolutionTime() + " Hours", "Mean duration from launch to resolution");
        csvPrinter.printRecord(report.getMonth(), "Most Active Locality", report.getMostActiveLocality(), "Locality with maximum petition submissions");
        csvPrinter.printRecord(report.getMonth(), "Most Active Category", report.getMostActiveCategory(), "Category with maximum petition submissions");
        csvPrinter.printRecord(report.getMonth(), "Total Citizens Participated", report.getTotalCitizensParticipated(), "Unique citizens who created, signed, or voted");
        csvPrinter.printRecord(report.getMonth(), "Monthly Growth Rate", report.getMonthlyGrowthPercentage() + "%", "Growth rate compared to previous month");

        if (report.getTopTrendingIssues() != null) {
            int rank = 1;
            for (String issue : report.getTopTrendingIssues()) {
                csvPrinter.printRecord(report.getMonth(), "Trending Issue Rank #" + rank, issue, "Top trending topic of the month");
                rank++;
            }
        }

        csvPrinter.flush();
    }
}
