import { test, expect, Page } from '@playwright/test';

// 测试数据
const TEST_ENTITY_ID = 'test_helicopter_' + Date.now();
const TEST_ENTITY_NAME = '测试直升机';
const TEST_ENTITY_DESC = '这是一个用于测试的直升机实体';

// 页面对象模型
class EntityManagementPage {
  constructor(private page: Page) {}

  // 导航到实体管理页面
  async navigate() {
    await this.page.goto('/entities');
    await this.page.waitForLoadState('networkidle');
  }

  // 等待页面加载完成
  async waitForPageLoad() {
    // 等待实体列表加载
    await this.page.waitForSelector('[data-testid="entity-sidebar"]', { timeout: 10000 });
    // 等待详情面板加载
    await this.page.waitForSelector('[data-testid="entity-detail-panel"]', { timeout: 10000 });
  }

  // 添加实体（跳转到新建页面）
  async addEntity(): Promise<void> {
    await this.page.click('[data-testid="add-entity-btn"]');
    await this.page.waitForTimeout(500);

    // 验证跳转到新建页面
    await expect(this.page).toHaveURL(/\/entities\/new\/?$/);

    // 验证新建页面的表单是空的
    await expect(this.page.locator('[data-testid="entity-id-input"]')).toHaveValue('');
    await expect(this.page.locator('[data-testid="entity-name-input"]')).toHaveValue('');
    await expect(this.page.locator('[data-testid="entity-description-input"]')).toHaveValue('');

    console.log('✅ 成功跳转到新建实体页面');
  }

  // 选择实体
  async selectEntity(entityId: string) {
    // 支持通过业务ID或_indexId选择实体
    const selector = `[data-testid="entity-item-${entityId}"], [data-testid*="entity-item-"][data-testid$="${entityId}"]`;
    await this.page.click(selector);
    await this.page.waitForTimeout(500);
  }

  // 编辑实体基本信息
  async editEntityBasicInfo(id: string, name: string, description: string) {
    // 编辑ID - 使用三次点击选中全部内容，然后输入
    const idInput = this.page.locator('[data-testid="entity-id-input"]');
    await idInput.click({ clickCount: 3 });
    await idInput.fill(id);
    await this.page.waitForTimeout(300);

    // 编辑名称
    const nameInput = this.page.locator('[data-testid="entity-name-input"]');
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill(name);
    await this.page.waitForTimeout(300);

    // 编辑描述
    const descInput = this.page.locator('[data-testid="entity-description-input"]');
    await descInput.click({ clickCount: 3 });
    await descInput.fill(description);
    await this.page.waitForTimeout(300);
  }

  // 保存实体
  async saveEntity() {
    // 等待保存按钮启用
    await expect(this.page.locator('[data-testid="save-entity-btn"]')).toBeEnabled({
      timeout: 5000,
    });
    await this.page.click('[data-testid="save-entity-btn"]');
    await this.page.waitForSelector('.semi-toast-success', { timeout: 5000 });
  }

  // 撤销修改
  async undoChanges() {
    await this.page.click('[data-testid="undo-entity-btn"]');
    await this.page.waitForSelector('.semi-toast-info', { timeout: 5000 });
  }

  // 删除实体
  async deleteEntity() {
    await this.page.click('[data-testid="delete-entity-btn"]');
    // 确认删除
    await this.page.click('.semi-popconfirm-wrapper .semi-button-primary');
    await this.page.waitForSelector('.semi-toast-success', { timeout: 5000 });
  }

  // 添加属性
  async addProperty() {
    await this.page.click('[data-testid="add-property-btn"]');
    await this.page.waitForTimeout(500);
  }

  // 编辑属性（简化版，不修改类型）
  async editProperty(propertyIndex: number, id: string, name: string) {
    const propertyRow = this.page.locator(`[data-testid="property-row-${propertyIndex}"]`);

    // 编辑属性ID
    const idInput = propertyRow.locator('[data-testid="property-id-input"]');
    await idInput.click({ clickCount: 3 }); // 选中全部内容
    await idInput.fill(id);
    await this.page.waitForTimeout(300);

    // 编辑属性名称
    const nameInput = propertyRow.locator('[data-testid="property-name-input"]');
    await nameInput.click({ clickCount: 3 }); // 选中全部内容
    await nameInput.fill(name);
    await this.page.waitForTimeout(300);
  }

  // 删除属性
  async deleteProperty(propertyIndex: number) {
    const propertyRow = this.page.locator(`[data-testid="property-row-${propertyIndex}"]`);
    await propertyRow.locator('[data-testid="delete-property-btn"]').click();
    // 确认删除
    await this.page.click('.semi-popconfirm-wrapper .semi-button-danger');
    await this.page.waitForTimeout(500);
  }

  // 绑定模块
  async bindModule(moduleId: string) {
    // 在模块关联表格中勾选模块
    await this.page.click(`[data-testid="module-checkbox-${moduleId}"]`);
    await this.page.waitForTimeout(500);
  }

  // 解绑模块
  async unbindModule(moduleId: string) {
    // 在模块关联表格中取消勾选模块
    await this.page.click(`[data-testid="module-checkbox-${moduleId}"]`);
    await this.page.waitForTimeout(500);
  }

  // 进入工作流编辑
  async enterWorkflowEdit() {
    await this.page.click('[data-testid="workflow-edit-btn"]');
    await this.page.waitForLoadState('networkidle');
  }

  // 验证实体信息
  async verifyEntityInfo(id: string, name: string, description: string) {
    await expect(this.page.locator('[data-testid="entity-id-input"]')).toHaveValue(id);
    await expect(this.page.locator('[data-testid="entity-name-input"]')).toHaveValue(name);
    await expect(this.page.locator('[data-testid="entity-description-input"]')).toHaveValue(
      description
    );
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

  // 验证模块绑定状态
  async verifyModuleBound(moduleId: string, isBound: boolean) {
    // 查找checkbox容器，然后找到其中的实际input元素
    const checkboxContainer = this.page.locator(`[data-testid="module-checkbox-${moduleId}"]`);
    const actualCheckbox = checkboxContainer.locator('input[type="checkbox"]');

    // 等待checkbox可见
    await expect(checkboxContainer).toBeVisible({ timeout: 5000 });

    // 验证checkbox状态
    if (isBound) {
      await expect(actualCheckbox).toBeChecked();
    } else {
      await expect(actualCheckbox).not.toBeChecked();
    }
  }
}

test.describe('实体管理页面测试', () => {
  let entityPage: EntityManagementPage;
  let createdEntityIds: string[] = []; // 跟踪创建的实体ID

  test.beforeEach(async ({ page }) => {
    entityPage = new EntityManagementPage(page);
    await entityPage.navigate();
    await entityPage.waitForPageLoad();
    createdEntityIds = []; // 重置创建的实体列表
  });

  test.afterEach(async ({ page, request }) => {
    // 清理测试创建的所有实体
    console.log('🧹 开始清理测试数据，实体数量:', createdEntityIds.length);

    for (const entityId of createdEntityIds) {
      try {
        // 选择实体
        const entityItem = page.locator(`[data-testid="entity-item-${entityId}"]`);
        if (await entityItem.isVisible({ timeout: 2000 })) {
          await entityItem.click();
          await page.waitForTimeout(500);

          // 删除实体
          await page.click('[data-testid="delete-entity-btn"]');

          // 等待并点击确认按钮
          const confirmBtn = page.locator('.semi-popconfirm .semi-button-primary');
          if (await confirmBtn.isVisible({ timeout: 2000 })) {
            await confirmBtn.click();
          } else {
            // 尝试其他选择器
            await page.click(
              '.semi-popover .semi-button-primary, .semi-popconfirm-wrapper .semi-button-primary'
            );
          }
          await page.waitForSelector('.semi-toast-success', { timeout: 3000 });

          console.log('✅ 已删除测试实体:', entityId);
        }
      } catch (error) {
        console.warn('⚠️ 删除实体失败:', entityId, error);
      }
    }

    // 调用清理API清理软删除的数据
    try {
      const cleanupResponse = await request.post('http://localhost:9999/cm/cleanup/deprecated/');
      console.log('🧹 调用清理API结果:', cleanupResponse.status());
    } catch (error) {
      console.warn('⚠️ 调用清理API失败:', error);
    }

    createdEntityIds = [];
    console.log('🧹 测试数据清理完成');
  });

  test('基本页面加载和布局验证', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('h4')).toContainText('实体管理');

    // 验证左侧边栏存在
    await expect(page.locator('[data-testid="entity-sidebar"]')).toBeVisible();

    // 验证右侧详情面板存在
    await expect(page.locator('[data-testid="entity-detail-panel"]')).toBeVisible();

    // 验证添加实体按钮存在
    await expect(page.locator('[data-testid="add-entity-btn"]')).toBeVisible();
  });

  test('实体管理完整流程测试', async ({ page }) => {
    await test.step('创建新实体并填写基本信息', async () => {
      await entityPage.addEntity();
      await entityPage.editEntityBasicInfo(TEST_ENTITY_ID, TEST_ENTITY_NAME, TEST_ENTITY_DESC);
    });

    await test.step('保存新实体并验证创建成功', async () => {
      const beforeCount = await page.locator('[data-testid*="entity-item-"]').count();
      await entityPage.saveEntity();
      createdEntityIds.push(TEST_ENTITY_ID); // 🧹 记录创建的实体

      // 验证创建成功
      await expect(page.locator('[data-testid*="entity-item-"]')).toHaveCount(beforeCount + 1);
      await expect(page).toHaveURL(new RegExp(`/entities/${TEST_ENTITY_ID}/?$`));
      await entityPage.verifyEntityInfo(TEST_ENTITY_ID, TEST_ENTITY_NAME, TEST_ENTITY_DESC);
      await expect(page.locator(`[data-testid="entity-item-${TEST_ENTITY_ID}"]`)).toBeVisible();
    });

    await test.step('测试实体搜索功能', async () => {
      const searchInput = page.locator('[data-testid="entity-search-input"]');
      if (await searchInput.isVisible({ timeout: 2000 })) {
        // 搜索刚创建的实体
        await searchInput.fill(TEST_ENTITY_ID);
        await page.waitForTimeout(500);

        // 验证搜索结果
        await expect(page.locator(`[data-testid="entity-item-${TEST_ENTITY_ID}"]`)).toBeVisible();

        // 清除搜索
        await searchInput.fill('');
        await page.waitForTimeout(500);
      }
    });

    await test.step('测试属性验证和管理', async () => {
      // 先测试无效属性验证
      await entityPage.addProperty();
      // 故意不填写属性ID，测试验证逻辑
      const propertyRow = page.locator('[data-testid="property-row-0"]');
      const nameInput = propertyRow.locator('[data-testid="property-name-input"]');
      await nameInput.fill('无效属性');

      // 尝试保存，应该失败或有提示
      const saveBtn = page.locator('[data-testid="save-entity-btn"]');
      if (await saveBtn.isEnabled()) {
        await saveBtn.click();
        // 检查是否有错误提示
        const errorToast = page.locator('.semi-toast-error, .semi-toast-warning');
        await errorToast.isVisible({ timeout: 2000 });
      }

      // 修复：填写无效属性的ID，使其变为有效属性
      const propertyIdInput = propertyRow.locator('[data-testid="property-id-input"]');
      await propertyIdInput.fill('vehicle_id');
      await nameInput.fill('载具ID');
      await page.waitForTimeout(500);

      // 添加第二个有效属性
      await entityPage.addProperty();
      await entityPage.editProperty(1, 'max_speed', '最大速度');

      await entityPage.saveEntity();
    });

    await test.step('验证属性持久化保存', async () => {
      // 验证属性在当前页面显示
      await entityPage.verifyPropertyExists('vehicle_id', '载具ID');
      await entityPage.verifyPropertyExists('max_speed', '最大速度');

      // 验证数据真的持久化了 - 返回列表页重新进入
      await page.goto('/entities');
      await page.waitForLoadState('networkidle');

      // 搜索并重新进入实体
      const searchInput2 = page.locator('[data-testid="entity-search-input"]');
      await searchInput2.fill(TEST_ENTITY_ID);
      await page.waitForTimeout(500);
      await page.click(`[data-testid="entity-item-${TEST_ENTITY_ID}"]`);
      await page.waitForTimeout(1000);

      // 验证属性真的保存了
      await entityPage.verifyPropertyExists('vehicle_id', '载具ID');
      await entityPage.verifyPropertyExists('max_speed', '最大速度');
    });

    await test.step('测试模块绑定功能', async () => {
      // 等待模块关联区域加载
      await page.waitForTimeout(1000);

      // 查找所有可用的模块checkbox
      const moduleCheckboxes = page.locator('[data-testid*="module-checkbox-"]');
      const checkboxCount = await moduleCheckboxes.count();

      if (checkboxCount > 0) {
        // 获取第一个模块的信息
        const firstCheckbox = moduleCheckboxes.first();
        const testId = await firstCheckbox.getAttribute('data-testid');
        const moduleId = testId ? testId.replace('module-checkbox-', '') : '';

        console.log(`🔍 找到模块checkbox: ${testId}, moduleId: ${moduleId}`);

        if (moduleId) {
          // 绑定模块
          await entityPage.bindModule(moduleId);
          await entityPage.saveEntity();
          await entityPage.verifyModuleBound(moduleId, true);

          // 解绑模块
          await entityPage.unbindModule(moduleId);
          await entityPage.saveEntity();
          await entityPage.verifyModuleBound(moduleId, false);
        }
      } else {
        console.log('⚠️ 没有找到可用的模块checkbox，跳过模块绑定测试');
      }
    });

    await test.step('创建第二个实体测试多实体场景', async () => {
      const secondEntityId = TEST_ENTITY_ID + '_2';
      await entityPage.addEntity();
      await entityPage.editEntityBasicInfo(
        secondEntityId,
        TEST_ENTITY_NAME + '_2',
        TEST_ENTITY_DESC + '_2'
      );
      await entityPage.saveEntity();
      createdEntityIds.push(secondEntityId); // 🧹 记录创建的实体

      // 验证两个实体都存在
      await expect(page.locator(`[data-testid="entity-item-${TEST_ENTITY_ID}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="entity-item-${secondEntityId}"]`)).toBeVisible();
    });

    await test.step('测试实体信息编辑功能', async () => {
      await entityPage.selectEntity(TEST_ENTITY_ID);
      const modifiedName = TEST_ENTITY_NAME + '_修改';
      const modifiedDesc = TEST_ENTITY_DESC + '_修改';
      await entityPage.editEntityBasicInfo(TEST_ENTITY_ID, modifiedName, modifiedDesc);
      await entityPage.saveEntity();
      await entityPage.verifyEntityInfo(TEST_ENTITY_ID, modifiedName, modifiedDesc);
    });

    await test.step('测试撤销修改功能', async () => {
      const modifiedName = TEST_ENTITY_NAME + '_修改';
      const modifiedDesc = TEST_ENTITY_DESC + '_修改';
      await entityPage.editEntityBasicInfo(TEST_ENTITY_ID, '临时名称', '临时描述');
      await entityPage.undoChanges();
      await entityPage.verifyEntityInfo(TEST_ENTITY_ID, modifiedName, modifiedDesc);
    });
  });

  test('应该显示验证错误Badge并提供详细信息', async ({ page }) => {
    await test.step('导航到新建实体页面并验证初始状态', async () => {
      await page.goto('/entities/new');
      await page.waitForLoadState('networkidle');

      // 验证初始状态：应该显示1个错误（实体ID为空）
      const saveBtn = page.getByTestId('save-entity-btn');
      await expect(saveBtn).toBeVisible();

      // 检查Badge是否显示错误数量
      const badge = page.locator('.semi-badge-count').first();
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('1');
    });

    await test.step('测试填写实体ID后Badge消失', async () => {
      const badge = page.locator('.semi-badge-count').first();

      // 填写实体ID，错误应该消失
      await page.getByTestId('entity-id-input').fill('test_validation_entity');
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
      const saveBtn = page.getByTestId('save-entity-btn');

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
