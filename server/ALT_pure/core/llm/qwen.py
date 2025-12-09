from .ollama import Ollama
from ...config.load_config import config
from ...log.load_log import logger
from httpx import AsyncClient,HTTPError
from .context_manager import ContextManager
import dashscope
TAG=__name__

class LLM:
    def __init__(self):
        self.context_manager=ContextManager(user_id="default")
        self.logger=logger.bind(tag=TAG)

        self.platform=config.get("choose",{"llm": None}).get("llm",None)
        self.api_key=None
        self.model=None
        self._is_loaded=False
        self.API_URL= r'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

        self.ollama=None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


    async def chat(self,text:str,change_role:str= None)->str:
        # 用户接口，带记忆一次性请求
        if self.platform=="ollama":
            self._is_loaded = True
        else:
            if not self._is_loaded:
                if self.platform=="qwen":
                    self._load_qwen()
                if not self._check():
                    self.logger.error("请于config完整配置llm,未发送llm请求")
                    self._is_loaded=False
                    return ""
                else:
                    self._is_loaded=True

        if self._is_loaded:
            if self.platform=="qwen":
                if change_role is not None:
                    self.context_manager.set_role(change_role)
                context=self.context_manager.add_question(text)
                answer=await self._request_qwen_by_http(context)
                self.context_manager.add_answer(answer)
                # self.logger.success(f"summary: {self.context_manager.summary}")
                # self.logger.warning(f"context: {self.context_manager.history}")
                return answer
            elif self.platform=="ollama":
                if change_role is not None:
                    self.context_manager.set_role(change_role)
                if self.ollama is None:
                    self.ollama=Ollama()
                return await self.ollama.chat(text)
            else:
                self.logger.warning("未选择llm平台或llm平台不被支持，未发送llm请求")
                return ""
        else:
            return  ""

    def request(self,role:str,text:str,model="qwen-turbo"):
        # 用户接口，不带记忆的请求，默认流式
        messages=[
            {"role": "system", "content": role},
            {"role": "user", "content": text}
        ]

        if not self._is_loaded:
            if self.platform == "qwen":
                self._load_qwen()
            if not self._check():
                self.logger.error("请于config完整配置llm,未发送llm请求")
                self._is_loaded = False
                return
            else:
                self._is_loaded = True

        if self._is_loaded:
            if self.platform == "qwen":
                yield from self._request_qwen_stream(messages,model=model)
            else:
                self.logger.warning("未选择llm平台或llm平台不被支持，未发送llm请求")
                return
        else:
            return

    def chat_stream(self,text:str,model="qwen-turbo",change_role:str= None,search:bool=True,temperature:float = 0.7,top_p:float = 0.9):
        # 用户接口，带记忆的请求，默认流式
        if not self._is_loaded:
            if self.platform == "qwen":
                self._load_qwen()
            if not self._check():
                self.logger.error("请于config完整配置llm,未发送llm请求")
                self._is_loaded = False
                return
            else:
                self._is_loaded = True

        if self._is_loaded:
            if self.platform == "qwen":
                if change_role is not None:
                    self.context_manager.set_role(change_role)
                context=self.context_manager.add_question(text)
                answer=""
                for item in self._request_qwen_stream(context,model=model,search=search,temperature=temperature,top_p=top_p):
                    yield item
                    answer+= item
                self.context_manager.add_answer(answer)
            else:
                self.logger.warning("未选择llm平台或llm平台不被支持，未发送llm请求")
                return
        else:
            return
    def _request_qwen_stream(self, context: list,model="qwen-turbo",search:bool = False,temperature:float = 0.7,top_p:float = 0.9):
        try:
            response = dashscope.Generation.call(
                api_key=self.api_key,
                model=model,
                messages=context,
                stream=True,
                temperature=temperature,
                top_p=top_p,
                enable_search=search,
                search_options={
                    "forced_search": False,
                    "enable_source": False,
                    "enable_citation": False,
                    # "citation_format": "[ref_<number>]",
                    "search_strategy": "turbo",
                },
                result_format="message"
            )

            last_content = ""
            for chunk in response:
                # print( chunk)
                if chunk.status_code != 200:
                    error_msg = f"请求失败: {chunk.message}"
                    self.logger.error(error_msg)
                    raise Exception(error_msg)

                if chunk.output and chunk.output.choices:
                    current_content = chunk.output.choices[0].message.content or ""

                    if len(current_content) > len(last_content):
                        delta = current_content[len(last_content):]
                        yield delta
                    last_content = current_content
        except Exception as e:
            self.logger.error(f"调用失败: {e}")

    def _request_qwen(self,context: list):
        try:
            response=dashscope.Generation.call(
                api_key=self.api_key,
                model=self.model,
                messages=context,
                temperature=0.7,
                top_p=0.9,
                enable_search=False,
                search_options={
                    "forced_search": False,
                    "enable_source": False,
                    "enable_citation": False,
                    # "citation_format": "[ref_<number>]",
                    "search_strategy": "turbo",
                },
                result_format="message"
            )
            if response and response.output and response.output.choices:
                result=response.output.choices[0].message.content
                logger.bind(tag=TAG).info(f"模型返回：{result}")
                return result
            else:
                print(response)
                logger.bind(tag=TAG).warning("模型返回为空。")
                return ""
        except Exception as e:
            logger.bind(tag=TAG).error(f"模型调用错误：{e}")
            return ""

    async def _request_qwen_by_http(self,context: list):
        async with AsyncClient(timeout=30) as client:
            try:
                if not self.model:
                    self.logger.error("模型名称未设置")
                    return ""
                response=await client.post(
                    self.API_URL,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}"
                    },
                    json={
                        "model": self.model,
                        "input": {'messages':context},
                        "parameters": {"temperature": 0.3,
                                       "top_p": 0.9,
                                       "result_format": "message",
                                       "enable_search":True,
                                       "search_options":{
                                           "forced_search": False,
                                           "enable_source": False,
                                           "enable_citation": False,
                                           # "citation_format": "[ref_<number>]",
                                           "search_strategy": "max"
                                       }

                       }
                    }
                )
                response.raise_for_status()
                result=response.json()
                if "output" in result and "choices" in result['output'] and len(result['output']['choices']) > 0:
                    return result['output']['choices'][0]['message']['content']
                else:
                    self.logger.warning("模型返回格式不正确或无内容。")
                    return ""
            except HTTPError as e:
                self.logger.error(f"HTTP错误: {e}")
                return ""
            except Exception as e:
                self.logger.error(f"请求错误: {e}")
                return ""


    def _check(self)->bool:
        flag = True
        if self.platform is None or self.platform == "":
            self.logger.warning("未选择llm平台")
            flag = False
        if self.api_key is None or self.api_key == "":
            self.logger.warning("未填写api_key")
            flag = False
        if self.model is None or self.model == "" or self.model == []:
            self.logger.warning("未填写model")
            flag = False
        return flag

    def _load_qwen(self):
        self.api_key=config.get("llm",{"qwen": {"api_key":None}}).get("qwen",{"api_key":None}).get("api_key",None)
        self.model=config.get("llm",{"qwen": {"model":None}}).get("qwen",{"model":None}).get("model",None)


    def _debug(self):
        self.logger.info("llm平台:{}".format(self.platform))
        self.logger.info("api_key:{}".format(self.api_key))
        self.logger.info("model:{}".format(self.model))

