/**
 * Shared API response contract for POST /api/novatech/inquiries.
 * Safe to import from client and server.
 */

export type InquiryApiSuccessData = {
  inquiryId: string;
  emailSent: boolean;
  selectedService: string;
};

export type InquiryApiSuccess = {
  success: true;
  data: InquiryApiSuccessData;
};

export type InquiryApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string>;
    /** Correlation id for support — never a stack or provider detail. */
    requestId?: string;
  };
};

export type InquiryApiResponse = InquiryApiSuccess | InquiryApiErrorBody;
