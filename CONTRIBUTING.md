# 贡献指南

感谢您有兴趣为DiaryMind项目做贡献！我们欢迎各种形式的贡献，包括但不限于代码提交、文档改进、功能建议和bug报告。

## 行为准则

在参与本项目时，请遵守以下行为准则：

1. 尊重他人，保持友善和专业的态度
2. 接受建设性的批评和建议
3. 关注项目的最佳利益
4. 以身作则，营造良好社区氛围

## 如何贡献

### 报告Bug

如果您发现了bug，请按照以下步骤操作：

1. 检查是否已有相关的issue
2. 如果没有，请创建一个新的issue
3. 在issue中详细描述：
   - Bug的具体表现
   - 重现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、浏览器、版本等）

### 提出功能建议

如果您有好的功能想法：

1. 检查是否已有相关讨论
2. 创建一个新的issue描述您的想法
3. 详细说明功能的用途和价值
4. 如果可能，提供实现思路

### 代码贡献

#### 开发环境搭建

1. Fork项目仓库
2. 克隆到本地：
   ```bash
   git clone https://github.com/your-username/DiaryMind.git
   ```
3. 按照README中的说明搭建前后端环境

#### 分支管理

请遵循以下分支命名约定：
- `feature/功能名称` - 新功能开发
- `bugfix/问题描述` - bug修复
- `hotfix/紧急修复` - 紧急问题修复
- `docs/文档说明` - 文档更新

#### 代码规范

##### Python后端
- 遵循PEP8编码规范
- 使用类型提示
- 编写单元测试
- 保持函数简短，单一职责

##### JavaScript前端
- 使用ES6+语法
- 遵循Airbnb JavaScript风格指南
- 使用函数式组件和Hooks
- 组件拆分合理，避免过大组件

#### 提交Pull Request

1. 确保代码通过所有测试
2. 更新相关文档
3. 编写清晰的提交信息
4. 创建Pull Request并详细描述变更内容

### 文档贡献

文档是项目的重要组成部分，您可以通过以下方式帮助改进：

1. 修正错别字和语法错误
2. 补充缺失的说明
3. 改进表述不清的内容
4. 添加使用示例

## 开发流程

### 项目结构回顾

```
DiaryMind/
├── server/                 # 后端服务
│   ├── ALT_pure/           # 核心模块
│   │   ├── config/         # 配置文件
│   │   ├── core/           # 核心功能
│   │   │   ├── api/        # API接口
│   │   │   ├── llm/        # 大语言模型
│   │   │   ├── tts/        # 文本转语音
│   │   │   ├── asr/        # 语音识别
│   │   │   └── common/     # 公共功能
│   │   └── utils/          # 工具函数
│   ├── main.py             # 应用入口
│   └── requirements.txt    # Python依赖
└── ui/                     # 前端界面
    ├── src/                # 源代码
    │   ├── components/     # React组件
    │   ├── App.jsx         # 主应用组件
    │   └── main.jsx        # 应用入口
    └── package.json        # Node.js依赖
```

### API开发指南

#### 添加新的API端点

1. 在 `server/ALT_pure/core/api/` 目录下创建新的API模块
2. 使用FastAPI装饰器定义路由
3. 在 `api_utli.py` 中注册新路由
4. 添加Swagger文档说明
5. 编写单元测试

示例：
```python
from fastapi import APIRouter

router = APIRouter(prefix="/new-feature", tags=["新功能"])

@router.get("/")
async def new_feature_endpoint():
    """
    新功能端点说明
    
    Returns:
        dict: 返回结果说明
    """
    return {"message": "新功能实现"}
```

#### 组件开发指南

##### 创建新React组件

1. 在 `ui/src/components/` 目录下创建新的组件文件
2. 使用函数式组件和Hooks
3. 遵循现有的样式规范
4. 添加PropTypes类型检查

示例：
```jsx
import React from 'react';
import PropTypes from 'prop-types';

const NewComponent = ({ title }) => {
  return (
    <div className="interactive-card">
      <h2>{title}</h2>
      {/* 组件内容 */}
    </div>
  );
};

NewComponent.propTypes = {
  title: PropTypes.string.isRequired,
};

export default NewComponent;
```

## 测试

### 后端测试

运行测试：
```bash
cd server
python -m pytest tests/ -v
```

测试覆盖范围应包括：
- API端点测试
- 业务逻辑测试
- 错误处理测试
- 边界条件测试

### 前端测试

运行测试：
```bash
cd ui
npm test
```

测试应包括：
- 组件渲染测试
- 用户交互测试
- 状态管理测试
- API调用测试

## 代码审查

所有Pull Request都需要经过代码审查才能合并。审查关注点包括：

1. 代码质量和可读性
2. 功能实现的正确性
3. 性能影响评估
4. 安全性考虑
5. 文档完整性

## 发布流程

项目使用语义化版本控制（Semantic Versioning）：

- MAJOR版本：不兼容的API变更
- MINOR版本：向后兼容的功能新增
- PATCH版本：向后兼容的问题修复

发布步骤：
1. 更新版本号
2. 更新CHANGELOG.md
3. 创建Git标签
4. 发布到包管理器（如适用）

## 社区和支持

### 获取帮助

如果您在贡献过程中遇到问题：

1. 查看现有文档
2. 搜索相关issue
3. 在issue中提问
4. 联系项目维护者

### 交流渠道

- GitHub Issues: 主要讨论渠道
- Email: 项目维护者联系方式（如果有）

## 许可证

通过贡献代码，您同意您的贡献将遵循项目的MIT许可证。

## 致谢

我们会定期更新贡献者名单，感谢每一位为项目做出贡献的人！

---

再次感谢您对DiaryMind项目的关注和贡献！