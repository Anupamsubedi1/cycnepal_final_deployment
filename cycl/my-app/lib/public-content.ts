export type NoticeItem = {
  id: string;
  title: string;
  shortDescription: string;
  details: string;
  publishedAt: string;
  expiresAt?: string;
  isActive: boolean;
};

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  details: string;
  category: string;
  publishedAt: string;
  publishedAtNepali?: string;
  author: string;
  image?: string;
  translations?: {
    en?: {
      title?: string;
      summary?: string;
      details?: string;
    };
    ne?: {
      title?: string;
      summary?: string;
      details?: string;
    };
  };
};

export type LeaderProfile = {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
};

export type LoanCategory = {
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  principalRange: string;
  annualRate: number;
  tenureMonths: {
    min: number;
    max: number;
  };
  processingFee: string;
  repaymentModes: string[];
  features: string[];
  eligibility: string[];
  requiredDocuments: string[];
};

export type LoanInterestRateRow = {
  id: string;
  loanType: string;
  annualRate: number;
  tenure: string;
  processingFee: string;
  effectiveFrom: string;
};

export type SavingsRateSlab = {
  id: string;
  balanceRange: string;
  interestRate: number;
  compounding: string;
};

export type SavingsProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  minimumBalance: string;
  withdrawalRule: string;
  targetAudience: string;
  benefits: string[];
  rateSlabs: SavingsRateSlab[];
};

export type ReportAttachment = {
  id: string;
  title: string;
  period: string;
  publishedAt: string;
  fileType: "PDF" | "XLSX" | "DOC";
  fileSize: string;
  downloadUrl: string;
};

export type BaseRateRow = {
  id: string;
  effectiveDate: string;
  baseRate: number;
  spreadRate: number;
  finalRate: number;
};

export type BranchEntry = {
  id: string;
  branchName: string;
  address: string;
  phone: string;
  email: string;
  mapLink: string;
};

export type ProvinceBranchGroup = {
  id: string;
  province: string;
  branches: BranchEntry[];
};

export const aboutCompanyProfile = {
  heading: "Building Inclusive Financial Strength Across Nepal",
  overview:
    "CYC Nepal Laghubitta Bittiya Sanstha Ltd. partners with underserved communities through responsible microfinance, financial literacy, and enterprise support programs.",
  vision:
    "To be a social financial institution that contributes to poverty reduction in Nepal by helping people become socially aware, increase entrepreneurship, and become financially self-reliant.",
  mission:
    "To provide financial services, financial awareness, and social awareness to the people in financially unserved areas of Nepal in an easy and sustainable manner.",
  goals: [
    "Provide financial services to people by expanding services to remote areas of Nepal.",
    "Transform financial awareness, entrepreneurship, and livelihood skills for people in rural areas.",
    "Develop a well-managed, sustainable, and technically capable institution with highly motivated and skillful human resources.",
    "Help poor families increase their income by involving women in income-generating activities.",
  ],
  objectives: [
    "Deliver compliant, customer-friendly lending and savings products.",
    "Improve financial literacy and business coaching for clients.",
    "Maintain strong governance and social performance standards.",
    "Promote long-term community impact through local partnerships.",
  ],
};

export const chairmanMessage = {
  name: "Padhmanath Sharma",
  title: "Chairman",
  message:
    "It gives me great pleasure to share a few words on behalf of CYC Nepal Laghubitta Bittiya Sanstha Ltd.\n\nSince our establishment in 2019, we have remained committed to empowering low-income households and underserved communities across the hilly and mountainous regions of Nepal. Our journey began with a clear vision to provide accessible financial services that create real opportunities for those who need them most. Today, with our expanding network of branches and dedicated team, we are proud to support thousands of families in improving their livelihoods.\n\nAt CYC Nepal Laghubitta, we believe that financial inclusion is not just about providing loans and savings facilities. It is about building confidence, encouraging entrepreneurship, and creating sustainable income-generating opportunities. Alongside our financial services, we continue to promote social awareness, education, skill development, and cultural values within the communities we serve.\n\nOur progress would not have been possible without the trust of our clients, the dedication of our staff, and the continuous support of our stakeholders. We remain committed to strengthening this trust by maintaining transparency, accountability, and responsible banking practices.\n\nAs we move forward, we will continue to expand our outreach, enhance service quality, and contribute meaningfully to the economic and social development of Nepal.\n\nThank you for your continued trust and support.",
};

export const boardOfDirectors: LeaderProfile[] = [
  {
    id: "director-1",
    name: "Ramesh Prasad Gautam",
    title: "Chairman",
    bio: "Leads strategic governance and long-term institutional sustainability initiatives.",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "director-2",
    name: "Anita Shrestha",
    title: "Independent Director",
    bio: "Advises on risk, compliance, and policy-level oversight across operations.",
    photoUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "director-3",
    name: "Kiran Bahadur Thapa",
    title: "Director",
    bio: "Supports branch expansion strategy and institutional partnerships.",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "director-4",
    name: "Mina Karki",
    title: "Director",
    bio: "Focuses on social impact evaluation and women-centered product development.",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  },
];

export const managementTeam: LeaderProfile[] = [
  {
    id: "management-1",
    name: "Prakash Neupane",
    title: "Chief Executive Officer",
    bio: "Oversees nationwide operations, strategic planning, and client service performance.",
    photoUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "management-2",
    name: "Sita Bhatta",
    title: "Chief Operating Officer",
    bio: "Drives branch efficiency, process automation, and service quality control.",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "management-3",
    name: "Bikash Adhikari",
    title: "Chief Finance Officer",
    bio: "Leads treasury, compliance reporting, and sustainable capital planning.",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "management-4",
    name: "Sunita Paudel",
    title: "Head of Credit and Risk",
    bio: "Monitors credit quality and portfolio health across all provinces.",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  },
];

export const loanCategories: LoanCategory[] = [
  {
    slug: "micro-enterprise-loan",
    name: "Micro Enterprise Loan",
    shortDescription:
      "Funding support for small and growing local businesses with flexible repayment.",
    fullDescription:
      "Designed for entrepreneurs running retail, service, and production units, this product offers accessible working capital and asset purchase financing with practical repayment cycles.",
    principalRange: "NPR 100,000 to NPR 2,000,000",
    annualRate: 13.25,
    tenureMonths: {
      min: 12,
      max: 60,
    },
    processingFee: "1.00% of sanctioned amount",
    repaymentModes: ["Monthly EMI", "Quarterly installment"],
    features: [
      "Top-up facility for eligible repeat clients",
      "Business monitoring support from branch officers",
      "Early settlement with reduced service charge",
    ],
    eligibility: [
      "Business operating for at least 12 months",
      "Stable income and repayment capacity",
      "Positive internal credit screening result",
    ],
    requiredDocuments: [
      "Citizenship copy",
      "Business registration or ward recommendation",
      "Recent passport-size photographs",
      "Collateral or group guarantee documents",
    ],
  },
  {
    slug: "agriculture-loan",
    name: "Agriculture and Livestock Loan",
    shortDescription:
      "Seasonal and term financing for crop, livestock, and agri value-chain activities.",
    fullDescription:
      "This product supports farmers, agri cooperatives, and livestock operators for production cycles, infrastructure upgrades, and supply chain expansion.",
    principalRange: "NPR 80,000 to NPR 1,500,000",
    annualRate: 12.5,
    tenureMonths: {
      min: 6,
      max: 48,
    },
    processingFee: "0.75% of sanctioned amount",
    repaymentModes: ["Seasonal installment", "Monthly EMI"],
    features: [
      "Flexible grace period based on crop cycle",
      "Suitable for dairy, poultry, and farm mechanization",
      "Dedicated branch-level agriculture loan support",
    ],
    eligibility: [
      "Farmer group or individual with valid operation evidence",
      "Repayment ability based on projected yield/income",
      "Basic technical assessment clearance",
    ],
    requiredDocuments: [
      "Citizenship copy",
      "Land/lease proof or farm operation documents",
      "Project estimate and expected income plan",
      "Photographs and recommendation letter",
    ],
  },
  {
    slug: "group-business-loan",
    name: "Group Business Loan",
    shortDescription:
      "Joint-liability based credit for community members operating income activities.",
    fullDescription:
      "Built for client groups and clusters, this loan helps women and community entrepreneurs finance small enterprises with peer-supported repayment discipline.",
    principalRange: "NPR 40,000 to NPR 600,000",
    annualRate: 14,
    tenureMonths: {
      min: 6,
      max: 36,
    },
    processingFee: "0.50% of sanctioned amount",
    repaymentModes: ["Monthly installment", "Fortnightly installment"],
    features: [
      "Fast approval for repeat groups with clean repayment history",
      "No complex collateral requirement for small-ticket loans",
      "Financial literacy session included",
    ],
    eligibility: [
      "Member of registered client group",
      "Minimum six months group participation",
      "Good repayment behavior in internal records",
    ],
    requiredDocuments: [
      "Citizenship copy",
      "Group recommendation letter",
      "Recent photographs",
      "Activity/income declaration form",
    ],
  },
];

export const loanInterestRates: LoanInterestRateRow[] = [
  {
    id: "loan-rate-1",
    loanType: "Micro Enterprise Loan",
    annualRate: 13.25,
    tenure: "12 to 60 months",
    processingFee: "1.00%",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "loan-rate-2",
    loanType: "Agriculture and Livestock Loan",
    annualRate: 12.5,
    tenure: "6 to 48 months",
    processingFee: "0.75%",
    effectiveFrom: "2026-01-01",
  },
  {
    id: "loan-rate-3",
    loanType: "Group Business Loan",
    annualRate: 14,
    tenure: "6 to 36 months",
    processingFee: "0.50%",
    effectiveFrom: "2026-01-01",
  },
];

export const savingsProducts: SavingsProduct[] = [
  {
    slug: "regular-savings",
    name: "Regular Savings",
    shortDescription:
      "Everyday savings account for daily transactions and progressive balance growth.",
    fullDescription:
      "A flexible savings product suitable for individual clients and households looking for liquidity, security, and steady interest earnings.",
    minimumBalance: "NPR 500",
    withdrawalRule: "Up to 4 free withdrawals per month",
    targetAudience: "General individual and household clients",
    benefits: [
      "No hidden maintenance fee",
      "SMS alerts for key transactions",
      "Mobile and branch banking support",
    ],
    rateSlabs: [
      {
        id: "regular-slab-1",
        balanceRange: "Below NPR 50,000",
        interestRate: 5,
        compounding: "Quarterly",
      },
      {
        id: "regular-slab-2",
        balanceRange: "NPR 50,000 to NPR 300,000",
        interestRate: 5.5,
        compounding: "Quarterly",
      },
      {
        id: "regular-slab-3",
        balanceRange: "Above NPR 300,000",
        interestRate: 6,
        compounding: "Quarterly",
      },
    ],
  },
  {
    slug: "fixed-deposit",
    name: "Fixed Deposit",
    shortDescription:
      "High-yield fixed tenure deposits for stable returns and future planning.",
    fullDescription:
      "This product offers assured returns on lump-sum deposits with multiple tenure options for education, business, and long-term savings goals.",
    minimumBalance: "NPR 25,000",
    withdrawalRule: "Premature closure allowed with revised interest policy",
    targetAudience: "Clients seeking long-term guaranteed returns",
    benefits: [
      "Higher rates than regular savings",
      "Auto-renewal option available",
      "Nomination facility for family security",
    ],
    rateSlabs: [
      {
        id: "fd-slab-1",
        balanceRange: "6 to 12 months tenure",
        interestRate: 8,
        compounding: "On maturity",
      },
      {
        id: "fd-slab-2",
        balanceRange: "13 to 24 months tenure",
        interestRate: 8.5,
        compounding: "On maturity",
      },
      {
        id: "fd-slab-3",
        balanceRange: "25 to 60 months tenure",
        interestRate: 9,
        compounding: "On maturity",
      },
    ],
  },
  {
    slug: "recurring-savings",
    name: "Recurring Savings",
    shortDescription:
      "Monthly contribution-based savings account for disciplined goal achievement.",
    fullDescription:
      "Ideal for salaried and self-employed clients who prefer automated monthly savings with attractive maturity returns.",
    minimumBalance: "NPR 1,000 monthly installment",
    withdrawalRule: "No withdrawal before maturity except emergency policy",
    targetAudience: "Clients with monthly income and goal-based savings plans",
    benefits: [
      "Fixed monthly installment options",
      "Loan facility against accumulated savings",
      "Maturity bonus for uninterrupted deposits",
    ],
    rateSlabs: [
      {
        id: "rd-slab-1",
        balanceRange: "12 months plan",
        interestRate: 7,
        compounding: "On maturity",
      },
      {
        id: "rd-slab-2",
        balanceRange: "24 months plan",
        interestRate: 7.5,
        compounding: "On maturity",
      },
      {
        id: "rd-slab-3",
        balanceRange: "36 months plan",
        interestRate: 8,
        compounding: "On maturity",
      },
    ],
  },
];

export const baseRateRows: BaseRateRow[] = [
  {
    id: "base-rate-1",
    effectiveDate: "2026-04-01",
    baseRate: 8.1,
    spreadRate: 3.2,
    finalRate: 11.3,
  },
  {
    id: "base-rate-2",
    effectiveDate: "2026-01-01",
    baseRate: 8.4,
    spreadRate: 3.1,
    finalRate: 11.5,
  },
  {
    id: "base-rate-3",
    effectiveDate: "2025-10-01",
    baseRate: 8.7,
    spreadRate: 3.2,
    finalRate: 11.9,
  },
  {
    id: "base-rate-4",
    effectiveDate: "2025-07-01",
    baseRate: 8.9,
    spreadRate: 3.3,
    finalRate: 12.2,
  },
];

export const annualReports: ReportAttachment[] = [
  {
    id: "annual-2025",
    title: "Annual Report 2025",
    period: "FY 2081/82",
    publishedAt: "2026-03-12",
    fileType: "PDF",
    fileSize: "8.2 MB",
    downloadUrl: "#",
  },
  {
    id: "annual-2024",
    title: "Annual Report 2024",
    period: "FY 2080/81",
    publishedAt: "2025-03-20",
    fileType: "PDF",
    fileSize: "7.7 MB",
    downloadUrl: "#",
  },
  {
    id: "annual-governance-2025",
    title: "Corporate Governance Disclosure 2025",
    period: "FY 2081/82",
    publishedAt: "2026-03-18",
    fileType: "PDF",
    fileSize: "2.4 MB",
    downloadUrl: "#",
  },
  {
    id: "annual-financial-2025",
    title: "Audited Financial Statement 2025",
    period: "FY 2081/82",
    publishedAt: "2026-03-10",
    fileType: "XLSX",
    fileSize: "1.1 MB",
    downloadUrl: "#",
  },
];

export const quarterlyReports: ReportAttachment[] = [
  {
    id: "q3-2026",
    title: "Third Quarter Report",
    period: "Q3 FY 2082/83",
    publishedAt: "2026-04-15",
    fileType: "PDF",
    fileSize: "3.1 MB",
    downloadUrl: "#",
  },
  {
    id: "q2-2026",
    title: "Second Quarter Report",
    period: "Q2 FY 2082/83",
    publishedAt: "2026-01-15",
    fileType: "PDF",
    fileSize: "2.8 MB",
    downloadUrl: "#",
  },
  {
    id: "q1-2026",
    title: "First Quarter Report",
    period: "Q1 FY 2082/83",
    publishedAt: "2025-10-16",
    fileType: "PDF",
    fileSize: "2.7 MB",
    downloadUrl: "#",
  },
  {
    id: "q4-2025",
    title: "Fourth Quarter Report",
    period: "Q4 FY 2081/82",
    publishedAt: "2025-07-14",
    fileType: "PDF",
    fileSize: "2.9 MB",
    downloadUrl: "#",
  },
  {
    id: "q3-2025",
    title: "Third Quarter Portfolio Summary",
    period: "Q3 FY 2081/82",
    publishedAt: "2025-04-12",
    fileType: "XLSX",
    fileSize: "0.9 MB",
    downloadUrl: "#",
  },
  {
    id: "q2-2025",
    title: "Second Quarter Compliance Brief",
    period: "Q2 FY 2081/82",
    publishedAt: "2025-01-15",
    fileType: "DOC",
    fileSize: "0.6 MB",
    downloadUrl: "#",
  },
];

import fs from "fs";
import path from "path";

function resolveNewsImage(primaryFileName: string, fallback: string) {
  try {
    const p = path.join(process.cwd(), "public", "news", primaryFileName);
    if (fs.existsSync(p)) return `/news/${primaryFileName}`;
  } catch (e) {
    // ignore
  }
  return fallback;
}

export const newsItems: NewsItem[] = [
  {
    id: "news-1",
    title: "CYC Launches Financial Literacy Bootcamp in Gandaki",
    summary:
      "A three-week outreach initiative will train women entrepreneurs on budgeting and working capital planning.",
    details:
      "The program includes branch-level workshops, mentor sessions, and practical templates for household accounting and small business cashflow monitoring.",
    category: "Community",
    publishedAt: "2026-04-20",
    author: "Corporate Communications",
    image: "/news-images/news-1.jpeg",
    translations: {
      ne: {
        title: "गण्डकीमा सिवाईसीले वित्तीय साक्षरता बुटक्याम्प सुरु गर्‍यो",
        summary: "तीन हप्ताको अभियानले महिला उद्यमीहरूलाई बजेट व्यवस्थापन र चालु पूँजी योजना बनाउन तालिम दिनेछ।",
        details: "कार्यक्रममा शाखा-स्तरका कार्यशाला, मार्गदर्शन सत्र, र घरेलु हिसाबकिताब तथा साना व्यवसायको नगद प्रवाह अनुगमनका लागि उपयोगी नमूना ढाँचाहरू समावेश छन्।",
      },
    },
  },
  {
    id: "news-2",
    title: "Digital Loan Tracking Dashboard Rolled Out Across 7 Provinces",
    summary:
      "Real-time branch dashboard improves turnaround time and improves credit quality checks.",
    details:
      "The platform provides district-level portfolio visibility, overdue alerts, and service benchmarking to support branch operations and client servicing.",
    category: "Technology",
    publishedAt: "2026-03-22",
    author: "IT and Operations",
    image: "/news-images/news-2.jpeg",
    translations: {
      ne: {
        title: "७ प्रदेशमा डिजिटल ऋण ट्र्याकिङ ड्यासबोर्ड लागू",
        summary: "वास्तविक-समय शाखा ड्यासबोर्डले कार्यसम्पादन समय घटाउन र ऋण गुणस्तर जाँच सुधार गर्न सहयोग गर्छ।",
        details: "यो प्लेटफर्मले जिल्ला-स्तरको पोर्टफोलियो दृश्यता, बक्यौता अलर्ट, र शाखा सञ्चालन तथा ग्राहक सेवाको समन्वयका लागि सेवा तुलना सुविधा प्रदान गर्छ।",
      },
    },
  },
  {
    id: "news-3",
    title: "Partnership Signed for Rural Entrepreneurship Incubation",
    summary:
      "CYC and local municipalities collaborate to support youth-led enterprises.",
    details:
      "The partnership introduces training, market linkage, and advisory support for first-time borrowers and early-stage business owners.",
    category: "Partnership",
    publishedAt: "2026-02-12",
    author: "Strategy Office",
    image: "/news-images/news-3.jpeg",
    translations: {
      ne: {
        title: "ग्रामीण उद्यमशीलता इन्क्युबेसनका लागि साझेदारी सम्झौता",
        summary: "सिवाईसी र स्थानीय पालिकाहरूले युवाको नेतृत्वमा रहेका उद्यमहरूलाई सहयोग गर्न सहकार्य गरेका छन्।",
        details: "यस साझेदारीले पहिलो पटक ऋण लिनेहरू र प्रारम्भिक चरणका व्यवसायीहरूका लागि तालिम, बजारसँग जोडिने अवसर, र परामर्श सहयोग सुरु गर्छ।",
      },
    },
  },
];

export const noticeItems: NoticeItem[] = [
  {
    id: "notice-1",
    title: "Branch Service Update During Public Holiday",
    shortDescription:
      "Selected branches will operate from 10:00 AM to 2:00 PM during the upcoming holiday period.",
    details:
      "During the national holiday week, designated branches in district centers will remain open for essential savings and repayment services. Customers are requested to check branch-level schedules before visiting.",
    publishedAt: "2026-04-21",
    expiresAt: "2026-05-05",
    isActive: true,
  },
  {
    id: "notice-2",
    title: "Revised Interest Rates Effective from Jestha 2083",
    shortDescription:
      "Updated lending and savings rates are now available on Loans and Savings pages.",
    details:
      "CYC Nepal has revised product-level rates based on market movement and regulatory guidance. Existing clients will receive branch communication regarding product-specific applicability.",
    publishedAt: "2026-04-12",
    expiresAt: "2026-05-20",
    isActive: true,
  },
  {
    id: "notice-3",
    title: "Mandatory KYC Update Reminder",
    shortDescription:
      "Clients are requested to update KYC details at nearest branch by Ashadh 2083.",
    details:
      "To maintain service continuity and regulatory compliance, clients must submit updated identification, current address details, and recent photographs where required.",
    publishedAt: "2026-03-01",
    expiresAt: "2026-04-10",
    isActive: false,
  },
];

export const branchDirectoryByProvince: ProvinceBranchGroup[] = [
  {
    id: "province-koshi",
    province: "Koshi Province",
    branches: [
      {
        id: "koshi-1",
        branchName: "Biratnagar Branch",
        address: "Main Road, Biratnagar-4, Morang",
        phone: "+977-21-555001",
        email: "biratnagar@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Biratnagar+Branch",
      },
      {
        id: "koshi-2",
        branchName: "Dharan Branch",
        address: "Putali Line, Dharan-12, Sunsari",
        phone: "+977-25-520450",
        email: "dharan@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Dharan+Branch",
      },
    ],
  },
  {
    id: "province-madhesh",
    province: "Madhesh Province",
    branches: [
      {
        id: "madhesh-1",
        branchName: "Janakpur Branch",
        address: "Ramanand Chowk, Janakpur-2, Dhanusha",
        phone: "+977-41-530910",
        email: "janakpur@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Janakpur+Branch",
      },
      {
        id: "madhesh-2",
        branchName: "Birgunj Branch",
        address: "Adarshnagar, Birgunj-10, Parsa",
        phone: "+977-51-570422",
        email: "birgunj@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Birgunj+Branch",
      },
    ],
  },
  {
    id: "province-bagmati",
    province: "Bagmati Province",
    branches: [
      {
        id: "bagmati-1",
        branchName: "Kathmandu Service Branch",
        address: "New Baneshwor, Kathmandu-10",
        phone: "+977-1-5351122",
        email: "ktm@cycnepal.com",
        mapLink: "https://maps.google.com/?q=New+Baneshwor+Kathmandu",
      },
      {
        id: "bagmati-2",
        branchName: "Hetauda Branch",
        address: "School Road, Hetauda-4, Makwanpur",
        phone: "+977-57-590041",
        email: "hetauda@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Hetauda+Branch",
      },
    ],
  },
  {
    id: "province-gandaki",
    province: "Gandaki Province",
    branches: [
      {
        id: "gandaki-1",
        branchName: "Pokhara Head Office Branch",
        address: "Sabhagriha Chowk, Pokhara-9, Kaski",
        phone: "+977-61-590894",
        email: "pokhara@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Sabhagriha+Chowk+Pokhara",
      },
      {
        id: "gandaki-2",
        branchName: "Baglung Branch",
        address: "Samikshalaya Road, Baglung-2",
        phone: "+977-68-522120",
        email: "baglung@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Baglung+Branch",
      },
    ],
  },
  {
    id: "province-lumbini",
    province: "Lumbini Province",
    branches: [
      {
        id: "lumbini-1",
        branchName: "Butwal Branch",
        address: "Traffic Chowk, Butwal-10, Rupandehi",
        phone: "+977-71-547812",
        email: "butwal@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Butwal+Branch",
      },
      {
        id: "lumbini-2",
        branchName: "Nepalgunj Branch",
        address: "Tribhuvan Chowk, Nepalgunj-8, Banke",
        phone: "+977-81-540730",
        email: "nepalgunj@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Nepalgunj+Branch",
      },
    ],
  },
  {
    id: "province-karnali",
    province: "Karnali Province",
    branches: [
      {
        id: "karnali-1",
        branchName: "Surkhet Branch",
        address: "Birendranagar-6, Surkhet",
        phone: "+977-83-525901",
        email: "surkhet@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Surkhet+Branch",
      },
      {
        id: "karnali-2",
        branchName: "Dailekh Service Center",
        address: "Narayan Municipality-1, Dailekh",
        phone: "+977-89-410223",
        email: "dailekh@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Dailekh+Service+Center",
      },
    ],
  },
  {
    id: "province-sudurpashchim",
    province: "Sudurpashchim Province",
    branches: [
      {
        id: "sudur-1",
        branchName: "Dhangadhi Branch",
        address: "Campus Road, Dhangadhi-4, Kailali",
        phone: "+977-91-552633",
        email: "dhangadhi@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Dhangadhi+Branch",
      },
      {
        id: "sudur-2",
        branchName: "Mahendranagar Branch",
        address: "Bhimdatta-5, Kanchanpur",
        phone: "+977-99-520877",
        email: "mahendranagar@cycnepal.com",
        mapLink: "https://maps.google.com/?q=Mahendranagar+Branch",
      },
    ],
  },
];

export const contactDirectory = {
  headOffice: "Sabhagriha Chowk, Pokhara-9, Kaski, Nepal",
  phone: "+977-61-590894, +977-61-590895",
  email: "info@cycnlbsl.org.np",
  supportHours: "Sunday to Friday, 10:00 AM to 5:00 PM",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28127.18013052863!2d83.9456963743164!3d28.210426100000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39960936f19c126d%3A0xdb76cf9b181d026e!2sCyc%20Nepal%20Laghubitta%20Bittiya%20Sanstha%20Ltd.!5e0!3m2!1sen!2snp!4v1777308756052!5m2!1sen!2snp",
  socialLinks: [
    {
      id: "facebook",
      label: "<FaSquareFacebook />",
      href: "https://www.facebook.com",
    },
    {
      id: "linkedin",
      label: "<FaLinkedinIn />",
      href: "https://www.linkedin.com",
    },
    {
      id: "youtube",
      label: "<FaYoutube />",
      href: "https://www.youtube.com",
    },
  ],
};

const byLatest = <T extends { publishedAt: string }>(items: T[]) => {
  return [...items].sort((a, b) => {
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
};

export function getLoanBySlug(slug: string) {
  return loanCategories.find((category) => category.slug === slug) || null;
}

export function getSavingsBySlug(slug: string) {
  return savingsProducts.find((product) => product.slug === slug) || null;
}

export function getSortedNewsItems() {
  return byLatest(newsItems);
}

export function getSortedNoticeItems() {
  return byLatest(noticeItems);
}

export function getActiveNoticeItems(currentDate: Date = new Date()) {
  return getSortedNoticeItems().filter((notice) => {
    const published = new Date(notice.publishedAt).getTime();
    const expires = notice.expiresAt
      ? new Date(notice.expiresAt).getTime()
      : Number.POSITIVE_INFINITY;

    return notice.isActive && published <= currentDate.getTime() && expires >= currentDate.getTime();
  });
}
