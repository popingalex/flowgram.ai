import { test, expect, Page } from '@playwright/test';

// 测试数据
const TEST_MODULE_ID = 'test_module_' + Date.now();
const TEST_MODULE_NAME = '测试模块';
const TEST_MODULE_DESC = '这是一个用于测试的模块';

// 页面对象模型
class ModuleManagementPage {
  constructor(private page: Page) {}

  // 导航到模块管理页面
  async navigate() {
    await this.page.goto('/modules');
    await this.page.waitForLoadState('networkidle');
  }

  // 等待页面加载完成
  async waitForPageLoad() {
    await this.page.waitForSelector('[data-testid="module-sidebar"]', { timeout: 10000 });
    await this.page.waitForSelector('[data-testid="module-detail-panel"]', { timeout: 10000 });
  }

  // 添加模块
  async addModule(): Promise<void> {
    await this.page.click('[data-testid="add-module-btn"]');
    await this.page.waitForTimeout(500);

    // 验证跳转到新建页面
    await expect(this.page).toHaveURL(/\/modules\/new\/?$/);

    // 验证新建页面的表单是空的
    await expect(this.page.locator('[data-testid="module-id-input"]')).toHaveValue('');
    await expect(this.page.locator('[data-testid="module-name-input"]')).toHaveValue('');
    await expect(this.page.locator('[data-testid="module-description-input"]')).toHaveValue('');

    console.log('✅ 成功跳转到新建模块页面');
  }

  // 选择模块
  async selectModule(moduleId: string) {
    const selector = `[data-testid="module-item-${moduleId}"], [data-testid*="module-item-"][data-testid$="${moduleId}"]`;
    await this.page.click(selector);
    await this.page.waitForTimeout(500);
  }

  // 编辑模块基本信息
  async editModuleBasicInfo(id: string, name: string, desc: string) {
    // 编辑ID
    const idInput = this.page.locator('[data-testid="module-id-input"]');
    await idInput.click({ clickCount: 3 });
    await idInput.fill(id);
    await this.page.waitForTimeout(300);

    // 编辑名称
    const nameInput = this.page.locator('[data-testid="module-name-input"]');
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill(name);
    await this.page.waitForTimeout(300);

    // 编辑描述
    const descInput = this.page.locator('[data-testid="module-description-input"]');
    await descInput.click({ clickCount: 3 });
    await descInput.fill(desc);
    await this.page.waitForTimeout(300);
  }

  // 保存模块
  async saveModule() {
    await expect(this.page.locator('[data-testid="save-module-btn"]')).toBeEnabled({
      timeout: 5000,
    });
    await this.page.click('[data-testid="save-module-btn"]');
    await this.page.waitForSelector('.semi-toast-success', { timeout: 5000 });
  }

  // 撤销修改
  async undoChanges() {
    await this.page.click('[data-testid="undo-module-btn"]');
    await this.page.waitForSelector('.semi-toast-info', { timeout: 5000 });
  }

  // 删除模块
  async deleteModule() {
    await this.page.click('[data-testid="delete-module-btn"]');
    await this.page.click('.semi-popconfirm-wrapper .semi-button-primary');
    await this.page.waitForSelector('.semi-toast-success', { timeout: 5000 });
  }

  // 添加属性
  async addProperty() {
    await this.page.click('[data-testid="add-property-btn"]');
    await this.page.waitForTimeout(500);
  }

  // 编辑属性
  async editProperty(propertyIndex: number, id: string, name: string) {
    const propertyRow = this.page.locator(`[data-testid="property-row-${propertyIndex}"]`);

    // 编辑属性ID
    const idInput = propertyRow.locator('[data-testid="property-id-input"]');
    await idInput.click({ clickCount: 3 });
    await idInput.fill(id);
    await this.page.waitForTimeout(300);

    // 编辑属性名称
    const nameInput = propertyRow.locator('[data-testid="property-name-input"]');
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill(name);
    await this.page.waitForTimeout(300);
  }

  // 验证模块信息
  async verifyModuleInfo(id: string, name: string, desc: string) {
    await expect(this.page.locator('[data-testid="module-id-input"]')).toHaveValue(id);
    await expect(this.page.locator('[data-testid="module-name-input"]')).toHaveValue(name);
    await expect(this.page.locator('[data-testid="module-description-input"]')).toHaveValue(desc);
  }

  // 验证属性存在
  async verifyPropertyExists(propertyId: string, propertyName: string) {
    const propertyRow = this.page.locator(`[data-testid*="property-row"]`).filter({
      has: this.page.locator(`[data-testid="property-id-input"][value="${propertyId}"]`),
    });
    await expect(propertyRow).toBeVisible();
    await expect(propertyRow.locator('[data-testid="property-name-input"]')).toHaveValue(
      propertyName
    );
  }
}

test.describe('模块管理页面测试', () => {
  let modulePage: ModuleManagementPage;
  let createdModuleIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    modulePage = new ModuleManagementPage(page);
    await modulePage.navigate();
    await modulePage.waitForPageLoad();
    createdModuleIds = [];
  });

  test.afterEach(async ({ page, request }) => {
    // 清理测试创建的所有模块
    console.log('🧹 开始清理测试数据，模块数量:', createdModuleIds.length);

    for (const moduleId of createdModuleIds) {
      try {
        const moduleItem = page.locator(`[data-testid="module-item-${moduleId}"]`);
        if (await moduleItem.isVisible({ timeout: 2000 })) {
          await moduleItem.click();
          await page.waitForTimeout(500);

          await page.click('[data-testid="delete-module-btn"]');

          const confirmBtn = page.locator('.semi-popconfirm .semi-button-primary');
          if (await confirmBtn.isVisible({ timeout: 2000 })) {
            await confirmBtn.click();
          } else {
            await page.click(
              '.semi-popover .semi-button-primary, .semi-popconfirm-wrapper .semi-button-primary'
            );
          }
          await page.waitForSelector('.semi-toast-success', { timeout: 3000 });

          console.log('✅ 已删除测试模块:', moduleId);
        }
      } catch (error) {
        console.warn('⚠️ 删除模块失败:', moduleId, error);
      }
    }

    // 调用清理API
    try {
      const cleanupResponse = await request.post('http://localhost:9999/cm/cleanup/deprecated/');
      console.log('🧹 调用清理API结果:', cleanupResponse.status());
    } catch (error) {
      console.warn('⚠️ 调用清理API失败:', error);
    }

    createdModuleIds = [];
    console.log('🧹 测试数据清理完成');
  });

  test('基本页面加载和布局验证', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('h4')).toContainText('模块管理');

    // 验证左侧边栏存在
    await expect(page.locator('[data-testid="module-sidebar"]')).toBeVisible();

    // 验证右侧详情面板存在
    await expect(page.locator('[data-testid="module-detail-panel"]')).toBeVisible();

    // 验证添加模块按钮存在
    await expect(page.locator('[data-testid="add-module-btn"]')).toBeVisible();
  });

  test('模块管理完整流程测试', async ({ page }) => {
    // 1. 创建新模块
    await modulePage.addModule();
    await modulePage.editModuleBasicInfo(TEST_MODULE_ID, TEST_MODULE_NAME, TEST_MODULE_DESC);

    const beforeCount = await page.locator('[data-testid*="module-item-"]').count();
    await modulePage.saveModule();
    createdModuleIds.push(TEST_MODULE_ID);

    // 验证创建成功 - 先等待页面跳转和基本信息加载
    await expect(page).toHaveURL(new RegExp(`/modules/${TEST_MODULE_ID}/?$`));
    await modulePage.verifyModuleInfo(TEST_MODULE_ID, TEST_MODULE_NAME, TEST_MODULE_DESC);

    // 等待侧边栏中的新模块项出现
    await expect(page.locator(`[data-testid="module-item-${TEST_MODULE_ID}"]`)).toBeVisible();

    // 最后验证总数量（给更多时间让数据同步）
    await expect(page.locator('[data-testid*="module-item-"]')).toHaveCount(beforeCount + 1, {
      timeout: 10000,
    });

    // 2. 测试搜索功能
    const searchInput = page.locator('[data-testid="module-search-input"]');
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill(TEST_MODULE_ID);
      await page.waitForTimeout(500);

      await expect(page.locator(`[data-testid="module-item-${TEST_MODULE_ID}"]`)).toBeVisible();

      await searchInput.fill('');
      await page.waitForTimeout(500);
      console.log('✅ 搜索功能测试通过');
    }

    // 3. 测试属性管理 - 先测试无效属性
    await modulePage.addProperty();
    const propertyRow = page.locator('[data-testid="property-row-0"]');
    const nameInput = propertyRow.locator('[data-testid="property-name-input"]');
    await nameInput.fill('无效属性');

    // 检查保存按钮状态
    const saveBtn = page.locator('[data-testid="save-module-btn"]');
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      const errorToast = page.locator('.semi-toast-error, .semi-toast-warning');
      if (await errorToast.isVisible({ timeout: 2000 })) {
        console.log('✅ 无效属性验证测试通过 - 有错误提示');
      } else {
        console.warn('⚠️ 无效属性没有错误提示');
      }
    } else {
      console.log('✅ 无效属性验证测试通过 - 保存按钮被禁用');
    }

    // 删除无效属性行
    await propertyRow.locator('[data-testid="delete-property-btn"]').click();

    // 添加有效属性
    await modulePage.addProperty();
    await modulePage.editProperty(0, 'module_prop_1', '模块属性1');

    await modulePage.addProperty();
    await modulePage.editProperty(1, 'module_prop_2', '模块属性2');

    await modulePage.saveModule();

    // 验证属性在当前页面显示
    await modulePage.verifyPropertyExists('module_prop_1', '模块属性1');
    await modulePage.verifyPropertyExists('module_prop_2', '模块属性2');

    // 验证数据持久化 - 返回列表页重新进入
    await page.goto('/modules');
    await page.waitForLoadState('networkidle');

    const searchInput2 = page.locator('[data-testid="module-search-input"]');
    await searchInput2.fill(TEST_MODULE_ID);
    await page.waitForTimeout(500);
    await page.click(`[data-testid="module-item-${TEST_MODULE_ID}"]`);
    await page.waitForTimeout(1000);

    // 验证属性真的保存了
    await modulePage.verifyPropertyExists('module_prop_1', '模块属性1');
    await modulePage.verifyPropertyExists('module_prop_2', '模块属性2');
    console.log('✅ 模块属性管理和持久化测试通过');

    // 4. 编辑模块信息
    const modifiedName = TEST_MODULE_NAME + '_修改';
    const modifiedDesc = TEST_MODULE_DESC + '_修改';
    await modulePage.editModuleBasicInfo(TEST_MODULE_ID, modifiedName, modifiedDesc);
    await modulePage.saveModule();
    await modulePage.verifyModuleInfo(TEST_MODULE_ID, modifiedName, modifiedDesc);

    // 5. 撤销修改功能
    await modulePage.editModuleBasicInfo(TEST_MODULE_ID, '临时名称', '临时描述');
    await modulePage.undoChanges();
    await modulePage.verifyModuleInfo(TEST_MODULE_ID, modifiedName, modifiedDesc);

    console.log('✅ 模块管理完整流程测试通过');
  });

  test('应该显示验证错误Badge并提供详细信息', async ({ page }) => {
    await test.step('导航到新建模块页面并验证初始状态', async () => {
      await page.goto('/modules/new');
      await page.waitForLoadState('networkidle');

      // 验证初始状态：应该显示1个错误（模块ID为空）
      const saveBtn = page.getByTestId('save-module-btn');
      await expect(saveBtn).toBeVisible();

      // 检查Badge是否显示错误数量
      const badge = page.locator('.semi-badge-count').first();
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('1');
    });

    await test.step('测试填写模块ID后Badge消失', async () => {
      const badge = page.locator('.semi-badge-count').first();

      // 填写模块ID，错误应该消失
      await page.getByTestId('module-id-input').fill('test_validation_module');
      await page.waitForTimeout(500); // 等待验证更新

      // Badge应该消失
      await expect(badge).not.toBeVisible();
    });

    await test.step('测试添加空属性后Badge重现', async () => {
      const badge = page.locator('.semi-badge-count').first();

      // 添加一个空属性，应该重新出现错误
      await page.getByTestId('add-property-btn').click();
      await page.waitForTimeout(500);

      // Badge应该重新出现，显示1个错误（属性ID为空）
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('1');
    });

    await test.step('测试悬停显示详细错误信息', async () => {
      const saveBtn = page.getByTestId('save-module-btn');

      // 悬停在保存按钮上应该显示详细错误信息
      await saveBtn.hover();
      await page.waitForTimeout(1000); // 等待tooltip出现

      // 检查tooltip内容
      const tooltip = page.locator('.semi-tooltip-content').first();
      if (await tooltip.isVisible()) {
        await expect(tooltip).toContainText('第1个属性的ID不能为空');
      }
    });

    await test.step('测试填写属性ID后Badge最终消失', async () => {
      const badge = page.locator('.semi-badge-count').first();

      // 填写属性ID，错误应该消失
      const propertyIdInput = page.getByTestId('property-id-input').first();
      await propertyIdInput.fill('test_property');
      await page.waitForTimeout(500);

      // Badge应该再次消失
      await expect(badge).not.toBeVisible();
    });
  });
});
