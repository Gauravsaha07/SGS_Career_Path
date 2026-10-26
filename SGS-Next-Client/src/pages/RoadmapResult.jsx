import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import roadmapService from '../services/roadmapService';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';

export default function RoadmapResult() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);

  const [selectedRoadmapIndex, setSelectedRoadmapIndex] = useState(0);

  const { data: roadmaps, isLoading, isError } = useQuery({
    queryKey: ['my-roadmaps'],
    queryFn: () => roadmapService.fetchMyRoadmaps(user?.token),
    enabled: !!user?.token
  });

  const activeRoadmap = roadmaps && roadmaps.length > 0 ? roadmaps[selectedRoadmapIndex] : null;

  const deleteMutation = useMutation({
    mutationFn: (id) => roadmapService.deleteRoadmap(id, user.token),
    onSuccess: () => {
      toast.success("Roadmap deleted successfully!");
      setSelectedRoadmapIndex(0);
      queryClient.invalidateQueries({ queryKey: ['my-roadmaps'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Could not delete roadmap");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => roadmapService.updateRoadmap(id, payload, user.token),
    onSuccess: () => {
      toast.success("Roadmap progress updated!");
      queryClient.invalidateQueries({ queryKey: ['my-roadmaps'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Could not update progress");
    }
  });

  const handleExportPDF = () => {
    window.print();
  };

  const handleAddToGoals = () => {
    toast.success("Added to your Active Goals on Dashboard! 🎯");
  };

  const handleTogglePhase = (phaseNum) => {
    if (!activeRoadmap) return;
    const currentCompleted = activeRoadmap.completedPhases || [];
    const isCompleted = currentCompleted.includes(phaseNum);
    const updated = isCompleted
      ? currentCompleted.filter(p => p !== phaseNum)
      : [...currentCompleted, phaseNum];
    const newProgress = Math.round((updated.length / 4) * 100);

    updateMutation.mutate({
      id: activeRoadmap._id,
      payload: {
        completedPhases: updated,
        progress: newProgress
      }
    });
  };

  // Standard fallback phases if roadmap has plain text
  const defaultPhases = [
    {
      phase: 'Phase 1 (Month 1-2)',
      title: 'Frontend Foundations & Modern React',
      status: 'IN PROGRESS',
      badgeStatus: 'info',
      topics: [
        'HTML5 Semantic Markup & Accessibility',
        'CSS Grid, Flexbox & Tailwind CSS Utility Styling',
        'ES6+ JavaScript (Promises, Async/Await, Array Methods)',
        'React 18 Component Architecture & Hooks',
      ],
      project: 'Build a Responsive Portfolio & E-commerce Product Showcase UI',
    },
    {
      phase: 'Phase 2 (Month 3-4)',
      title: 'Node.js Backend, REST APIs & Databases',
      status: 'UPCOMING',
      badgeStatus: 'warning',
      topics: [
        'Node.js Runtime & Express Server Setup',
        'RESTful API Design & Middleware Authentication',
        'PostgreSQL & MongoDB Database Schemas',
        'JWT Tokens, Password Hashing & Security',
      ],
      project: 'Build a Full-Stack Career Guidance Portal with User Auth',
    },
    {
      phase: 'Phase 3 (Month 5)',
      title: 'Full-Stack Integration & Next.js SSR',
      status: 'UPCOMING',
      badgeStatus: 'warning',
      topics: [
        'Next.js App Router, Server Components & SSR',
        'Vercel & Render Deployment Pipelines',
        'State Management with Zustand & React Query',
        'Docker Container Basics',
      ],
      project: 'Deploy a Production-Ready SaaS Application',
    },
    {
      phase: 'Phase 4 (Month 6)',
      title: 'Interview Prep & Campus Placements',
      status: 'LOCKED',
      badgeStatus: 'purple',
      topics: [
        'Top 50 LeetCode Medium DSA Questions in JS',
        'System Design Fundamentals (Load Balancers, DB Indexing)',
        'Mock Interviews with Verified Counselors',
        'Resume ATS Optimization & LinkedIn Networking',
      ],
      project: 'Land 3+ Interview Offers at Top Indian Product Startups',
    },
  ];

  if (isLoading) {
    return <LoadingScreen loadingMessage="Loading Your AI Roadmaps..." />;
  }

  if (!roadmaps || roadmaps.length === 0) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col">
        <Navbar activePage="roadmap" />
        <div className="flex-1 flex">
          <Sidebar activeTab="roadmap" role="student" />
          <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
            <div className="bg-parchment-card border-4 border-navy rounded-3xl p-12 text-center shadow-pop max-w-xl mx-auto">
              <div className="text-4xl mb-3">⚡</div>
              <h2 className="font-grotesk font-extrabold text-2xl text-navy">No Roadmaps Generated Yet</h2>
              <p className="font-body text-xs text-navy-muted mt-2">
                Generate your personalized 4-phase learning path tailored to Indian campus placements and tech jobs.
              </p>
              <Button
                clickAction={() => navigate('/auth/ai-roadmap')}
                variant="accent"
                size="md"
                className="mt-6"
              >
                + Generate AI Roadmap (1 Credit)
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const completedPhasesList = activeRoadmap?.completedPhases || [1];

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="roadmap" />

      <div className="flex-1 flex">
        <Sidebar activeTab="roadmap" role="student" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          {/* Roadmap Switcher if multiple exist */}
          {roadmaps.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <span className="font-mono text-xs font-bold text-navy uppercase mr-2">Your Roadmaps:</span>
              {roadmaps.map((rm, idx) => (
                <button
                  key={rm._id}
                  onClick={() => setSelectedRoadmapIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl border-2 border-navy font-mono text-xs font-bold transition-all cursor-pointer ${
                    selectedRoadmapIndex === idx
                      ? 'bg-yellow text-navy shadow-pop-sm'
                      : 'bg-white text-navy hover:bg-parchment-dim'
                  }`}
                >
                  {rm.title || `Roadmap #${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Header Banner */}
          <div className="bg-yellow border-4 border-navy rounded-3xl p-8 shadow-pop mb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <StatusBadge text="AI GENERATED PATH" status="success" />
                  <span className="font-mono text-xs font-bold text-navy-muted">
                    GENERATED ON: {new Date(activeRoadmap?.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h1 className="font-grotesk font-extrabold text-3xl text-navy">
                  {activeRoadmap?.title || "Career Roadmap"}
                </h1>
                <p className="font-body text-sm text-navy-muted mt-1">
                  Target Domain: <span className="font-bold text-navy">{activeRoadmap?.interest || "Technology"}</span> • Completion: <span className="font-bold text-rust">{activeRoadmap?.progress || Math.round((completedPhasesList.length / 4) * 100)}%</span> • 4-Phase Placement Plan
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button clickAction={handleExportPDF} variant="outline" size="md">
                  📥 Export PDF
                </Button>
                <Button clickAction={handleAddToGoals} variant="accent" size="md">
                  + Add to Active Goals
                </Button>
                <Button
                  clickAction={() => {
                    if (window.confirm("Are you sure you want to delete this roadmap?")) {
                      deleteMutation.mutate(activeRoadmap._id);
                    }
                  }}
                  variant="primary"
                  size="md"
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  🗑️ Delete
                </Button>
              </div>
            </div>
          </div>

          {/* AI Output Overview Card if text available */}
          {activeRoadmap?.text && (
            <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop mb-8 max-w-5xl">
              <h2 className="font-grotesk font-extrabold text-lg text-navy mb-2">Detailed Curriculum & Advisor Guidance</h2>
              <div className="bg-parchment border-2 border-navy rounded-2xl p-4 font-body text-xs text-navy whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {activeRoadmap.text}
              </div>
            </div>
          )}

          {/* Timeline Phases */}
          <div className="space-y-6 max-w-5xl">
            {defaultPhases.map((p, idx) => {
              const phaseNum = idx + 1;
              const isDone = completedPhasesList.includes(phaseNum);

              return (
                <div key={idx} className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop relative">
                  {/* Connecting Line Indicator */}
                  {idx < defaultPhases.length - 1 && (
                    <div className="hidden lg:block absolute left-8 -bottom-7 w-1 h-7 bg-navy"></div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b-2 border-navy/20">
                    <div>
                      <div className="font-mono text-xs font-bold text-rust uppercase tracking-wider">{p.phase}</div>
                      <h2 className="font-grotesk font-extrabold text-xl text-navy mt-0.5">{p.title}</h2>
                    </div>
                    <StatusBadge
                      text={isDone ? "COMPLETED (100%)" : p.status}
                      status={isDone ? "success" : p.badgeStatus}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-parchment border-2 border-navy p-4 rounded-2xl">
                      <h3 className="font-grotesk font-bold text-xs text-navy uppercase mb-2">Key Skills & Learning Goals:</h3>
                      <ul className="space-y-1.5 font-body text-xs text-navy">
                        {p.topics.map((t, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-rust font-bold">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-sky/20 border-2 border-navy p-4 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h3 className="font-grotesk font-bold text-xs text-navy uppercase mb-2">Milestone Project:</h3>
                        <p className="font-grotesk font-extrabold text-sm text-navy">🛠️ {p.project}</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-navy/20 flex justify-between items-center">
                        <span className="font-mono text-[10px] font-bold text-navy-muted">Recommended: 15 hrs/wk</span>
                        <Button
                          clickAction={() => handleTogglePhase(phaseNum)}
                          variant={isDone ? "outline" : "primary"}
                          size="sm"
                        >
                          {isDone ? "✓ Completed" : "Mark Phase Done"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
