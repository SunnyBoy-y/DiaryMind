## 公共
### model存放模型:
    silero_vad 人声检测模块
### 公共工具
    text_processor 文本处理模块
### text_processor
    text_clean(text:str)->str  # 用户接口，传入文本，返回处理后的文本(过滤表情包、网址等)
    text_cutter_by_language(text:str,language:str="auto")->list  # 用户接口，传入文本，根据语言类型返回分句后的列表（默认为自动判断）
    text_merger(texts:list=None)->list  # 用户接口，传入分句后的列表，返回合并后的列表(通过config的max_split_len配置分割长度)
    ！！！这三个函数搭配起来用
### task_manager
    async def get_group_results(self,group_id): 获取任务组的结果，注意任务组未完成的适合是获取中间结果，一旦任务组完成，获取后才会销毁内存，否则一直保存在内存！！一定要记得在任务结束后获取结果来销毁任务！
    async def add_group(self,items:List[Any],g_id:str=None)-> Optional[str]  # 添加任务
    async def cancel_group(self,group_id:str): # 取消任务组
    async def add_items_to_group(self,items:List[Any],group_id:str=None)-> Optional[str] #添加任务到任务组
    async def wait_for_group(self,group_id:str): 等待一个任务组结束
    close() 资源清理
    ！具体用法看test里面！
    ！注意每个任务组使用.get_group_result()获取结果后任务组才真正销毁，否则一直保存结果留在内存！