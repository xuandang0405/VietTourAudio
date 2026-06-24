import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { sampleRows } from '../utils/mockData';
import { createZone, fetchZones } from '../api/admin';

const schema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  radius: z.coerce.number().min(5).max(100)
});

export function PoiPage() {
  const [rows, setRows] = useState(sampleRows.pois);

  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', type: 'landmark', radius: 15 } });

  useEffect(() => {
    let active = true;
    fetchZones().then((items) => {
      if (!active || !items?.length) return;
      setRows(items);
    });
    return () => { active = false; };
  }, []);

  const columns = useMemo(() => [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Type', accessorKey: 'zoneType' },
    { header: 'Premium', accessorKey: 'isPremium', cell: (ctx) => (ctx.getValue() ? 'Yes' : 'No') },
    { header: 'Radius', accessorKey: 'radius' }
  ], []);

  return (
    <section className="space-y-4">
      <PageHeader title="POI & Zones" subtitle="Quan ly zone, geofence radius, va premium flag" />
      <form
        onSubmit={handleSubmit(async (values) => {
          try {
            const created = await createZone({
              name: values.name,
              zoneType: values.type.toUpperCase(),
              radius: values.radius,
              latitude: 10.7728,
              longitude: 106.7045,
              isPremium: false,
              activeTime: 'ALL',
              translations: [{ language: 'vi', description: values.name }]
            });
            setRows((prev) => [created, ...prev]);
            toast.success(`Saved zone: ${values.name}`);
            reset();
          } catch (e) {
            toast.error(e.message);
          }
        })}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4"
      >
        <input {...register('name')} placeholder="Zone name" className="rounded-lg border border-slate-200 px-3 py-2" />
        <input {...register('type')} placeholder="Type" className="rounded-lg border border-slate-200 px-3 py-2" />
        <input type="number" {...register('radius')} placeholder="Radius" className="rounded-lg border border-slate-200 px-3 py-2" />
        <button className="rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white">Save</button>
      </form>
      <DataTable columns={columns} data={rows} />
    </section>
  );
}
