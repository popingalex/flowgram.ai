import { inject, injectable } from 'inversify';
import {
  WorkflowDocument,
  WorkflowLineEntity,
  WorkflowNodeEntity,
  WorkflowNodeLinesData,
} from '@flowgram.ai/free-layout-core';

import { Layout, type LayoutOptions } from './layout';

@injectable()
export class AutoLayoutService {
  @inject(WorkflowDocument) private readonly document: WorkflowDocument;

  public async layout(options: LayoutOptions = {}): Promise<void> {
    await this.layoutNode(this.document.root, options);
  }

  private async layoutNode(node: WorkflowNodeEntity, options: LayoutOptions): Promise<void> {
    // 获取子节点
    const nodes = node.blocks;
    if (!nodes || !Array.isArray(nodes) || !nodes.length) {
      return;
    }

    // 获取子线条
    const edges = this.getNodesAllLines(nodes);

    // 先递归执行子节点 autoLayout
    await Promise.all(nodes.map(async (child) => this.layoutNode(child, options)));

    const layout = new Layout();
    layout.init({ nodes, edges, container: node }, options);
    layout.layout();
    await layout.position();
  }

  private getNodesAllLines(nodes: WorkflowNodeEntity[]): WorkflowLineEntity[] {
    const lines = nodes
      .map((node) => {
        const linesData = node.getData<WorkflowNodeLinesData>(WorkflowNodeLinesData);
        const outputLines = linesData.outputLines.filter(Boolean);
        const inputLines = linesData.inputLines.filter(Boolean);
        return [...outputLines, ...inputLines];
      })
      .flat();

    return lines;
  }
}
