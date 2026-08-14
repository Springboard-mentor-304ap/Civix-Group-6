package com.civix.civix_backend.dto;

import java.util.List;

public class MonthlyReportResponse {
    private String month;
    private long totalPetitions;
    private long resolved;
    private long pending;
    private long rejected;
    private long active;
    private double resolutionRate;
    private double averageResolutionTime;
    private String mostActiveLocality;
    private String mostActiveCategory;
    private long totalCitizensParticipated;
    private List<String> topTrendingIssues;
    private double monthlyGrowthPercentage;

    public MonthlyReportResponse() {
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public long getTotalPetitions() {
        return totalPetitions;
    }

    public void setTotalPetitions(long totalPetitions) {
        this.totalPetitions = totalPetitions;
    }

    public long getResolved() {
        return resolved;
    }

    public void setResolved(long resolved) {
        this.resolved = resolved;
    }

    public long getPending() {
        return pending;
    }

    public void setPending(long pending) {
        this.pending = pending;
    }

    public long getRejected() {
        return rejected;
    }

    public void setRejected(long rejected) {
        this.rejected = rejected;
    }

    public long getActive() {
        return active;
    }

    public void setActive(long active) {
        this.active = active;
    }

    public double getResolutionRate() {
        return resolutionRate;
    }

    public void setResolutionRate(double resolutionRate) {
        this.resolutionRate = resolutionRate;
    }

    public double getAverageResolutionTime() {
        return averageResolutionTime;
    }

    public void setAverageResolutionTime(double averageResolutionTime) {
        this.averageResolutionTime = averageResolutionTime;
    }

    public String getMostActiveLocality() {
        return mostActiveLocality;
    }

    public void setMostActiveLocality(String mostActiveLocality) {
        this.mostActiveLocality = mostActiveLocality;
    }

    public String getMostActiveCategory() {
        return mostActiveCategory;
    }

    public void setMostActiveCategory(String mostActiveCategory) {
        this.mostActiveCategory = mostActiveCategory;
    }

    public long getTotalCitizensParticipated() {
        return totalCitizensParticipated;
    }

    public void setTotalCitizensParticipated(long totalCitizensParticipated) {
        this.totalCitizensParticipated = totalCitizensParticipated;
    }

    public List<String> getTopTrendingIssues() {
        return topTrendingIssues;
    }

    public void setTopTrendingIssues(List<String> topTrendingIssues) {
        this.topTrendingIssues = topTrendingIssues;
    }

    public double getMonthlyGrowthPercentage() {
        return monthlyGrowthPercentage;
    }

    public void setMonthlyGrowthPercentage(double monthlyGrowthPercentage) {
        this.monthlyGrowthPercentage = monthlyGrowthPercentage;
    }
}
