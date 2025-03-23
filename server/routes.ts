import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertJobSchema, 
  insertCandidateSchema, 
  insertInterviewSchema,
  insertEmailTemplateSchema,
  insertEmailLogSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // In a real app, we would use JWT or sessions here
    // For simplicity, we'll just return the user object (except password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  });
  
  // Dashboard routes
  app.get("/api/dashboard", async (req: Request, res: Response) => {
    try {
      const jobStats = await storage.getJobStats();
      const candidateStats = await storage.getCandidateStats();
      const interviewStats = await storage.getInterviewStats();
      const recentActivities = await storage.getActivityLogs(5);
      const jobs = await storage.getJobs();
      
      res.json({
        stats: {
          jobs: jobStats,
          candidates: candidateStats,
          interviews: interviewStats
        },
        recentActivities,
        jobs
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  
  // Job routes
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });
  
  app.get("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });
  
  app.post("/api/jobs", async (req: Request, res: Response) => {
    try {
      const validation = insertJobSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid job data",
          errors: validation.error.format()
        });
      }
      
      const job = await storage.createJob(validation.data);
      res.status(201).json(job);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });
  
  app.put("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertJobSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid job data",
          errors: validation.error.format()
        });
      }
      
      const updatedJob = await storage.updateJob(id, validation.data);
      
      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(updatedJob);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });
  
  // JD Generator routes
  app.post("/api/jd-generator", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        title: z.string(),
        department: z.string(),
        experience: z.string(),
        skills: z.string(),
        createdBy: z.number()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid job data",
          errors: validation.error.format()
        });
      }
      
      const { title, department, experience, skills, createdBy } = validation.data;
      
      // In a real app, here we would call Llama 3 model API
      // We'll simulate the call with a timeout
      setTimeout(async () => {
        // Create a structured job description
        const jobDescription = `We are looking for a talented ${title} to join our ${department} team. The ideal candidate will have ${experience} of experience in the field.`;
        const requirements = `Required Skills:\n- ${skills.split(',').join('\n- ')}`;
        
        const job = await storage.createJob({
          title,
          department,
          description: jobDescription,
          requirements,
          experience,
          status: "active",
          createdBy
        });
        
        res.status(201).json(job);
      }, 1000);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate job description" });
    }
  });
  
  // Candidate routes
  app.get("/api/candidates", async (req: Request, res: Response) => {
    try {
      let candidates;
      
      if (req.query.jobId) {
        const jobId = parseInt(req.query.jobId as string);
        candidates = await storage.getCandidatesByJob(jobId);
      } else {
        candidates = await storage.getCandidates();
      }
      
      res.json(candidates);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });
  
  app.get("/api/candidates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidate(id);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });
  
  app.post("/api/candidates", async (req: Request, res: Response) => {
    try {
      const validation = insertCandidateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid candidate data",
          errors: validation.error.format()
        });
      }
      
      const candidate = await storage.createCandidate(validation.data);
      res.status(201).json(candidate);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create candidate" });
    }
  });
  
  // Resume Ranker routes
  app.post("/api/resume-ranker", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        jobId: z.number(),
        resumes: z.array(z.object({
          id: z.number().optional(),
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          resumeText: z.string(),
          resumeUrl: z.string().optional()
        }))
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.format()
        });
      }
      
      const { jobId, resumes } = validation.data;
      
      // In a real app, here we would call Llama 3 model API to rank resumes
      // We'll simulate the call with a timeout
      setTimeout(async () => {
        const job = await storage.getJob(jobId);
        
        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }
        
        const rankedResumes = [];
        
        for (const resume of resumes) {
          // Simulate scoring based on random numbers
          const score = Math.floor(Math.random() * 100);
          
          // For new candidates, create them in storage
          if (!resume.id) {
            const candidate = await storage.createCandidate({
              name: resume.name,
              email: resume.email,
              phone: resume.phone || "",
              resumeText: resume.resumeText,
              resumeUrl: resume.resumeUrl || "",
              status: "new",
              jobId,
              score
            });
            
            rankedResumes.push({
              ...candidate,
              matchScore: score
            });
          } else {
            // For existing candidates, update their score
            const candidate = await storage.getCandidate(resume.id);
            
            if (candidate) {
              await storage.updateCandidate(candidate.id, { score });
              
              rankedResumes.push({
                ...candidate,
                score,
                matchScore: score
              });
            }
          }
        }
        
        // Sort by score in descending order
        rankedResumes.sort((a, b) => b.matchScore - a.matchScore);
        
        // Log activity
        await storage.createActivityLog({
          agent: "Resume Ranker",
          action: "Ranked resumes",
          details: `Ranked ${rankedResumes.length} resumes for "${job.title}" position`
        });
        
        res.json(rankedResumes);
      }, 2000);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to rank resumes" });
    }
  });
  
  // Interview routes
  app.get("/api/interviews", async (req: Request, res: Response) => {
    try {
      let interviews;
      
      if (req.query.candidateId) {
        const candidateId = parseInt(req.query.candidateId as string);
        interviews = await storage.getInterviewsByCandidate(candidateId);
      } else if (req.query.jobId) {
        const jobId = parseInt(req.query.jobId as string);
        interviews = await storage.getInterviewsByJob(jobId);
      } else {
        interviews = await storage.getInterviews();
      }
      
      res.json(interviews);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });
  
  app.post("/api/interviews", async (req: Request, res: Response) => {
    try {
      const validation = insertInterviewSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid interview data",
          errors: validation.error.format()
        });
      }
      
      const interview = await storage.createInterview(validation.data);
      res.status(201).json(interview);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });
  
  // Interview Scheduler routes
  app.post("/api/schedule-interview", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        candidateId: z.number(),
        jobId: z.number(),
        scheduledAt: z.string()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.format()
        });
      }
      
      const { candidateId, jobId, scheduledAt } = validation.data;
      
      // Create interview
      const interview = await storage.createInterview({
        candidateId,
        jobId,
        scheduledAt: new Date(scheduledAt),
        status: "scheduled",
        transcript: null as any,
        feedbackSummary: null as any,
        recommendation: null as any,
        sentimentScore: null as any,
        sentimentAnalysis: null as any
      });
      
      // Send email notification (in a real app, we'd call an email API)
      const candidate = await storage.getCandidate(candidateId);
      const job = await storage.getJob(jobId);
      const template = await storage.getEmailTemplateByType("interview_invitation");
      
      if (candidate && job && template) {
        // Replace placeholders in template
        const subject = template.subject
          .replace("{{position}}", job.title);
        
        const body = template.body
          .replace("{{candidate_name}}", candidate.name)
          .replace("{{position}}", job.title)
          .replace("{{interview_date}}", new Date(scheduledAt).toLocaleDateString())
          .replace("{{interview_time}}", new Date(scheduledAt).toLocaleTimeString());
        
        await storage.createEmailLog({
          candidateId,
          templateId: template.id,
          subject,
          body,
          status: "sent"
        });
        
        // Log activity
        await storage.createActivityLog({
          agent: "Email Automation",
          action: "Sent email",
          details: `Sent interview invitation to ${candidate.name} for "${job.title}"`
        });
      }
      
      res.status(201).json(interview);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to schedule interview" });
    }
  });
  
  // Interview Agent routes
  app.post("/api/conduct-interview", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        interviewId: z.number(),
        responses: z.array(z.object({
          question: z.string(),
          answer: z.string()
        })).optional()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.format()
        });
      }
      
      const { interviewId, responses } = validation.data;
      
      const interview = await storage.getInterview(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      // If responses are provided, update the interview with a transcript
      if (responses && responses.length > 0) {
        const transcript = responses
          .map(r => `Q: ${r.question}\nA: ${r.answer}`)
          .join("\n\n");
        
        await storage.updateInterview(interviewId, {
          transcript,
          status: "completed"
        });
        
        // Log activity
        const candidate = await storage.getCandidate(interview.candidateId);
        const job = await storage.getJob(interview.jobId);
        
        if (candidate && job) {
          await storage.createActivityLog({
            agent: "Interview Agent",
            action: "Completed interview",
            details: `Completed interview with ${candidate.name} for "${job.title}"`
          });
        }
        
        // In a real app, we would call Llama 3 model API to get the next question
        // For now, return a dummy question
        res.json({
          interviewId,
          message: "Interview completed",
          status: "completed"
        });
      } else {
        // In a real app, we would call Llama 3 model API to get the first question
        // For now, return a dummy question
        res.json({
          interviewId,
          message: "Interview started",
          status: "in_progress",
          question: "Tell me about your experience with React and TypeScript."
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to conduct interview" });
    }
  });
  
  // Hire Recommendation routes
  app.post("/api/hire-recommendation", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        interviewId: z.number()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.format()
        });
      }
      
      const { interviewId } = validation.data;
      
      const interview = await storage.getInterview(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      if (interview.status !== "completed") {
        return res.status(400).json({ message: "Interview must be completed first" });
      }
      
      // In a real app, we would call Llama 3 model API to analyze the interview
      // We'll simulate the call with a timeout
      setTimeout(async () => {
        const strengths = ["Strong technical skills", "Good communication", "Problem-solving abilities"];
        const weaknesses = ["Limited experience in specific domain", "Could improve cultural fit"];
        const recommendation = Math.random() > 0.3 ? "hire" : "reject";
        
        // Update the interview with feedback
        await storage.updateInterview(interviewId, {
          feedbackSummary: `Strengths: ${strengths.join(", ")}. Areas for improvement: ${weaknesses.join(", ")}.`,
          recommendation
        });
        
        // Log activity
        const candidate = await storage.getCandidate(interview.candidateId);
        const job = await storage.getJob(interview.jobId);
        
        if (candidate && job) {
          await storage.createActivityLog({
            agent: "Hire Recommendation",
            action: "Generated recommendation",
            details: `Generated ${recommendation} recommendation for ${candidate.name} (${job.title})`
          });
          
          // Update candidate status based on recommendation
          await storage.updateCandidate(candidate.id, {
            status: recommendation === "hire" ? "hired" : "rejected"
          });
        }
        
        res.json({
          strengths,
          weaknesses,
          recommendation,
          summary: `Strengths: ${strengths.join(", ")}. Areas for improvement: ${weaknesses.join(", ")}.`
        });
      }, 1500);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate hire recommendation" });
    }
  });
  
  // Sentiment Analyzer routes
  app.post("/api/sentiment-analysis", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        interviewId: z.number()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.format()
        });
      }
      
      const { interviewId } = validation.data;
      
      const interview = await storage.getInterview(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      if (interview.status !== "completed") {
        return res.status(400).json({ message: "Interview must be completed first" });
      }
      
      // In a real app, we would call Llama 3 model API to analyze sentiment
      // We'll simulate the call with a timeout
      setTimeout(async () => {
        const sentimentScore = Math.floor(Math.random() * 100);
        const sentimentAnalysis = {
          positive: Math.random() * 0.7,
          negative: Math.random() * 0.3,
          neutral: Math.random() * 0.4,
          confidence: 0.85,
          toneIndicators: {
            excited: Math.random() * 0.3,
            neutral: Math.random() * 0.4,
            hesitant: Math.random() * 0.2,
            confident: Math.random() * 0.5
          }
        };
        
        // Update the interview with sentiment analysis
        await storage.updateInterview(interviewId, {
          sentimentScore,
          sentimentAnalysis
        });
        
        // Log activity
        const candidate = await storage.getCandidate(interview.candidateId);
        const job = await storage.getJob(interview.jobId);
        
        if (candidate && job) {
          await storage.createActivityLog({
            agent: "Sentiment Analyzer",
            action: "Analyzed sentiment",
            details: `Analyzed sentiment for ${candidate.name}'s interview (${job.title})`
          });
        }
        
        res.json({
          sentimentScore,
          sentimentAnalysis
        });
      }, 1000);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to analyze sentiment" });
    }
  });
  
  // Email Template routes
  app.get("/api/email-templates", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });
  
  app.post("/api/email-templates", async (req: Request, res: Response) => {
    try {
      const validation = insertEmailTemplateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid email template data",
          errors: validation.error.format()
        });
      }
      
      const template = await storage.createEmailTemplate(validation.data);
      res.status(201).json(template);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });
  
  // Email Automation routes
  app.post("/api/send-email", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        candidateId: z.number(),
        templateType: z.string(),
        customizations: z.record(z.string()).optional()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validation.error.format()
        });
      }
      
      const { candidateId, templateType, customizations = {} } = validation.data;
      
      const candidate = await storage.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      const template = await storage.getEmailTemplateByType(templateType);
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      const job = await storage.getJob(candidate.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Replace placeholders in template
      let subject = template.subject
        .replace("{{position}}", job.title);
      
      let body = template.body
        .replace("{{candidate_name}}", candidate.name)
        .replace("{{position}}", job.title);
      
      // Apply custom replacements
      for (const [key, value] of Object.entries(customizations)) {
        subject = subject.replace(`{{${key}}}`, value);
        body = body.replace(`{{${key}}}`, value);
      }
      
      // In a real app, we would call an email API here
      // For now, just log the email
      const emailLog = await storage.createEmailLog({
        candidateId,
        templateId: template.id,
        subject,
        body,
        status: "sent"
      });
      
      res.json(emailLog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });
  
  // Activity Log routes
  app.get("/api/activity-logs", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
