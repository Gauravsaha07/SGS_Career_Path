import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import careerService from '../services/careerService';
import authService from '../services/authService';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigate } from 'react-router-dom';

export default function CareerExplorer() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Domains");
  const [selectedSalary, setSelectedSalary] = useState("Any Salary Range");

  const { data: careers, isLoading: careersLoading } = useQuery({
    queryKey: ['careers'],
    queryFn: () => careerService.fetchCareers()
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => authService.fetchQueries()
  });

  const filteredCareers = (careers || []).filter((career) => {
    const matchesSearch =
      !search ||
      career.title?.toLowerCase().includes(search.toLowerCase()) ||
      career.description?.toLowerCase().includes(search.toLowerCase()) ||
      (career.skills && career.skills.some(sk => sk.toLowerCase().includes(search.toLowerCase())));

    const matchesCategory =
      selectedCategory === "All Domains" ||
      career.category?.title === selectedCategory ||
      career.category?._id === selectedCategory;

    const matchesSalary =
      selectedSalary === "Any Salary Range" ||
      (selectedSalary === "₹4L - ₹8L / year" && (career.salary.includes("4L") || career.salary.includes("5L") || career.salary.includes("6L") || career.salary.includes("7L") || career.salary.includes("8L"))) ||
      (selectedSalary === "₹8L - ₹15L / year" && (career.salary.includes("8L") || career.salary.includes("10L") || career.salary.includes("12L") || career.salary.includes("14L") || career.salary.includes("15L"))) ||
      (selectedSalary === "₹15L+ / year" && (career.salary.includes("18L") || career.salary.includes("20L") || career.salary.includes("22L") || career.salary.includes("24L")));

    return matchesSearch && matchesCategory && matchesSalary;
  });

  if (careersLoading) {
    return <LoadingScreen loadingMessage="Loading High-Growth Careers..." />;
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="explorer" />

      <div className="flex-1 flex">
        <Sidebar activeTab="explorer" role="student" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="mb-8">
            <div className="inline-block bg-yellow border-3 border-navy px-3 py-1 rounded-full shadow-pop-sm font-mono text-xs font-bold text-navy mb-2">
              CAREER DIRECTORY 2026
            </div>
            <h1 className="font-grotesk font-extrabold text-3xl text-navy">
              Explore High-Growth <span className="text-rust">Careers in India</span>
            </h1>
            <p className="font-body text-sm text-navy-muted mt-1">
              Compare salary benchmarks, required skills, and market demand for Indian graduates.
            </p>
          </div>

          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                  Search Career Title or Skill
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title (e.g., Python, IAS, Design)..."
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                  Industry Field
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-3 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                >
                  <option value="All Domains">All Domains</option>
                  {(categories || []).map((cat) => (
                    <option key={cat._id} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-grotesk font-bold text-xs uppercase text-navy mb-1">
                  Expected Salary
                </label>
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="w-full bg-parchment border-3 border-navy rounded-xl px-3 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                >
                  <option value="Any Salary Range">Any Salary Range</option>
                  <option value="₹4L - ₹8L / year">₹4L - ₹8L / year</option>
                  <option value="₹8L - ₹15L / year">₹8L - ₹15L / year</option>
                  <option value="₹15L+ / year">₹15L+ / year</option>
                </select>
              </div>
            </div>
          </div>

          {filteredCareers.length === 0 ? (
            <div className="bg-parchment-card border-4 border-navy rounded-3xl p-12 text-center shadow-pop">
              <div className="text-4xl mb-3">🔍</div>
              <h2 className="font-grotesk font-extrabold text-xl text-navy">No Careers Found</h2>
              <p className="font-body text-xs text-navy-muted mt-1">Try resetting your search query or filters.</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setSelectedCategory("All Domains"); setSelectedSalary("Any Salary Range"); }}
                className="mt-4 px-4 py-2 bg-yellow border-2 border-navy rounded-xl font-grotesk font-bold text-xs text-navy shadow-pop-sm cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCareers.map((career) => (
                <Card key={career._id} color="white" className="flex flex-col justify-between hover:translate-y-[-2px] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <StatusBadge text={career.badge || "TOP CHOICE"} status="success" />
                      <span className="font-mono text-[11px] font-bold text-navy-muted bg-parchment-dim px-2 py-0.5 rounded border border-navy">
                        {career.openings || "10,000+ Openings"}
                      </span>
                    </div>

                    <h3 className="font-grotesk font-extrabold text-xl text-navy mb-1">{career.title}</h3>
                    <p className="font-mono text-xs font-bold text-rust mb-3">{career.category?.title || "Technology"}</p>

                    <div className="bg-yellow/30 border-2 border-navy p-2.5 rounded-xl mb-4">
                      <div className="font-mono text-[10px] font-bold text-navy-muted uppercase">Avg. Starting Package</div>
                      <div className="font-grotesk font-extrabold text-lg text-navy">{career.salary}</div>
                    </div>

                    <p className="font-body text-xs text-navy-muted mb-4">{career.description}</p>

                    <div className="mb-4">
                      <div className="font-grotesk font-bold text-xs text-navy mb-2">Required Core Skills:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(career.skills && career.skills.length > 0 ? career.skills : ["Problem Solving", "Core Tech", "Communication"]).map((sk, idx) => (
                          <span key={idx} className="bg-parchment border border-navy text-navy font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-navy/20 flex space-x-2">
                    <Button
                      clickAction={() => navigate(`/auth/careers/${career._id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      View Detail
                    </Button>
                    <Button
                      clickAction={() => navigate('/auth/ai-roadmap', { state: { interest: career.title } })}
                      variant="primary"
                      size="sm"
                      className="flex-1"
                    >
                      Build Roadmap →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
