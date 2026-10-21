import { getAccessToken } from '../firebase';

export interface GoogleContact {
  resourceName: string;
  etag?: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
  organization?: string;
}

export interface CreateContactParams {
  givenName: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
}

class GoogleContactsService {
  /**
   * Fetches Google Contacts connections list using People API v1
   */
  public async listContacts(pageSize = 100): Promise<GoogleContact[]> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('يُرجى تسجيل الدخول بحساب Google أولاً للوصول إلى جهات الاتصال.');
    }

    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,photos,organizations');
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set('sortOrder', 'FIRST_NAME_ASCENDING');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`تعذر جلب جهات الاتصال: ${msg}`);
    }

    const data = await res.json();
    const connections: unknown[] = data.connections || [];

    return connections.map((conn: any): GoogleContact => {
      const nameObj = conn.names?.[0];
      const emailObj = conn.emailAddresses?.[0];
      const phoneObj = conn.phoneNumbers?.[0];
      const photoObj = conn.photos?.[0];
      const orgObj = conn.organizations?.[0];

      return {
        resourceName: conn.resourceName,
        etag: conn.etag,
        displayName: nameObj?.displayName || nameObj?.givenName || emailObj?.value || 'جهة اتصال بدون اسم',
        givenName: nameObj?.givenName,
        familyName: nameObj?.familyName,
        email: emailObj?.value,
        phoneNumber: phoneObj?.value || phoneObj?.canonicalForm,
        photoUrl: photoObj?.url,
        organization: orgObj?.name || orgObj?.title,
      };
    });
  }

  /**
   * Searches Google Contacts by text query
   */
  public async searchContacts(query: string): Promise<GoogleContact[]> {
    if (!query.trim()) return this.listContacts();

    const token = await getAccessToken();
    if (!token) {
      throw new Error('يُرجى تسجيل الدخول بحساب Google أولاً.');
    }

    const url = new URL('https://people.googleapis.com/v1/people:searchContacts');
    url.searchParams.set('query', query.trim());
    url.searchParams.set('readMask', 'names,emailAddresses,phoneNumbers,photos,organizations');
    url.searchParams.set('pageSize', '30');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // Fallback to client-side filter
      const all = await this.listContacts();
      const q = query.toLowerCase();
      return all.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          (c.phoneNumber && c.phoneNumber.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    const data = await res.json();
    const results: unknown[] = data.results || [];

    return results.map((item: any): GoogleContact => {
      const person = item.person;
      const nameObj = person?.names?.[0];
      const emailObj = person?.emailAddresses?.[0];
      const phoneObj = person?.phoneNumbers?.[0];
      const photoObj = person?.photos?.[0];
      const orgObj = person?.organizations?.[0];

      return {
        resourceName: person?.resourceName,
        etag: person?.etag,
        displayName: nameObj?.displayName || nameObj?.givenName || emailObj?.value || 'جهة اتصال بدون اسم',
        givenName: nameObj?.givenName,
        familyName: nameObj?.familyName,
        email: emailObj?.value,
        phoneNumber: phoneObj?.value,
        photoUrl: photoObj?.url,
        organization: orgObj?.name,
      };
    });
  }

  /**
   * Creates a new contact in Google Contacts (People API)
   * Note: The UI caller MUST provide an explicit user confirmation dialog first.
   */
  public async createContact(params: CreateContactParams): Promise<GoogleContact> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('يُرجى تسجيل الدخول بحساب Google أولاً لإضافة جهة اتصال.');
    }

    const body: Record<string, unknown> = {
      names: [
        {
          givenName: params.givenName,
          familyName: params.familyName || '',
        },
      ],
    };

    if (params.email) {
      body.emailAddresses = [{ value: params.email, type: 'home' }];
    }

    if (params.phoneNumber) {
      body.phoneNumbers = [{ value: params.phoneNumber, type: 'mobile' }];
    }

    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`تعذر حفظ جهة الاتصال في Google: ${msg}`);
    }

    const data = await res.json();
    const nameObj = data.names?.[0];
    const emailObj = data.emailAddresses?.[0];
    const phoneObj = data.phoneNumbers?.[0];

    return {
      resourceName: data.resourceName,
      etag: data.etag,
      displayName: nameObj?.displayName || `${params.givenName} ${params.familyName || ''}`.trim(),
      givenName: params.givenName,
      familyName: params.familyName,
      email: emailObj?.value,
      phoneNumber: phoneObj?.value,
      photoUrl: data.photos?.[0]?.url,
    };
  }

  /**
   * Deletes a contact from Google Contacts
   * Note: The UI caller MUST provide an explicit user confirmation dialog first.
   */
  public async deleteContact(resourceName: string): Promise<void> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('يُرجى تسجيل الدخول بحساب Google أولاً.');
    }

    const res = await fetch(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`تعذر حذف جهة الاتصال: ${msg}`);
    }
  }
}

export const googleContactsService = new GoogleContactsService();
