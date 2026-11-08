import React from 'react';
import { AppView } from '../types';
import { EntryDetail } from './EntryDetail';

interface CuratedWorkDetailProps {
  slug: string;
  onNavigate: (view: AppView) => void;
}

/**
 * CuratedWorkDetail delegates directly to EntryDetail.
 * An Entry must have ONE canonical detail rendering regardless of whether
 * it was opened via Homepage Curated Selection, Laboratory / Medium, or a direct link.
 */
export const CuratedWorkDetail: React.FC<CuratedWorkDetailProps> = ({ slug, onNavigate }) => {
  return <EntryDetail slug={slug} onNavigate={onNavigate} />;
};
