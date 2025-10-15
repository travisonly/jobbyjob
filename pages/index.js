'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, TrendingUp, Download, Target, Award, Lock } from 'lucide-react';

export default function Jobbyjob() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'jobbyjob2025' || passwordInput.length > 0) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('jobbyjob_auth', 'true');
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('jobbyjob_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    try {
      if (fileType === 'pdf' || fileType === 'docx') {
        alert('PDF/DOCX upload coming soon! Please copy/paste text for now.');
        return;
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          if (type === 'resume') {
            setResumeText(text);
          } else {
            setJobDescription(text);
          }
        };
        reader.readAsText(file);
      }
    } catch (error) {
      alert('Error reading file. Please try copy/paste instead.');
    }
  };

  useEffect(() => {
    if (resumeText) {
      analyzeResume();
    }
  }, [resumeText, jobDescription]);

  const analyzeResume = () => {
    if (!resumeText) return;

    setLoading(true);
    
    const results = {
      overallScore: 0,
      categories: {},
      atsBreakingElements: [],
      sections: {},
      contactInfo: {},
      keywords: {},
      skillsGap: {},
      achievements: {},
      recommendations: []
    };

    results.contactInfo = analyzeContactInfo(resumeText);
    results.sections = analyzeSections(resumeText);
    results.atsBreakingElements = detectATSBreakers(resumeText);
    
    if (jobDescription) {
      results.keywords = analyzeKeywords(resumeText, jobDescription);
      results.skillsGap = analyzeSkillsGap(resumeText, jobDescription);
    }
    
    results.achievements = analyzeAchievements(resumeText);
    results.categories.formatting = analyzeFormatting(resumeText, results.atsBreakingElements);
    results.categories.content = analyzeContent(resumeText, results.achievements);
    results.categories.keywords = results.keywords.score || 50;
    results.categories.structure = analyzeStructure(results.sections);
    results.categories.readability = analyzeReadability(resumeText);
    results.overallScore = calculateOverallScore(results.categories);
    results.recommendations = generateRecommendations(results);
    
    setAnalysis(results);
    setLoading(false);
  };

  const analyzeContactInfo = (text) => {
    const lower = text.toLowerCase();
    return {
      hasEmail: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text),
      hasPhone: /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/.test(text),
      hasLinkedIn: lower.includes('linkedin') || lower.includes('linked.in'),
      hasLocation: /\b(city|state|[A-Z]{2}\s+\d{5})\b/.test(text) || 
                   /(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)/i.test(text),
    };
  };

  const analyzeSections = (text) => {
    const sections = {
      contact: false,
      summary: false,
      experience: false,
      education: false,
      skills: false
    };

    const lower = text.toLowerCase();
    
    if (lower.includes('experience') || lower.includes('work history') || lower.includes('employment')) sections.experience = true;
    if (lower.includes('education') || lower.includes('degree') || lower.includes('university') || lower.includes('college')) sections.education = true;
    if (lower.includes('skills') || lower.includes('technical') || lower.includes('competencies') || lower.includes('proficiencies')) sections.skills = true;
    if (lower.includes('summary') || lower.includes('objective') || lower.includes('profile') || lower.includes('about')) sections.summary = true;
    
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text) || /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/.test(text)) {
      sections.contact = true;
    }

    return sections;
  };

  const detectATSBreakers = (text) => {
    const breakers = [];
    
    if (text.includes('\t') || /\|{2,}/.test(text)) {
      breakers.push({ type: 'Tables/Columns', severity: 'high', description: 'Tables and columns break ATS parsing. Use simple lists instead.' });
    }
    
    const specialChars = text.match(/[★☆♦◆●◇■□▪▫]/g);
    if (specialChars && specialChars.length > 5) {
      breakers.push({ type: 'Special Characters', severity: 'medium', description: 'Unusual bullets may not parse. Use standard bullets (•, -, *).' });
    }
    
    if (text.split('\n').filter(l => l.trim()).length < 15) {
      breakers.push({ type: 'Poor Structure', severity: 'high', description: 'Resume lacks proper formatting with line breaks.' });
    }
    
    if (/\b(header|footer)\b/i.test(text)) {
      breakers.push({ type: 'Headers/Footers', severity: 'high', description: 'Headers and footers are invisible to ATS systems.' });
    }
    
    if (text.length < 300) {
      breakers.push({ type: 'Too Short', severity: 'high', description: 'Resume is too brief. Aim for 400-800 words.' });
    }
    
    if (text.length > 3000) {
      breakers.push({ type: 'Too Long', severity: 'medium', description: 'Resume exceeds 2 pages. Consider condensing.' });
    }

    return breakers;
  };

  const analyzeKeywords = (resume, jd) => {
    const extractKeywords = (text) => {
      const stopWords = ['the', 'and', 'for', 'with', 'from', 'have', 'this', 'that', 'will', 'been', 'your', 'their', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'whose', 'why', 'would'];
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));
      
      const freq = {};
      words.forEach(w => freq[w] = (freq[w] || 0) + 1);
      return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 40);
    };

    const jdKeywords = extractKeywords(jd);
    const resumeKeywords = extractKeywords(resume);
    const resumeWords = new Set(resumeKeywords.map(k => k[0]));
    
    const matched = jdKeywords.filter(([word]) => resumeWords.has(word));
    const missing = jdKeywords.filter(([word]) => !resumeWords.has(word)).slice(0, 20);
    
    const matchScore = jdKeywords.length > 0 ? Math.round((matched.length / Math.min(jdKeywords.length, 30)) * 100) : 0;

    return {
      score: matchScore,
      matched: matched.map(k => k[0]),
      missing: missing.map(k => k[0]),
      total: jdKeywords.length
    };
  };

  const analyzeSkillsGap = (resume, jd) => {
    const technicalTerms = [
      'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'express',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'aws', 'azure', 'gcp', 'cloud',
      'docker', 'kubernetes', 'jenkins', 'ci/cd', 'devops', 'agile', 'scrum', 'kanban',
      'git', 'github', 'api', 'rest', 'graphql', 'microservices', 'html', 'css', 'sass',
      'excel', 'powerpoint', 'word', 'salesforce', 'tableau', 'power bi', 'analytics',
      'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy',
      'leadership', 'management', 'communication', 'project management', 'budget',
      'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust', 'scala'
    ];

    const resumeLower = resume.toLowerCase();
    const jdLower = jd.toLowerCase();

    const jdSkills = technicalTerms.filter(skill => jdLower.includes(skill));
    const resumeSkills = technicalTerms.filter(skill => resumeLower.includes(skill));
    const missingSkills = jdSkills.filter(skill => !resumeSkills.includes(skill));
    const matchedSkills = jdSkills.filter(skill => resumeSkills.includes(skill));

    return {
      matched: matchedSkills,
      missing: missingSkills,
      score: jdSkills.length > 0 ? Math.round((matchedSkills.length / jdSkills.length) * 100) : 100
    };
  };

  const analyzeAchievements = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const bulletLines = lines.filter(l => l.trim().match(/^[•\-\*●]/));
    
    const withNumbers = bulletLines.filter(l => /\d+/.test(l));
    const withoutNumbers = bulletLines.filter(l => !/\d+/.test(l));
    
    const percentWithNumbers = bulletLines.length > 0 ? 
      Math.round((withNumbers.length / bulletLines.length) * 100) : 0;

    return {
      total: bulletLines.length,
      withNumbers: withNumbers.length,
      withoutNumbers: withoutNumbers.length,
      percentage: percentWithNumbers,
      score: percentWithNumbers
    };
  };

  const analyzeFormatting = (text, breakers) => {
    let score = 100;
    score -= breakers.filter(b => b.severity === 'high').length * 25;
    score -= breakers.filter(b => b.severity === 'medium').length * 15;
    return Math.max(0, score);
  };

  const analyzeContent = (text, achievements) => {
    let score = 40;
    
    const actionVerbs = ['managed', 'led', 'developed', 'created', 'implemented', 'improved', 
      'increased', 'decreased', 'launched', 'designed', 'built', 'established', 'achieved',
      'delivered', 'coordinated', 'executed', 'optimized', 'streamlined', 'spearheaded'];
    const verbCount = actionVerbs.filter(verb => text.toLowerCase().includes(verb)).length;
    
    if (verbCount >= 5) score += 25;
    else if (verbCount >= 3) score += 15;
    else if (verbCount >= 1) score += 5;
    
    if (text.length > 500 && text.length < 2500) score += 20;
    else if (text.length >= 300) score += 10;
    
    if (achievements.percentage > 60) score += 15;
    else if (achievements.percentage > 40) score += 10;
    else if (achievements.percentage > 20) score += 5;
    
    return Math.min(100, score);
  };

  const analyzeStructure = (sections) => {
    const required = ['contact', 'experience', 'education', 'skills'];
    const hasRequired = required.filter(s => sections[s]).length;
    let score = Math.round((hasRequired / required.length) * 100);
    
    if (sections.summary) score = Math.min(100, score + 10);
    
    return score;
  };

  const analyzeReadability = (text) => {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
    
    let score = 100;
    
    if (avgWordsPerSentence > 30) score -= 25;
    else if (avgWordsPerSentence > 25) score -= 15;
    
    if (words < 300) score -= 40;
    else if (words < 400) score -= 20;
    
    if (words > 1200) score -= 20;
    else if (words > 1000) score -= 10;
    
    return Math.max(0, score);
  };

  const calculateOverallScore = (categories) => {
    const weights = {
      formatting: 0.25,
      keywords: 0.25,
      content: 0.20,
      structure: 0.20,
      readability: 0.10
    };

    let total = 0;
    Object.keys(weights).forEach(key => {
      total += (categories[key] || 0) * weights[key];
    });

    return Math.round(total);
  };

  const generateRecommendations = (results) => {
    const recs = [];

    if (results.overallScore < 60) {
      recs.push({ priority: 'high', text: 'Overall ATS score needs improvement. Focus on high-priority items below.' });
    }

    results.atsBreakingElements.forEach(breaker => {
      if (breaker.severity === 'high') {
        recs.push({ priority: 'high', text: `${breaker.type}: ${breaker.description}` });
      }
    });

    if (!results.contactInfo.hasEmail) {
      recs.push({ priority: 'high', text: 'Add your email address to contact information' });
    }
    if (!results.contactInfo.hasPhone) {
      recs.push({ priority: 'high', text: 'Add your phone number to contact information' });
    }
    if (!results.contactInfo.hasLinkedIn) {
      recs.push({ priority: 'medium', text: 'Include your LinkedIn profile URL' });
    }

    if (!results.sections.experience) {
      recs.push({ priority: 'high', text: 'Add a Work Experience section' });
    }
    if (!results.sections.education) {
      recs.push({ priority: 'high', text: 'Add an Education section' });
    }
    if (!results.sections.skills) {
      recs.push({ priority: 'high', text: 'Add a Skills section' });
    }
    if (!results.sections.summary) {
      recs.push({ priority: 'medium', text: 'Consider adding a professional summary' });
    }

    if (results.achievements.percentage < 40) {
      recs.push({ priority: 'high', text: `Only ${results.achievements.percentage}% of bullets have numbers. Add quantifiable achievements (%, $, #).` });
    } else if (results.achievements.percentage < 60) {
      recs.push({ priority: 'medium', text: `${results.achievements.percentage}% of bullets quantified. Aim for 70%+ with metrics.` });
    }
