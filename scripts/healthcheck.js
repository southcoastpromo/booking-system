#!/usr/bin/env node
/**
 * COMPREHENSIVE HEALTH CHECK
 * Tests all critical system endpoints and functionality
 */

import { readFileSync } from 'fs';

class HealthChecker {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = [];
  }

  async runAllChecks() {
    console.log('🏥 SouthCoast ProMotion - Health Check Suite');
    console.log('════════════════════════════════════════════\n');

    const checks = [
      { name: 'Basic Health Endpoint', test: () => this.checkHealth() },
      { name: 'API Authentication', test: () => this.checkCSRFToken() },
      { name: 'Campaigns API', test: () => this.checkCampaigns() },
      { name: 'CORS Configuration', test: () => this.checkCORS() },
      { name: 'Security Headers', test: () => this.checkSecurityHeaders() },
      { name: 'Database Connectivity', test: () => this.checkDatabase() },
      { name: 'API Performance', test: () => this.checkPerformance() }
    ];

    for (const check of checks) {
      await this.runCheck(check);
    }

    this.printSummary();
    return this.results.every(r => r.status === 'PASSED');
  }

  async runCheck(check) {
    const start = Date.now();
    try {
      await check.test();
      const duration = Date.now() - start;
      this.results.push({ name: check.name, status: 'PASSED', duration, error: null });
      console.log(`✅ ${check.name} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({ name: check.name, status: 'FAILED', duration, error: error.message });
      console.log(`❌ ${check.name} - FAILED (${duration}ms): ${error.message}`);
    }
  }

  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`Health status not OK: ${data.status}`);
    }
  }

  async checkCSRFToken() {
    const response = await fetch(`${this.baseUrl}/api/csrf-token`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`CSRF token endpoint failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data.csrfToken) {
      throw new Error('CSRF token not returned');
    }
  }

  async checkCampaigns() {
    const response = await fetch(`${this.baseUrl}/api/campaigns`);
    if (!response.ok) {
      throw new Error(`Campaigns API failed: ${response.status}`);
    }
    const campaigns = await response.json();
    if (!Array.isArray(campaigns)) {
      throw new Error('Campaigns response is not an array');
    }
    if (campaigns.length === 0) {
      throw new Error('No campaigns returned');
    }
    console.log(`   📊 ${campaigns.length} campaigns loaded`);
  }

  async checkCORS() {
    const response = await fetch(`${this.baseUrl}/api/campaigns`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    if (!corsHeader) {
      throw new Error('CORS headers not present');
    }
    console.log(`   🔒 CORS: ${corsHeader}`);
  }

  async checkSecurityHeaders() {
    const response = await fetch(`${this.baseUrl}/health`);
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection'
    ];

    for (const header of requiredHeaders) {
      if (!response.headers.get(header)) {
        throw new Error(`Missing security header: ${header}`);
      }
    }
    console.log(`   🛡️  Security headers present`);
  }

  async checkDatabase() {
    // Check if campaigns are loaded (indicates DB connectivity)
    const response = await fetch(`${this.baseUrl}/api/campaigns`);
    if (!response.ok) {
      throw new Error(`Database connectivity check failed: ${response.status}`);
    }
    const campaigns = await response.json();
    if (campaigns.length === 0) {
      throw new Error('Database appears empty');
    }
    console.log(`   💾 Database operational with ${campaigns.length} records`);
  }

  async checkPerformance() {
    const start = Date.now();
    const response = await fetch(`${this.baseUrl}/api/campaigns`);
    const duration = Date.now() - start;
    
    if (!response.ok) {
      throw new Error(`Performance check failed: ${response.status}`);
    }
    
    if (duration > 1000) {
      throw new Error(`Response too slow: ${duration}ms (expected <1000ms)`);
    }
    
    console.log(`   ⚡ Response time: ${duration}ms`);
  }

  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const avgDuration = Math.round(
      this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
    );

    console.log('\n📋 HEALTH CHECK SUMMARY');
    console.log('═══════════════════════');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚡ Avg Response: ${avgDuration}ms`);

    if (failed === 0) {
      console.log('\n🎉 ALL HEALTH CHECKS PASSED - System is production ready!');
    } else {
      console.log('\n⚠️  HEALTH CHECK FAILURES DETECTED - Review before deployment');
    }
  }
}

// Run health checks
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  checker.runAllChecks()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

export default HealthChecker;