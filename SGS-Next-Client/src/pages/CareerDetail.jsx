import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import careerService from '../services/careerService';
import LoadingScreen from '../components/LoadingScreen';

export default function CareerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: career, isLoading, isError } = useQuery({
    queryKey: ['career', id],
    queryFn: () => careerService.fetchCareerById(id),
    enabled: !!id
  });

  const hiringCompanies = ['Razorpay', 'Swiggy', 'Flipkart', 'Zomato', 'TCS Digital', 'Infosys Springboard'];

  const salaryPhases = [
    { level: 'Entry Level (0-2 Yrs)', range: career?.salary || '₹6.5L - ₹10L / year', note: 'Junior / Associate Roles at Startups & Product Firms' },
    { level: 'Mid Level (3-5 Yrs)', range: '₹14L - ₹24L / year', note: 'Senior Specialist / Technical Lead' },
    { level: 'Lead / Principal (6+ Yrs)', range: '₹28L - ₹45L / year', note: 'Staff Architect & Practice Lead' },
  ];

  const skillTree = [
    {
      title: 'Core Domain Technologies',
      items: (career?.skills && career.skills.length > 0)
        ? career.skills.slice(0, 5)
        : ['Fundamentals', 'Domain Architecture', 'Security & Best Practices']
    },
    {
      title: 'Tools & Ecosystem',
      items: ['Git & Version Control', 'REST APIs', 'Cloud Deployment Pipelines', 'Testing & CI/CD']
    },
    {
      title: 'Professional Practices',
      items: ['Agile / Scrum Methodologies', 'System Performance Optimization', 'Cross-Functional Collaboration']
    },
  ];

  if (isLoading) {
    return <LoadingScreen loadingMessage="Loading Career Blueprint..." />;
  }

  if (isError || !career) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col">
        <Navbar activePage="explorer" />
        <div className="flex-1 flex">
          <Sidebar activeTab="explorer" role="student" />
          <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
            <div className="bg-parchment-card border-4 border-navy rounded-3xl p-12 text-center shadow-pop max-w-xl mx-auto">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-grotesk font-extrabold text-2xl text-navy">Career Not Found</h2>
              <p className="font-body text-xs text-navy-muted mt-2">The career path you requested could not be located.</p>
              <Button clickAction={() => navigate('/auth/careers')} variant="primary" size="md" className="mt-6">
                ← Back to Career Explorer
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="explorer" />

      <div className="flex-1 flex">
        <Sidebar activeTab="explorer" role="student" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="mb-4">
            <Link to="/auth/careers" className="font-grotesk font-bold text-xs text-navy hover:text-rust flex items-center space-x-1">
              <span>← Back to Career Explorer</span>
            </Link>
          </div>

          <div className="bg-yellow border-4 border-navy rounded-3xl p-8 shadow-pop mb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <StatusBadge text={career.badge || "HIGH DEMAND IN INDIA"} status="success" />
                  <span className="font-mono text-xs font-bold text-navy-muted">
                    CATEGORY: {career.category?.title?.toUpperCase() || "CAREER"}
                  </span>
                </div>
                <h1 className="font-grotesk font-extrabold text-4xl text-navy">{career.title}</h1>
                <p className="font-body text-sm text-navy-muted mt-1 max-w-2xl">
                  {career.description}
                </p>
              </div>

              <div className="bg-parchment-card border-3 border-navy p-4 rounded-2xl shadow-pop-sm text-center min-w-[200px]">
                <div className="font-mono text-[10px] font-bold text-navy-muted uppercase">Avg Starting Package</div>
                <div className="font-grotesk font-extrabold text-2xl text-rust">{career.salary}</div>
                <div className="font-mono text-[10px] text-navy font-semibold mt-1">{career.openings || "10,000+ Active Vacancies"}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-3 border-navy flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-grotesk font-bold text-xs text-navy">Top Employers Hiring:</span>
                {hiringCompanies.map((c, i) => (
                  <span key={i} className="bg-white border-2 border-navy px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold text-navy">
                    {c}
                  </span>
                ))}
              </div>

              <Button
                clickAction={() => navigate('/auth/ai-roadmap', { state: { interest: career.title } })}
                variant="accent"
                size="md"
              >
                ⚡ Generate Personal AI Roadmap
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h2 className="font-grotesk font-extrabold text-xl text-navy mb-4">Indian Salary Trajectory</h2>
                <div className="space-y-4">
                  {salaryPhases.map((sp, idx) => (
                    <div key={idx} className="bg-parchment border-3 border-navy rounded-2xl p-4 flex justify-between items-center shadow-pop-sm">
                      <div>
                        <div className="font-grotesk font-extrabold text-base text-navy">{sp.level}</div>
                        <p className="font-body text-xs text-navy-muted mt-0.5">{sp.note}</p>
                      </div>
                      <div className="font-mono text-sm font-extrabold text-rust bg-rust-container px-3 py-1.5 rounded-full border-2 border-navy">
                        {sp.range}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h2 className="font-grotesk font-extrabold text-xl text-navy mb-4">Required Technology Stack</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {skillTree.map((st, i) => (
                    <div key={i} className="bg-sky/20 border-3 border-navy rounded-2xl p-4">
                      <h3 className="font-grotesk font-extrabold text-sm text-navy mb-3 pb-2 border-b-2 border-navy">
                        {st.title}
                      </h3>
                      <ul className="space-y-2">
                        {st.items.map((item, j) => (
                          <li key={j} className="flex items-center space-x-2 font-mono text-xs text-navy">
                            <span className="text-rust">✔</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-teal-container border-4 border-navy rounded-3xl p-6 shadow-pop">
                <StatusBadge text="EXPERT COUNSELOR MATCH" status="info" />
                <h3 className="font-grotesk font-extrabold text-xl text-navy mt-3">Verified Mentor Guidance</h3>
                <p className="font-mono text-xs text-navy">Direct 1-on-1 Guidance</p>
                <p className="font-body text-xs text-navy mt-2">
                  "Connect with senior mentors who have guided hundreds of Indian students into top {career.title} roles. Book a 1-on-1 resume & career review."
                </p>
                <div className="mt-4 pt-4 border-t-2 border-navy">
                  <Button
                    clickAction={() => navigate('/auth/counselors')}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    Browse Counselors (50 Credits)
                  </Button>
                </div>
              </div>

              <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
                <h3 className="font-grotesk font-extrabold text-lg text-navy mb-3">Prerequisite Qualifications</h3>
                <ul className="space-y-2 text-xs font-body text-navy">
                  <li className="flex items-start space-x-2">
                    <span className="text-rust font-bold">•</span>
                    <span>{career.requiredQualification || "Recognized Bachelor Degree / Relevant Certification"}</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-rust font-bold">•</span>
                    <span>Estimated Preparation Timeline: {career.duration || "4 - 6 Months"}</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-rust font-bold">•</span>
                    <span>Hands-on practical projects and portfolio validation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
