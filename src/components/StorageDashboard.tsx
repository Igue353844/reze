import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HardDrive, Loader2 } from 'lucide-react';

interface B2Account {
  id: string;
  label: string;
  max_storage_bytes: number;
  used_storage_bytes: number;
  is_active: boolean;
  bucket_name: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

export function StorageDashboard() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['b2-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('b2_accounts').select('*').order('priority');
      if (error) throw error;
      return data as B2Account[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma conta B2 cadastrada</p>
      </div>
    );
  }

  const totalUsed = accounts.reduce((s, a) => s + a.used_storage_bytes, 0);
  const totalMax = accounts.reduce((s, a) => s + a.max_storage_bytes, 0);
  const totalFree = totalMax - totalUsed;

  // Pie chart data: usage distribution across accounts
  const pieData = accounts.map((a, i) => ({
    name: a.label,
    value: a.used_storage_bytes,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  if (pieData.length === 0) {
    pieData.push({ name: 'Livre', value: totalMax, color: 'hsl(var(--muted))' });
  }

  // Bar chart data: used vs available per account
  const barData = accounts.map(a => ({
    name: a.label,
    usado: +(a.used_storage_bytes / (1024 * 1024 * 1024)).toFixed(2),
    livre: +((a.max_storage_bytes - a.used_storage_bytes) / (1024 * 1024 * 1024)).toFixed(2),
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-secondary p-4 text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-foreground">{formatBytes(totalMax)}</p>
        </div>
        <div className="rounded-lg bg-secondary p-4 text-center">
          <p className="text-xs text-muted-foreground">Usado</p>
          <p className="text-lg font-bold text-primary">{formatBytes(totalUsed)}</p>
        </div>
        <div className="rounded-lg bg-secondary p-4 text-center">
          <p className="text-xs text-muted-foreground">Livre</p>
          <p className="text-lg font-bold text-foreground">{formatBytes(totalFree)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-secondary rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Distribuição de Uso</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatBytes(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-secondary rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Uso por Conta (GB)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="usado" stackId="a" fill="hsl(var(--primary))" name="Usado" />
              <Bar dataKey="livre" stackId="a" fill="hsl(var(--muted))" name="Livre" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
