from ALT_pure.log.load_log import logger
from ALT_pure.config.load_config import config
from dashscope import Generation
from concurrent.futures import ThreadPoolExecutor
import time


TAG=__name__
class ContextManager:
    def __init__(self, user_id="default"):
        self.logger = logger.bind(tag=TAG)
        self.user_id = user_id
        self.context = None
        self.history = None

        self.summary=None
        self.request_cnt = 0
        self.summary_api_key = None
        self.summary_freq = config.get("context_manager",{"summary_freq":5}).get("summary_freq",5)

        self.history_length=config.get("context_manager",{"history_length":3}).get("history_length",3)
        self.role=None
        self.summary_api_key = None
        self.time= None

        self.executor=ThreadPoolExecutor(max_workers=1,thread_name_prefix="summary_worker")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._close()

    def set_role(self,role:str=None):
        # 用户接口，动态更改角色设定,注意：角色设定会覆盖之前的设定
        if self.context is None:
            self.context = self._load_role()
        elif role is not None:
            self.role = role
            self.context[0]["content"] = self.role
        else:
            logger.warning("运行时角色设定出错")
    def add_question(self,question):
        # 用户接口，添加user问题,返回history
        if self.context is None:
            self.context = self._load_role()
        self.context.append({"role": "user", "content": question})
        return self._get_history()

    def add_answer(self,answer):
        # 用户接口，添加答案,返回history
        if self.context is None:
            self.context = self._load_role()
        self.context.append({"role": "assistant", "content": answer})
        self.request_cnt+=1
        self._generate_summary_async()

    def _get_time(self):
        self.time=str(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

    def _get_history(self):
        if self.context is None:
            self.context = self._load_role()

        if len(self.context)<self.history_length*2+1:
            self.history=self.context
        else:
            if self.history is None:
                self.history = self.context[:1]
            else:
                self.history=self.context[:1]
            if self.summary is not None:
                self.history.append({"role": "system", "content": f"此前的对话摘要: {self.summary}"})

            self.history.extend((self.context[-self.history_length*2:]))

        self._get_time()
        self.history[0]["content"]=self.history[0]["content"]+f"，当前时间是{str(self.time)}，这个时间会实时更新，后续回答问及今天时间请用这个时间。"
        return self.history

    def _generate_summary_async(self):
        try:
            if self.summary_api_key is None:
                self.summary_api_key = config.get('llm', {'qwen': {"api_key": None}}).get('qwen',{'api_key': None}).get('api_key', None)
            if len(self.context) >= self.summary_freq * 2 + 1 and self.request_cnt % self.summary_freq == 0:
                self.executor.submit(self._generate_summary)
        except Exception as e:
            self.logger.warning(f"启动后台摘要生成失败: {e}")


    def _generate_summary(self):
        try:
            start_idx = 1
            end_idx = len(self.context) - self.history_length * 2
            if end_idx > start_idx:
                summary_context = self.context[start_idx:end_idx]
                summary_messages = [
                    {"role": "system","content": "你的职责是根据与用户的对话历史生成一段短文，用于总结对话历史。"},
                    {"role": "user", "content": f"请总结以下对话历史：{str(summary_context)}"}
                ]
                try:
                    response = Generation.call(
                        api_key=self.summary_api_key,
                        model="qwen-turbo",
                        messages=summary_messages,
                        result_format="message",
                        temperature=0.6,
                        top_p=0.9,
                        max_tokens=500
                    )
                    if response and response.output and response.output.choices:
                        result = response.output.choices[0].message.content
                        self.summary = result
                    else:
                        self.logger.warning(f"生成摘要失败: {response}")
                except Exception as e:
                    self.logger.warning(f"生成摘要失败: {e}")
                    self.summary = None
        except Exception as e:
            self.logger.warning(f"生成摘要失败: {e}")
            self.summary = None


    def _load_role(self):
        # 初始化角色设定
        self.role = config.get("context_manager",{"role":"我是一个充满活力的AI数字人伙伴,🌐 服务准则「专业不过度，亲切不越界」——用18岁的心境，做100分的服务不话唠，不话唠，不话唠"}).get("role","我是一个充满活力的AI数字人伙伴,🌐 服务准则「专业不过度，亲切不越界」——用18岁的心境，做100分的服务不话唠，不话唠，不话唠")
        context = [{"role": "system", "content": self.role},
                   {'role': 'assistant', 'content': '我已了解我的身份，可以开始对话！'}]
        return context

    def _save_context(self):
        # 存储上下文到磁盘
        logger.error("存储失败！这里的世界以后再来探索吧")
        pass

    def _load_context(self):
        # 从磁盘中加载上下文
        logger.error("加载失败！这里的世界以后再来探索吧")
        pass

    def _close(self):
        self._save_context()
        self._save_context()
        self.logger.info("成功关闭上下文管理器")

