import { test, expect } from '@playwright/test';

const AGENT_ID = 'antigravity';
const TEST_FILE = 'test-e2e-hello.txt';
const ORIGINAL_CONTENT = 'Hello from e2e test';
const UPDATED_CONTENT = 'Edited via workspace UI';

test.describe('Workspace UI', () => {
  test('creates a file via API, edits it via the UI, and verifies saved content', async ({ page, request }) => {
    const createResp = await request.post(`/api/workspaces/${AGENT_ID}/files`, {
      data: { path: TEST_FILE, content: ORIGINAL_CONTENT },
    });
    expect(createResp.ok()).toBeTruthy();

    await page.goto(`/agents/${AGENT_ID}/workspace`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(TEST_FILE)).toBeVisible({ timeout: 15000 });

    await page.getByText(TEST_FILE).click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await expect(textarea).toHaveValue(ORIGINAL_CONTENT);

    await textarea.fill(UPDATED_CONTENT);
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText('Saved')).toBeVisible({ timeout: 5000 });

    const response = await request.get(
      `/api/workspaces/${AGENT_ID}/files?path=${encodeURIComponent(TEST_FILE)}`
    );
    const data = await response.json();
    expect(data.content).toBe(UPDATED_CONTENT);
  });
});
