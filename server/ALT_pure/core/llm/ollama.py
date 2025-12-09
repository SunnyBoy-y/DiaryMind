import asyncio
from ...config.load_config import config
from ...log.load_log import logger
from httpx import AsyncClient, HTTPError
from .context_manager import ContextManager
import httpx

TAG = __name__


class Ollama:
    def __init__(self):
        self.context_manager = ContextManager(user_id="default")
        self.logger = logger.bind(tag=TAG)

        self.platform = config.get("choose", {"llm": None}).get("llm", None)
        self.api_key = None
        self.model = None
        self.base_url = config.get("llm", {"ollama": {"base_url": "http://localhost:11434"}}).get("ollama", {"base_url": "http://localhost:11434"}).get("base_url", "http://localhost:11434")
        self._is_loaded = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    async def chat(self, text: str, change_role: str = None) -> str:
        # 用户接口，带记忆一次性请求
        if not self._is_loaded:
            if self.platform == "ollama":
                self._load_ollama()
            if not self._check():
                self.logger.error("请于config完整配置llm,未发送llm请求")
                self._is_loaded = False
                return ""
            else:
                self._is_loaded = True

        if self._is_loaded:
            if self.platform == "ollama":
                if change_role is not None:
                    self.context_manager.set_role(change_role)
                context = self.context_manager.add_question(text)
                answer = await self._request_ollama_by_http(context)
                self.context_manager.add_answer(answer)
                return answer
            else:
                self.logger.warning("未选择llm平台或llm平台不被支持，未发送llm请求")
                return ""
        else:
            return ""

    def request(self, role: str, text: str, model=None):
        # 用户接口，不带记忆的请求，默认流式
        messages = [
            {"role": "system", "content": role},
            {"role": "user", "content": text}
        ]

        if not self._is_loaded:
            if self.platform == "ollama":
                self._load_ollama()
            if not self._check():
                self.logger.error("请于config完整配置llm,未发送llm请求")
                self._is_loaded = False
                return
            else:
                self._is_loaded = True

        if self._is_loaded:
            if self.platform == "ollama":
                model = model or self.model
                yield from self._request_ollama_stream(messages, model=model)
            else:
                self.logger.warning("未选择llm平台或llm平台不被支持，未发送llm请求")
                return
        else:
            return

    def chat_stream(self, text: str, model=None, change_role: str = None, temperature: float = 0.7, top_p: float = 0.9):
        # 用户接口，带记忆的请求，默认流式
        if not self._is_loaded:
            if self.platform == "ollama":
                self._load_ollama()
            if not self._check():
                self.logger.error("请于config完整配置llm,未发送llm请求")
                self._is_loaded = False
                return
            else:
                self._is_loaded = True

        if self._is_loaded:
            if self.platform == "ollama":
                if change_role is not None:
                    self.context_manager.set_role(change_role)
                context = self.context_manager.add_question(text)
                model = model or self.model
                answer = ""
                for item in self._request_ollama_stream(context, model=model, temperature=temperature, top_p=top_p):
                    yield item
                    answer += item
                self.context_manager.add_answer(answer)
            else:
                self.logger.warning("未选择llm平台或llm平台不被支持，未发送llm请求")
                return
        else:
            return

    async def _check_model_exists(self, model_name):
        """检查模型是否存在"""
        try:
            # 确保base_url包含协议
            base_url = self.base_url if self.base_url.startswith(("http://", "https://")) else f"http://{self.base_url}"
            url = f"{base_url}/api/tags"
            
            async with AsyncClient(timeout=10) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                if "models" in data:
                    model_names = [m["name"] for m in data["models"]]
                    return model_name in model_names
                return False
        except Exception as e:
            self.logger.warning(f"检查模型时出错: {e}")
            return False

    def _request_ollama_stream(self, context: list, model=None, temperature: float = 0.7, top_p: float = 0.9):
        import json

        model = model or self.model
        # 确保base_url包含协议
        base_url = self.base_url if self.base_url.startswith(("http://", "https://")) else f"http://{self.base_url}"
        url = f"{base_url}/api/chat"

        # 转换消息格式
        messages = []
        if isinstance(context, list):
            messages = context
        elif isinstance(context, str):
            messages = [{"role": "user", "content": context}]

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p
            }
        }

        try:
            with httpx.stream("POST", url, json=payload, timeout=30.0) as response:
                for line in response.iter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            self.logger.error(f"Ollama流式请求错误: {e}")

    async def _request_ollama_by_http(self, context: list):
        async with AsyncClient(timeout=30) as client:
            try:
                model = self.model
                # 确保base_url包含协议
                base_url = self.base_url if self.base_url.startswith(("http://", "https://")) else f"http://{self.base_url}"
                url = f"{base_url}/api/chat"

                # 转换消息格式
                messages = []
                if isinstance(context, list):
                    messages = context
                elif isinstance(context, str):
                    messages = [{"role": "user", "content": context}]

                # 检查模型是否存在
                if not await self._check_model_exists(model):
                    self.logger.warning(f"模型 '{model}' 不存在于Ollama中，请确认模型名称或先拉取模型: ollama pull {model}")
                    return f"错误：模型 '{model}' 不存在，请先拉取模型"

                response = await client.post(
                    url,
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": False
                    }
                )
                
                # 更详细的错误处理
                if response.status_code == 400:
                    error_detail = response.text
                    self.logger.error(f"HTTP 400 错误，请求内容有误: {error_detail}")
                    return f"请求错误: {error_detail}"
                elif response.status_code == 404:
                    self.logger.error("指定的模型未找到，请确认模型名称")
                    return "错误：指定的模型未找到"
                elif response.status_code >= 500:
                    self.logger.error(f"Ollama服务器内部错误: {response.status_code}")
                    return "服务器内部错误"
                    
                response.raise_for_status()
                result = response.json()
                if "message" in result and "content" in result["message"]:
                    return result["message"]["content"]
                else:
                    self.logger.warning("模型返回格式不正确或无内容。")
                    return ""
            except HTTPError as e:
                self.logger.error(f"HTTP错误: {e}")
                return ""
            except Exception as e:
                self.logger.error(f"请求错误: {e}")
                return ""

    def _check(self) -> bool:
        flag = True
        if self.platform is None or self.platform == "":
            self.logger.warning("未选择llm平台")
            flag = False
        if self.model is None or self.model == "" or self.model == []:
            self.logger.warning("未填写model")
            flag = False
        return flag

    def _load_ollama(self):
        # Ollama通常不需要api_key，但可能需要指定base_url和model
        self.model = config.get("llm", {"ollama": {"model": None}}).get("ollama", {"model": None}).get("model", None)
        ollama_config = config.get("llm", {"ollama": {}}).get("ollama", {})
        if "base_url" in ollama_config:
            self.base_url = ollama_config["base_url"]

    def _debug(self):
        self.logger.info("llm平台:{}".format(self.platform))
        self.logger.info("model:{}".format(self.model))
        self.logger.info("base_url:{}".format(self.base_url))

# if __name__ == '__main__':
#     import asyncio
#
#     async def main():
#         while 1:
#         text=input("请输入：")
#         llm = LLM()
#         # 对于 chat 方法，需要 await
#         response = await llm.chat(text)
#         print(response)
#
#
#
#     asyncio.run(main())
