import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuButton = page.getByRole('button').first();
    await expect(menuButton).toBeVisible();
    
    await menuButton.click();
    await expect(page.getByRole('link', { name: /find vendors/i })).toBeVisible();
  });

  test('should hide mobile menu on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    const desktopNav = page.getByRole('navigation');
    await expect(desktopNav).toBeVisible();
  });

  test('search page should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/search');
    
    const searchInput = page.getByPlaceholder(/search vendors/i);
    await expect(searchInput).toBeVisible();
    
    const box = await searchInput.boundingBox();
    expect(box?.width).toBeLessThan(400);
  });
});
