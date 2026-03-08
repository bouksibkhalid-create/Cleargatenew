import type {
  Order,
  TierDefinition,
  InvestigationReport,
} from '../types/order';

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: 'scan',
    name: 'ClearGate Scan',
    badge: 'Inclus — Vous êtes ici',
    price: null,
    turnaround: 'Instantané',
    isPurchasable: false,
    accentColor: '#6B7280',
    features: [
      { label: 'Match sanctions (Oui / Non)', included: true, isNew: false },
      { label: 'Médias défavorables (nombre de résultats)', included: true, isNew: false },
      { label: 'Liens offshore (connexions directes)', included: true, isNew: false },
      { label: 'Score de risque automatisé', included: true, isNew: false },
      { label: 'Risque juridictionnel (nom du pays)', included: true, isNew: false },
      { label: 'Page profil', included: true, isNew: false },
    ],
  },
  {
    id: 'investigation',
    name: 'ClearGate Investigation',
    badge: 'Recommandé',
    price: 'Forfait Taskforce RDC',
    turnaround: '48 heures',
    isPurchasable: true,
    accentColor: '#00D4AA',
    features: [
      { label: 'Tout dans ClearGate Scan', included: true, isNew: false },
      { label: 'Détail du programme de sanctions', included: true, isNew: true },
      { label: 'Analyse complète des médias + pertinence', included: true, isNew: true },
      { label: 'Chaîne UBO complète (multi-hop)', included: true, isNew: true },
      { label: 'Score de risque pondéré IA', included: true, isNew: true },
      { label: 'Superposition GAFI / CPI', included: true, isNew: true },
      { label: 'Rapport PDF enrichi', included: true, isNew: true },
    ],
  },
  {
    id: 'due_diligence',
    name: 'ClearGate Due Diligence',
    badge: 'Premium',
    price: 'Forfait Taskforce RDC',
    turnaround: '5 à 10 jours ouvrés',
    isPurchasable: true,
    accentColor: '#8B5CF6',
    features: [
      { label: 'Tout dans ClearGate Investigation', included: true, isNew: false },
      { label: 'Couverture médias en langue source', included: true, isNew: true },
      { label: 'Analyse de structure réseau', included: true, isNew: true },
      { label: 'Score de risque validé par analyste', included: true, isNew: true },
      { label: 'Contexte réglementaire local', included: true, isNew: true },
      { label: 'Dossiers judiciaires (PACER, Justia)', included: true, isNew: true },
      { label: "Vérification registres d'entreprises", included: true, isNew: true },
      { label: 'Conclusion signée par analyste', included: true, isNew: true },
      { label: 'Dossier complet signé', included: true, isNew: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Jurisdiction options
// ---------------------------------------------------------------------------

export const JURISDICTION_OPTIONS: { label: string; value: string; region: string }[] = [
  // Europe
  { label: 'France', value: 'FR', region: 'Europe' },
  { label: 'Royaume-Uni', value: 'GB', region: 'Europe' },
  { label: 'Allemagne', value: 'DE', region: 'Europe' },
  { label: 'Suisse', value: 'CH', region: 'Europe' },
  { label: 'Luxembourg', value: 'LU', region: 'Europe' },
  { label: 'Chypre', value: 'CY', region: 'Europe' },
  { label: 'Malte', value: 'MT', region: 'Europe' },
  { label: 'Pays-Bas', value: 'NL', region: 'Europe' },
  // Americas
  { label: 'États-Unis', value: 'US', region: 'Amériques' },
  { label: 'Canada', value: 'CA', region: 'Amériques' },
  { label: 'Panama', value: 'PA', region: 'Amériques' },
  { label: 'Îles Vierges Britanniques', value: 'VG', region: 'Amériques' },
  { label: 'Îles Caïmans', value: 'KY', region: 'Amériques' },
  // Middle East
  { label: 'Émirats Arabes Unis', value: 'AE', region: 'Moyen-Orient' },
  { label: 'Arabie Saoudite', value: 'SA', region: 'Moyen-Orient' },
  { label: 'Qatar', value: 'QA', region: 'Moyen-Orient' },
  // Asia-Pacific
  { label: 'Chine', value: 'CN', region: 'Asie-Pacifique' },
  { label: 'Hong Kong', value: 'HK', region: 'Asie-Pacifique' },
  { label: 'Singapour', value: 'SG', region: 'Asie-Pacifique' },
  { label: 'Russie', value: 'RU', region: 'Asie-Pacifique' },
  // Africa
  { label: 'Afrique du Sud', value: 'ZA', region: 'Afrique' },
  { label: 'Nigeria', value: 'NG', region: 'Afrique' },
  { label: 'Kenya', value: 'KE', region: 'Afrique' },
];

// ---------------------------------------------------------------------------
// Language options
// ---------------------------------------------------------------------------

export const LANGUAGE_OPTIONS = [
  { label: 'Russe', value: 'ru' },
  { label: 'Arabe', value: 'ar' },
  { label: 'Chinois (Mandarin)', value: 'zh' },
  { label: 'Espagnol', value: 'es' },
  { label: 'Allemand', value: 'de' },
  { label: 'Portugais', value: 'pt' },
];

// ---------------------------------------------------------------------------
// Mock reports
// ---------------------------------------------------------------------------

const SECHIN_REPORT: InvestigationReport = {
  completedAt: '2026-03-04T14:30:00Z',
  riskScore: 94,
  riskLevel: 'Critique',
  sanctions: {
    isSanctioned: true,
    programs: ['OFAC SDN', 'EU Consolidated List', 'UK Sanctions'],
    designationDate: '2022-02-25',
    reason:
      'Designated in connection with the situation in Ukraine. CEO of Rosneft, close associate of Vladimir Putin.',
  },
  adverseMedia: {
    totalArticles: 47,
    highRelevance: 12,
    summary: [
      {
        source: 'Financial Times',
        date: '2025-11-15',
        title: 'Rosneft CEO under renewed scrutiny over sanctions evasion',
        relevance: 'high',
        allegationType: 'Sanctions evasion',
      },
      {
        source: 'Reuters',
        date: '2025-09-22',
        title: 'EU investigates tanker fleet linked to Russian oil executive',
        relevance: 'high',
        allegationType: 'Sanctions circumvention',
      },
      {
        source: 'Le Monde',
        date: '2025-08-03',
        title: "Les réseaux offshore d'Igor Sechin passés au crible",
        relevance: 'medium',
        allegationType: 'Offshore structures',
      },
    ],
  },
  uboChain: [
    { entity: 'Igor Sechin', type: 'Person', jurisdiction: 'Russia', role: 'Beneficial Owner' },
    { entity: 'Rosneft Oil Company', type: 'Organization', jurisdiction: 'Russia', role: 'CEO / Director', ownership: 'Direct' },
    { entity: 'RN-Invest LLC', type: 'Organization', jurisdiction: 'Russia', role: 'Subsidiary', ownership: '100%' },
    { entity: 'Rosneft Trading SA', type: 'Organization', jurisdiction: 'Switzerland', role: 'Trading Arm', ownership: '100%' },
    { entity: 'RT Marine Services Ltd', type: 'Organization', jurisdiction: 'Cyprus', role: 'Shipping Entity', ownership: 'Indirect' },
  ],
  jurisdictionalRisk: [
    { jurisdiction: 'Russia', fatfStatus: 'Black List (FATF)', cpiScore: 26, riskLevel: 'Très élevé' },
    { jurisdiction: 'Switzerland', fatfStatus: 'Member', cpiScore: 82, riskLevel: 'Faible' },
    { jurisdiction: 'Cyprus', fatfStatus: 'Under Monitoring', cpiScore: 53, riskLevel: 'Modéré' },
  ],
  aiBrief:
    "Igor Sechin présente un profil de risque extrêmement élevé. Désigné sur les listes OFAC, UE et UK en lien avec la situation en Ukraine, il est identifié comme un proche associé du président russe. L'analyse révèle une chaîne de propriété s'étendant de la Russie vers la Suisse et Chypre via des entités de trading et de services maritimes. La couverture médiatique récente (47 articles, dont 12 à haute pertinence) fait état d'allégations de contournement de sanctions via des flottes de navires et des structures offshore. Le risque juridictionnel est amplifié par l'exposition à la Russie (liste noire GAFI, CPI 26) et à Chypre (sous surveillance). Recommandation : vigilance renforcée requise pour toute interaction directe ou indirecte.",
};

export const GLENCORE_REPORT: InvestigationReport = {
  completedAt: '2026-03-10T09:00:00Z',
  riskScore: 78,
  riskLevel: 'Élevé',
  sanctions: {
    isSanctioned: false,
    programs: [],
    designationDate: '',
    reason: "Aucune désignation directe, mais plusieurs filiales et partenaires figurent sur des listes de surveillance.",
  },
  adverseMedia: {
    totalArticles: 83,
    highRelevance: 24,
    summary: [
      {
        source: 'The Guardian',
        date: '2025-12-01',
        title: 'Glencore pays $1.1bn in penalties over corruption charges',
        relevance: 'high',
        allegationType: 'Corruption',
      },
      {
        source: 'Bloomberg',
        date: '2025-10-18',
        title: 'Glencore Congo mining operations face new environmental scrutiny',
        relevance: 'high',
        allegationType: 'Environmental violations',
      },
      {
        source: 'Le Temps',
        date: '2025-07-12',
        title: 'Les liens troubles de Glencore avec des intermédiaires africains',
        relevance: 'medium',
        allegationType: 'Intermediary networks',
      },
    ],
  },
  uboChain: [
    { entity: 'Glencore plc', type: 'Organization', jurisdiction: 'Jersey', role: 'Parent Entity' },
    { entity: 'Glencore International AG', type: 'Organization', jurisdiction: 'Switzerland', role: 'Operating HQ', ownership: '100%' },
    { entity: 'Glencore Finance (Bermuda) Ltd', type: 'Organization', jurisdiction: 'Bermuda', role: 'Finance Arm', ownership: '100%' },
    { entity: 'Katanga Mining Ltd', type: 'Organization', jurisdiction: 'DRC', role: 'Mining Subsidiary', ownership: '86.3%' },
    { entity: 'Mopani Copper Mines plc', type: 'Organization', jurisdiction: 'Zambia', role: 'Mining Subsidiary', ownership: '73.1%' },
  ],
  jurisdictionalRisk: [
    { jurisdiction: 'Jersey', fatfStatus: 'Member (Crown Dependency)', cpiScore: 72, riskLevel: 'Modéré' },
    { jurisdiction: 'Switzerland', fatfStatus: 'Member', cpiScore: 82, riskLevel: 'Faible' },
    { jurisdiction: 'Bermuda', fatfStatus: 'Monitored Territory', cpiScore: 65, riskLevel: 'Modéré' },
    { jurisdiction: 'DRC', fatfStatus: 'Grey List (FATF)', cpiScore: 20, riskLevel: 'Très élevé' },
    { jurisdiction: 'Zambia', fatfStatus: 'Not Listed', cpiScore: 33, riskLevel: 'Élevé' },
  ],
  aiBrief:
    "Glencore International présente un profil de risque élevé principalement lié à des antécédents de corruption avérée, des opérations dans des juridictions à haut risque (RDC, Zambie) et une structure corporate complexe impliquant des entités dans des centres financiers offshore (Jersey, Bermudes). Bien que l'entreprise ne soit pas directement sous sanctions, les pénalités de 1,1 milliard de dollars payées en 2022 pour corruption au Nigeria, au Cameroun et en Côte d'Ivoire, ainsi que les enquêtes en cours, indiquent un risque de conformité significatif.",
  courtRecords: [
    {
      caseNumber: '1:22-cr-00297',
      court: 'U.S. District Court, Southern District of New York',
      jurisdiction: 'États-Unis',
      date: '2022-05-24',
      parties: 'United States v. Glencore International A.G.',
      summary: 'Plea of guilty to conspiracy to violate the FCPA and commodity price manipulation. Ordered to pay $700M in fines.',
    },
    {
      caseNumber: 'SFO/2019/0042',
      court: 'Southwark Crown Court',
      jurisdiction: 'Royaume-Uni',
      date: '2022-11-02',
      parties: 'R v. Glencore Energy UK Ltd',
      summary: 'Convicted of bribery offences in five African countries. Ordered to pay £280M.',
    },
  ],
  corporateRegistry: [
    {
      entityName: 'Glencore plc',
      registry: 'Jersey Financial Services Commission',
      jurisdiction: 'Jersey',
      status: 'Active',
      filingDate: '2013-05-02',
      directors: ['Gary Nagle (CEO)', 'Kalidas Madhavpeddi (Chairman)'],
    },
    {
      entityName: 'Glencore International AG',
      registry: 'Handelsregister Zug',
      jurisdiction: 'Switzerland',
      status: 'Active',
      filingDate: '1994-03-15',
      directors: ['Gary Nagle', 'John Burton'],
    },
  ],
  networkAnalysis:
    "La structure de Glencore révèle un réseau multinational typique des grandes maisons de négoce de matières premières. La holding de tête est enregistrée à Jersey (avantages fiscaux), les opérations sont centralisées en Suisse, le financement transite par les Bermudes, et les actifs miniers sont détenus via des filiales locales en RDC et en Zambie. Les arrangements de nominee directors sont minimes, mais la complexité de la chaîne de propriété (5+ niveaux) et l'utilisation de juridictions à faible transparence (Bermudes) constituent des indicateurs de risque structurel.",
  sourceLanguageMedia: [
    {
      originalLanguage: 'Russe',
      source: 'Kommersant',
      date: '2025-06-14',
      originalTitle: 'Глен­кор рас­ширя­ет при­сут­ствие в Ка­зах­стане',
      translatedSummary: "Glencore étend sa présence au Kazakhstan avec l'acquisition de droits miniers supplémentaires dans la région d'Aktobe.",
      relevance: 'medium',
    },
    {
      originalLanguage: 'Arabe',
      source: 'Al Jazeera',
      date: '2025-04-22',
      originalTitle: 'غلينكور تواجه اتهامات جديدة في أفريقيا',
      translatedSummary: "Glencore fait face à de nouvelles accusations de pratiques commerciales déloyales dans ses opérations en Afrique du Nord.",
      relevance: 'high',
    },
  ],
  analystConclusion: {
    analystName: 'Marie Dupont',
    analystTitle: 'Analyste Senior en Conformité',
    date: '2026-03-10',
    conclusion:
      "Après examen approfondi de l'ensemble des sources disponibles, je conclus que Glencore International présente un profil de risque ÉLEVÉ nécessitant une vigilance renforcée. Les antécédents judiciaires de corruption avérée, combinés à une structure corporate complexe utilisant des juridictions offshore et à des opérations significatives dans des pays à haut risque, justifient l'application de mesures de diligence renforcée (EDD) pour toute relation commerciale directe ou indirecte avec cette entité ou ses filiales.",
  },
};

// ---------------------------------------------------------------------------
// Pre-seeded mock orders
// ---------------------------------------------------------------------------

export const MOCK_ORDERS: Order[] = [
  {
    id: 'CG-INV-2026-0038',
    entity: { name: 'Igor Sechin', type: 'person', aliases: ['Игорь Сечин'] },
    tier: 'investigation',
    status: 'completed',
    jurisdictions: ['RU', 'CH', 'CY'],
    priorityAreas: ['UBO tracing', 'Adverse media analysis'],
    languages: [],
    specialInstructions: 'Focus sur les connexions avec Rosneft et les structures chypriotes.',
    price: 'Forfait Taskforce RDC',
    orderedAt: '2026-03-02T10:00:00Z',
    estimatedDelivery: '2026-03-04T10:00:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2026-03-02T10:00:00Z', label: 'Commande reçue' },
      { status: 'data_collection', timestamp: '2026-03-02T11:30:00Z', label: 'Collecte de données' },
      { status: 'analysis', timestamp: '2026-03-03T08:00:00Z', label: 'Analyse en cours' },
      { status: 'completed', timestamp: '2026-03-04T14:30:00Z', label: 'Rapport disponible' },
    ],
    report: SECHIN_REPORT,
  },
  {
    id: 'CG-DD-2026-0039',
    entity: { name: 'Glencore International', type: 'organization', aliases: ['Glencore plc', 'Glencore International AG'] },
    tier: 'due_diligence',
    status: 'analyst_review',
    jurisdictions: ['CH', 'JE', 'BM', 'CD', 'ZM'],
    priorityAreas: ['UBO tracing', 'Adverse media analysis', 'Corporate registry', 'Court records', 'Network analysis', 'Source-language media'],
    languages: ['ru', 'ar'],
    specialInstructions: 'Vérifier la structure BVI et les connexions africaines.',
    price: 'Forfait Taskforce RDC',
    orderedAt: '2026-03-04T09:00:00Z',
    estimatedDelivery: '2026-03-14T09:00:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2026-03-04T09:00:00Z', label: 'Commande reçue' },
      { status: 'data_collection', timestamp: '2026-03-04T14:00:00Z', label: 'Collecte de données' },
      { status: 'analysis', timestamp: '2026-03-06T08:00:00Z', label: 'Analyse en cours' },
      { status: 'analyst_review', timestamp: '2026-03-08T10:00:00Z', label: 'Revue analyste' },
    ],
    report: null,
  },
  {
    id: 'CG-INV-2026-0040',
    entity: { name: 'Alisher Usmanov', type: 'person', aliases: ['Алишер Усманов'] },
    tier: 'investigation',
    status: 'analysis',
    jurisdictions: ['RU', 'GB', 'UZ', 'LV'],
    priorityAreas: ['UBO tracing', 'Adverse media analysis'],
    languages: [],
    specialInstructions: '',
    price: 'Forfait Taskforce RDC',
    orderedAt: '2026-03-06T14:00:00Z',
    estimatedDelivery: '2026-03-08T14:00:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2026-03-06T14:00:00Z', label: 'Commande reçue' },
      { status: 'data_collection', timestamp: '2026-03-06T16:00:00Z', label: 'Collecte de données' },
      { status: 'analysis', timestamp: '2026-03-07T09:00:00Z', label: 'Analyse en cours' },
    ],
    report: null,
  },
  {
    id: 'CG-DD-2026-0041',
    entity: { name: 'Gazprom', type: 'organization', aliases: ['PAO Gazprom', 'ПАО Газпром'] },
    tier: 'due_diligence',
    status: 'data_collection',
    jurisdictions: ['RU', 'DE', 'NL', 'TR'],
    priorityAreas: ['UBO tracing', 'Adverse media analysis', 'Corporate registry', 'Court records', 'Network analysis'],
    languages: ['ru', 'de'],
    specialInstructions: 'Focus sur Nord Stream et les connexions allemandes.',
    price: 'Forfait Taskforce RDC',
    orderedAt: '2026-03-07T11:00:00Z',
    estimatedDelivery: '2026-03-17T11:00:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2026-03-07T11:00:00Z', label: 'Commande reçue' },
      { status: 'data_collection', timestamp: '2026-03-07T15:00:00Z', label: 'Collecte de données' },
    ],
    report: null,
  },
];
