'use client';
import { useParams } from 'next/navigation';
import TemplateEditor from '../../../components/TemplateEditor';
export default function Page() { const { id } = useParams(); return <TemplateEditor id={id} />; }
