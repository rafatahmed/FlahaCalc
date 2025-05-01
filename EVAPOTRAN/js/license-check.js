/**
 * License validation module
 */
class LicenseManager {
  constructor() {
    this.licenseKey = localStorage.getItem('license_key');
    this.validationEndpoint = '/api/validate-license';
  }

  async validateLicense() {
    if (!this.licenseKey) {
      return false;
    }

    try {
      const response = await fetch(this.validationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ licenseKey: this.licenseKey })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('License validation error:', error);
      return false;
    }
  }

  setLicenseKey(key) {
    this.licenseKey = key;
    localStorage.setItem('license_key', key);
  }
}

// Export singleton instance
const licenseManager = new LicenseManager();
export default licenseManager;