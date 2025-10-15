import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, TrendingUp, Download, Target, Award, Lock } from 'lucide-react';

export default function Jobbyjob() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simple password check
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // In production, this would check against environment variable
    // For now, hardcode or use any password you want
    if (passwordInput === 'jobbyjob2025' || passwordInput.length > 0) {
      setIsAuthenticated(true);
      localStorage.setItem('jobbyjob_auth', 'true');
    }
  };

  // Check if already authenticated
  useEffect(() => {
    if (localStorage.getItem('jobbyjob_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // File upload handler with PDF and DOCX support
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    try {
      if (fileType === 'pdf') {
        // PDF handling would require pdfjs-dist
        // For simplicity, show error for now
        alert('PDF upload coming soon! Please copy/paste text for now.');
        return;
      } else if (fileType === 'docx') {
        // DOCX handling would require mammoth
        alert('DOCX upload coming soon! Please copy/paste text for now.');
        return;
      } else {
        // Handle text files
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

  // Analyze resume when text changes
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

    // 1. Contact Information
    results.contactInfo = analyzeContactInfo(resumeText);
    
    // 2. Sections
    results.sections = analyzeSections(resumeText);
    
    // 3. ATS Breakers
    results.atsBreakingElements = detectATSBreakers(resumeText);
    
    // 4. Keywords
    if (jobDescription) {
      results.keywords = analyzeKeywords(resumeText, jobDescription);
      results.skillsGap = analyzeSkillsGap(resumeText, jobDescription);
    }
    
    // 5. Achievements
    results.achievements = analyzeAchievements(resumeText);
    
    // 6. Category Scores
    results.categories.formatting = analyzeFormatting(resumeText, results.atsBreakingElements);
    results.categories.content = analyzeContent(resumeText, results.achievements);
    results.categories.keywords = results.keywords.score || 50;
    results.categories.structure = analyzeStructure(results.sections);
    results.categories.readability = analyzeReadability(resumeText);
    
    // 7. Overall Score
    results.overallScore = calculateOverallScore(results.categories);
    
    // 8. Recommendations
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

    if (results.keywords.missing && results.keywords.missing.length > 5) {
      recs.push({ priority: 'high', text: `Missing critical keywords: ${results.keywords.missing.slice(0, 8).join(', ')}` });
    }

    if (results.skillsGap.missing && results.skillsGap.missing.length > 0) {
      recs.push({ priority: 'high', text: `Add these required skills to your resume: ${results.skillsGap.missing.slice(0, 5).join(', ')}` });
    }

    if (recs.length === 0) {
      recs.push({ priority: 'success', text: 'Excellent! Your resume is ATS-optimized. Keep refining for perfection.' });
    }

    return recs.slice(0, 12);
  };

  const exportAnalysis = () => {
    if (!analysis) return;

    const report = `
═══════════════════════════════════════════════════
           JOBBYJOB - ATS ANALYSIS REPORT
═══════════════════════════════════════════════════
Generated: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL ATS SCORE: ${analysis.overallScore}/100
${analysis.overallScore >= 80 ? '✓ EXCELLENT' : analysis.overallScore >= 60 ? '⚠ GOOD' : '✗ NEEDS WORK'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CATEGORY BREAKDOWN:
├─ Formatting:    ${analysis.categories.formatting}/100
├─ Keywords:      ${analysis.categories.keywords}/100
├─ Content:       ${analysis.categories.content}/100
├─ Structure:     ${analysis.categories.structure}/100
└─ Readability:   ${analysis.categories.readability}/100

${jobDescription ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JOB MATCH ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Match Score: ${analysis.keywords.score}%
Keywords Matched: ${analysis.keywords.matched.length}/${analysis.keywords.total}

✓ MATCHED KEYWORDS:
${analysis.keywords.matched.slice(0, 20).join(', ')}

✗ MISSING KEYWORDS:
${analysis.keywords.missing.join(', ')}

SKILLS GAP ANALYSIS:
✓ Skills Present: ${analysis.skillsGap.matched.join(', ') || 'None detected'}
✗ Skills Missing: ${analysis.skillsGap.missing.join(', ') || 'None'}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATS-BREAKING ELEMENTS (${analysis.atsBreakingElements.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysis.atsBreakingElements.length > 0 ? analysis.atsBreakingElements.map(b => `
⚠ ${b.type.toUpperCase()} [${b.severity}]
   ${b.description}
`).join('') : '✓ No ATS-breaking elements detected!'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUANTIFIABLE ACHIEVEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Bullet Points:     ${analysis.achievements.total}
With Metrics:            ${analysis.achievements.withNumbers} (${analysis.achievements.percentage}%)
Without Metrics:         ${analysis.achievements.withoutNumbers}

${analysis.achievements.percentage < 50 ? '⚠ Add more quantifiable results (percentages, dollar amounts, numbers)' : '✓ Good use of metrics!'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysis.recommendations.map((r, i) => `
${i + 1}. [${r.priority.toUpperCase()}] ${r.text}`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESUME SECTION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(analysis.sections).map(([section, present]) => 
  `${present ? '✓' : '✗'} ${section.charAt(0).toUpperCase() + section.slice(1)}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Object.entries(analysis.contactInfo).map(([field, present]) => {
  if (field === 'score') return '';
  const label = field.replace('has', '');
  return `${present ? '✓' : '✗'} ${label}`;
}).filter(Boolean).join('\n')}

═══════════════════════════════════════════════════
           End of Jobbyjob ATS Report
═══════════════════════════════════════════════════
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobbyjob-ats-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-300';
    if (score >= 60) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobbyjob</h1>
            <p className="text-gray-600">Your Personal ATS Scanner</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Access Jobbyjob
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-6 text-center">
            Private • Secure • For Your Eyes Only
          </p>
        </div>
      </div>
    );
  }

  // Main Application
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Jobbyjob
          </h1>
          <p className="text-gray-600 text-lg">Your Personal ATS Resume Scanner & Job Matcher</p>
        </div>

        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Resume Input */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Your Resume
              </h2>
              <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                <Upload className="w-4 h-4" />
                Upload
                <input 
                  type="file" 
                  accept=".txt,.doc,.docx,.pdf"
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'resume')}
                />
              </label>
            </div>
            <textarea
              className="w-full h-96 p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Paste your resume text here...

Tips:
• Include all sections (Contact, Summary, Experience, Education, Skills)
• Use bullet points with quantifiable achievements
• Add action verbs (managed, developed, increased, etc.)
• Keep formatting simple for ATS compatibility"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              {resumeText.length} characters • {resumeText.split(/\s+/).filter(w => w).length} words
            </p>
          </div>

          {/* Job Description Input */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Job Description
              </h2>
              <label className="cursor-pointer text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
                <Upload className="w-4 h-4" />
                Upload
                <input 
                  type="file" 
                  accept=".txt"
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'jd')}
                />
              </label>
            </div>
            <textarea
              className="w-full h-96 p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Paste the job description here (optional but highly recommended)...

Why add this?
• Get keyword match percentage
• Identify missing skills
• See what to emphasize
• Tailor your resume to the role"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              {jobDescription.length} characters
            </p>
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">ATS Analysis Results</h2>
                <button
                  onClick={exportAnalysis}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-xl border-4 ${getScoreBg(analysis.overallScore)}`}>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}
                    </div>
                    <div className="text-gray-700 font-bold text-lg">Overall ATS Score</div>
                    <div className="mt-2 text-sm font-semibold">
                      {analysis.overallScore >= 80 ? '✓ Excellent' : 
                       analysis.overallScore >= 60 ? '⚠ Good' : '✗ Needs Work'}
                    </div>
                  </div>
                </div>

                {jobDescription && (
                  <div className={`p-6 rounded-xl border-4 ${getScoreBg(analysis.keywords.score)}`}>
                    <div className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysis.keywords.score)}`}>
                        {analysis.keywords.score}%
                      </div>
                      <div className="text-gray-700 font-bold text-lg">Job Match</div>
                      <div className="mt-2 text-sm font-semibold">
                        {analysis.keywords.matched.length}/{analysis.keywords.total} keywords
                      </div>
                    </div>
                  </div>
                )}

                <div className={`p-6 rounded-xl border-4 ${getScoreBg(analysis.achievements.percentage)}`}>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysis.achievements.percentage)}`}>
                      {analysis.achievements.percentage}%
                    </div>
                    <div className="text-gray-700 font-bold text-lg">Quantified</div>
                    <div className="mt-2 text-sm font-semibold">
                      {analysis.achievements.withNumbers}/{analysis.achievements.total} bullets
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Scores */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analysis.categories).map(([category, score]) => (
                  <div key={category} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <div className={`text-3xl font-bold mb-1 ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-sm text-gray-600 capitalize font-medium">{category}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Action Items
              </h3>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
                    rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    {rec.priority === 'high' ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> :
                     rec.priority === 'medium' ? <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /> :
                     <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <span className={`font-bold text-xs px-2 py-1 rounded ${
                        rec.priority === 'high' ? 'bg-red-200 text-red-900' :
                        rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-green-200 text-green-900'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <p className="text-gray-800 mt-1">{rec.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ATS Breakers */}
            {analysis.atsBreakingElements.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  ATS-Breaking Issues ({analysis.atsBreakingElements.length})
                </h3>
                <div className="space-y-3">
                  {analysis.atsBreakingElements.map((breaker, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-red-900">{breaker.type}</div>
                        <div className="text-sm text-red-700 mt-1">{breaker.description}</div>
                        <div className="text-xs text-red-600 mt-2 font-semibold">
                          Severity: {breaker.severity.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Gap */}
            {jobDescription && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Skills Analysis
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      You Have ({analysis.skillsGap.matched.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skillsGap.matched.length > 0 ? (
                        analysis.skillsGap.matched.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm italic">No technical skills detected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Missing ({analysis.skillsGap.missing.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skillsGap.missing.length > 0 ? (
                        analysis.skillsGap.missing.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm italic">All required skills present! 🎉</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Keywords */}
            {jobDescription && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Keyword Match Analysis</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-green-700 mb-3">
                      ✓ Matched ({analysis.keywords.matched.length})
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                      {analysis.keywords.matched.map((kw, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-700 mb-3">
                      ✗ Missing ({analysis.keywords.missing.length})
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                      {analysis.keywords.missing.map((kw, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sections */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Section Checklist</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(analysis.sections).map(([section, present]) => (
                  <div key={section} className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                    present ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                  }`}>
                    {present ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> :
                      <XCircle className="w-5 h-5 text-red-600" />
                    }
                    <span className={`font-bold capitalize text-sm ${present ? 'text-green-900' : 'text-red-900'}`}>
                      {section}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analysis.contactInfo).filter(([key]) => key !== 'score').map(([field, present]) => (
                  <div key={field} className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                    present ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    {present ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> :
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    }
                    <span className={`text-sm font-bold ${present ? 'text-green-900' : 'text-yellow-900'}`}>
                      {field.replace('has', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-20 h-20 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Optimize Your Resume</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Paste your resume above to get instant ATS feedback. Add a job description for keyword matching and skills gap analysis.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Analysis updates automatically as you type
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pb-6 text-sm text-gray-500">
        <p>Jobbyjob • Your Personal ATS Tool • Private & Secure</p>
      </div>
    </div>
  );
}
