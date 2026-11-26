import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LEGAL_DOCUMENTS } from '@/lib/config/compliance-config';
import { LegalLayout } from '@/components/compliance/legal-layout';
import { renderLegalDocumentBody } from '@/components/compliance/legal-documents';

interface LegalDocPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: LegalDocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) {
    return { title: 'Compliance Document Not Found | CivicSpaces' };
  }
  return {
    title: `${doc.number} — ${doc.title} | CivicSpaces`,
    description: doc.summary,
  };
}

export default async function LegalDocumentPage({ params }: LegalDocPageProps) {
  const { slug } = await params;
  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);

  if (!doc) {
    notFound();
  }

  return <LegalLayout currentDoc={doc}>{renderLegalDocumentBody(doc.slug)}</LegalLayout>;
}
