export type CopilotIntent = 'create_po' | 'analyze' | 'explain' | 'execute' | 'unknown';

export interface ExtractedData {
  material?: string;
  quantity?: number;
  department?: string;
  vendor?: string;
}

export interface AnalysisData {
  title: string;
  metrics: { label: string; value: string }[];
  insights: string[];
  table: { vendor: string; onTime: string; rating: string }[];
}

export interface ExecuteData {
  title: string;
  transaction: string;
  description: string;
  fields: { label: string; value: string }[];
  notes?: string;
}

export interface CopilotResponse {
  message: string;
  intent: CopilotIntent;
  data?: ExtractedData;
  cardType?:
    | 'suggested_po'
    | 'missing_data'
    | 'alternative_vendors'
    | 'analysis'
    | 'execute_form'
    | 'none';
  missingFields?: string[];
  suggestedVendors?: string[];
  analysisData?: AnalysisData;
  executeData?: ExecuteData;
}

const conceptLibrary: Record<string, string> = {
  'purchase requisition':
    'A Purchase Requisition (PR) is an internal request to purchase goods or services. It can be created with ME51N and is often converted into a Purchase Order after approvals.',
  pr:
    'A PR is a Purchase Requisition. It represents a request from a requester or department to buy materials or services and is a key step in the P2P process.',
  'material master':
    'The Material Master stores all information about a material, including purchasing, inventory, accounting, and sales data. It is the central record for managing stock and procurement.',
  'vendor master':
    'The Vendor Master contains supplier information, payment terms, and purchasing data. In S/4HANA it may be stored in the Business Partner framework.',
  'info record':
    'An Info Record links a material and a vendor with pricing, delivery, and procurement conditions. It simplifies PO creation and ensures the correct supplier is selected.',
  plant:
    'A Plant is a location such as a factory, warehouse, or service center. It is used for inventory valuation, goods movement, and material availability.',
  'storage location':
    'A Storage Location is a subdivision within a plant that represents where materials are stored. It provides finer stock tracking and controls movement posting.',
  'purchasing org':
    'The Purchasing Organization negotiates with vendors and manages purchasing documents. It can be assigned to one or multiple plants or company codes depending on the sourcing model.',
  'goods receipt':
    'A Goods Receipt records the physical receipt of materials into inventory. It increases stock levels and usually posts accounting entries through the GR/IR account.',
  'goods issue':
    'A Goods Issue removes materials from inventory, typically for consumption, production, or delivery. It reduces stock and posts cost to an assigned account object.',
  'transfer posting':
    'A Transfer Posting moves stock between plants or storage locations without creating a procurement document. It changes stock type or location inside SAP inventory management.',
  miro:
    'MIRO is the Invoice Verification transaction. It posts vendor invoices against purchase orders and goods receipts, creating vendor liability and clearing GR/IR positions.',
  'procure-to-pay':
    'Procure-to-Pay (P2P) is the SAP MM cycle from Purchase Requisition through Purchase Order, Goods Receipt, and Invoice Verification to vendor payment.',
  'p2p':
    'P2P stands for Procure-to-Pay. It is the end-to-end process that starts with a business need and ends with payment to the supplier.'
};

const findConceptExplanation = (input: string): string | null => {
  const lowerInput = input.toLowerCase();
  const keys = Object.keys(conceptLibrary);
  const matchKey = keys.find((key) => lowerInput.includes(key));
  return matchKey ? conceptLibrary[matchKey] : null;
};

const extractPurchaseOrderDetails = (input: string): ExtractedData => {
  const materialMatch = input.match(/for\s+(\d+)\s+([a-zA-Z]+)/i);
  const deptMatch = input.match(/for\s+([a-zA-Z]+)\s+department/i);
  const vendorMatch = input.match(/from\s+([a-zA-Z0-9\s]+)/i);

  const quantity = materialMatch ? Number(materialMatch[1]) : undefined;
  const material = materialMatch ? materialMatch[2] : undefined;
  const department = deptMatch ? deptMatch[1].toUpperCase() : undefined;
  let vendor = vendorMatch ? vendorMatch[1].trim() : undefined;

  const vagueVendors = ['approved vendor', 'vendor', 'a vendor', 'the vendor'];
  if (vendor && vagueVendors.includes(vendor.toLowerCase())) {
    vendor = undefined;
  }

  return {
    material,
    quantity,
    department,
    vendor
  };
};

export const parseUserInput = (input: string): CopilotResponse => {
  const lowerInput = input.toLowerCase();

  if (/\b(hello|hi|hey|good morning|good afternoon)\b/.test(lowerInput)) {
    return {
      message:
        'Hello! I am your embedded SAP Joule AI. Ask me to Explain, Analyze, or Execute MM activities.',
      intent: 'unknown',
      cardType: 'none'
    };
  }

  const isExplainIntent = /\b(what is|explain|definition|shaboli|shar7|شرح|ما هو)\b/.test(lowerInput);
  const explanation = findConceptExplanation(lowerInput);
  if (isExplainIntent && explanation) {
    return {
      message: explanation,
      intent: 'explain',
      cardType: 'none'
    };
  }

  if (lowerInput.includes('analyze') || lowerInput.includes('insight') || lowerInput.includes('performance') || lowerInput.includes('report')) {
    return {
      message:
        'I analyzed recent procurement metrics and created a vendor performance summary for your review.',
      intent: 'analyze',
      cardType: 'analysis',
      analysisData: {
        title: 'Vendor Performance Dashboard',
        metrics: [
          { label: 'On-Time Delivery', value: '92%' },
          { label: 'Invoice Accuracy', value: '97%' },
          { label: 'PO Cycle Time', value: '4.2 days' }
        ],
        insights: [
          'TechSupply Inc. is the strongest performer with 96% on-time delivery.',
          'Three vendors show invoice discrepancy rates below 4%.',
          'Average PO cycle has improved by 8% compared to last quarter.'
        ],
        table: [
          { vendor: 'TechSupply Inc.', onTime: '96%', rating: 'A' },
          { vendor: 'Global Electronics', onTime: '91%', rating: 'B+' },
          { vendor: 'Prime IT Solutions', onTime: '89%', rating: 'B' }
        ]
      }
    };
  }

  const purchaseOrderRequest = /\b(create|open|execute|launch)\b.*\b(po|purchase order|me21n)\b/.test(lowerInput);
  const invoiceVerificationRequest = /\b(mi?ro|invoice verification|post invoice)\b/.test(lowerInput);
  const goodsMovementRequest = /\b(migo|goods receipt|goods issue|transfer posting)\b/.test(lowerInput);

  if (purchaseOrderRequest) {
    const data = extractPurchaseOrderDetails(input);
    const missingFields = [] as string[];
    if (!data.quantity) missingFields.push('Quantity');
    if (!data.material) missingFields.push('Material');
    if (!data.vendor) missingFields.push('Vendor');

    if (missingFields.length === 1 && missingFields[0] === 'Vendor' && data.material) {
      return {
        message: `I found ${data.quantity || 'a'} ${data.material || 'material'} request. Please choose one of these approved vendors:`,
        intent: 'create_po',
        data,
        cardType: 'alternative_vendors',
        suggestedVendors: ['TechSupply Inc.', 'Global Electronics', 'Prime IT Solutions']
      };
    }

    if (missingFields.length > 0) {
      return {
        message: `To simulate this Purchase Order, I need: **${missingFields.join(', ')}**.`,
        intent: 'create_po',
        data,
        cardType: 'missing_data',
        missingFields
      };
    }

    return {
      message:
        'I prepared a mock Purchase Order execution card for ME21N. Review the fields and launch the transaction.',
      intent: 'create_po',
      data,
      cardType: 'execute_form',
      executeData: {
        title: 'Purchase Order Execution',
        transaction: 'ME21N',
        description: 'Simulated creation of a purchase order with the requested details.',
        fields: [
          { label: 'Material', value: data.material || 'N/A' },
          { label: 'Quantity', value: `${data.quantity || 0}` },
          { label: 'Vendor', value: data.vendor || 'Pending' },
          { label: 'Department', value: data.department || 'N/A' }
        ],
        notes: 'This is a mock execution; no real SAP system is affected.'
      }
    };
  }

  if (invoiceVerificationRequest) {
    return {
      message:
        'I can simulate the MIRO invoice verification flow. Review the mock invoice fields below and launch the transaction.',
      intent: 'execute',
      cardType: 'execute_form',
      executeData: {
        title: 'Invoice Verification Execution',
        transaction: 'MIRO',
        description:
          'Simulated invoice posting for a purchase order receipt. Verify quantity and invoice amount before posting.',
        fields: [
          { label: 'PO Number', value: '4500021342' },
          { label: 'Invoice Amount', value: '€18,340.00' },
          { label: 'Vendor', value: 'TechSupply Inc.' },
          { label: 'GR/IR Clearing', value: 'Pending' }
        ],
        notes: 'Simulated response for logistics invoice verification.'
      }
    };
  }

  if (goodsMovementRequest) {
    return {
      message:
        'I can simulate a Goods Movement in MIGO. Choose the movement type and then launch the mock transaction.',
      intent: 'execute',
      cardType: 'execute_form',
      executeData: {
        title: 'Goods Movement Simulation',
        transaction: 'MIGO',
        description:
          'Render a mock goods movement form that demonstrates GR, GI, or transfer posting behavior in SAP MM.',
        fields: [
          { label: 'Movement Type', value: '101 / 201 / 301' },
          { label: 'Material', value: 'ABC-1001' },
          { label: 'Quantity', value: '120' },
          { label: 'Plant', value: '1000' }
        ],
        notes: 'Choose the correct movement type for your scenario when in the actual SAP system.'
      }
    };
  }

  const conceptExplanation = findConceptExplanation(lowerInput);
  if (conceptExplanation) {
    return {
      message: conceptExplanation,
      intent: 'explain',
      cardType: 'none'
    };
  }

  return {
    message:
      'I am your SAP MM Copilot. You can ask me to explain concepts, analyze procurement data, or execute mock transactions like ME21N, MIGO, or MIRO.',
    intent: 'unknown',
    cardType: 'none'
  };
};
