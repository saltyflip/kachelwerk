import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { AnzahlKarte, Habit } from '../../types/models';
import { HabitCard } from './HabitCard';

const LEERE_KARTE: AnzahlKarte = new Map<string, number>();

interface SortableHabitListProps {
  habits: Habit[];
  karten: Map<string, Map<string, number>>;
  heuteSchluessel: string;
  onTippen: (habit: Habit) => void;
  onZuruecksetzen: (habit: Habit) => void;
  onReihenfolge: (ids: string[]) => void;
}

/**
 * Sortierbare Liste. Auf dem Touchscreen startet das Ziehen erst nach kurzem
 * Halten am Griff, damit normales Scrollen weiter funktioniert.
 */
export function SortableHabitList({
  habits,
  karten,
  heuteSchluessel,
  onTippen,
  onZuruecksetzen,
  onReihenfolge,
}: SortableHabitListProps) {
  const sensoren = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const beiDragEnde = (ereignis: DragEndEvent) => {
    const { active, over } = ereignis;
    if (!over || active.id === over.id) return;
    const von = habits.findIndex((h) => h.id === active.id);
    const nach = habits.findIndex((h) => h.id === over.id);
    if (von < 0 || nach < 0) return;
    onReihenfolge(arrayMove(habits, von, nach).map((h) => h.id));
  };

  return (
    <DndContext
      sensors={sensoren}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={beiDragEnde}
    >
      <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-3">
          {habits.map((habit) => (
            <SortierbareKarte
              key={habit.id}
              habit={habit}
              karte={karten.get(habit.id) ?? LEERE_KARTE}
              heuteSchluessel={heuteSchluessel}
              onTippen={onTippen}
              onZuruecksetzen={onZuruecksetzen}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface SortierbareKarteProps {
  habit: Habit;
  karte: AnzahlKarte;
  heuteSchluessel: string;
  onTippen: (habit: Habit) => void;
  onZuruecksetzen: (habit: Habit) => void;
}

function SortierbareKarte({ habit, ...rest }: SortierbareKarteProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={isDragging ? 'relative opacity-90 shadow-xl' : 'relative'}
    >
      <HabitCard
        habit={habit}
        {...rest}
        griff={
          <button
            type="button"
            className="text-schwach hover:text-leise -ml-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            aria-label={`${habit.name} verschieben`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </li>
  );
}
