// 测试实体切换功能
console.log('=== 开始测试实体切换 ===');

// 查找实体选择器
const selectors = [
  'div[class*="semi-select"]',
  '.semi-select',
  '[role="combobox"]',
  'input[placeholder*="选择实体"]',
];

let entitySelector = null;
for (const selector of selectors) {
  entitySelector = document.querySelector(selector);
  if (entitySelector) {
    console.log('找到实体选择器:', selector);
    break;
  }
}

if (entitySelector) {
  console.log('点击实体选择器...');
  entitySelector.click();

  // 等待下拉菜单出现
  setTimeout(() => {
    const options = document.querySelectorAll(
      '[role="option"], .semi-select-option, .semi-select-option-text'
    );
    console.log('找到选项数量:', options.length);

    // 打印所有选项
    options.forEach((option, index) => {
      console.log(`选项 ${index}: ${option.textContent}`);
    });

    // 查找task实体
    for (let option of options) {
      if (option.textContent && option.textContent.toLowerCase().includes('task')) {
        console.log('找到task选项，点击...');
        option.click();
        return;
      }
    }

    // 如果没找到task，尝试点击第二个选项
    if (options.length > 1) {
      console.log('点击第二个选项...');
      options[1].click();
    }
  }, 1000);
} else {
  console.log('未找到实体选择器，尝试其他方法...');

  // 尝试查找所有可能的选择器元素
  const allSelects = document.querySelectorAll('*[class*="select"]');
  console.log('找到的select相关元素:', allSelects.length);
  allSelects.forEach((el, i) => {
    console.log(`元素 ${i}:`, el.className, el.tagName);
  });
}

console.log('=== 测试脚本执行完成 ===');
