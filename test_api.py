#!/usr/bin/env python3
"""
API测试脚本，用于测试DiaryMind后端API的高可用性和功能完整性
"""

import requests
import time
import concurrent.futures
import json
import statistics
from datetime import datetime

BASE_URL = "http://127.0.0.1:8082"

# 测试API端点列表
API_ENDPOINTS = [
    # 公共API
    ("GET", "/"),
    ("GET", "/docs"),
    ("GET", "/redoc"),
    ("GET", "/health"),
    
    # 音乐API
    ("GET", "/api/music/list"),
    
    # LLM相关API
    ("POST", "/api/llm/chat", {"role": "你是助手", "message": "你好", "stream": False}),
    ("POST", "/api/llm/stream-chat", {"role": "你是助手", "message": "你好", "stream": True}),
    
    # TTS相关API
    ("GET", "/api/tts/platform"),
    ("GET", "/api/common/text/max-split-length"),
    
    # ASR相关API
    ("GET", "/api/asr/supported-models"),
    ("GET", "/api/asr/supported-languages"),
    
    # 公共功能接口
    ("POST", "/api/common/text/clean", {"text": "  这是一个测试文本   \n带换行的 "}),
    ("POST", "/api/common/text/cut", {"text": "这是一个测试文本，用于测试文本切割功能", "max_length": 10}),
    ("POST", "/api/common/text/merge", {"texts": ["这是第一段", "这是第二段", "这是第三段"]}),
]

def test_endpoint(method, url, data=None, headers=None):
    """测试单个API端点"""
    full_url = BASE_URL + url
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(full_url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(full_url, json=data, headers=headers, timeout=5)
        else:
            return {"status": "error", "url": url, "message": f"Unsupported method: {method}"}
        
        end_time = time.time()
        latency = end_time - start_time
        
        result = {
            "status": "success" if response.status_code < 400 else "failure",
            "url": url,
            "method": method,
            "status_code": response.status_code,
            "latency": latency,
            "response_time": f"{latency:.3f}s"
        }
        
        # 检查响应内容（可选）
        if response.status_code == 200:
            result["has_content"] = True
        
        return result
        
    except requests.exceptions.Timeout:
        return {
            "status": "timeout",
            "url": url,
            "method": method,
            "message": "Request timed out after 5 seconds"
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "connection_error",
            "url": url,
            "method": method,
            "message": "Failed to connect to server"
        }
    except Exception as e:
        return {
            "status": "error",
            "url": url,
            "method": method,
            "message": str(e)
        }

def run_load_test(endpoint, concurrent_users=10, requests_per_user=5, duration=None):
    """运行负载测试"""
    method, url = endpoint[:2]
    data = endpoint[2] if len(endpoint) > 2 else None
    
    print(f"\n🚀 运行负载测试: {method} {url}")
    print(f"   并发用户: {concurrent_users}")
    print(f"   每个用户请求数: {requests_per_user}")
    if duration:
        print(f"   测试持续时间: {duration}s")
    
    results = []
    total_requests = concurrent_users * requests_per_user
    
    def user_task():
        """单个用户的请求任务"""
        user_results = []
        for _ in range(requests_per_user):
            result = test_endpoint(method, url, data)
            user_results.append(result)
            # 模拟用户思考时间
            time.sleep(0.1)
        return user_results
    
    start_time = time.time()
    
    # 使用线程池模拟并发用户
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
        futures = [executor.submit(user_task) for _ in range(concurrent_users)]
        
        for future in concurrent.futures.as_completed(futures):
            user_results = future.result()
            results.extend(user_results)
    
    end_time = time.time()
    total_time = end_time - start_time
    
    # 计算统计信息
    successful = sum(1 for r in results if r["status"] == "success")
    failed = total_requests - successful
    success_rate = (successful / total_requests) * 100
    
    # 延迟统计
    latencies = [r["latency"] for r in results if r["status"] == "success"]
    avg_latency = statistics.mean(latencies) if latencies else 0
    min_latency = min(latencies) if latencies else 0
    max_latency = max(latencies) if latencies else 0
    
    # 计算分位数
    p50 = statistics.median(latencies) if latencies else 0
    p95 = statistics.quantiles(latencies, n=20)[-1] if latencies else 0
    p99 = statistics.quantiles(latencies, n=100)[-1] if latencies else 0
    
    requests_per_second = total_requests / total_time
    
    print(f"\n📊 负载测试结果:")
    print(f"   总请求数: {total_requests}")
    print(f"   成功请求: {successful}")
    print(f"   失败请求: {failed}")
    print(f"   成功率: {success_rate:.2f}%")
    print(f"   总耗时: {total_time:.2f}s")
    print(f"   请求/秒: {requests_per_second:.2f} RPS")
    print(f"\n   延迟统计 (秒):")
    print(f"   - 最小值: {min_latency:.3f}s")
    print(f"   - 平均值: {avg_latency:.3f}s")
    print(f"   - 最大值: {max_latency:.3f}s")
    print(f"   - P50 (中位数): {p50:.3f}s")
    print(f"   - P95: {p95:.3f}s")
    print(f"   - P99: {p99:.3f}s")
    
    return {
        "total_requests": total_requests,
        "successful": successful,
        "failed": failed,
        "success_rate": success_rate,
        "total_time": total_time,
        "requests_per_second": requests_per_second,
        "latency_stats": {
            "min": min_latency,
            "avg": avg_latency,
            "max": max_latency,
            "p50": p50,
            "p95": p95,
            "p99": p99
        }
    }

def health_check_monitor(duration=60, interval=2):
    """健康检查监控 - 持续监控系统健康状态"""
    print(f"\n🔍 3. 健康检查监控")
    print(f"   监控时间: {duration}秒")
    print(f"   检查间隔: {interval}秒")
    print("-" * 30)
    
    health_endpoint = ("GET", "/health")
    checks = []
    
    start_time = time.time()
    end_time = start_time + duration
    
    while time.time() < end_time:
        result = test_endpoint(*health_endpoint)
        checks.append(result)
        
        status_icon = "✅" if result["status"] == "success" else "❌"
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"{status_icon} [{timestamp}] 健康检查 - {result['status'].upper()} ({result.get('response_time', 'N/A')})")
        
        time.sleep(interval)
    
    # 统计健康检查结果
    successful = sum(1 for r in checks if r["status"] == "success")
    total = len(checks)
    success_rate = (successful / total) * 100
    
    print(f"\n📊 健康检查统计:")
    print(f"   总检查次数: {total}")
    print(f"   成功次数: {successful}")
    print(f"   失败次数: {total - successful}")
    print(f"   成功率: {success_rate:.2f}%")
    print(f"   监控时长: {duration}秒")
    
    return {
        "total_checks": total,
        "successful": successful,
        "success_rate": success_rate,
        "duration": duration
    }

def fault_recovery_test():
    """故障恢复测试 - 模拟高负载后的恢复能力"""
    print("\n⚡ 4. 故障恢复测试")
    print("-" * 30)
    
    # 1. 测试正常负载下的响应
    print("\n1. 正常负载测试:")
    normal_endpoint = ("GET", "/api/music/list")
    normal_result = test_endpoint(*normal_endpoint)
    print(f"   响应时间: {normal_result['response_time']} (状态: {normal_result['status']})")
    
    # 2. 施加高负载
    print("\n2. 施加高负载 (100个并发请求):")
    high_load_endpoint = ("GET", "/api/music/list")
    load_result = run_load_test(high_load_endpoint, concurrent_users=100, requests_per_user=10)
    
    # 3. 测试恢复能力
    print("\n3. 恢复能力测试 (高负载后连续检查):")
    recovery_checks = []
    for i in range(10):
        result = test_endpoint(*normal_endpoint)
        recovery_checks.append(result)
        print(f"   检查 {i+1}/10 - 响应时间: {result['response_time']} (状态: {result['status']})")
        time.sleep(0.5)
    
    # 统计恢复测试结果
    recovery_successful = sum(1 for r in recovery_checks if r["status"] == "success")
    recovery_latencies = [r["latency"] for r in recovery_checks if r["status"] == "success"]
    avg_recovery_latency = statistics.mean(recovery_latencies) if recovery_latencies else 0
    
    print(f"\n📊 恢复测试统计:")
    print(f"   成功检查: {recovery_successful}/10 ({(recovery_successful/10)*100:.1f}%)")
    print(f"   平均恢复响应时间: {avg_recovery_latency:.3f}s")
    
    return {
        "recovery_success_rate": (recovery_successful/10)*100,
        "avg_recovery_latency": avg_recovery_latency
    }

def generate_report(test_results):
    """生成测试报告"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = {
        "timestamp": timestamp,
        "base_url": BASE_URL,
        "test_results": test_results,
        "summary": {
            "total_endpoints": len(API_ENDPOINTS),
            "overall_success_rate": 0
        }
    }
    
    # 计算总体成功率
    total_success = 0
    total_tests = 0
    
    for test in test_results:
        if "success_rate" in test and "total_requests" in test:
            total_success += test["successful"]
            total_tests += test["total_requests"]
        elif "success_count" in test:
            total_success += test["success_count"]
            total_tests += test["total_count"]
        elif "total_checks" in test:
            total_success += test.get("successful", 0)
            total_tests += test.get("total_checks", 0)
    
    if total_tests > 0:
        report["summary"]["overall_success_rate"] = (total_success / total_tests) * 100
    
    # 保存报告到文件
    report_filename = f"api_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_filename, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 测试报告已保存到: {report_filename}")
    
    return report

def main():
    """主测试函数"""
    print("🎯 DiaryMind API 测试脚本")
    print(f"🔗 测试地址: {BASE_URL}")
    print(f"📅 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    test_results = []
    start_time = time.time()
    
    # 1. 基础功能测试
    print("\n📋 1. 基础功能测试")
    print("-" * 30)
    
    results = []
    for endpoint in API_ENDPOINTS:
        method, url = endpoint[:2]
        data = endpoint[2] if len(endpoint) > 2 else None
        result = test_endpoint(method, url, data)
        results.append(result)
        
        status_icon = "✅" if result["status"] == "success" else "❌"
        print(f"{status_icon} {method} {url} - {result['status'].upper()}")
        if result["status"] != "success":
            print(f"   错误信息: {result.get('message', 'N/A')}")
        else:
            print(f"   响应时间: {result['response_time']}")
    
    # 统计基础测试结果
    success_count = sum(1 for r in results if r["status"] == "success")
    total_count = len(results)
    print("\n📊 基础测试统计:")
    print(f"   成功: {success_count}/{total_count} ({(success_count/total_count)*100:.1f}%)")
    print(f"   失败: {total_count - success_count}/{total_count}")
    
    test_results.append({
        "test_name": "基础功能测试",
        "success_count": success_count,
        "total_count": total_count
    })
    
    # 2. 负载测试（仅测试关键API）
    print("\n" + "=" * 50)
    print("📈 2. 负载测试")
    print("-" * 30)
    
    # 选择关键API进行负载测试
    load_test_endpoints = [
        API_ENDPOINTS[0],  # GET /
        API_ENDPOINTS[3],  # GET /api/music/list
        API_ENDPOINTS[4],  # POST /api/llm/chat
    ]
    
    for endpoint in load_test_endpoints:
        load_result = run_load_test(endpoint, concurrent_users=50, requests_per_user=20)
        test_results.append({
            "test_name": "负载测试",
            "endpoint": endpoint[1],
            **load_result
        })
    
    # 3. 健康检查监控
    health_result = health_check_monitor(duration=30, interval=2)
    test_results.append({
        "test_name": "健康检查监控",
        **health_result
    })
    
    # 4. 故障恢复测试
    recovery_result = fault_recovery_test()
    test_results.append({
        "test_name": "故障恢复测试",
        **recovery_result
    })
    
    # 5. 最终报告
    print("\n" + "=" * 50)
    print("🏁 测试报告总结")
    print("-" * 30)
    
    # 计算总体成功率
    total_success = 0
    total_tests = 0
    
    for test in test_results:
        if "success_rate" in test and "total_requests" in test:
            total_success += test["successful"]
            total_tests += test["total_requests"]
        elif "success_count" in test:
            total_success += test["success_count"]
            total_tests += test["total_count"]
        elif "total_checks" in test:
            total_success += test.get("successful", 0)
            total_tests += test.get("total_checks", 0)
    
    overall_success_rate = (total_success / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"✅ 总体成功率: {overall_success_rate:.2f}%")
    print(f"📊 测试覆盖: {len(API_ENDPOINTS)}个API端点")
    print(f"⏱️  测试时长: 约{(time.time() - start_time):.0f}秒")
    
    # 检查是否达到高可用标准（99.9% 或更高）
    if overall_success_rate >= 99.9:
        print("\n🎉 系统达到高可用性标准 (99.9% 或更高)")
    else:
        print(f"\n⚠️  系统未达到高可用性标准 (当前: {overall_success_rate:.2f}%, 目标: 99.9%)")
    
    # 生成详细报告
    report = generate_report(test_results)
    
    print("\n" + "=" * 50)
    print("测试完成！")

if __name__ == "__main__":
    main()
