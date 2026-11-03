export type InvoiceFormValues = {
  customerEmail: string;
  milestoneName: string;
  amount: string;
};

export type CreateInvoicePayload = {
  customerEmail: string;
  milestoneName: string;
  amount: number;
};

export type InvoiceResult = {
  invoiceId: string;
  status: string;
  message: string;
};

export type InvoiceRequestStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";