## 大模型
### qwen
    chat(self,text:str,change_role:str=None)->str  用户接口，传入文本，返回模型处理结果（全局角色设定请在config中设置），此处的change_role调用context_manager中的set_role,带记忆
    request(self,role:str,text:str,model="qwen-turbo") 用户接口，不带记忆的请求，默认流式
    chat_stream(self,text:str,model="qwen-turbo",change_role:str= None,search:bool=True,temperature:float = 0.7,top_p:float = 0.9): 用户接口，带记忆的请求，默认流式
    
### context_manager
    set_role(self,role=None) 用户接口，动态更改角色设定,注意：角色设定会覆盖全局的设定
    add_question(self,question) 用户接口，添加user的问题，返回历史对话
    add_answer(self,answer) 用户接口，添加模型生成的答案，并适时自总结
