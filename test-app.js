#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testApp() {
  console.log('🔍 Testing VB6 Web IDE...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('✅') || text.includes('❌') || text.includes('🔍')) {
      console.log('Browser:', text);
    }
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.error('❌ Page Error:', error.message);
  });
  
  try {
    console.log('🌐 Loading http://localhost:8080/...');
    await page.goto('http://localhost:8080/', { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    // Wait for the app to potentially load
    await page.waitForTimeout(5000);
    
    // Check if we have any errors
    const hasError = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [id*="error"]');
      return errorElements.length > 0;
    });
    
    // Check for VB6Provider error specifically
    const hasVB6Error = await page.evaluate(() => {
      return document.body.textContent?.includes('useVB6 must be used within a VB6Provider') || false;
    });
    
    // Check if we have a blank page
    const bodyText = await page.evaluate(() => document.body.textContent?.trim() || '');
    const isBlank = bodyText.length < 50;
    
    console.log('📊 Test Results:');
    console.log('  - Has Error Elements:', hasError);
    console.log('  - Has VB6Provider Error:', hasVB6Error);
    console.log('  - Is Blank Page:', isBlank);
    console.log('  - Body Text Length:', bodyText.length);
    
    if (hasVB6Error) {
      console.log('❌ VB6Provider error still exists');
    } else if (isBlank) {
      console.log('⚠️ Page appears blank');
    } else {
      console.log('✅ Page loaded with content');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);