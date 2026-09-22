import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';

export default function HabitDetailPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader titel="Detail" zurueck />
      <div className="text-leise px-4 text-sm">Kommt in Phase 5 ({id}).</div>
    </>
  );
}
