export interface ICertificate {
  certificateId: string;
  donationId: string;
  donor: {
    name: string;
    blood_type: string;
    email: string;
  };
  campaign: {
    name: string;
    location: string;
    address: string;
  };
  donationDetails: {
    date: string;
    scheduledDate: string;
    quantityMl: number;
  };
  generatedAt: string;
}
