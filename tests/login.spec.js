require('dotenv').config()
const { test, expect } = require('@playwright/test');

test('login to app', async ({ page }) => {
  // Get credentials from environment variables
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;
  const loginUrl = process.env.LOGIN_URL;

  if (!email || !password || !loginUrl) {
    throw new Error('Missing required environment variables: LOGIN_EMAIL, LOGIN_PASSWORD, LOGIN_URL');
  }

  console.log('🚀 Starting login test...');
  console.log('📍 Target URL:', loginUrl);
  console.log('👤 Email:', email);
  
  try {
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    console.log('✅ Login page loaded successfully');
    
    // Take screenshot of login page
    await page.screenshot({ path: '/tmp/01-login-page.png', fullPage: true });
    console.log('📸 Login page screenshot saved');
    
    // Check if login form elements exist
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Log In")');
    
    await expect(emailField).toBeVisible({ timeout: 10000 });
    await expect(passwordField).toBeVisible({ timeout: 10000 });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    console.log('✅ All login form elements found');
    
    // Fill in credentials from environment variables
    console.log('📝 Filling in credentials...');
    await emailField.fill(email);
    await passwordField.fill(password);
    console.log('✅ Credentials filled');
    
    // Take screenshot before clicking login
    await page.screenshot({ path: '/tmp/02-before-login.png', fullPage: true });
    console.log('📸 Pre-login screenshot saved');
    
    // Click login and wait for response
    console.log('🔑 Attempting login...');
    await loginButton.click();
    
    // Wait for either success or error
    await page.waitForTimeout(3000); // Give it a moment to process
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after login attempt
    await page.screenshot({ path: '/tmp/03-after-login.png', fullPage: true });
    console.log('📸 Post-login screenshot saved');
    
    const currentUrl = page.url();
    console.log('🌐 Current URL after login attempt:', currentUrl);
    
    // Check for various success indicators
    const isNotOnLoginPage = !currentUrl.includes('/login');
    const hasErrorMessage = await page.locator('[class*="error"], [class*="alert"], .alert-danger, .error-message').count() > 0;
    
    if (hasErrorMessage) {
      const errorText = await page.locator('[class*="error"], [class*="alert"], .alert-danger, .error-message').first().textContent();
      console.log('❌ Login failed - Error message found:', errorText);
      throw new Error(`Login failed: ${errorText}`);
    }
    
    if (isNotOnLoginPage) {
      console.log('✅ LOGIN SUCCESS - Redirected away from login page');
      console.log('🎉 Final URL:', currentUrl);
    } else {
      console.log('⚠️  Still on login page - checking for other success indicators...');
      
      // Check for dashboard elements or user indicators
      const userIndicators = page.locator('[class*="user"], [class*="profile"], [class*="dashboard"], [class*="welcome"]');
      const userIndicatorCount = await userIndicators.count();
      
      if (userIndicatorCount > 0) {
        console.log('✅ LOGIN SUCCESS - User elements found on page');
      } else {
        console.log('❌ LOGIN FAILED - No success indicators found');
        throw new Error('Login appears to have failed - still on login page with no user indicators');
      }
    }
    
    // Final verification
    await expect(page).not.toHaveURL(/.*\/login.*/, { timeout: 5000 });
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved');
    throw error;
  }
});