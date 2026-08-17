import { redirect } from 'next/navigation';
import { sections } from '@/data/questions';

export default function FormulaireIndex() {
  redirect(`/formulaire/${sections[0].id}`);
}
