import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, Phone as PhoneIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import AppHeader from '@/components/AppHeader';
import RiskBadge from '@/components/RiskBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

const RISK_COLORS = { Low: '#1A7A4A', Medium: '#F4A124', High: '#C0392B' };

const AdminDashboard = () => {
  const [stats, setStats] = useState({ today: 0, week: 0, pending: 0 });
  const [riskDist, setRiskDist] = useState<{ name: string; value: number }[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [screenToday, screenWeek, pendingCount, riskData, appts] = await Promise.all([
      supabase.from('screenings').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('screenings').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('screenings').select('risk_result'),
      supabase.from('appointments').select('*').order('created_at', { ascending: false }),
    ]);

    setStats({
      today: screenToday.count || 0,
      week: screenWeek.count || 0,
      pending: pendingCount.count || 0,
    });

    // Risk distribution
    const dist: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
    (riskData.data || []).forEach((s: any) => {
      if (s.risk_result && dist[s.risk_result] !== undefined) dist[s.risk_result]++;
    });
    setRiskDist(Object.entries(dist).map(([name, value]) => ({ name, value })));

    setAppointments(appts.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const exportCsv = () => {
    const headers = ['Name', 'Phone', 'Clinic', 'Date', 'Time', 'Risk', 'Status'];
    const rows = appointments.map(a => [a.patient_name, a.phone, a.clinic_name, a.preferred_date, a.preferred_time, a.risk_level, a.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'appointments.csv';
    link.click();
  };

  const filtered = statusFilter ? appointments.filter(a => a.status === statusFilter) : appointments;
  const todayFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader showLogo rightElement={<span className="text-xs text-muted-foreground">{todayFormatted}</span>} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <RefreshCw className="w-5 h-5 text-primary" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner className="w-8 h-8" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Screenings Today', value: stats.today },
                { label: 'This Week', value: stats.week },
                { label: 'Pending Appointments', value: stats.pending },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card rounded-xl p-4 card-shadow text-center">
                  <div className="text-3xl font-bold text-primary">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Pie Chart */}
            <div className="bg-card rounded-xl p-4 card-shadow">
              <h3 className="font-bold text-foreground mb-2">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {riskDist.map((entry) => (
                      <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Appointments Table */}
            <div className="bg-card rounded-xl p-4 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Appointment Requests</h3>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-muted border-none rounded-lg px-2 py-1 outline-none"
                  >
                    <option value="">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <button onClick={exportCsv} className="flex items-center gap-1 text-xs text-primary font-semibold px-2 py-1 bg-primary-light rounded-lg">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">Phone</th>
                      <th className="pb-2 pr-3">Clinic</th>
                      <th className="pb-2 pr-3">Date</th>
                      <th className="pb-2 pr-3">Time</th>
                      <th className="pb-2 pr-3">Risk</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => (
                      <tr key={a.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        <td className="py-2 pr-3 font-medium">{a.patient_name}</td>
                        <td className="py-2 pr-3">{a.phone}</td>
                        <td className="py-2 pr-3 text-xs">{a.clinic_name}</td>
                        <td className="py-2 pr-3">{a.preferred_date}</td>
                        <td className="py-2 pr-3">{a.preferred_time}</td>
                        <td className="py-2 pr-3"><RiskBadge level={a.risk_level} /></td>
                        <td className="py-2 pr-3">
                          <select
                            value={a.status}
                            onChange={(e) => updateStatus(a.id, e.target.value)}
                            className="text-xs bg-muted rounded px-1 py-0.5 outline-none"
                          >
                            <option>Pending</option>
                            <option>Confirmed</option>
                            <option>Rescheduled</option>
                            <option>Cancelled</option>
                          </select>
                        </td>
                        <td className="py-2">
                          <a href={`tel:${a.phone}`} className="text-primary text-xs font-semibold flex items-center gap-1">
                            <PhoneIcon className="w-3 h-3" /> Call
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No appointments found</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
