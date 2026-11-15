import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';

test('CRUD, 삭제 후 GET 없음, 롤백, 폴링과 새로고침 유지', async ({ page, request }) => {
  mkdirSync('docs/screenshots', { recursive: true });
  const title = '과제 동작 검증용 Todo';
  let createdId: string | undefined;
  let polledId: string | undefined;
  try {
    await page.goto('/');
    await expect(page.getByRole('button', { name: '추가', exact: true })).toBeDisabled();
    await expect(page.locator('.todo-list')).toBeVisible();
    await page.getByLabel('새로운 할 일').fill(title);
    await page.getByRole('button', { name: '추가', exact: true }).click();
    const row = page.getByRole('listitem').filter({ hasText: title });
    await expect(row).toBeVisible();
    createdId = (await (await request.get('http://localhost:3000/todos')).json()).find((t: { title: string }) => t.title === title).id;

    await row.getByRole('checkbox').click();
    await expect(row.getByRole('checkbox')).toBeEnabled();
    await expect(row.getByRole('checkbox')).toBeChecked();
    await page.route('**/todos/*', async route => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 350));
        await route.fulfill({ status: 500, body: '{}' });
      } else await route.continue();
    });
    await row.getByRole('checkbox').click();
    await expect(row.getByRole('checkbox')).not.toBeChecked();
    await expect(page.getByRole('alert')).toContainText('완료 상태를 변경하지 못했습니다.');
    await expect(row.getByRole('checkbox')).toBeChecked();
    await expect(row.getByRole('checkbox')).toBeEnabled();
    await row.getByRole('button').click();
    await expect(page.getByRole('alert')).toContainText('할 일을 삭제하지 못했습니다.');
    await expect(row).toBeVisible();
    await expect(row.getByRole('button')).toBeEnabled();
    await page.unroute('**/todos/*');
    await page.reload();
    await expect(row).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/01-before-delete.png', fullPage: true });

    const requests: string[] = [];
    page.on('request', req => { if (req.url().includes(':3000/todos')) requests.push(req.method()); });
    await row.getByRole('button').click();
    await expect(row).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect(requests).toEqual(['DELETE']);
    const db = JSON.parse(await readFile('server/db.json', 'utf8'));
    expect(db.todos.some((t: { id: string }) => t.id === createdId)).toBe(false);
    await page.screenshot({ path: 'docs/screenshots/02-after-delete.png', fullPage: true });
    await page.reload();
    await expect(page.locator('.todo-list')).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);

    await page.getByRole('checkbox', { name: '자동 새로고침 · 5초' }).check();
    const external = await request.post('http://localhost:3000/todos', { data: { title: '폴링으로 자동 반영된 할 일', completed: false } });
    polledId = (await external.json()).id;
    await expect(page.getByText('폴링으로 자동 반영된 할 일', { exact: true })).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'docs/screenshots/03-polling.png', fullPage: true });
    await page.getByRole('checkbox', { name: '자동 새로고침 · 5초' }).uncheck();
    requests.length = 0;
    await page.waitForTimeout(5500);
    expect(requests).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'docs/screenshots/04-mobile.png', fullPage: true });
  } finally {
    if (createdId) await request.delete('http://localhost:3000/todos/' + createdId);
    if (polledId) await request.delete('http://localhost:3000/todos/' + polledId);
  }
});


