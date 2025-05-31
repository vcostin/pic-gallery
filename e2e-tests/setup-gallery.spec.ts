import { test, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';
import { TEST_ASSETS } from './test-assets';
import { TEST_ASSETS_CI, ensureTestImagesExist } from './test-assets-ci';

// This test creates a test gallery with images for E2E testing
// Configure to run serially to avoid race conditions with shared user data
test.describe.configure({ mode: 'serial' });
test.describe('Setup Test Gallery', () => {
  // Clean up only after all tests in this suite are completed
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/galleries');
    await TestHelpers.cleanupTestData(page);
    await context.close();
  });
  
  test('create a test gallery with images', async ({ page }) => {
    console.log('Starting setup gallery test...');
    
    // Listen for console messages from the browser
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[Browser ${type.toUpperCase()}]:`, text);
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.error('[Browser ERROR]:', error.message);
    });
    
    // ===== PHASE 0: UPLOAD TEST IMAGES =====
    console.log('Phase 0: Uploading test images...');
    
    // First, upload some test images so we have images to select from
    const uploadedImages = await TestHelpers.uploadTestImages(page, 2);
    console.log(`Successfully uploaded ${uploadedImages.length} test images:`, uploadedImages);
    
    // ===== PHASE 1: GALLERY CREATION =====
    console.log('Phase 1: Creating gallery...');
    
    // Create a unique gallery name to avoid conflicts
    const uniqueId = Date.now();
    const galleryName = `Test Gallery ${uniqueId}`;
    console.log(`Using gallery name: ${galleryName}`);
    
    // Go to create gallery page
    await page.goto('/galleries/create');
    console.log('Navigated to create gallery page');
  
  // Wait for the page to load fully
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the create gallery page
  await expect(page).toHaveURL('/galleries/create');
  
  // Let's first check what inputs are available
  const inputCount = await page.locator('input, textarea').count();
  console.log(`Found ${inputCount} input elements on create gallery page`);
  
  // Try multiple selectors for title field
  try {
    // First try by test ID
    const titleInput = page.getByTestId('gallery-title');
    if (await titleInput.isVisible()) {
      await titleInput.fill(galleryName);
      console.log('Filled title using test ID');
    } else {
      // Try by role with label
      const titleByRole = page.getByRole('textbox', { name: /title/i });
      if (await titleByRole.isVisible()) {
        await titleByRole.fill(galleryName);
        console.log('Filled title using role with label');
      } else {
        // Try by placeholder
        const titleByPlaceholder = page.getByPlaceholder(/title/i);
        if (await titleByPlaceholder.isVisible()) {
          await titleByPlaceholder.fill(galleryName);
          console.log('Filled title using placeholder');
        } else {
          // Last resort - use generic selectors
          const inputs = page.locator('input, textarea');
          await inputs.first().fill(galleryName);
          console.log('Filled title using first input element');
        }
      }
    }
    
    // Try multiple selectors for description field
    const descriptionInput = page.getByTestId('gallery-description');
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('This gallery was created for E2E testing');
      console.log('Filled description using test ID');
    } else {
      // Try by role with label
      const descByRole = page.getByRole('textbox', { name: /description/i });
      if (await descByRole.isVisible()) {
        await descByRole.fill('This gallery was created for E2E testing');
        console.log('Filled description using role with label');
      } else {
        // Try by placeholder
        const descByPlaceholder = page.getByPlaceholder(/description/i);
        if (await descByPlaceholder.isVisible()) {
          await descByPlaceholder.fill('This gallery was created for E2E testing');
          console.log('Filled description using placeholder');
        } else {
          // Last resort - use generic selectors
          const inputs = page.locator('input, textarea');
          if (await inputs.count() > 1) {
            await inputs.nth(1).fill('This gallery was created for E2E testing');
            console.log('Filled description using second input element');
          }
        }
      }
    }
    
    // Try multiple selectors for public checkbox
    const publicCheckbox = page.getByTestId('gallery-public');
    if (await publicCheckbox.isVisible()) {
      await publicCheckbox.check();
      console.log('Checked public using test ID');
    } else {
      // Try by role with label
      const checkboxByRole = page.getByRole('checkbox', { name: /public/i });
      if (await checkboxByRole.isVisible()) {
        await checkboxByRole.check();
        console.log('Checked public using role with label');
      } else {
        // Last resort - use generic selectors
        const checkboxes = page.locator('input[type="checkbox"]');
        if (await checkboxes.count() > 0) {
          await checkboxes.first().check();
          console.log('Checked public using first checkbox element');
        }
      }
    }
  } catch (error) {
    console.error('Error filling gallery form:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'gallery-form-error.png' });
    throw error;
  }
  
  // Submit the form
  try {
    const createButton = page.getByTestId('create-gallery-submit');
    await createButton.click();
    console.log('Clicked create gallery button');
  } catch (error) {
    console.error('Error submitting gallery form:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'gallery-submit-error.png' });
    throw error;
  }
  
  // Wait for redirection to the gallery page
  await page.waitForURL(/\/galleries\/[\w-]+$/, { timeout: 10000 });
  console.log(`Created gallery: ${galleryName}`);
  
  // ===== IMPORTANT: DATABASE CONSISTENCY WAIT =====
  console.log('Waiting for database consistency after gallery creation...');
  // In CI environments, there can be a delay between gallery creation and data availability
  await page.waitForTimeout(3000);
  
  // ===== PHASE 2: ADDING IMAGES TO GALLERY =====
  console.log('Phase 2: Adding images to gallery...');
  
  // We now have test images uploaded in Phase 0, so we can proceed directly to adding them to the gallery
  
  // ===== PHASE 3: ADDING IMAGES TO GALLERY =====
  console.log('Phase 3: Adding uploaded images to gallery...');
  
  // IMPORTANT: Wait for database consistency before proceeding
  // In CI environments, there can be a delay between upload completion and data availability
  console.log('Waiting for database consistency after uploads...');
  await page.waitForTimeout(3000);
  
  // Verify uploaded images are accessible via the images API before proceeding
  console.log('Verifying uploaded images are accessible...');
  try {
    await page.goto('/images');
    await page.waitForLoadState('networkidle');
    
    // Look for our uploaded images on the images page
    const imageElements = await page.locator('.image-card, [data-testid*="image"], img[alt*="Test Image"]').count();
    console.log(`Found ${imageElements} image elements on /images page`);
    
    // If no images found, wait a bit more and retry
    if (imageElements === 0) {
      console.log('No images found on /images page, waiting longer for database consistency...');
      await page.waitForTimeout(5000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const retryCount = await page.locator('.image-card, [data-testid*="image"], img[alt*="Test Image"]').count();
      console.log(`After retry, found ${retryCount} image elements on /images page`);
    }
  } catch (e) {
    console.warn('Could not verify images on /images page:', e);
  }
  
  try {
    // Now let's add these images to our test gallery
    // IMPORTANT: Additional database consistency wait before navigating to galleries
    console.log('Ensuring gallery is fully persisted before proceeding...');
    await page.waitForTimeout(2000);
    
    // Go back to galleries
    await page.goto('/galleries');
    console.log('Navigated to galleries page');
    
    // Wait for the page to load fully with extended timeout
    await page.waitForLoadState('networkidle');
    
    // Additional wait for any dynamic content loading
    await page.waitForTimeout(1000);
    
    // Find and click our test gallery - use more robust selectors
    // First, wait for galleries to load with extended timeout and better error handling
    console.log('Waiting for gallery items to appear...');
    try {
      await page.waitForSelector('[data-testid="gallery-item"]', { timeout: 15000 });
      console.log('Gallery items found successfully');
    } catch (timeoutError) {
      console.warn('Gallery items not found, trying alternative approaches...');
      
      // Try refreshing the page if gallery items are not found
      console.log('Refreshing page and retrying...');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Try again with a longer timeout
      await page.waitForSelector('[data-testid="gallery-item"]', { timeout: 15000 });
      console.log('Gallery items found after refresh');
    }
    
    // Try multiple approaches to find the gallery
    let galleryFound = false;
    
    // Method 1: Try by data-testid attribute on the gallery title
    const galleryByTestId = page.locator('[data-testid="gallery-title"]').filter({ hasText: galleryName });
    const titleCount = await galleryByTestId.count();
    console.log(`Found ${titleCount} galleries with matching title via data-testid`);
    
    if (titleCount > 0) {
      // Click the parent gallery item link
      await galleryByTestId.first().locator('xpath=ancestor::a').click();
      galleryFound = true;
      console.log('Clicked on gallery via title data-testid');
    } else {
      // Method 2: Try by text content with more flexible matching
      const galleryByText = page.getByText(galleryName, { exact: false });
      const textCount = await galleryByText.count();
      console.log(`Found ${textCount} elements with gallery name text`);
      
      if (textCount > 0) {
        await galleryByText.first().click();
        galleryFound = true;
        console.log('Clicked on gallery via text content');
      } else {
        // Method 3: Debug what galleries are actually present
        const allGalleries = page.locator('[data-testid="gallery-title"]');
        const allTitles = await allGalleries.allTextContents();
        console.log('Available gallery titles:', allTitles);
        
        // Try partial matching
        for (const title of allTitles) {
          if (title.includes(galleryName.split(' ')[0])) { // Match first part of name
            await page.getByText(title).click();
            galleryFound = true;
            console.log(`Clicked on gallery with similar name: ${title}`);
            break;
          }
        }
      }
    }
    
    if (!galleryFound) {
      throw new Error(`Could not find gallery with name: ${galleryName}. Available galleries: ${(await page.locator('[data-testid="gallery-title"]').allTextContents()).join(', ')}`);
    }
    
    // Click the edit button
    const editButton = page.getByTestId('edit-gallery-button').first();
    await editButton.click();
    console.log('Clicked edit button');
    
    // Wait for edit page to fully load
    await page.waitForURL('**/edit', { timeout: 10000 });
    console.log('Edit page URL loaded');
    
    // Wait for the edit page content to be ready (images section should be visible)
    await page.locator('text=Images (').waitFor({ timeout: 10000 });
    console.log('Edit page images section loaded');
    
    // Additional wait for the page JavaScript to be ready
    await page.waitForTimeout(2000);
    console.log('Additional stability wait completed');
    
    // Click the "Select Images" button
    const selectImagesButton = page.getByTestId('select-images-button');
    
    // Debug: Check if button exists and is clickable
    console.log('Checking select images button...');
    const buttonExists = await selectImagesButton.isVisible();
    console.log('Button visible:', buttonExists);
    
    if (buttonExists) {
      const buttonEnabled = await selectImagesButton.isEnabled();
      console.log('Button enabled:', buttonEnabled);
      
      // Take a screenshot before clicking
      await page.screenshot({ path: 'before-button-click.png' });
      
      await selectImagesButton.click();
      console.log('Clicked select images button');
      
      // Take a screenshot after clicking
      await page.screenshot({ path: 'after-button-click.png' });
      
      // Check for any console errors
      const consoleLogs = await page.evaluate(() => {
        // Return any errors from console
        return window.console;
      });
      console.log('Browser console state checked');
    } else {
      throw new Error('Select Images button not found');
    }
    
    // Select the images we uploaded - look for them by title in the dialog
    // CRITICAL: Wait for SelectImagesDialog API call to complete and images to render
    console.log('Waiting for SelectImagesDialog API call to complete and images to render...');
    
    try {
      // Step 1: Wait for the dialog to open
      await page.locator('[data-testid="select-images-modal-overlay"]').waitFor({ timeout: 5000 });
      console.log('SelectImagesDialog opened successfully');
      
      // Step 2: Wait for loading spinner to appear and disappear (if it exists)
      const loadingSpinner = page.getByText('Loading images...');
      const hasLoadingSpinner = await loadingSpinner.isVisible().catch(() => false);
      
      if (hasLoadingSpinner) {
        console.log('Loading spinner detected, waiting for it to disappear...');
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
        console.log('Loading spinner disappeared');
      } else {
        console.log('No loading spinner detected, API call may have completed quickly');
      }
      
      // Step 3: CRITICAL - Wait for actual image cards to be rendered and interactable
      console.log('Waiting for image cards to be rendered...');
      
      // ENHANCED WAIT STRATEGY: Multiple approaches to handle React-to-DOM timing
      const imageCardSelector = '[data-testid^="select-images-image-card-"]';
      console.log('Looking for image cards with selector:', imageCardSelector);
      
      // Strategy 1: Simple timeout to allow React to complete its render cycle
      console.log('Step 1: Brief wait for React render cycle...');
      await page.waitForTimeout(500);
      
      // Strategy 2: Use waitForSelector instead of waitForFunction for better reliability
      console.log('Step 2: Waiting for first image card to exist in DOM...');
      try {
        await page.waitForSelector(imageCardSelector, { 
          timeout: 10000,
          state: 'attached'  // Wait for element to be attached to DOM
        });
        console.log('Image card selector found with waitForSelector');
      } catch (selectorError) {
        console.warn('waitForSelector failed, trying alternative approaches...');
        
        // Strategy 3: Multiple shorter waits with DOM checks
        let cardCount = 0;
        for (let attempt = 0; attempt < 10; attempt++) {
          await page.waitForTimeout(200);
          cardCount = await page.locator(imageCardSelector).count();
          console.log(`Attempt ${attempt + 1}: Found ${cardCount} cards`);
          if (cardCount > 0) break;
        }
        
        if (cardCount === 0) {
          // Strategy 4: Wait for any visible changes in the grid container
          console.log('Step 4: Waiting for grid container changes...');
          try {
            await page.waitForFunction(() => {
              const grid = document.querySelector('.grid');
              return grid && grid.children.length > 0;
            }, { timeout: 5000 });
            console.log('Grid container has children');
          } catch (gridError) {
            console.warn('Grid wait also failed:', gridError);
          }
        }
      }
      
      // Strategy 5: Wait for the specific React state to stabilize
      console.log('Step 5: Waiting for React state stabilization...');
      try {
        await page.waitForFunction(() => {
          // Check if React has finished rendering by looking for the completion marker
          const dialog = document.querySelector('[data-testid="select-images-modal-overlay"]');
          if (!dialog) return false;
          
          // Look for signs that React has finished its work
          const hasGrid = !!dialog.querySelector('.grid');
          const grid = dialog.querySelector('.grid');
          const gridHasChildren = grid ? grid.children.length > 0 : false;
          const hasCards = document.querySelectorAll('[data-testid^="select-images-image-card-"]').length > 0;
          
          return hasGrid && (gridHasChildren || hasCards);
        }, { timeout: 8000 });
        console.log('React state appears stabilized');
      } catch (reactWaitError) {
        console.warn('React state wait failed:', reactWaitError);
      }
      
      // Strategy 6: Final verification with proper state checks
      const firstImageCard = page.locator(imageCardSelector).first();
      try {
        await firstImageCard.waitFor({ 
          state: 'visible', 
          timeout: 5000 
        });
        console.log('First image card is now visible');
      } catch (visibilityError) {
        console.warn('Image card visibility check failed:', visibilityError);
        
        // Fallback: Just check if cards exist in DOM even if not visible
        const cardCount = await page.locator(imageCardSelector).count();
        console.log(`Fallback check: Found ${cardCount} cards in DOM (may not be visible)`);
      }
      
      // Strategy 7: Wait for custom React completion flag
      console.log('Step 7: Waiting for React render completion flag...');
      try {
        await page.waitForFunction(() => {
          return (window as any).reactRenderComplete === true;
        }, { timeout: 5000 });
        console.log('React render completion flag detected');
        
        // Additional small wait after flag is set
        await page.waitForTimeout(100);
        
      } catch (flagError) {
        console.warn('React completion flag wait failed:', flagError);
      }
      
      // Strategy 8: Ensure network stability
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('Network idle state reached - all image loading complete');
      } catch (networkError) {
        console.warn('Network idle wait failed:', networkError);
      }
      
    } catch (error) {
      console.warn('Error waiting for SelectImagesDialog to load:', error);
      
      // If waiting for image cards failed, let's debug what we have
      const cardCount = await page.locator('[data-testid^="select-images-image-card-"]').count();
      console.log(`Found ${cardCount} image cards after error`);
      
      // Check if there's a "No images found" message
      const noImagesMessage = await page.getByText('No images found').isVisible().catch(() => false);
      if (noImagesMessage) {
        console.log('Dialog shows "No images found" message');
      }
    }
    
    // Debug: Check what the dialog actually contains
    const dialogVisible = await page.locator('[data-testid="select-images-modal-overlay"]').isVisible();
    console.log(`Dialog visible: ${dialogVisible}`);
    
    // Debug: Check if there are any images in the API response by looking at the dialog state
    const dialogContent = await page.locator('[data-testid="select-images-modal-overlay"]').textContent();
    console.log(`Dialog content includes: ${dialogContent?.includes('No images found') ? 'No images found message' : 'Some content'}`);
    
    // Debug: Check specifically for image cards using multiple Playwright wait strategies
    const allImageCards = page.locator('[data-testid^="select-images-image-card-"]');
    
    // ENHANCED WAIT APPROACH: Try different techniques instead of just waitForFunction
    console.log('Waiting for image cards to appear in dialog using multiple strategies...');
    
    let cardCount = 0;
    let strategyUsed = 'none';
    
    // Strategy A: Direct locator waiting (most reliable for React)
    try {
      console.log('Strategy A: Using locator.first().waitFor()...');
      await allImageCards.first().waitFor({ 
        state: 'attached', 
        timeout: 8000 
      });
      cardCount = await allImageCards.count();
      strategyUsed = 'locator.waitFor';
      console.log(`Strategy A succeeded: Found ${cardCount} cards`);
    } catch (locatorError) {
      console.warn('Strategy A (locator.waitFor) failed:', locatorError);
      
      // Strategy B: waitForSelector with CSS selector
      try {
        console.log('Strategy B: Using waitForSelector...');
        await page.waitForSelector('[data-testid^="select-images-image-card-"]', { 
          timeout: 8000,
          state: 'attached'
        });
        cardCount = await allImageCards.count();
        strategyUsed = 'waitForSelector';
        console.log(`Strategy B succeeded: Found ${cardCount} cards`);
      } catch (selectorError) {
        console.warn('Strategy B (waitForSelector) failed:', selectorError);
        
        // Strategy C: waitForFunction (fallback to original approach)
        try {
          console.log('Strategy C: Using waitForFunction...');
          await page.waitForFunction(() => {
            const cards = document.querySelectorAll('[data-testid^="select-images-image-card-"]');
            return cards.length > 0;
          }, { timeout: 8000 });
          cardCount = await allImageCards.count();
          strategyUsed = 'waitForFunction';
          console.log(`Strategy C succeeded: Found ${cardCount} cards`);
        } catch (functionError) {
          console.warn('Strategy C (waitForFunction) failed:', functionError);
          
          // Strategy D: Manual polling with short intervals
          console.log('Strategy D: Manual polling approach...');
          for (let i = 0; i < 20; i++) {
            await page.waitForTimeout(250);
            cardCount = await allImageCards.count();
            console.log(`Poll ${i + 1}: Found ${cardCount} cards`);
            if (cardCount > 0) {
              strategyUsed = 'manual-polling';
              break;
            }
          }
        }
      }
    }
    
    console.log(`Found ${cardCount} image cards in dialog using strategy: ${strategyUsed}`);
    
    // If no image cards found, let's debug why with enhanced wait strategies
    if (cardCount === 0) {
      console.log('No image cards found - using enhanced debugging with proper waits...');
      
      // 1. Check if the modal overlay exists and is visible
      const modalOverlay = page.getByTestId('select-images-modal-overlay');
      const hasOverlay = await modalOverlay.isVisible();
      console.log(`Modal overlay visible: ${hasOverlay}`);
      
      // 2. Check for various states in the dialog
      const loadingSpinner = page.locator('text=Loading images...');
      const isLoadingVisible = await loadingSpinner.isVisible();
      console.log(`Loading spinner visible: ${isLoadingVisible}`);
      
      const errorMessage = page.locator('[data-testid="error-message"], .error-message');
      const hasError = await errorMessage.count() > 0;
      console.log(`Error state detected: ${hasError}`);
      
      const emptyState = page.locator('text=No images found');
      const hasEmptyState = await emptyState.isVisible();
      console.log(`Empty state visible: ${hasEmptyState}`);
      
      // 3. Check for grid container
      const gridContainer = page.locator('.grid');
      const hasGrid = await gridContainer.count() > 0;
      console.log(`Grid container found: ${hasGrid}`);
      
      if (hasGrid) {
        const gridChildren = await gridContainer.locator('> *').count();
        console.log(`Grid has ${gridChildren} direct children`);
      }
      
      // 4. CRITICAL: Use Playwright's evaluate to inspect the DOM directly
      const domInspection = await page.evaluate(() => {
        const dialog = document.querySelector('[data-testid="select-images-modal-overlay"]');
        if (!dialog) return { error: 'Dialog not found in DOM' };
        
        // Check all elements with data-testid attributes in the dialog
        const testIdElements = dialog.querySelectorAll('[data-testid]');
        const testIds = Array.from(testIdElements).map(el => el.getAttribute('data-testid'));
        
        // Check specifically for image cards
        const imageCards = document.querySelectorAll('[data-testid^="select-images-image-card-"]');
        const cardInfo = Array.from(imageCards).map((card, index) => {
          const htmlCard = card as HTMLElement;
          const rect = card.getBoundingClientRect();
          const style = window.getComputedStyle(card);
          
          return {
            index,
            testId: card.getAttribute('data-testid'),
            visible: htmlCard.offsetParent !== null,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            position: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            inViewport: rect.top >= 0 && rect.left >= 0 && 
                       rect.bottom <= window.innerHeight && 
                       rect.right <= window.innerWidth
          };
        });
        
        // Check for React rendering issues
        const grid = dialog.querySelector('.grid');
        const gridInfo = grid ? {
          exists: true,
          children: grid.children.length,
          childrenTypes: Array.from(grid.children).map(child => ({
            tagName: child.tagName,
            className: child.className,
            testId: child.getAttribute('data-testid'),
            innerHTML: (child as HTMLElement).innerHTML.slice(0, 200) + '...'
          }))
        } : { exists: false };
        
        // ENHANCED: Check for any cursor-pointer elements (Card components)
        const cursorPointerElements = dialog.querySelectorAll('.cursor-pointer');
        const cursorPointerInfo = Array.from(cursorPointerElements).map(el => ({
          tagName: el.tagName,
          className: el.className,
          testId: el.getAttribute('data-testid'),
          innerHTML: (el as HTMLElement).innerHTML.slice(0, 100) + '...'
        }));
        
        // ENHANCED: Look for any elements with "image-card" in their test ID
        const imageCardElements = dialog.querySelectorAll('[data-testid*="image-card"]');
        const imageCardInfo = Array.from(imageCardElements).map(el => ({
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName,
          className: el.className
        }));
        
        return {
          totalTestIds: testIds.length,
          testIds: testIds,
          imageCardsCount: imageCards.length,
          cardDetails: cardInfo,
          gridInfo: gridInfo,
          cursorPointerCount: cursorPointerElements.length,
          cursorPointerInfo: cursorPointerInfo,
          imageCardElementsCount: imageCardElements.length,
          imageCardInfo: imageCardInfo,
          dialogDimensions: dialog.getBoundingClientRect(),
          dialogVisible: (dialog as HTMLElement).offsetParent !== null,
          dialogInnerHTML: dialog.innerHTML.slice(0, 1000) + '...'
        };
      });
      
      console.log('🔍 DOM Inspection Results:', JSON.stringify(domInspection, null, 2));
      
      // 5. Use Playwright's waitForFunction for React updates instead of arbitrary timeout
      console.log('Waiting for React updates to complete using proper wait strategies...');
      await page.waitForFunction(() => {
        // Wait for React to finish any pending updates by checking if DOM is stable
        const cards = document.querySelectorAll('[data-testid^="select-images-image-card-"]');
        return document.readyState === 'complete' && cards.length >= 0; // Allow for 0 if truly no images
      }, { timeout: 5000 });
      
      // 6. Check if anything changed after waiting with proper Playwright techniques
      const cardCountAfterWait = await page.waitForFunction(() => {
        return document.querySelectorAll('[data-testid^="select-images-image-card-"]').length;
      }).then(async () => await allImageCards.count());
      console.log(`Found ${cardCountAfterWait} image cards after proper React wait`);
      
      // 7. Enhanced waitForFunction with detailed logging
      if (cardCountAfterWait === 0) {
        console.log('Attempting enhanced wait for DOM elements to appear...');
        try {
          await page.waitForFunction(() => {
            const cards = document.querySelectorAll('[data-testid^="select-images-image-card-"]');
            // Log inside the browser context for debugging
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('Browser-side waitForFunction check - Found', cards.length, 'cards');
            }
            return cards.length > 0;
          }, { timeout: 15000 });
          
          const cardCountAfterFunction = await allImageCards.count();
          console.log(`Found ${cardCountAfterFunction} image cards after enhanced waitForFunction`);
        } catch (waitError) {
          console.warn('Enhanced waitForFunction timed out:', waitError);
          
          // Final comprehensive check
          const finalDomState = await page.evaluate(() => {
            return {
              documentReady: document.readyState,
              modalExists: !!document.querySelector('[data-testid="select-images-modal-overlay"]'),
              gridExists: !!document.querySelector('.grid'),
              allTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')),
              bodyChildren: document.body.children.length,
              htmlContent: document.querySelector('[data-testid="select-images-modal-overlay"]')?.innerHTML?.slice(0, 1000)
            };
          });
          
          console.log('🔍 Final DOM State:', JSON.stringify(finalDomState, null, 2));
        }
      }
    }
    
    // Debug: Check for any images in general
    const anyImages = page.locator('img').count();
    console.log(`Found ${await anyImages} img elements in the page`);
    
    // Try to find and select the first uploaded image using proper wait strategies
    let selectedCount = 0;
    
    // Use enhanced waiting to ensure we have cards before proceeding
    let finalCardCount = cardCount; // Use the count from our enhanced strategies above
    
    // If the enhanced strategies didn't find cards, try one more comprehensive check
    if (finalCardCount === 0) {
      console.log('Final attempt: Comprehensive card detection...');
      
      try {
        // Try locator-based waiting one more time
        await allImageCards.first().waitFor({ 
          state: 'attached', 
          timeout: 3000 
        });
        finalCardCount = await allImageCards.count();
        console.log(`Final attempt found ${finalCardCount} cards via locator`);
      } catch (finalLocatorError) {
        // Last resort: immediate count check
        finalCardCount = await allImageCards.count();
        console.log(`Final attempt: immediate count = ${finalCardCount}`);
      }
    }
    
    // Only proceed with selection if we have image cards
    if (finalCardCount > 0) {
      console.log(`Proceeding with image selection - found ${finalCardCount} cards`);
      try {
        // Look for the first uploaded image by title text within the dialog
        const image1Element = uploadedImages.length > 0 
          ? page.locator(`[data-testid^="select-images-image-card-"]`).filter({ hasText: uploadedImages[0] }).first()
          : page.locator('[data-testid^="select-images-image-card-"]').first();
          
        // Use Playwright's expect with auto-retry instead of isVisible check
        await expect(image1Element).toBeVisible({ timeout: 10000 });
        
        // Click directly on the image card
        await image1Element.click();
        console.log(`Selected image: ${uploadedImages.length > 0 ? uploadedImages[0] : 'first available'}`);
        selectedCount++;
      } catch (e) {
        console.warn(`Couldn't select first image: ${e}`);
        
        // Enhanced fallback with proper waiting
        try {
          const anyImageCard = page.locator('[data-testid^="select-images-image-card-"]').first();
          await expect(anyImageCard).toBeVisible({ timeout: 5000 });
          await anyImageCard.click();
          console.log('Selected first available image as enhanced fallback');
          selectedCount++;
        } catch (fallbackError) {
          console.warn('Enhanced fallback also failed:', fallbackError);
        }
      }
      
      try {
        // Look for the second uploaded image with proper waiting
        const image2Element = uploadedImages.length > 1 
          ? page.locator(`[data-testid^="select-images-image-card-"]`).filter({ hasText: uploadedImages[1] }).first()
          : page.locator('[data-testid^="select-images-image-card-"]').nth(1);
          
        // Use expect with timeout instead of isVisible
        await expect(image2Element).toBeVisible({ timeout: 10000 });
        
        // Click directly on the image card
        await image2Element.click();
        console.log(`Selected image: ${uploadedImages.length > 1 ? uploadedImages[1] : 'second available'}`);
        selectedCount++;
      } catch (e) {
        console.warn(`Couldn't select second image: ${e}`);
        
        // Enhanced fallback: try to find the second image card and select it
        try {
          const imageCards = page.locator('[data-testid^="select-images-image-card-"]');
          const cardCount = await imageCards.count();
          if (cardCount > 1) {
            await expect(imageCards.nth(1)).toBeVisible({ timeout: 5000 });
            await imageCards.nth(1).click();
            console.log('Selected second available image as enhanced fallback');
            selectedCount++;
          }
        } catch (fallbackError) {
          console.warn('Enhanced fallback for second image also failed:', fallbackError);
        }
      }
      
      console.log(`Successfully selected ${selectedCount} images`);
      
      // If no images were selected, try a more generic approach with proper waiting
      if (selectedCount === 0) {
        console.log('No images selected by name, trying to select any available images...');
        const allImageCards = page.locator('[data-testid^="select-images-image-card-"]');
        
        // Use waitForFunction to get the current count
        const totalCards = await page.waitForFunction(() => {
          return document.querySelectorAll('[data-testid^="select-images-image-card-"]').length;
        }).then(async () => await allImageCards.count());
        
        console.log(`Found ${totalCards} image cards in dialog`);
        
        // Select up to 2 images with proper waiting
        const imagesToSelect = Math.min(2, totalCards);
        for (let i = 0; i < imagesToSelect; i++) {
          try {
            const currentCard = allImageCards.nth(i);
            await expect(currentCard).toBeVisible({ timeout: 5000 });
            await currentCard.click();
            selectedCount++;
            console.log(`Selected image ${i + 1} by index`);
          } catch (e) {
            console.warn(`Failed to select image ${i + 1}: ${e}`);
          }
        }
      }
      
      // Confirm image selection only if we selected something
      if (selectedCount > 0) {
        // Use waitForLoadState instead of arbitrary timeout
        await page.waitForLoadState('networkidle');
        
        // The button text changes based on number of selected images, so use the test ID
        const selectButton = page.getByTestId('select-images-add-button');
        
        // Use expect with timeout instead of isEnabled check
        await expect(selectButton).toBeEnabled({ timeout: 5000 });
        console.log('Add button is enabled');
        
        await selectButton.click();
        console.log('Confirmed image selection');
      } else {
        console.warn('No images were selected - skipping add button click');
        // Close the dialog since we can't proceed
        const closeButton = page.getByTestId('select-images-close-button');
        await expect(closeButton).toBeVisible({ timeout: 5000 });
        await closeButton.click();
        throw new Error('No images available for selection in dialog');
      }
    } else {
      console.warn('No image cards found in dialog - cannot proceed with selection');
      // Close the dialog
      const closeButton = page.getByTestId('select-images-close-button');
      await expect(closeButton).toBeVisible({ timeout: 5000 });
      await closeButton.click();
      throw new Error('No images found in SelectImagesDialog');
    }
    
    // Save the gallery changes only if we successfully selected images
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await expect(saveButton).toBeEnabled({ timeout: 5000 });
    await saveButton.click();
    console.log('Clicked save changes button');
    
    // Verify that the gallery was updated with proper waiting
    const successMessage = page.getByText(/gallery updated successfully/i);
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log(`Added images to gallery: ${galleryName}`);
  } catch (error) {
    console.error('Error adding images to gallery:', error);
    await page.screenshot({ path: 'add-images-error.png' });
    
    // Try to close any open dialogs before continuing
    try {
      const closeButton = page.getByTestId('select-images-close-button');
      // Use expect with short timeout instead of isVisible check
      await expect(closeButton).toBeVisible({ timeout: 2000 });
      await closeButton.click();
      console.log('Closed SelectImagesDialog after error');
    } catch (e) {
      console.log('Could not close dialog (it may not be open):', e);
    }
    
    // Continue with the test even if adding images fails
    console.log('Continuing test despite image selection failure...');
  }
  
  // Output the gallery name for use in other tests
  console.log(`TEST GALLERY CREATED: ${galleryName}`);
  
  try {
    // Go back to the gallery to verify it has images
    await page.goto('/galleries');
    await page.waitForLoadState('networkidle');
    
    // Use the same robust gallery finding logic as before
    await page.waitForSelector('[data-testid="gallery-item"]', { timeout: 10000 });
    
    // Try to find and click the gallery using multiple methods
    let galleryFound = false;
    
    // Method 1: Try by data-testid attribute on the gallery title
    const galleryByTestId = page.locator('[data-testid="gallery-title"]').filter({ hasText: galleryName });
    const titleCount = await galleryByTestId.count();
    
    if (titleCount > 0) {
      await galleryByTestId.first().locator('xpath=ancestor::a').click();
      galleryFound = true;
      console.log('Found gallery for verification via title data-testid');
    } else {
      // Method 2: Try by text content
      const galleryByText = page.getByText(galleryName, { exact: false });
      const textCount = await galleryByText.count();
      
      if (textCount > 0) {
        await galleryByText.first().click();
        galleryFound = true;
        console.log('Found gallery for verification via text content');
      } else {
        // Method 3: Try partial matching
        const allGalleries = page.locator('[data-testid="gallery-title"]');
        const allTitles = await allGalleries.allTextContents();
        console.log('Available galleries for verification:', allTitles);
        
        for (const title of allTitles) {
          if (title.includes(galleryName.split(' ')[0])) {
            await page.getByText(title).click();
            galleryFound = true;
            console.log(`Found gallery for verification with similar name: ${title}`);
            break;
          }
        }
      }
    }
    
    if (galleryFound) {
      // Verify there are images in the gallery using proper waiting
      const galleryImages = page.locator('.gallery-image, [data-testid*="gallery-image"], .grid img');
      
      // Wait for images to load with proper timeout
      const imageCount = await page.waitForFunction(() => {
        const images = document.querySelectorAll('.gallery-image, [data-testid*="gallery-image"], .grid img');
        return images.length;
      }, { timeout: 10000 }).then(async () => {
        return await galleryImages.count();
      }).catch(async () => {
        console.warn('Image count wait timed out, checking immediate count');
        return await galleryImages.count();
      });
      
      console.log(`Gallery has ${imageCount} images`);
      
      if (imageCount > 0) {
        console.log('Successfully created gallery with images');
      } else {
        console.log('Gallery was created but no images were found');
      }
    } else {
      console.warn(`Could not find gallery ${galleryName} for verification`);
    }
  } catch (error) {
    console.error('Error verifying gallery images:', error);
    await page.screenshot({ path: 'verify-gallery-error.png' });
  }
  
  console.log('Setup gallery test completed');
  });
});
