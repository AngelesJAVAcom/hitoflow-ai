export type InvoiceFormValues = {
  customerEmail: string;
  milestoneId: string;
  milestoneName: string;
  amount: number;
};

export type CreateInvoicePayload = {
  customerEmail: string;
  milestoneId: string;
};

export type InvoiceResult = {
  invoiceId: string;
  status: string;
  message: string;
  paymentUrl: string | null;
};

export type MilestoneOption = {
  id: string;
  projectName: string;
  name: string;
  amount: number;
  status: string;
  paymentStatus: string;
};

export type InvoiceRequestStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";
