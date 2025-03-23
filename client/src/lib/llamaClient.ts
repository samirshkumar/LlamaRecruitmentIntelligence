// This client would interface with the Llama 3.x API
// For now, it's a simulation as we don't have direct access to the API

// Types of AI tasks we can perform
export type AITask = 
  | 'generate-job-description'
  | 'rank-resumes'
  | 'suggest-interview-questions'
  | 'analyze-interview'
  | 'generate-recommendation'
  | 'analyze-sentiment'
  | 'conduct-video-interview';

interface LlamaRequestOptions {
  task: AITask;
  inputs: Record<string, any>;
  temperature?: number;
  max_tokens?: number;
}

interface LlamaResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Simulated Llama 3.x API client
 * In a real implementation, this would connect to the Llama API endpoint
 */
class LlamaClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_LLAMA_API_URL || 'https://api.llama-model.ai/v1';
    this.apiKey = import.meta.env.VITE_LLAMA_API_KEY || 'sim_llama_api_key';
  }

  /**
   * Process a request to the Llama 3.x API
   * This is a simulation function that returns mock responses
   */
  async process<T>(options: LlamaRequestOptions): Promise<LlamaResponse<T>> {
    console.log(`Processing Llama API request for task: ${options.task}`, options);
    
    // In a real implementation, this would make an actual API call
    // For this simulation, we'll return mock data based on the task

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    try {
      let result: any;

      switch (options.task) {
        case 'generate-job-description':
          result = this.mockGenerateJobDescription(options.inputs);
          break;
        case 'rank-resumes':
          result = this.mockRankResumes(options.inputs);
          break;
        case 'suggest-interview-questions':
          result = this.mockSuggestInterviewQuestions(options.inputs);
          break;
        case 'analyze-interview':
          result = this.mockAnalyzeInterview(options.inputs);
          break;
        case 'generate-recommendation':
          result = this.mockGenerateRecommendation(options.inputs);
          break;
        case 'analyze-sentiment':
          result = this.mockAnalyzeSentiment(options.inputs);
          break;
        case 'conduct-video-interview':
          result = this.mockConductVideoInterview(options.inputs);
          break;
        default:
          throw new Error(`Unknown task: ${options.task}`);
      }

      return {
        success: true,
        data: result as T
      };
    } catch (error) {
      console.error(`Error in Llama API request: ${error}`);
      return {
        success: false,
        error: `Failed to process ${options.task}: ${error}`
      };
    }
  }

  private mockGenerateJobDescription(inputs: Record<string, any>) {
    const { title, department, experience, skills } = inputs;
    
    return {
      title,
      description: `We are looking for an exceptional ${title} to join our ${department} team. The ideal candidate will have ${experience} of experience and will be responsible for designing, developing and implementing solutions that drive our business forward.`,
      requirements: `Requirements:\n- ${experience} of professional experience\n- ${skills}\n- Strong problem-solving abilities\n- Excellent communication skills\n- Bachelor's degree in a relevant field`,
      responsibilities: `Responsibilities:\n- Design and implement solutions for complex business problems\n- Collaborate with cross-functional teams\n- Stay up-to-date with industry trends\n- Mentor junior team members\n- Contribute to technical architecture decisions`
    };
  }

  private mockRankResumes(inputs: Record<string, any>) {
    const { jobDescription, jobRequirements, resumes } = inputs;
    
    // Extract skills from job requirements
    const requiredSkills = this.extractSkillsFromRequirements(jobRequirements || jobDescription);
    
    // Process each resume to find skill matches
    return resumes.map((resume: any) => {
      // Extract skills from resume text
      const candidateSkills = this.extractSkillsFromResume(resume.resumeText);
      
      // Find matched skills (intersection)
      const matchedSkills = candidateSkills.filter(skill => 
        requiredSkills.some(reqSkill => reqSkill.toLowerCase() === skill.toLowerCase())
      );
      
      // Find missing skills (required but not in resume)
      const missingSkills = requiredSkills.filter(reqSkill => 
        !candidateSkills.some(skill => skill.toLowerCase() === reqSkill.toLowerCase())
      );
      
      // Calculate score based on skill matches (weighted)
      const matchRatio = matchedSkills.length / requiredSkills.length;
      const score = Math.min(Math.round(matchRatio * 100), 100);
      
      return {
        ...resume,
        score,
        matchedSkills,
        missingSkills
      };
    }).sort((a: any, b: any) => b.score - a.score);
  }
  
  // Helper method to extract skills from job requirements
  private extractSkillsFromRequirements(requirements: string): string[] {
    // Common tech skills to look for
    const commonSkills = [
      "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", 
      "Express", "Python", "Django", "Flask", "Java", "Spring", "C#", ".NET",
      "PHP", "Laravel", "Ruby", "Rails", "Go", "Rust", "Swift", "Kotlin",
      "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind", "Material UI",
      "GraphQL", "REST", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
      "AWS", "Azure", "GCP", "Firebase", "Docker", "Kubernetes", "CI/CD",
      "Git", "GitHub", "Agile", "Scrum", "TDD", "DevOps", "Testing"
    ];
    
    // Extract skills from requirements text
    const skillsFound = commonSkills.filter(skill => 
      requirements.toLowerCase().includes(skill.toLowerCase())
    );
    
    // Add any explicitly mentioned required skills from comma or bullet separated lists
    const explicitRequirements = requirements
      .split(/[,.\-•\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 2 && !skillsFound.includes(item));
    
    // Combine and deduplicate the array of skills
    const allSkills = Array.from(new Set([...skillsFound, ...explicitRequirements]));
    return allSkills;
  }
  
  // Helper method to extract skills from resume text
  private extractSkillsFromResume(resumeText: string): string[] {
    // Common tech skills to look for
    const commonSkills = [
      "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", 
      "Express", "Python", "Django", "Flask", "Java", "Spring", "C#", ".NET",
      "PHP", "Laravel", "Ruby", "Rails", "Go", "Rust", "Swift", "Kotlin",
      "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind", "Material UI",
      "GraphQL", "REST", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
      "AWS", "Azure", "GCP", "Firebase", "Docker", "Kubernetes", "CI/CD",
      "Git", "GitHub", "Agile", "Scrum", "TDD", "DevOps", "Testing"
    ];
    
    // Extract skills from resume text
    const skillsFound = commonSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );
    
    return skillsFound;
  }

  private mockSuggestInterviewQuestions(inputs: Record<string, any>) {
    const { jobTitle, candidateResume, previousResponses } = inputs;
    
    // Simulated questions based on job title
    const technicalQuestions = [
      "Can you describe your experience with React and modern JavaScript frameworks?",
      "How do you approach testing in your development process?",
      "Can you explain a complex technical challenge you faced and how you solved it?",
      "What's your experience with TypeScript and how has it improved your development workflow?",
      "How do you stay up-to-date with the latest technologies and best practices?"
    ];
    
    const behavioralQuestions = [
      "Tell me about a time you had to work under pressure to meet a deadline.",
      "How do you handle disagreements with team members?",
      "Describe a situation where you had to learn a new technology quickly.",
      "Tell me about a project you're particularly proud of.",
      "How do you approach mentoring more junior team members?"
    ];
    
    // If we have previous responses, generate a follow-up question
    if (previousResponses && previousResponses.length > 0) {
      const lastResponse = previousResponses[previousResponses.length - 1];
      return {
        question: `That's interesting. Can you elaborate more on the ${lastResponse.answer.split(" ").slice(0, 3).join(" ")}... aspect you mentioned?`
      };
    }
    
    // Initial question
    return {
      questions: {
        technical: technicalQuestions,
        behavioral: behavioralQuestions
      },
      recommendation: "Start with a technical question to assess skills, then move to behavioral questions."
    };
  }

  private mockAnalyzeInterview(inputs: Record<string, any>) {
    const { transcript } = inputs;
    
    return {
      technicalAssessment: {
        score: Math.floor(Math.random() * 5) + 1,
        strengths: ["Problem-solving", "Technical knowledge", "System design"],
        weaknesses: ["Could improve on architectural patterns", "Limited experience with distributed systems"]
      },
      communicationAssessment: {
        score: Math.floor(Math.random() * 5) + 1,
        strengths: ["Clear explanations", "Thoughtful responses"],
        weaknesses: ["Could be more concise", "Some technical terms were misused"]
      },
      culturalFitAssessment: {
        score: Math.floor(Math.random() * 5) + 1,
        notes: "Candidate shows alignment with company values and seems collaborative."
      }
    };
  }

  private mockGenerateRecommendation(inputs: Record<string, any>) {
    const { candidateName, interviewTranscript, jobTitle } = inputs;
    
    const randomRecommendation = Math.random() > 0.3 ? "hire" : "reject";
    
    return {
      recommendation: randomRecommendation,
      strengths: [
        "Strong technical background",
        "Good problem-solving approach",
        "Excellent communication skills"
      ],
      weaknesses: [
        "Limited experience with specific required technologies",
        "Could benefit from more leadership experience"
      ],
      summary: `Based on the interview, ${candidateName} demonstrates strong technical abilities and communication skills required for the ${jobTitle} position. ${randomRecommendation === 'hire' ? 'I recommend proceeding with an offer.' : 'However, I recommend considering other candidates with more specific experience.'}`
    };
  }

  private mockAnalyzeSentiment(inputs: Record<string, any>) {
    const { transcript } = inputs;
    
    return {
      overall: {
        positive: Math.random() * 0.7,
        negative: Math.random() * 0.3,
        neutral: Math.random() * 0.4
      },
      confidence: Math.random() * 0.5 + 0.5,
      toneAnalysis: {
        confident: Math.random() * 0.8,
        hesitant: Math.random() * 0.4,
        enthusiastic: Math.random() * 0.6,
        nervous: Math.random() * 0.5
      },
      keyEmotionalIndicators: [
        "Confidence when discussing technical experience",
        "Slight nervousness when addressing gaps in knowledge",
        "Enthusiasm when describing past projects"
      ]
    };
  }
  
  private mockConductVideoInterview(inputs: Record<string, any>) {
    const { interviewId, videoResponse, previousQuestions } = inputs;
    
    // Technical questions specific to video interviews
    const videoInterviewQuestions = [
      "Please introduce yourself and tell us about your background in your own words.",
      "What motivated you to apply for this position?",
      "Can you describe a challenging project you worked on and how you approached it?",
      "How do you handle working under pressure or tight deadlines?",
      "Where do you see yourself professionally in the next few years?",
      "Do you have any questions for us about the role or company?"
    ];
    
    // If we have previous questions, generate a follow-up question or provide feedback
    if (previousQuestions && previousQuestions.length > 0) {
      // If we've asked enough questions, conclude the interview
      if (previousQuestions.length >= 4) {
        return {
          status: "completed",
          message: "Thank you for completing this video interview. We'll review your responses and get back to you soon."
        };
      }
      
      // Otherwise, ask the next question
      const nextQuestionIndex = previousQuestions.length;
      return {
        status: "in-progress",
        question: videoInterviewQuestions[nextQuestionIndex],
        questionNumber: nextQuestionIndex + 1,
        totalQuestions: Math.min(5, videoInterviewQuestions.length)
      };
    }
    
    // Initial question to start the interview
    return {
      status: "started",
      question: videoInterviewQuestions[0],
      questionNumber: 1,
      totalQuestions: Math.min(5, videoInterviewQuestions.length),
      instructions: "Please enable your camera and microphone to begin the video interview. Answer each question clearly and concisely."
    };
  }
}

// Export a singleton instance
export const llamaClient = new LlamaClient();
