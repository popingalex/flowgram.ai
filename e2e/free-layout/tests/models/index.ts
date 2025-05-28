import type { Page } from '@playwright/test';

class FreeLayoutModel {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // 获取节点数量
  async getNodeCount() {
    return await this.page.evaluate(
      () => document.querySelectorAll('[data-testid="sdk.workflow.canvas.node"]').length
    );
  }

  async addConditionNode() {
    const preConditionNodes = await this.page.locator('.gedit-flow-activity-node');
    const preCount = await preConditionNodes.count();
    const button = this.page.locator('[data-testid="demo.free-layout.add-node"]');
    // open add node panel
    await button.click();
    await this.page.waitForSelector('[data-testid="demo-free-node-list-condition"]');
    // add condition
    const conditionItem = this.page.locator('[data-testid="demo-free-node-list-condition"]');
    await conditionItem.click();
    // determine whether the node was successfully added
    await this.page.waitForFunction(
      (expectedCount) =>
        document.querySelectorAll('.gedit-flow-activity-node').length === expectedCount,
      preCount + 1
    );
  }
}

export default FreeLayoutModel;
