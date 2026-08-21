export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  KycList: undefined;
  KycDetail: {
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    kycProfile: {
      status: string;
      accountType: string;
      submittedAt: string | null;
      rejectReason: string | null;
    };
    documents: { id: string; documentType: string; documentUrl: string }[];
  };
  OrderList: { initialStatus?: string } | undefined;
  OrderDetail: { orderId: string };
  ProductList: undefined;
  ProductForm: {
    productId?: string;
    name?: string;
    metal?: 'GOLD' | 'SILVER';
    premiumPerGram?: string;
    minQuantityGrams?: number;
    unitSizeGrams?: number | null;
    quantityPresetsGrams?: number[] | null;
    subtitle?: string | null;
    isActive?: boolean;
  } | undefined;
  UserList: undefined;
  UserDetail: { userId: string };
  Settings: undefined;
  AuditLog: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
