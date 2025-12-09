"""
ALT系统FastAPI应用入口文件

这个文件是ALT系统的FastAPI应用入口点，用于启动API服务器。
它导入了api_utli.py中配置好的FastAPI应用实例，并使用uvicorn来运行服务器。
"""

# 不再直接导入app，而是使用字符串引用以支持重载功能
# from ALT_pure.core.api.api_utli import app
import uvicorn

if __name__ == "__main__":
    """
    主函数，启动FastAPI服务器
    
    服务器将运行在http://127.0.0.1:8000
    """
    print("正在启动ALT系统API服务器...")
    print("服务器配置:")
    print("  主机: 127.0.0.1")
    print("  端口: 8082")
    print("  调试模式: True")
    print()
    print("可访问的地址:")
    print("  主页: http://127.0.0.1:8082")
    print("  交互式API文档: http://127.0.0.1:8082/docs")
    print("  ReDoc API文档: http://127.0.0.1:8082/redoc")
    print()
    print("按 Ctrl+C 停止服务器")
    print("=" * 60)
    
    # 使用uvicorn运行FastAPI应用，通过字符串引用以支持重载
    uvicorn.run(
        "ALT_pure.core.api.api_utli:app", 
        host="127.0.0.1", 
        port=8082, 
        reload=True  # 启用热重载，便于开发
    )