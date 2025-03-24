import {
  users, User, InsertUser,
  jobs, Job, InsertJob,
  candidates, Candidate, InsertCandidate,
  interviews, Interview, InsertInterview,
  emailTemplates, EmailTemplate, InsertEmailTemplate,
  emailLogs, EmailLog, InsertEmailLog,
  activityLogs, ActivityLog, InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  
  // Candidate operations
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidates(): Promise<Candidate[]>;
  getCandidatesByJob(jobId: number): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  
  // Interview operations
  getInterview(id: number): Promise<Interview | undefined>;
  getInterviews(): Promise<Interview[]>;
  getInterviewsByCandidate(candidateId: number): Promise<Interview[]>;
  getInterviewsByJob(jobId: number): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: number, interview: Partial<InsertInterview>): Promise<Interview | undefined>;
  
  // Email template operations
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(emailTemplate: InsertEmailTemplate): Promise<EmailTemplate>;
  
  // Email log operations
  getEmailLog(id: number): Promise<EmailLog | undefined>;
  getEmailLogs(): Promise<EmailLog[]>;
  getEmailLogsByCandidate(candidateId: number): Promise<EmailLog[]>;
  createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog>;
  
  // Activity log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
  
  // Analytics
  getJobStats(): Promise<any>;
  getCandidateStats(): Promise<any>;
  getInterviewStats(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private candidates: Map<number, Candidate>;
  private interviews: Map<number, Interview>;
  private emailTemplates: Map<number, EmailTemplate>;
  private emailLogs: Map<number, EmailLog>;
  private activityLogs: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private jobIdCounter: number;
  private candidateIdCounter: number;
  private interviewIdCounter: number;
  private emailTemplateIdCounter: number;
  private emailLogIdCounter: number;
  private activityLogIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.candidates = new Map();
    this.interviews = new Map();
    this.emailTemplates = new Map();
    this.emailLogs = new Map();
    this.activityLogs = new Map();
    
    this.userIdCounter = 1;
    this.jobIdCounter = 1;
    this.candidateIdCounter = 1;
    this.interviewIdCounter = 1;
    this.emailTemplateIdCounter = 1;
    this.emailLogIdCounter = 1;
    this.activityLogIdCounter = 1;
    
    // Add a demo user
    this.createUser({
      username: "jane.smith",
      password: "password123",
      fullName: "Jane Smith",
      role: "HR Manager",
      avatarUrl: "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });
    
    // Add some demo data
    this.seedDemoData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }
  
  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const now = new Date();
    const job: Job = { ...insertJob, id, createdAt: now };
    this.jobs.set(id, job);
    
    // Log activity
    await this.createActivityLog({
      agent: "JD Generator",
      action: "Created job description",
      details: `Created job description for "${job.title}"`
    });
    
    return job;
  }
  
  async updateJob(id: number, jobUpdate: Partial<InsertJob>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob: Job = { ...job, ...jobUpdate };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  // Candidate operations
  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }
  
  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }
  
  async getCandidatesByJob(jobId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(candidate => candidate.jobId === jobId);
  }
  
  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.candidateIdCounter++;
    const now = new Date();
    const candidate: Candidate = { ...insertCandidate, id, createdAt: now };
    this.candidates.set(id, candidate);
    return candidate;
  }
  
  async updateCandidate(id: number, candidateUpdate: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;
    
    const updatedCandidate: Candidate = { ...candidate, ...candidateUpdate };
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }
  
  // Interview operations
  async getInterview(id: number): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }
  
  async getInterviews(): Promise<Interview[]> {
    return Array.from(this.interviews.values());
  }
  
  async getInterviewsByCandidate(candidateId: number): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(interview => interview.candidateId === candidateId);
  }
  
  async getInterviewsByJob(jobId: number): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(interview => interview.jobId === jobId);
  }
  
  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const id = this.interviewIdCounter++;
    const now = new Date();
    const interview: Interview = { ...insertInterview, id, createdAt: now };
    this.interviews.set(id, interview);
    
    // Log activity
    const candidate = await this.getCandidate(interview.candidateId);
    const job = await this.getJob(interview.jobId);
    if (candidate && job) {
      await this.createActivityLog({
        agent: "Interview Scheduler",
        action: "Scheduled interview",
        details: `Scheduled interview with ${candidate.name} for "${job.title}"`
      });
    }
    
    return interview;
  }
  
  async updateInterview(id: number, interviewUpdate: Partial<InsertInterview>): Promise<Interview | undefined> {
    const interview = this.interviews.get(id);
    if (!interview) return undefined;
    
    const updatedInterview: Interview = { ...interview, ...interviewUpdate };
    this.interviews.set(id, updatedInterview);
    return updatedInterview;
  }
  
  // Email template operations
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }
  
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }
  
  async getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined> {
    return Array.from(this.emailTemplates.values()).find(template => template.type === type);
  }
  
  async createEmailTemplate(insertEmailTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.emailTemplateIdCounter++;
    const now = new Date();
    const emailTemplate: EmailTemplate = { ...insertEmailTemplate, id, createdAt: now };
    this.emailTemplates.set(id, emailTemplate);
    return emailTemplate;
  }
  
  // Email log operations
  async getEmailLog(id: number): Promise<EmailLog | undefined> {
    return this.emailLogs.get(id);
  }
  
  async getEmailLogs(): Promise<EmailLog[]> {
    return Array.from(this.emailLogs.values());
  }
  
  async getEmailLogsByCandidate(candidateId: number): Promise<EmailLog[]> {
    return Array.from(this.emailLogs.values()).filter(log => log.candidateId === candidateId);
  }
  
  async createEmailLog(insertEmailLog: InsertEmailLog): Promise<EmailLog> {
    const id = this.emailLogIdCounter++;
    const now = new Date();
    const emailLog: EmailLog = { ...insertEmailLog, id, sentAt: now };
    this.emailLogs.set(id, emailLog);
    
    // Log activity
    const candidate = await this.getCandidate(emailLog.candidateId);
    if (candidate) {
      await this.createActivityLog({
        agent: "Email Automation",
        action: "Sent email",
        details: `Sent email to ${candidate.name}: ${emailLog.subject}`
      });
    }
    
    return emailLog;
  }
  
  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }
  
  async getActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const now = new Date();
    const activityLog: ActivityLog = { ...insertActivityLog, id, createdAt: now };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }
  
  // Analytics methods
  async getJobStats(): Promise<any> {
    const jobs = await this.getJobs();
    const activeJobs = jobs.filter(job => job.status === "active").length;
    
    return {
      total: jobs.length,
      active: activeJobs,
      closed: jobs.length - activeJobs
    };
  }
  
  async getCandidateStats(): Promise<any> {
    const candidates = await this.getCandidates();
    return {
      total: candidates.length,
      new: candidates.filter(c => c.status === "new").length,
      screening: candidates.filter(c => c.status === "screening").length,
      interview: candidates.filter(c => c.status === "interview").length,
      hired: candidates.filter(c => c.status === "hired").length,
      rejected: candidates.filter(c => c.status === "rejected").length
    };
  }
  
  async getInterviewStats(): Promise<any> {
    const interviews = await this.getInterviews();
    return {
      total: interviews.length,
      scheduled: interviews.filter(i => i.status === "scheduled").length,
      completed: interviews.filter(i => i.status === "completed").length,
      cancelled: interviews.filter(i => i.status === "cancelled").length
    };
  }
  
  // Seed demo data
  private async seedDemoData() {
    // Create Jobs
    const job1 = await this.createJob({
      title: "Senior Software Engineer",
      department: "Engineering",
      description: "We are looking for an experienced software engineer to join our team...",
      requirements: "5+ years of experience, proficient in JavaScript, TypeScript, and React...",
      experience: "5+ years",
      status: "active",
      createdBy: 1
    });
    
    const job2 = await this.createJob({
      title: "UX Designer",
      department: "Design",
      description: "We are seeking a talented UX Designer to create amazing user experiences...",
      requirements: "3+ years of experience in UX design, proficient in Figma and Sketch...",
      experience: "3+ years",
      status: "active",
      createdBy: 1
    });
    
    const job3 = await this.createJob({
      title: "Product Manager",
      department: "Product",
      description: "We are looking for a Product Manager to help us build great products...",
      requirements: "3+ years of experience in product management, excellent communication skills...",
      experience: "3+ years",
      status: "active",
      createdBy: 1
    });
    
    const job4 = await this.createJob({
      title: "Marketing Specialist",
      department: "Marketing",
      description: "We are seeking a Marketing Specialist to help us grow our brand...",
      requirements: "2+ years of experience in marketing, excellent writing skills...",
      experience: "2+ years",
      status: "active",
      createdBy: 1
    });
    
    // Create Candidates
    for (let i = 1; i <= 15; i++) {
      await this.createCandidate({
        name: `Candidate ${i}`,
        email: `candidate${i}@example.com`,
        phone: `555-000-${1000 + i}`,
        resumeText: `Resume text for candidate ${i}...`,
        resumeUrl: `https://example.com/resumes/candidate${i}.pdf`,
        status: i % 5 === 0 ? "hired" : i % 4 === 0 ? "rejected" : i % 3 === 0 ? "interview" : i % 2 === 0 ? "screening" : "new",
        jobId: i % 4 === 0 ? job4.id : i % 3 === 0 ? job3.id : i % 2 === 0 ? job2.id : job1.id,
        score: Math.floor(Math.random() * 100)
      });
    }
    
    // Create Email Templates
    await this.createEmailTemplate({
      type: "interview_invitation",
      subject: "Interview Invitation for {{position}}",
      body: "Dear {{candidate_name}},\n\nWe would like to invite you for an interview for the {{position}} position. The interview is scheduled for {{interview_date}} at {{interview_time}}.\n\nBest regards,\nThe Recruitment Team"
    });
    
    await this.createEmailTemplate({
      type: "rejection",
      subject: "Application Status for {{position}}",
      body: "Dear {{candidate_name}},\n\nThank you for your interest in the {{position}} position. After careful consideration, we have decided to move forward with other candidates whose qualifications better match our needs at this time.\n\nBest regards,\nThe Recruitment Team"
    });
    
    await this.createEmailTemplate({
      type: "offer",
      subject: "Job Offer for {{position}}",
      body: "Dear {{candidate_name}},\n\nWe are pleased to offer you the {{position}} position. Please review the attached offer letter and let us know if you have any questions.\n\nBest regards,\nThe Recruitment Team"
    });
    
    // Create some interviews
    const now = new Date();
    for (let i = 1; i <= 5; i++) {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + i);
      
      await this.createInterview({
        candidateId: i,
        jobId: i % 4 === 0 ? job4.id : i % 3 === 0 ? job3.id : i % 2 === 0 ? job2.id : job1.id,
        scheduledAt: scheduledDate,
        status: "scheduled",
        transcript: null as any,
        feedbackSummary: null as any,
        recommendation: null as any,
        sentimentScore: null as any,
        sentimentAnalysis: null as any
      });
    }
    
    // Create some completed interviews
    for (let i = 6; i <= 10; i++) {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() - i + 5);
      
      await this.createInterview({
        candidateId: i,
        jobId: i % 4 === 0 ? job4.id : i % 3 === 0 ? job3.id : i % 2 === 0 ? job2.id : job1.id,
        scheduledAt: scheduledDate,
        status: "completed",
        transcript: "Interview transcript content...",
        feedbackSummary: "Candidate showed good technical skills but needs improvement in communication...",
        recommendation: i % 2 === 0 ? "hire" : "reject",
        sentimentScore: Math.floor(Math.random() * 100),
        sentimentAnalysis: { positive: 0.7, negative: 0.1, neutral: 0.2 } as any
      });
    }
    
    // Create some email logs
    for (let i = 1; i <= 10; i++) {
      const template = await this.getEmailTemplateByType("interview_invitation");
      if (template) {
        const candidate = await this.getCandidate(i);
        const job = await this.getJob(candidate?.jobId || 1);
        
        if (candidate && job) {
          await this.createEmailLog({
            candidateId: candidate.id,
            templateId: template.id,
            subject: `Interview Invitation for ${job.title}`,
            body: `Dear ${candidate.name},\n\nWe would like to invite you for an interview for the ${job.title} position...`,
            status: "sent"
          });
        }
      }
    }
    
    // Create activity logs for demo
    const activityMessages = [
      { agent: "JD Generator", action: "Created job description", details: "Created job description for \"Senior Software Engineer\"" },
      { agent: "Resume Ranker", action: "Ranked resumes", details: "Ranked 14 resumes for \"UX Designer\" position" },
      { agent: "Email Automation", action: "Sent emails", details: "Sent 5 interview invitations for \"Product Manager\" role" },
      { agent: "Interview Agent", action: "Completed interview", details: "Completed interview with Michael Chen for \"Data Scientist\"" },
      { agent: "Hire Recommendation", action: "Generated recommendation", details: "Generated recommendation report for \"Marketing Specialist\"" }
    ];
    
    // Create activity logs with different timestamps
    for (let i = 0; i < activityMessages.length; i++) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - (i + 1) * 30);
      
      const log = await this.createActivityLog(activityMessages[i]);
      
      // Manually update the timestamp
      this.activityLogs.set(log.id, { ...log, createdAt: timestamp });
    }
  }
}

export const storage = new MemStorage();
