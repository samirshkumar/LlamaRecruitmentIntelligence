import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { RecruitmentAppProvider } from "./context";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import Dashboard from "./pages/dashboard";
import JDGenerator from "./pages/jd-generator";
import Jobs from "./pages/jobs";
import ResumeRanker from "./pages/resume-ranker";
import Candidates from "./pages/candidates";
import EmailAutomation from "./pages/email-automation";
import InterviewScheduler from "./pages/interview-scheduler";
import ScheduledInterviews from "./pages/scheduled-interviews";
import InterviewAgent from "./pages/interview-agent";
import HireRecommendation from "./pages/hire-recommendation";
import HiredCandidates from "./pages/hired-candidates";
import SentimentAnalyzer from "./pages/sentiment-analyzer";
import VideoInterview from "./pages/video-interview";
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/jd-generator" component={JDGenerator} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/candidates" component={Candidates} />
        <Route path="/resume-ranker" component={ResumeRanker} />
        <Route path="/email-automation" component={EmailAutomation} />
        <Route path="/interview-scheduler" component={InterviewScheduler} />
        <Route path="/scheduled-interviews" component={ScheduledInterviews} />
        <Route path="/interview-agent" component={InterviewAgent} />
        <Route path="/video-interview" component={VideoInterview} />
        <Route path="/hire-recommendation" component={HireRecommendation} />
        <Route path="/hired-candidates" component={HiredCandidates} />
        <Route path="/sentiment-analyzer" component={SentimentAnalyzer} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RecruitmentAppProvider>
        <Router />
        <Toaster />
      </RecruitmentAppProvider>
    </QueryClientProvider>
  );
}

export default App;
