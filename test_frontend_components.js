/**
 * 前端组件测试脚本
 * 用于测试DiaryMind前端组件的功能完整性
 * 运行方式: node test_frontend_components.js
 */

const fs = require('fs');
const path = require('path');

// 组件目录路径
const componentsDir = path.join(__dirname, 'ui', 'src', 'components');

// 测试结果
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  components: []
};

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
    return null;
  }
}

// 检查组件基本结构
function checkComponentStructure(fileName, content) {
  const checks = {
    hasReactImport: /import\s+React/.test(content),
    hasComponentExport: /(export\s+(default\s+)?(function|const|class|[A-Za-z_][A-Za-z0-9_]*))|export\s*\{/.test(content),
    hasJsx: /<[A-Za-z]/.test(content)
  };
  
  return checks;
}

// 检查组件特定功能
function checkComponentFeatures(fileName, content) {
  const features = {};
  
  // 根据组件名称检查特定功能
  switch (fileName) {
    case 'SidebarMenu.jsx':
      features.hasNavigation = /onNavigate/.test(content);
      features.hasMenuToggle = /isOpen/.test(content);
      break;
    case 'DiaryList.jsx':
      features.hasDiaryItems = /diaryItems|entries/.test(content);
      features.hasClickHandler = /onClick|onSelect/.test(content);
      break;
    case 'TodoList.jsx':
      features.hasTodoProps = /todos|onUpdateTodo/.test(content);
      features.hasTodoActions = /toggle-hidden|activate|pause|complete/.test(content);
      break;
    case 'InputBar.jsx':
      features.hasInputHandling = /onSendMessage|onChange/.test(content);
      features.hasSuggestions = /suggestion|autocomplete/.test(content);
      break;
    case 'Clock.jsx':
      features.hasTimeDisplay = /time|date/.test(content);
      features.hasUseEffect = /useEffect/.test(content);
      break;
    case 'Calendar.jsx':
      features.hasCalendarView = /calendar|date/.test(content);
      features.hasDateNavigation = /prev|next|today/.test(content);
      break;
    case 'MusicPlayer.jsx':
      features.hasPlaylist = /playlist/.test(content);
      features.hasPlayControls = /play|pause|next|prev/.test(content);
      break;
    default:
      features.genericCheck = true;
  }
  
  return features;
}

// 测试单个组件
function testComponent(fileName) {
  const filePath = path.join(componentsDir, fileName);
  
  testResults.total++;
  
  if (!fileExists(filePath)) {
    testResults.failed++;
    testResults.components.push({
      name: fileName,
      status: 'failed',
      reason: '文件不存在'
    });
    return;
  }
  
  const content = readFile(filePath);
  if (!content) {
    testResults.failed++;
    testResults.components.push({
      name: fileName,
      status: 'failed',
      reason: '无法读取文件内容'
    });
    return;
  }
  
  // 检查基本结构
  const structureChecks = checkComponentStructure(fileName, content);
  const isStructurallyValid = Object.values(structureChecks).every(Boolean);
  
  // 检查特定功能
  const featureChecks = checkComponentFeatures(fileName, content);
  const hasRequiredFeatures = Object.values(featureChecks).every(Boolean);
  
  if (isStructurallyValid && hasRequiredFeatures) {
    testResults.passed++;
    testResults.components.push({
      name: fileName,
      status: 'passed',
      structure: structureChecks,
      features: featureChecks
    });
  } else {
    testResults.failed++;
    testResults.components.push({
      name: fileName,
      status: 'failed',
      structure: structureChecks,
      features: featureChecks,
      reason: '结构或功能不完整'
    });
  }
}

// 运行所有组件测试
function runComponentTests() {
  console.log('🎯 前端组件测试脚本');
  console.log('=' * 50);
  console.log(`📁 测试目录: ${componentsDir}`);
  
  // 获取所有组件文件
  const componentFiles = fs.readdirSync(componentsDir)
    .filter(file => file.endsWith('.jsx') || file.endsWith('.tsx'));
  
  console.log(`\n📋 找到 ${componentFiles.length} 个组件文件:`);
  console.log(componentFiles.map(file => `   ${file}`).join('\n'));
  
  // 测试每个组件
  console.log('\n🔍 开始测试组件...');
  console.log('-'.repeat(30));
  
  componentFiles.forEach(file => {
    testComponent(file);
  });
  
  // 生成测试报告
  generateTestReport();
}

// 生成测试报告
function generateTestReport() {
  console.log('\n' + '=' * 50);
  console.log('📊 测试报告总结');
  console.log('-'.repeat(30));
  
  console.log(`   总组件数: ${testResults.total}`);
  console.log(`   通过: ${testResults.passed} ✅`);
  console.log(`   失败: ${testResults.failed} ❌`);
  console.log(`   通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 组件测试详情:');
  console.log('-'.repeat(30));
  
  testResults.components.forEach(component => {
    const statusIcon = component.status === 'passed' ? '✅' : '❌';
    console.log(`${statusIcon} ${component.name} - ${component.status.toUpperCase()}`);
    
    if (component.status === 'failed') {
      console.log(`   原因: ${component.reason}`);
    }
    
    // 显示结构检查结果
    if (component.structure) {
      console.log('   结构检查:');
      Object.entries(component.structure).forEach(([key, value]) => {
        const checkIcon = value ? '✅' : '❌';
        console.log(`     ${checkIcon} ${key.replace(/([A-Z])/g, ' $1').trim()}`);
      });
    }
    
    // 显示功能检查结果
    if (component.features) {
      console.log('   功能检查:');
      Object.entries(component.features).forEach(([key, value]) => {
        const checkIcon = value ? '✅' : '❌';
        console.log(`     ${checkIcon} ${key.replace(/([A-Z])/g, ' $1').trim()}`);
      });
    }
    
    console.log('');
  });
  
  // 最终结论
  console.log('=' * 50);
  if (testResults.failed === 0) {
    console.log('🎉 所有组件测试通过！前端功能完整。');
  } else {
    console.log(`⚠️  有 ${testResults.failed} 个组件测试失败，需要进一步检查。`);
  }
  console.log('\n测试完成！');
}

// 检查App.jsx的完整性
function testAppComponent() {
  console.log('\n' + '=' * 50);
  console.log('🔍 App.jsx 集成测试');
  console.log('-'.repeat(30));
  
  const appPath = path.join(__dirname, 'ui', 'src', 'App.jsx');
  if (!fileExists(appPath)) {
    console.log('❌ App.jsx 文件不存在');
    return;
  }
  
  const appContent = readFile(appPath);
  if (!appContent) {
    console.log('❌ 无法读取App.jsx内容');
    return;
  }
  
  // 检查App.jsx的关键功能
  const appChecks = {
    hasComponentImports: /import\s+(.*)from/.test(appContent),
    hasStateManagement: /useState|useEffect/.test(appContent),
    hasViewNavigation: /currentView|setCurrentView/.test(appContent),
    hasTaskManagement: /todos|onUpdateTodo/.test(appContent),
    hasMusicPlayer: /playlist|isPlaying/.test(appContent),
    hasChatFunctionality: /onSendMessage|chatResponse/.test(appContent),
    hasFlowMode: /isFlowMode|FlowMode/.test(appContent)
  };
  
  console.log('📋 App.jsx 功能检查:');
  let appPassed = true;
  
  Object.entries(appChecks).forEach(([key, value]) => {
    const checkIcon = value ? '✅' : '❌';
    console.log(`   ${checkIcon} ${key.replace(/([A-Z])/g, ' $1').trim()}`);
    if (!value) appPassed = false;
  });
  
  console.log('\n' + '=' * 50);
  if (appPassed) {
    console.log('🎉 App.jsx 集成测试通过！应用结构完整。');
  } else {
    console.log('⚠️  App.jsx 缺少某些功能，需要进一步检查。');
  }
}

// 主函数
function main() {
  runComponentTests();
  testAppComponent();
  
  // 检查项目配置文件
  console.log('\n' + '=' * 50);
  console.log('🔍 项目配置检查');
  console.log('-'.repeat(30));
  
  const configFiles = [
    path.join(__dirname, 'ui', 'package.json'),
    path.join(__dirname, 'ui', 'vite.config.js'),
    path.join(__dirname, 'ui', 'index.html')
  ];
  
  configFiles.forEach(file => {
    const exists = fileExists(file);
    const statusIcon = exists ? '✅' : '❌';
    console.log(`${statusIcon} ${path.basename(file)} - ${exists ? '存在' : '不存在'}`);
  });
  
  console.log('\n' + '=' * 50);
  console.log('测试完成！');
}

// 运行测试
main();
