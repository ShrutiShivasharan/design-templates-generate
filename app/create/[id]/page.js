'use client';
import { useParams } from 'next/navigation';
import CreateDesign from '../../../components/CreateDesign';
export default function Page() { const { id } = useParams(); return <CreateDesign id={id} />; }
