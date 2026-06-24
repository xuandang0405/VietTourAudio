import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { sampleRows } from '../utils/mockData';
import { fetchTours } from '../api/admin';

function SortRow({ id, text }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      {...attributes}
      {...listeners}
    >
      {text}
    </div>
  );
}

export function TourPage() {
  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Tour', accessorKey: 'name' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Zones', accessorKey: 'zones' }
  ];

  const [flow, setFlow] = useState(['Landing', 'Map', 'Player', 'Payment']);
  const [rows, setRows] = useState(sampleRows.tours);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    let active = true;
    fetchTours().then((items) => {
      if (!active || !items?.length) return;
      setRows(items.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.isActive ? 'ACTIVE' : 'INACTIVE',
        zones: t.zones?.length || t.tourZones?.length || 0
      })));
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="Tour Management" subtitle="Quan ly tour va thu tu experience flow" />
      <DataTable columns={columns} data={rows} />
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-semibold">Reorder flow</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = flow.indexOf(active.id);
            const newIndex = flow.indexOf(over.id);
            setFlow((items) => arrayMove(items, oldIndex, newIndex));
          }}
        >
          <SortableContext items={flow} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {flow.map((item) => <SortRow key={item} id={item} text={item} />)}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
