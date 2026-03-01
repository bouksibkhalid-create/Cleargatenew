import React from 'react';
import { Document, pdf } from '@react-pdf/renderer';
import type { ReportEntityProfile, ReportData } from './types/reportData';
import type { ReportTheme } from './types/theme';
import { clearGateTheme } from './themes/cleargate';
import { registerFonts } from './fonts/registerFonts';
import { transformToReportData } from './utils/reportDataTransform';
import { computeGraphLayout } from './utils/graphLayout';

import CoverPage from './pages/CoverPage';
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import IdentificationPage from './pages/IdentificationPage';
import SanctionsVerificationPage from './pages/SanctionsVerificationPage';
import WarningsVerificationPage from './pages/WarningsVerificationPage';
import PEPVerificationPage from './pages/PEPVerificationPage';
import AdverseMediaPage from './pages/AdverseMediaPage';
import RelationshipGraphPage from './pages/RelationshipGraphPage';
import GeoAnalysisPage from './pages/GeoAnalysisPage';
import TimelinePage from './pages/TimelinePage';
import MethodologyPage from './pages/MethodologyPage';
import GlossaryPage from './pages/GlossaryPage';
import DisclaimerPage from './pages/DisclaimerPage';

interface ReportDocumentProps {
  data: ReportData;
  theme: ReportTheme;
}

function ReportDocument({ data, theme }: ReportDocumentProps) {
  return (
    <Document
      title={`Intelligence Report - ${data.profile.name}`}
      author="ClearGate"
      subject="Due Diligence Intelligence Report"
      creator="ClearGate v1.0"
    >
      <CoverPage data={data} theme={theme} />
      <ExecutiveSummaryPage data={data} theme={theme} />
      <RiskAssessmentPage data={data} theme={theme} />
      <IdentificationPage data={data} theme={theme} />
      <SanctionsVerificationPage data={data} theme={theme} />
      <WarningsVerificationPage data={data} theme={theme} />
      <PEPVerificationPage data={data} theme={theme} />
      <AdverseMediaPage data={data} theme={theme} />
      {data.computed.graph_layout && (
        <RelationshipGraphPage data={data} theme={theme} />
      )}
      <GeoAnalysisPage data={data} theme={theme} />
      <TimelinePage data={data} theme={theme} />
      <MethodologyPage
        theme={theme}
        classification={data.metadata.classification}
        language={data.metadata.language}
      />
      <GlossaryPage
        theme={theme}
        classification={data.metadata.classification}
        language={data.metadata.language}
      />
      <DisclaimerPage data={data} theme={theme} />
    </Document>
  );
}

export async function generateReport(
  profile: ReportEntityProfile,
  theme: ReportTheme = clearGateTheme
): Promise<void> {
  // 1. Register fonts
  console.log('[Report] Step 1: Registering fonts…');
  registerFonts();

  // 2. Transform data
  console.log('[Report] Step 2: Transforming profile data…');
  const reportData = transformToReportData(profile, theme);

  // 3. Compute graph layout if graph data exists
  if (profile.graph && profile.graph.nodes.length > 0) {
    console.log('[Report] Step 3: Computing graph layout…');
    reportData.computed.graph_layout = computeGraphLayout(profile.graph);
  }

  // 4. Build document and generate blob
  console.log('[Report] Step 4: Rendering PDF document…');
  let blob: Blob;
  try {
    const doc = React.createElement(ReportDocument, { data: reportData, theme }) as any;
    blob = await pdf(doc).toBlob();
  } catch (renderErr) {
    console.error('[Report] PDF render failed:', renderErr);
    throw renderErr;
  }

  // 5. Trigger browser download
  console.log('[Report] Step 5: Triggering download…');
  const url = URL.createObjectURL(blob);
  const link = globalThis.document.createElement('a');
  link.href = url;
  link.download = `ClearGate_Report_${profile.name.replace(/\s+/g, '_')}_${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  link.click();
  URL.revokeObjectURL(url);
  console.log('[Report] Done — download triggered.');
}
