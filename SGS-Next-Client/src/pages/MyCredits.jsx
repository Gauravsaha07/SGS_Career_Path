import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import creditService from '../services/creditService';
import authService from '../services/authService';
import { setUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function MyCredits() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);

  const packs = [
    { name: 'Starter Pack', credits: '100', displayCredits: '100 Credits', price: '₹299', perCredit: '₹2.99 / credit', popular: false, badge: 'STARTER' },
    { name: 'Student Value Pack', credits: '300', displayCredits: '300 Credits', price: '₹699', perCredit: '₹2.33 / credit', popular: true, badge: 'MOST POPULAR 🔥' },
    { name: 'Pro Career Pack', credits: '700', displayCredits: '700 Credits', price: '₹1,299', perCredit: '₹1.85 / credit', popular: false, badge: 'BEST VALUE' },
  ];

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe(user?.token),
    enabled: !!user?.token
  });

  useEffect(() => {
    if (meData && meData.credits !== undefined && meData.credits !== user?.credits) {
      dispatch(setUser({ ...user, credits: meData.credits }));
    }
  }, [meData, user, dispatch]);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['credit-history'],
    queryFn: () => creditService.fetchCreditHistory(user?.token),
    enabled: !!user?.token
  });

  const requestMutation = useMutation({
    mutationFn: (creditsAmount) => creditService.requestCredits(creditsAmount, user.token),
    onSuccess: (data) => {
      toast.success(`Top-up request for ${data.credits} credits submitted successfully! Pending admin verification.`);
      queryClient.invalidateQueries({ queryKey: ['credit-history'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Could not raise credit request");
    }
  });

  const handleBuyPack = (pack) => {
    if (!user) {
      toast.error("Please log in to purchase credits");
      return;
    }
    requestMutation.mutate(pack.credits);
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="credits" />

      <div className="flex-1 flex">
        <Sidebar activeTab="credits" role="student" />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto">
          <div className="bg-yellow border-4 border-navy rounded-3xl p-8 shadow-pop mb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="inline-block bg-navy text-yellow font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-2">
                  WALLET & CREDITS
                </div>
                <h1 className="font-grotesk font-extrabold text-3xl text-navy">
                  Manage CareerBridge Credits
                </h1>
                <p className="font-body text-sm text-navy-muted mt-1">
                  Use credits to generate AI roadmaps and book 1-on-1 mentorship calls with verified industry leaders.
                </p>
              </div>

              <div className="bg-parchment-card border-3 border-navy p-6 rounded-2xl shadow-pop text-center min-w-[220px]">
                <div className="font-mono text-xs font-bold text-navy-muted uppercase">AVAILABLE BALANCE</div>
                <div className="font-grotesk font-extrabold text-4xl text-rust mt-1">
                  {user?.credits ?? 0} <span className="text-base text-navy">pts</span>
                </div>
                <StatusBadge text="ACTIVE WALLET" status="success" />
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="font-grotesk font-extrabold text-2xl text-navy mb-2">Buy Credit Top-Up Packs</h2>
            <p className="font-body text-xs text-navy-muted mb-6">Instant credit delivery via UPI, GPay, PhonePe, or Net Banking.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packs.map((p, idx) => (
                <Card
                  key={idx}
                  color={p.popular ? 'yellow' : 'white'}
                  className={`relative flex flex-col justify-between ${p.popular ? 'border-4 shadow-pop-lg' : ''}`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <StatusBadge text={p.badge} status={p.popular ? 'success' : 'info'} />
                      <span className="font-mono text-[10px] font-bold text-navy-muted">{p.perCredit}</span>
                    </div>

                    <h3 className="font-grotesk font-extrabold text-2xl text-navy">{p.name}</h3>
                    <div className="font-grotesk font-extrabold text-3xl text-rust mt-2">{p.displayCredits}</div>
                    <div className="font-mono text-xl font-bold text-navy mt-1">{p.price} <span className="text-xs text-navy-muted">inclusive GST</span></div>

                    <ul className="mt-4 space-y-2 font-body text-xs text-navy border-t-2 border-navy/20 pt-4">
                      <li className="flex items-center space-x-2">
                        <span className="text-rust font-bold">✓</span>
                        <span>Never Expires</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-rust font-bold">✓</span>
                        <span>Valid for AI Roadmaps & Calls</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-navy/20">
                    <Button
                      clickAction={() => handleBuyPack(p)}
                      variant={p.popular ? 'accent' : 'primary'}
                      size="md"
                      className="w-full"
                    >
                      {requestMutation.isPending ? "Processing..." : `Pay ${p.price} via UPI / Card →`}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-parchment-card border-4 border-navy rounded-3xl p-6 shadow-pop">
            <h2 className="font-grotesk font-extrabold text-xl text-navy mb-4">Credit Transaction Ledger</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs">
                <thead>
                  <tr className="border-b-3 border-navy font-grotesk font-extrabold text-navy uppercase text-[11px] bg-parchment-dim">
                    <th className="p-3">Transaction Details</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-navy/10">
                  {historyLoading ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center font-mono text-xs text-navy-muted">
                        Loading credit transactions...
                      </td>
                    </tr>
                  ) : !historyData || historyData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center font-mono text-xs text-navy-muted">
                        No credit transactions yet. Top up credits to get started!
                      </td>
                    </tr>
                  ) : (
                    historyData.map((tx) => {
                      const isPositive = tx.credits > 0;
                      const displayCredits = isPositive ? `+${tx.credits} Credits` : `${tx.credits} Credits`;
                      const title = isPositive
                        ? `Top-Up Request (#${tx._id.slice(-6).toUpperCase()})`
                        : `Platform Service Usage (#${tx._id.slice(-6).toUpperCase()})`;

                      return (
                        <tr key={tx._id} className="hover:bg-parchment/60 font-mono">
                          <td className="p-3 font-bold text-navy">{title}</td>
                          <td className="p-3 text-navy-muted">{isPositive ? "Top-up / Grant" : "Deduction"}</td>
                          <td className={`p-3 font-bold ${isPositive ? 'text-green-600' : 'text-rust'}`}>
                            {displayCredits}
                          </td>
                          <td className="p-3 text-navy-muted">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-3">
                            <StatusBadge
                              text={tx.status === 'granted' ? 'Granted' : tx.status === 'rejected' ? 'Rejected' : 'Pending'}
                              status={tx.status === 'granted' ? 'success' : tx.status === 'rejected' ? 'warning' : 'info'}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
