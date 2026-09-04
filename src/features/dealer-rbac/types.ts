export type PortalPermission = {
  key: string;
  name: string;
  action: "view" | "edit" | "manage" | "create" | "delete" | "export";
};

export type PortalModule = {
  key: string;
  name: string;
  sortOrder: number;
  permissions: PortalPermission[];
};

export type PortalRole = {
  id: string;
  key: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isSuperRole: boolean;
  isActive: boolean;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type PortalRoleInput = {
  key?: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
};

export type PortalRoleListParams = {
  q?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
};

export type PortalRolePageData = {
  list: {
    items: PortalRole[];
    total: number;
    page: number;
    pageSize: number;
  };
};

export const DEFAULT_ROLE_PAGE_SIZE = 10;
